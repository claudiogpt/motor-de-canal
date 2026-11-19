#!/usr/bin/env python3
"""
Relatorio de alcance do canal, a partir do export do YouTube Studio.

Uso:
    python3 reels/analise-alcance.py "data/Conteudo AAAA-MM-DD_AAAA-MM-DD QI Politico"

Le "Dados da tabela.csv" (um vídeo por linha) e "Total.csv" (um dia por linha).
Responde tres perguntas, nesta ordem de importancia:

  1. De onde veio a visualizacao: feed de Shorts ou clique em miniatura.
     Nos Shorts a miniatura quase nao conta, entao titulo e capa nao sao
     alavanca de alcance; sao alavanca de conversao depois da entrega.
  2. Qual a taxa de estouro, que e a probabilidade de um video novo
     ser distribuido de verdade. E dela que sai quantos Shorts por dia valem a pena.
  3. Se alguma variavel medida explica o estouro. Ate 10/11/2026 nenhuma explicava:
     retencao x views deu r = -0,07 em 16 Shorts.

Nao usa dependencia externa: so a biblioteca padrao.
"""
import csv
import statistics as st
import sys
from pathlib import Path

LIMITE_SHORT = 90  # segundos; acima disso o video entra na aba /videos


def ler_videos(pasta: Path) -> list[dict]:
    """Uma linha por video, ja com os campos convertidos e o Total fora."""
    saida = []
    with open(pasta / "Dados da tabela.csv", encoding="utf-8") as f:
        for r in csv.DictReader(f):
            if r["Conteúdo"] in ("", "Total"):
                continue
            imp = int(r["Impressões de miniaturas"] or 0)
            ctr = float(r["Taxa de cliques na miniatura (%)"] or 0)
            ret = r["Continuaram assistindo (%)"]
            saida.append({
                "id": r["Conteúdo"],
                "titulo": r["Título do vídeo"],
                "dur": int(r["Duração"]),
                "views": int(r["Visualizações"]),
                "impressoes": imp,
                "cliques": round(imp * ctr / 100),
                "ctr": ctr,
                "retencao": float(ret) if ret else None,
                "inscritos": int(r["Inscritos"] or 0),
                "horas": float(r["Tempo de exibição (horas)"] or 0),
            })
    return saida


def correlacao(a: list[float], b: list[float]) -> float:
    """Pearson. Devolve 0 quando uma das series e constante."""
    n = len(a)
    if n < 3:
        return 0.0
    ma, mb = sum(a) / n, sum(b) / n
    sa, sb = st.pstdev(a), st.pstdev(b)
    if sa == 0 or sb == 0:
        return 0.0
    return sum((x - ma) * (y - mb) for x, y in zip(a, b)) / n / (sa * sb)


def e_estouro(video: dict, shorts: list[dict]) -> bool:
    """
    Decide se este video foi distribuido de verdade ou so entregue a base.

    TODO(human): implemente a regra.

    O que esta em jogo: a taxa de estouro manda em quantos Shorts por dia
    compensa publicar. Se a regra for frouxa demais, tudo vira estouro e o
    numero perde sentido; rigida demais, voce nunca ve progresso.

    Tres caminhos possiveis, e o trade-off de cada um:
      - corte absoluto (ex.: views >= 500): simples de ler, mas envelhece
        rapido. O que hoje e estouro vira rotina quando o canal crescer.
      - multiplo da mediana (ex.: views >= 5x a mediana dos shorts): acompanha
        o crescimento do canal sozinho, mas com poucos videos a mediana balanca
        muito e um mes ruim faz qualquer coisa parecer estouro.
      - multiplo da base de inscritos: mede alcance alem de quem ja segue,
        que e o que voce quer agora, mas exige passar a contagem de inscritos
        como argumento.

    Recebe o video e a lista de todos os shorts do periodo, para quem quiser
    usar mediana ou percentil. Devolve True ou False.
    """
    raise NotImplementedError("defina a regra de estouro")


def relatorio(pasta: Path) -> None:
    videos = ler_videos(pasta)
    shorts = [v for v in videos if v["dur"] <= LIMITE_SHORT]
    longos = [v for v in videos if v["dur"] > LIMITE_SHORT]

    print(f"\n{'=' * 64}\nALCANCE  ·  {pasta.name}\n{'=' * 64}")

    print("\n1. DE ONDE VEIO A VISUALIZACAO (Shorts)")
    v_tot = sum(v["views"] for v in shorts)
    c_tot = sum(v["cliques"] for v in shorts)
    if v_tot:
        print(f"   feed de Shorts : {v_tot - c_tot:6d}  ({(v_tot - c_tot) / v_tot * 100:.1f}%)")
        print(f"   miniatura      : {c_tot:6d}  ({c_tot / v_tot * 100:.1f}%)")
        print(f"   impressoes servidas: {sum(v['impressoes'] for v in shorts)}")

    if longos:
        print("\n2. VIDEOS LONGOS")
        for v in sorted(longos, key=lambda x: -x["views"]):
            print(f"   {v['titulo'][:44]:44s} {v['dur'] // 60}:{v['dur'] % 60:02d}"
                  f"  {v['impressoes']:4d} impr  CTR {v['ctr']:5.2f}%  {v['views']:4d} views")
        print(f"   somam {sum(v['views'] for v in longos)} views"
              f" = {sum(v['views'] for v in longos) / sum(v['views'] for v in videos) * 100:.1f}% do canal")

    print("\n3. TAXA DE ESTOURO")
    try:
        estouros = [v for v in shorts if e_estouro(v, shorts)]
        taxa = len(estouros) / len(shorts) * 100 if shorts else 0
        print(f"   {len(estouros)} de {len(shorts)} Shorts = {taxa:.1f}%")
        if taxa:
            print(f"   a 1 Short/dia: um estouro a cada {100 / taxa:.1f} dias")
            print(f"   a 2 Shorts/dia: um a cada {100 / taxa / 2:.1f} dias")
        for v in estouros:
            print(f"   > {v['titulo'][:50]:50s} {v['views']:5d} views")
    except NotImplementedError as e:
        print(f"   (pendente: {e})")

    print("\n4. ALGUMA VARIAVEL EXPLICA O ALCANCE?")
    com_ret = [v for v in shorts if v["retencao"] is not None]
    if len(com_ret) >= 3:
        r = correlacao([v["retencao"] for v in com_ret], [v["views"] for v in com_ret])
        print(f"   retencao x views : r = {r:+.2f}  (n={len(com_ret)})")
        r2 = correlacao([v["dur"] for v in com_ret], [v["views"] for v in com_ret])
        print(f"   duracao  x views : r = {r2:+.2f}")
        print("   |r| abaixo de 0,3 significa que a variavel nao explica nada.")

    print("\n5. CONVERSAO EM INSCRITO")
    for v in sorted(videos, key=lambda x: -x["inscritos"])[:5]:
        if v["inscritos"]:
            print(f"   {v['titulo'][:44]:44s} {v['inscritos']:2d} insc"
                  f"  = {v['inscritos'] / v['views'] * 1000:5.1f} por mil views")
    print()


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    relatorio(Path(sys.argv[1]))
