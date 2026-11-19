#!/usr/bin/env python3
"""Extrai a capa do Short no YouTube: o quadro em que a pergunta está na tela.

    python3 capa-youtube.py ../conteudo/<dia>              # um dia
    python3 capa-youtube.py ../conteudo/2026-11-*          # vários

Grava `out/capa-youtube.jpg`, 1080x1920, para subir por presign e aplicar com
`posts_update_post_metadata` (campo `thumbnail_url`) depois que o Short estiver
publicado.

POR QUE ISSO EXISTE. Medido em 10/11/2026 nos 16 Shorts publicados: o YouTube
escolhe sozinho um quadro do MEIO do vídeo, e em nenhum dos 16 esse quadro era
o gancho. A capa 9:16 que o público vê na aba Shorts do canal (`oar2.jpg`) saiu
com a escada de números ou com o gráfico já montado, nunca com a pergunta.
Capa personalizada é a única forma de escolher, e o canal já está verificado
por telefone desde 05/11, que é a exigência do YouTube.

ONDE A CAPA APARECE, E ONDE NÃO APARECE. Ela aparece na aba Shorts do canal,
na busca, nas prateleiras da página inicial e no compartilhamento. Ela NÃO
aparece no feed de Shorts, que toca o vídeo direto. Como quase toda view de
Short vem do feed, esta correção melhora a grade do canal e a conversão de
quem visita o perfil, e não há motivo medido para prometer mais views.

QUAL QUADRO. O mesmo instante que o `capa-instagram.py` já calcula: o fim do
bloco de gancho menos 0,45 s, tirado de `audio/tempos.json`, que é o arquivo
que manda no tempo do render. Uma regra só para as duas plataformas.

FORMATO. JPEG, porque o YouTube e a Zernio recusam acima de 2 MB e um PNG de
1080x1920 passa disso. A qualidade começa em 2 e cai até caber.
"""

import json
import pathlib
import subprocess
import sys

MARGEM = 0.45       # s antes do fim do gancho, para não pegar a troca de cena
TETO_BYTES = 2 * 1024 * 1024
BRILHO_MINIMO = 150  # abaixo disso o quadro é fundo vazio, não texto


def ffmpeg(args: list[str]) -> str:
    return subprocess.run(["ffmpeg", *args], capture_output=True, text=True).stderr


def brilho(mp4: pathlib.Path, t: float) -> float:
    err = ffmpeg(["-ss", f"{t}", "-i", str(mp4), "-frames:v", "1", "-vf",
                  "format=gray,signalstats,metadata=print:key=lavfi.signalstats.YMAX",
                  "-f", "null", "-"])
    for linha in err.splitlines():
        if "signalstats.YMAX=" in linha:
            return float(linha.split("=")[-1])
    return -1.0


def escolher_mp4(dia: pathlib.Path) -> pathlib.Path:
    preferido = dia / "out/reel.mp4"
    if preferido.is_file():
        return preferido
    achado = next(iter(sorted(dia.glob("out/*.mp4"))), None)
    if achado is None:
        raise SystemExit(f"nenhum mp4 em {dia}/out: rode o render antes")
    return achado


def por_brilho(mp4: pathlib.Path) -> float:
    """Último instante do primeiro bloco, achado pelo brilho médio.

    Só para o Dia 1 e qualquer vídeo do formato antigo, que não tem
    `tempos.json`. Varre os 12 primeiros segundos e fica no último instante em
    que o brilho médio ainda está no patamar do primeiro bloco, ou seja, antes
    de a cena trocar. É chute assistido, não medição: confira o quadro.
    """
    amostras = []
    for n in range(1, 25):
        t = n / 2
        err = ffmpeg(["-ss", f"{t}", "-i", str(mp4), "-frames:v", "1", "-vf",
                      "format=gray,signalstats,metadata=print:key=lavfi.signalstats.YAVG",
                      "-f", "null", "-"])
        for linha in err.splitlines():
            if "signalstats.YAVG=" in linha:
                amostras.append((t, float(linha.split("=")[-1])))
    if not amostras:
        raise SystemExit("não consegui medir o brilho do vídeo")
    pico = max(v for _, v in amostras)
    return max(t for t, v in amostras if v >= 0.97 * pico)


def instante_do_gancho(dia: pathlib.Path) -> float:
    tempos = dia / "audio/tempos.json"
    if not tempos.is_file():
        print("  sem tempos.json: instante escolhido pelo brilho, CONFIRA O QUADRO")
        return por_brilho(escolher_mp4(dia))
    blocos = json.loads(tempos.read_text())["blocos"]
    gancho = blocos[0]
    if gancho["tipo"] != "gancho":
        print(f"  aviso: o primeiro bloco é '{gancho['tipo']}', não 'gancho'")
    return max(0.3, gancho["duracao"] - MARGEM)


def gravar(mp4: pathlib.Path, t: float, saida: pathlib.Path) -> int:
    """Grava o quadro em JPEG e baixa a qualidade até caber nos 2 MB."""
    for q in (2, 4, 6, 8):
        ffmpeg(["-y", "-ss", f"{t}", "-i", str(mp4), "-frames:v", "1",
                "-q:v", str(q), str(saida)])
        if saida.is_file() and saida.stat().st_size <= TETO_BYTES:
            return saida.stat().st_size
    raise SystemExit(f"{saida}: não coube em 2 MB nem com qualidade 8")


def um_dia(dia: pathlib.Path) -> bool:
    mp4 = escolher_mp4(dia)
    alvo = instante_do_gancho(dia)
    saida = dia / "out/capa-youtube.jpg"
    tam = gravar(mp4, alvo, saida)
    br = brilho(mp4, alvo)
    dim = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "v",
         "-show_entries", "stream=width,height", "-of", "csv=p=0", str(saida)],
        capture_output=True, text=True).stdout.strip()

    ok = br >= BRILHO_MINIMO and dim == "1080,1920"
    print(f"{dia.name}")
    print(f"  quadro      : {alvo:.2f} s   (brilho máx {br:.0f})")
    print(f"  arquivo     : {saida}  ({dim}, {tam/1024:.0f} KB)")
    if br < BRILHO_MINIMO:
        print("  ATENÇÃO: quadro escuro, o texto do gancho pode não ter entrado")
    if dim != "1080,1920":
        print(f"  ATENÇÃO: capa de Short tem de ser 1080x1920, veio {dim}")
    print("  CONFIRA O QUADRO antes de aplicar: o medidor não lê o que está escrito")
    return ok


def main() -> None:
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    falhou = False
    for arg in sys.argv[1:]:
        if arg.startswith("--"):
            continue
        dia = pathlib.Path(arg).resolve()
        # Uma pasta sem vídeo (um carrossel, por exemplo) não derruba o lote:
        # um glob de data pega as duas coisas, e abortar esconderia o resto.
        if not (dia / "out").is_dir() or not any(dia.glob("out/*.mp4")):
            print(f"{dia.name}: sem vídeo em out/, pulando")
            continue
        try:
            if not um_dia(dia):
                falhou = True
        except SystemExit as erro:
            print(f"{dia.name}: {erro}")
            falhou = True
    sys.exit(1 if falhou else 0)


if __name__ == "__main__":
    main()
