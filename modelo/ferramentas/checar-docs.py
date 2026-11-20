#!/usr/bin/env python3
"""Verifica a documentação ANTES do push: diagrama que não renderiza, bloco largo.

    python3 -I ferramentas/checar-docs.py                 # tudo que é .md
    python3 -I ferramentas/checar-docs.py README.md docs/ # alvos específicos
    python3 -I ferramentas/checar-docs.py --rapido        # só as regras estáticas

POR QUE ISTO EXISTE, e é a lição mais cara desta parte do projeto:

**"Não deu erro" não é "funcionou".**

Um diagrama Mermaid com tag <i> no rótulo renderiza um SVG VAZIO no GitHub, sem
mensagem de erro nenhuma. Uma verificação que procura a string "Unable to
render" passa limpa com a página quebrada. Isso aconteceu DUAS vezes aqui: a
primeira passou para o dono do canal, que viu o buraco antes de mim.

E não dá para inspecionar por script a partir da página publicada: o GitHub põe
cada diagrama num iframe isolado.

DUAS CAMADAS

  1. REGRAS ESTÁTICAS (sempre, sem rede, instantâneo)
     As armadilhas já pagas na prática. Cada uma está documentada com o que
     ela causa, porque regra sem motivo vira regra que alguém remove.

  2. RENDER DE VERDADE (se houver Chrome e rede)
     Desenha cada diagrama num Chrome headless e confere se saiu SVG com
     conteúdo. Pega o que as regras estáticas não preveem.

Sai com código diferente de zero se achar qualquer coisa, para servir de hook.
"""
from __future__ import annotations

import json
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

LARGURA_DESENHO = 72
"""Colunas num bloco de DESENHO (ASCII, sem linguagem declarada). Acima disso o
GitHub põe rolagem horizontal, e um desenho que exige rolar lateralmente deixa
de ser desenho: o leitor perde a relação entre as partes, que é o que ele veio
buscar."""

LARGURA_CODIGO = 100
"""Colunas num bloco de CÓDIGO de verdade (bash, json, ts). Aqui o limite é
frouxo de propósito: quebrar um comando para caber estraga o comando, e quem lê
código já espera rolar. A regra apertada vale para desenho, não para código."""

ARQUIVOS_PARA_IA = {"SKILL.md", "CLAUDE.md", "AGENTS.md", "GEMINI.md"}
"""Quem lê estes é o modelo, não uma pessoa. A regra do dono é explícita:
documentação para IA pode ser texto corrido. Então a regra de largura de
desenho não se aplica aqui — mas a de diagrama que não renderiza sim, porque
esses arquivos também abrem no GitHub."""

LINGUAS_DE_CODIGO = {"bash", "sh", "shell", "console", "json", "jsonc", "js",
                     "ts", "tsx", "javascript", "typescript", "python", "py",
                     "yaml", "yml", "html", "css", "diff"}

MERMAID_URL = "https://cdn.jsdelivr.net/npm/mermaid@11.4.1/dist/mermaid.min.js"
MERMAID_CACHE = Path.home() / ".cache" / "checar-docs" / "mermaid-11.4.1.min.js"
"""Baixado uma vez e guardado em cache. Assim o hook funciona offline depois da
primeira rodada, e o repositório não carrega 2,5 MB de biblioteca."""

CHROMES = [
    "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser",
    "/snap/bin/chromium", "/usr/bin/google-chrome-stable",
]


# ── blocos ──────────────────────────────────────────────────────────────────

def blocos(texto: str) -> list[dict]:
    """Blocos cercados por ```, com a linha em que começam."""
    saida, dentro, atual = [], False, None
    for n, linha in enumerate(texto.splitlines(), 1):
        if linha.lstrip().startswith("```"):
            if not dentro:
                dentro = True
                atual = {"lang": linha.strip()[3:].strip() or "ascii",
                         "linha": n, "corpo": []}
            else:
                dentro = False
                atual["corpo"] = "\n".join(atual["corpo"])
                saida.append(atual)
            continue
        if dentro:
            atual["corpo"].append(linha)
    if dentro:
        saida.append({"lang": "ABERTO", "linha": atual["linha"], "corpo": ""})
    return saida


# ── camada 1: regras estáticas ──────────────────────────────────────────────

TAGS_PROIBIDAS = ("<i>", "</i>", "<em>", "</em>", "<u>", "</u>", "<span")


def regras_estaticas(arq: Path) -> list[str]:
    achados = []
    texto = arq.read_text(encoding="utf-8")
    bs = blocos(texto)
    para_ia = arq.name in ARQUIVOS_PARA_IA

    for b in bs:
        onde = f"{arq}:{b['linha']}"

        if b["lang"] == "ABERTO":
            achados.append(f"{onde}  bloco ``` sem fechamento")
            continue

        if b["lang"] == "mermaid":
            for tag in TAGS_PROIBIDAS:
                if tag in b["corpo"]:
                    achados.append(
                        f"{onde}  mermaid usa {tag} no rótulo.\n"
                        f"        O GitHub sanitiza e o diagrama sai EM BRANCO, sem erro.\n"
                        f"        Use <b> ou nada. <br/> funciona."
                    )
                    break

            # aspas simples dentro de rótulo entre aspas duplas
            for rot in re.findall(r'\["([^"]*)"\]', b["corpo"]):
                if "'" in rot or '"' in rot:
                    achados.append(
                        f"{onde}  rótulo com aspas dentro de aspas: \"{rot[:46]}\"\n"
                        f"        O parser do Mermaid quebra e o diagrama sai EM BRANCO.\n"
                        f"        Tire as aspas internas."
                    )

            if b["corpo"].lstrip().startswith("gantt"):
                for l in b["corpo"].splitlines():
                    nome = l.split(":")[0]
                    if ":" in l and ":" in l[len(nome) + 1:] and not l.strip().startswith(
                            ("title", "dateFormat", "axisFormat", "section", "gantt")):
                        achados.append(
                            f"{onde}  gantt com ':' no nome da tarefa.\n"
                            f"        ':' é o separador da sintaxe; quebra mesmo entre aspas."
                        )
                        break

            largo = [l for l in b["corpo"].splitlines() if len(l) > 110]
            if largo:
                achados.append(
                    f"{onde}  {len(largo)} linha(s) de mermaid acima de 110 colunas.\n"
                    f"        Rótulo comprido estoura a largura da coluna do GitHub."
                )

        elif not para_ia:
            eh_codigo = b["lang"].lower() in LINGUAS_DE_CODIGO
            limite = LARGURA_CODIGO if eh_codigo else LARGURA_DESENHO
            estouro = [l for l in b["corpo"].splitlines() if len(l) > limite]
            if estouro:
                pior = max(len(l) for l in estouro)
                tipo = "código" if eh_codigo else "DESENHO"
                extra = ("" if eh_codigo else
                         "\n        Desenho que exige rolar de lado deixa de ser desenho.")
                achados.append(
                    f"{onde}  bloco de {tipo} com {len(estouro)} linha(s) acima de "
                    f"{limite} colunas (maior: {pior}).{extra}"
                )
    return achados


# ── camada 2: render de verdade ─────────────────────────────────────────────

PAGINA = """<!doctype html><html><head><meta charset="utf-8"></head>
<body><div id="saida">pendente</div><div id="palco"></div>
<script src="__CDN__"></script>
<script>
(async () => {
  const R = [];
  try {
    mermaid.initialize({ startOnLoad: false, suppressErrorRendering: true });
    const DS = __DIAGRAMAS__;
    for (const d of DS) {
      let nota = null;
      try {
        const { svg } = await mermaid.render("mk" + d.id, d.src);
        const box = document.createElement("div");
        box.innerHTML = svg;
        const el = box.querySelector("svg");
        const nos = el ? el.querySelectorAll("g.node, .nodeLabel, .label").length : 0;
        const alt = el ? parseFloat(el.getAttribute("height") || "0") : 0;
        if (!el) nota = "nao produziu svg";
        else if (nos === 0) nota = "svg VAZIO: zero nos desenhados";
        else if (alt > 0 && alt < 20) nota = "svg de altura " + alt + "px";
      } catch (e) { nota = "erro: " + String((e && e.message) || e).split("\\n")[0]; }
      R.push({ arq: d.arq, linha: d.linha, nota });
    }
  } catch (e) { R.push({ arq: "-", linha: 0, nota: "mermaid nao carregou: " + e }); }
  document.getElementById("saida").textContent = "RESULTADO:" + JSON.stringify(R);
})();
</script></body></html>"""


def mermaid_local() -> Path | None:
    """O mermaid.js em disco, baixando na primeira vez."""
    if MERMAID_CACHE.is_file() and MERMAID_CACHE.stat().st_size > 500_000:
        return MERMAID_CACHE
    MERMAID_CACHE.parent.mkdir(parents=True, exist_ok=True)
    try:
        import urllib.request
        with urllib.request.urlopen(MERMAID_URL, timeout=60) as r:
            dados = r.read()
        if len(dados) < 500_000:
            return None
        MERMAID_CACHE.write_bytes(dados)
        print(f"  mermaid baixado para {MERMAID_CACHE} ({len(dados) // 1024} KB)")
        return MERMAID_CACHE
    except Exception:
        return None


def acha_chrome() -> str | None:
    for c in CHROMES:
        if Path(c).is_file():
            return c
    return shutil.which("google-chrome") or shutil.which("chromium")


def render_de_verdade(diagramas: list[dict]) -> list[str] | None:
    """Devolve achados, ou None se não deu para rodar (sem Chrome ou sem rede)."""
    chrome = acha_chrome()
    if not chrome:
        return None
    mjs = mermaid_local()
    if not mjs:
        return None
    tmp = Path(tempfile.mkdtemp(prefix="checar_docs_"))
    # Copia local: o Chrome headless com file:// não busca CDN de forma
    # confiável, e depender de rede num hook é fragilidade gratuita.
    shutil.copy(mjs, tmp / "mermaid.js")
    pagina = tmp / "p.html"
    pagina.write_text(
        PAGINA.replace("__CDN__", "mermaid.js")
              .replace("__DIAGRAMAS__", json.dumps(diagramas, ensure_ascii=False)),
        encoding="utf-8")
    try:
        r = subprocess.run(
            [chrome, "--headless", "--disable-gpu", "--no-sandbox",
             f"--user-data-dir={tmp}/perfil",
             "--virtual-time-budget=25000", "--dump-dom", pagina.as_uri()],
            capture_output=True, text=True, timeout=90)
    except (subprocess.TimeoutExpired, OSError):
        return None
    m = re.search(r"RESULTADO:(\[.*?\])</div>", r.stdout, re.S)
    if not m:
        m = re.search(r'id="saida">RESULTADO:(\[.*?\])<', r.stdout, re.S)
    if not m:
        return None  # sem rede, ou o Chrome não chegou lá
    try:
        res = json.loads(m.group(1).replace("&quot;", '"'))
    except json.JSONDecodeError:
        return None
    if res and res[0].get("arq") == "-":
        return None  # mermaid não carregou: provavelmente sem rede
    return [f"{d['arq']}:{d['linha']}  diagrama nao renderiza — {d['nota']}"
            for d in res if d.get("nota")]


# ── principal ───────────────────────────────────────────────────────────────

PASTAS_DE_FORA = {"node_modules", "vendor", ".git", "__pycache__", ".venv",
                  "dist", "build", "repos", "site-packages"}
"""Código e documentação de terceiros. Não é documentação SUA: reclamar da
largura de um bloco num README que veio de outro projeto é ruído que faz o
hook ser desligado, e hook desligado não protege nada."""


def _versionados(raiz: Path) -> list[Path] | None:
    """Só os .md que o git rastreia. Assim o que está no .gitignore (skills de
    terceiros, dependências) fica de fora sozinho, sem lista de exceções."""
    try:
        r = subprocess.run(["git", "-C", str(raiz), "ls-files", "-z", "*.md"],
                           capture_output=True, text=True, timeout=30)
        if r.returncode != 0:
            return None
        return [raiz / n for n in r.stdout.split("\0") if n]
    except (OSError, subprocess.TimeoutExpired):
        return None


ARQ_IGNORAR = ".checar-docs-ignore"
"""Um prefixo de caminho por linha, relativo à raiz. Para documentação de
terceiros que o repositório versiona mas não mantém. Linha começando com # é
comentário."""


def _ignorados(raiz: Path) -> list[str]:
    f = raiz / ARQ_IGNORAR
    if not f.is_file():
        return []
    return [l.strip() for l in f.read_text(encoding="utf-8").splitlines()
            if l.strip() and not l.strip().startswith("#")]


def _filtra(ps: list[Path], padroes: list[str] | None = None) -> list[Path]:
    padroes = padroes or []
    saida = []
    for p in ps:
        if p.suffix != ".md" or not p.is_file():
            continue
        if PASTAS_DE_FORA & set(p.parts):
            continue
        s = str(p)
        if any(pad in s for pad in padroes):
            continue
        saida.append(p)
    return sorted(set(saida))


def arquivos(alvos: list[str]) -> list[Path]:
    if not alvos:
        raiz = Path(__file__).resolve().parents[1]
        if not (raiz / "canal.json").is_file() and (raiz.parent / "docs").is_dir():
            raiz = raiz.parent
        alvos = [str(raiz)]

    saida, padroes = [], []
    for a in alvos:
        p = Path(a)
        if p.is_dir():
            padroes += _ignorados(p)
            v = _versionados(p)
            saida += v if v is not None else list(p.rglob("*.md"))
        else:
            saida.append(p)
            padroes += _ignorados(p.resolve().parent)
    return _filtra(saida, padroes)


def main() -> int:
    args = [a for a in sys.argv[1:] if a != "--rapido"]
    rapido = "--rapido" in sys.argv[1:]
    alvos = arquivos(args)
    if not alvos:
        print("nenhum .md encontrado")
        return 0

    achados, diagramas = [], []
    for arq in alvos:
        achados += regras_estaticas(arq)
        for b in blocos(arq.read_text(encoding="utf-8")):
            if b["lang"] == "mermaid":
                diagramas.append({"id": len(diagramas), "arq": str(arq),
                                  "linha": b["linha"], "src": b["corpo"]})

    para_ia = sum(1 for a in alvos if a.name in ARQUIVOS_PARA_IA)
    print(f"{len(alvos)} arquivo(s) ({para_ia} para IA, regra de largura não se"
          f" aplica), {len(diagramas)} diagrama(s)")

    if rapido:
        print("  camada 2 (render) pulada por --rapido")
    elif not diagramas:
        pass
    else:
        prof = render_de_verdade(diagramas)
        if prof is None:
            print("  ATENCAO: nao deu para renderizar de verdade (sem Chrome ou sem")
            print("           rede). So as regras estaticas rodaram, e elas NAO pegam")
            print("           falha nova. Confira a pagina publicada com o olho.")
        else:
            achados += prof
            print(f"  render de verdade: {len(diagramas)} diagrama(s) desenhado(s)")

    if not achados:
        print("\nOK: nada a corrigir.")
        return 0
    print(f"\n{len(achados)} ACHADO(S):\n")
    for a in achados:
        print(f"  {a}")
    print("\nCorrija antes do push. Depois do push, ABRA A PAGINA e olhe:")
    print("  render que compila nao e render que renderiza.")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
