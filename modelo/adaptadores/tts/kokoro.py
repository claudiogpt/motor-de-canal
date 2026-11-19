#!/usr/bin/env python3
"""Kokoro 82M em pt-BR, servido por Modal. A voz de produção do modelo.

POR QUE KOKORO. Apache 2.0, roda em CPU (então o custo é centavos por semana),
e não clona voz de ninguém. Onze narrações de uma semana inteira custaram menos
de US$ 0,50.

POR QUE NÃO QWEN3-TTS, que foi testado e descartado: sai com sotaque de
Portugal, e o design de voz em pt-BR soou estrangeiro em três tentativas.
Motor bom em inglês não é motor bom em português, e isso só se descobre
ouvindo.

CONFIGURAÇÃO. Publique o app em `modal-kokoro-ptbr/app.py` e ponha a URL no
ambiente:

    export MODAL_TTS_URL=https://...modal.run

A chave fica no ambiente, nunca em arquivo versionado.

ARMADILHA DE OPERAÇÃO: ao suspender o notebook, deploys no Modal caem. Use
`systemd-inhibit` em volta de um deploy demorado.
"""
from __future__ import annotations

import base64
import json
import os
import urllib.error
import urllib.request
from pathlib import Path

VOZES = ("pm_santa", "pm_alex", "pf_dora")
TIMEOUT = 900


def sintetizar(textos: list[str], opcoes: dict, destino: Path) -> list[Path]:
    url = os.environ.get("MODAL_TTS_URL")
    if not url:
        raise SystemExit(
            "MODAL_TTS_URL não está no ambiente.\n"
            "Publique adaptadores/tts/modal-kokoro-ptbr/app.py e exporte a URL.\n"
            "Para renderizar sem voz agora, use --adaptador estimativa."
        )
    voz = opcoes.get("voz", "pm_santa")
    if voz not in VOZES:
        raise SystemExit(f"voz '{voz}' não existe. Disponíveis: {', '.join(VOZES)}")

    # Todos os trechos numa requisição: a latência de subida do modelo domina
    # o custo, então pedir um por um multiplica o tempo sem motivo.
    corpo = json.dumps({
        "text": textos,
        "voice": voz,
        "speed": opcoes.get("velocidadeDoModelo", 1.0),
        "output_format": "wav",
        "gap_seconds": 0.3,
    }).encode()

    req = urllib.request.Request(
        url, data=corpo, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
            resultado = json.loads(r.read())
    except urllib.error.HTTPError as e:
        raise SystemExit(f"Modal devolveu {e.code}: {e.read()[:300].decode(errors='replace')}")
    except urllib.error.URLError as e:
        raise SystemExit(f"não alcancei o Modal: {e.reason}")

    if not resultado.get("success"):
        raise SystemExit(f"Kokoro falhou: {resultado.get('error', 'erro desconhecido')}")

    saida = []
    for i, item in enumerate(resultado["outputs"]):
        p = destino / f"cru_{i:03d}.wav"
        p.write_bytes(base64.b64decode(item["audio_base64"]))
        saida.append(p)
    return saida
