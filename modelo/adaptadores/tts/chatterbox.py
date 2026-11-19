#!/usr/bin/env python3
"""Chatterbox pt-BR (Resemble AI, MIT): a voz clonada do dono do canal.

QUANDO USAR. Quando o canal quer a própria voz e não a de um modelo genérico.
O Kokoro continua sendo o padrão porque é mais barato e não depende de uma
gravação de referência boa.

O QUE PRECISA. Uma referência de áudio limpa, apontada em
marca.voz.chatterbox.referencia. Lição ganha: 13 segundos vindos do WhatsApp
funcionam, mas o resultado soa comprimido. Grave em ambiente silencioso, sem
compressão de mensageiro.

RITMO. O modelo fala devagar, perto de 150 palavras por minuto. O núcleo
acelera conforme `aceleracao` (1,25 por padrão) com rubberband, que preserva o
tom. Acima de 1,45 começa a soar processado.

MARCA D'ÁGUA. Todo áudio sai com a marca Perth da Resemble, inaudível. Ela é
parte do modelo e não é removível.
"""
from __future__ import annotations

import base64
import json
import os
import urllib.error
import urllib.request
from pathlib import Path

TIMEOUT = 900


def sintetizar(textos: list[str], opcoes: dict, destino: Path) -> list[Path]:
    url = os.environ.get("MODAL_CHATTERBOX_URL") or os.environ.get("MODAL_TTS_URL")
    if not url:
        raise SystemExit(
            "MODAL_CHATTERBOX_URL não está no ambiente.\n"
            "Publique adaptadores/tts/modal-chatterbox-ptbr/app.py.\n"
            "Para renderizar sem voz agora, use --adaptador estimativa."
        )

    raiz = Path(__file__).resolve().parents[2]
    ref = opcoes.get("referencia")
    ref_b64 = None
    if ref:
        p = (raiz / ref) if not Path(ref).is_absolute() else Path(ref)
        if not p.is_file():
            raise SystemExit(f"referência de voz não encontrada: {p}")
        ref_b64 = base64.b64encode(p.read_bytes()).decode()

    corpo = {
        "text": textos,
        "output_format": "wav",
        "gap_seconds": 0.3,
        # seed fixa: duas gerações do mesmo texto devem sair iguais, senão
        # refazer uma batida muda o tempo das outras.
        "seed": opcoes.get("seed", 42),
        "exaggeration": opcoes.get("exaggeration", 0.5),
        "cfg_weight": opcoes.get("cfg", 0.5),
        "temperature": opcoes.get("temperature", 0.8),
    }
    if ref_b64:
        corpo["ref_audio_base64"] = ref_b64

    req = urllib.request.Request(url, data=json.dumps(corpo).encode(),
                                 headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
            resultado = json.loads(r.read())
    except urllib.error.HTTPError as e:
        raise SystemExit(f"Modal devolveu {e.code}: {e.read()[:300].decode(errors='replace')}")
    except urllib.error.URLError as e:
        raise SystemExit(f"não alcancei o Modal: {e.reason}")

    if not resultado.get("success"):
        raise SystemExit(f"Chatterbox falhou: {resultado.get('error', 'desconhecido')}")

    saida = []
    for i, item in enumerate(resultado["outputs"]):
        p = destino / f"cru_{i:03d}.wav"
        p.write_bytes(base64.b64decode(item["audio_base64"]))
        saida.append(p)
    return saida
