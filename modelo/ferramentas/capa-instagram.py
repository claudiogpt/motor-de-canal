#!/usr/bin/env python3
"""Diz em que instante do Reel fica a capa do Instagram.

    python3 capa-instagram.py ../conteudo/<dia>        # um dia
    python3 capa-instagram.py ../conteudo/<dia> --png  # grava tambem o quadro

Imprime o valor de `thumbOffset`, em milissegundos, para pôr no
`platformSpecificData` da entrada `instagram` do post da Zernio.

POR QUE ISSO EXISTE. O Instagram usa `thumbOffset` para escolher a capa do
Reel e o padrão é 0, o primeiro quadro. O primeiro quadro dos nossos Reels é
o fundo da marca ainda vazio: medido em 03/11/2026 nos sete vídeos agendados,
o brilho máximo do quadro 0 era 37 em 255 nos sete, ou seja, nenhum texto
tinha entrado. Resultado: a grade do perfil ficou com sete capas pretas.

QUAL QUADRO SERVE. O último do bloco de gancho, quando todo o texto do gancho
já entrou e a cena ainda não trocou. A duração do gancho sai de
`audio/tempos.json`, que é o mesmo arquivo que manda no tempo do render, então
a capa não tem como apontar para um instante que o vídeo não tem.

Isso não substitui uma capa desenhada. Quando houver uma, use
`platformSpecificData.instagramThumbnail` com a URL da imagem: ela tem
prioridade sobre o `thumbOffset`.
"""

import json
import pathlib
import subprocess
import sys

MARGEM = 0.45   # s antes do fim do gancho, para não pegar a transição de cena


def brilho(mp4: pathlib.Path, t: float, chave: str = "YMAX") -> float:
    err = subprocess.run(
        ["ffmpeg", "-ss", f"{t}", "-i", str(mp4), "-frames:v", "1", "-vf",
         "format=gray,signalstats,metadata=print:key=lavfi.signalstats.{chave}".format(chave=chave),
         "-f", "null", "-"], capture_output=True, text=True).stderr
    for linha in err.splitlines():
        if f"signalstats.{chave}=" in linha:
            return float(linha.split("=")[-1])
    return -1.0


def escolher_mp4(dia: pathlib.Path) -> pathlib.Path:
    """O vídeo que foi publicado, não o que sobrou do fluxo antigo.

    No formato de batidas a voz já está dentro do `reel.mp4`, porque não existe
    mais passo de mux depois do render. O `reel-narrado.mp4`, quando existe, é
    resto do fluxo de outubro. Um glob simples pegava um dos dois sem critério.
    """
    preferido = dia / "out/reel.mp4"
    if preferido.is_file():
        return preferido
    achado = next(iter(sorted(dia.glob("out/*.mp4"))), None)
    if achado is None:
        raise SystemExit(f"nenhum mp4 em {dia}/out: rode o render antes")
    return achado


def sem_tempos(dia: pathlib.Path, png: bool) -> None:
    """Dia 1 e qualquer vídeo do formato antigo, que não tem tempos.json.

    Sem a duração dos blocos não dá para achar o fim do gancho pela estrutura,
    então procura pelo brilho: varre o começo do vídeo e fica no último instante
    em que o brilho médio ainda está no patamar do primeiro bloco. Chute
    assistido, não medição; por isso imprime o aviso.
    """
    mp4 = escolher_mp4(dia)
    amostras = [(t / 2, brilho(mp4, t / 2, "YAVG")) for t in range(1, 25)]
    pico = max(v for _, v in amostras)
    alvo = max(t for t, v in amostras if v >= 0.97 * pico)
    print(f"{dia.name}   (sem tempos.json: instante escolhido pelo brilho)")
    print(f"  thumbOffset : {int(alvo * 1000)}   (quadro de {alvo:.2f} s)")
    print(f"  brilho máx  : quadro 0 = {brilho(mp4, 0.0, 'YMAX'):.0f}"
          f"  ->  capa = {brilho(mp4, alvo, 'YMAX'):.0f}")
    print("  CONFIRA O QUADRO: aqui o instante não veio da estrutura do vídeo")
    if png:
        saida = dia / "out/capa-instagram.png"
        subprocess.run(["ffmpeg", "-y", "-ss", f"{alvo}", "-i", str(mp4),
                        "-frames:v", "1", str(saida)], capture_output=True)
        print(f"  quadro      : {saida}")


def main() -> None:
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    dia = pathlib.Path(sys.argv[1]).resolve()
    tempos = dia / "audio/tempos.json"
    if not tempos.is_file():
        return sem_tempos(dia, "--png" in sys.argv)
    mp4 = escolher_mp4(dia)

    blocos = json.loads(tempos.read_text())["blocos"]
    gancho = blocos[0]
    if gancho["tipo"] != "gancho":
        print(f"aviso: o primeiro bloco é '{gancho['tipo']}', não 'gancho'")
    alvo = max(0.3, gancho["duracao"] - MARGEM)

    q0, qcapa = brilho(mp4, 0.0), brilho(mp4, alvo)
    print(f"{dia.name}")
    print(f"  gancho      : {gancho['duracao']:.2f} s")
    print(f"  thumbOffset : {int(alvo * 1000)}   (quadro de {alvo:.2f} s)")
    print(f"  brilho máx  : quadro 0 = {q0:.0f}  ->  capa = {qcapa:.0f}")
    if qcapa < 150:
        print("  ATENÇÃO: a capa escolhida está escura, confira o quadro")

    if "--png" in sys.argv:
        saida = dia / "out/capa-instagram.png"
        subprocess.run(["ffmpeg", "-y", "-ss", f"{alvo}", "-i", str(mp4),
                        "-frames:v", "1", str(saida)], capture_output=True)
        print(f"  quadro      : {saida}")


if __name__ == "__main__":
    main()
