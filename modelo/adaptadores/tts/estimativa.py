#!/usr/bin/env python3
"""Adaptador de voz que não fala: gera silêncio do tamanho certo.

É o padrão do modelo, e isso é escolha. Um canal novo precisa poder renderizar
o primeiro vídeo antes de ter conta em serviço de GPU, e precisa poder revisar
ritmo, layout e quebra de linha sem gastar nada. O silêncio dura o que a fala
duraria, então toda a estrutura de tempo do sistema funciona igual.

O modelo de duração está em ferramentas/duracao.py, e foi ajustado em 16 vídeos
narrados de verdade.
"""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "ferramentas"))

from duracao import segundos_de_fala  # noqa: E402

APARAR = False
"""A saída já tem a duração exata, então não há borda para cortar.

E aparar seria ativamente errado: silenceremove sobre um arquivo inteiramente
silencioso remove o arquivo, e o erro só aparece depois, no ffprobe, longe da
causa.
"""


def sintetizar(textos: list[str], opcoes: dict, destino: Path) -> list[Path]:
    saida = []
    for i, texto in enumerate(textos):
        # Uma batida por chamada, então o termo por batida entra uma vez.
        dur = segundos_de_fala(texto, batidas=1)
        p = destino / f"cru_{i:03d}.wav"
        subprocess.run(
            ["ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
             "-f", "lavfi", "-i", "anullsrc=r=48000:cl=mono",
             "-t", f"{dur:.3f}", str(p)],
            check=True,
        )
        saida.append(p)
    return saida
