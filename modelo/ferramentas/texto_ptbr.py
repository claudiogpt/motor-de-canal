#!/usr/bin/env python3
"""Texto para fala em português do Brasil.

A conversão de número para palavra NÃO é problema do motor de TTS: é problema
de língua. O Kokoro lê "44" como "quarenta e quatro" às vezes e como "quatro
quatro" outras, e nenhum ajuste de voz resolve isso. A saída é resolver antes,
no texto, de forma determinística.

Por isso este arquivo fica fora dos adaptadores: trocar o motor de voz não
muda como um brasileiro fala um número.

Cobre: milhar com ponto, dimensão (1080x1920), dinheiro, data, ordinal,
porcentagem com e sem decimal, decimal com vírgula, hora, e concordância de
gênero ("duas horas", não "dois horas").

LIMITE CONHECIDO: não existe transcritor local no projeto para conferir o que
o modelo realmente falou. Quando a conversão é duvidosa, escreva a fala à mão
no campo `falaLiteral` da batida. Um canal já teve "Cruzado II" virando
"Cruzado Dois" e só descobriu ouvindo.
"""
from __future__ import annotations

import re

_UNITS = ["zero", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove",
          "dez", "onze", "doze", "treze", "catorze", "quinze", "dezesseis", "dezessete",
          "dezoito", "dezenove"]
_TENS = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta",
         "oitenta", "noventa"]
_HUNDREDS = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos",
             "seiscentos", "setecentos", "oitocentos", "novecentos"]
# Words ending in -a that are masculine anyway.
_MASC_A = {"dia", "dias", "problema", "problemas", "sistema", "sistemas", "programa",
           "programas", "tema", "temas", "mapa", "mapas", "planeta", "planetas", "clima"}

_UNITS = ["zero", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove",
          "dez", "onze", "doze", "treze", "catorze", "quinze", "dezesseis", "dezessete",
          "dezoito", "dezenove"]
_TENS = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta",
         "oitenta", "noventa"]
_HUNDREDS = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos",
             "seiscentos", "setecentos", "oitocentos", "novecentos"]
# Words ending in -a that are masculine anyway.
_MASC_A = {"dia", "dias", "problema", "problemas", "sistema", "sistemas", "programa",
           "programas", "tema", "temas", "mapa", "mapas", "planeta", "planetas", "clima"}




def _feminize(words: str) -> str:
    words = re.sub(r"\bum$", "uma", words)
    words = re.sub(r"\bdois$", "duas", words)
    return re.sub(r"entos\b", "entas", words)

def _below_1000(n: int) -> str:
    if n == 100:
        return "cem"
    parts = []
    h, rest = divmod(n, 100)
    if h:
        parts.append(_HUNDREDS[h])
    if rest >= 20:
        t, u = divmod(rest, 10)
        parts.append(_TENS[t] + (f" e {_UNITS[u]}" if u else ""))
    elif rest or not parts:
        parts.append(_UNITS[rest])
    return " e ".join(parts)

def number_to_words(n: int, feminine: bool = False) -> str:
    """Cardinal number in Brazilian Portuguese (0 to 999,999,999)."""
    if n < 1000:
        words = _below_1000(n)
        return _feminize(words) if feminine else words
    groups = []
    millions, rest = divmod(n, 1_000_000)
    thousands, units = divmod(rest, 1000)
    if millions:
        groups.append("um milhão" if millions == 1 else f"{_below_1000(millions)} milhões")
    if thousands:
        th = _below_1000(thousands)
        if feminine:
            th = re.sub(r"entos\b", "entas", th)
        groups.append("mil" if thousands == 1 else f"{th} mil")
    if units:
        u = _below_1000(units)
        if feminine:
            u = _feminize(u)
        # "mil e vinte", "mil e trezentos", but "mil trezentos e quarenta"
        joiner = " e " if (units < 100 or units % 100 == 0) else " "
        return joiner.join([" ".join(groups), u])
    return " ".join(groups)


_MONTHS = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto",
           "setembro", "outubro", "novembro", "dezembro"]
_ORD = {1: "primeir", 2: "segund", 3: "terceir", 4: "quart", 5: "quint", 6: "sext",
        7: "sétim", 8: "oitav", 9: "non", 10: "décim"}

def _date(m: re.Match) -> str:
    """16/10 -> "dezesseis de outubro" ("primeiro" on day 1). Year is dropped."""
    day, month = int(m[1]), int(m[2])
    if not (1 <= day <= 31 and 1 <= month <= 12):
        return m[0]
    return f"{'primeiro' if day == 1 else number_to_words(day)} de {_MONTHS[month - 1]}"

def _ordinal(n: int, mark: str) -> str:
    """7º -> sétimo, 2ª -> segunda (1 to 10; larger ones stay cardinal)."""
    stem = _ORD.get(n)
    if not stem:
        return number_to_words(n)
    return stem + ("a" if mark == "ª" else "o")

def _is_feminine(next_word: str) -> bool:
    w = next_word.lower().strip(".,;:!?")
    return w.endswith(("a", "as")) and w not in _MASC_A

def spoken_ptbr(text: str) -> str:
    """Rewrite digits and symbols the way a Brazilian narrator says them."""
    t = re.sub(r"(?<=\d)\.(?=\d{3}\b)", "", text)  # 1.500 -> 1500, before anything else
    t = re.sub(r"(\d+)\s*[xX]\s*(\d+)",
               lambda m: f"{number_to_words(int(m[1]))} por {number_to_words(int(m[2]))}", t)

    def money(m: re.Match) -> str:
        reais, cents = int(m[1]), int(m[2] or 0)
        parts = []
        if reais or not cents:
            parts.append(f"{number_to_words(reais)} {'real' if reais == 1 else 'reais'}")
        if cents:
            parts.append(f"{number_to_words(cents)} {'centavo' if cents == 1 else 'centavos'}")
        return " e ".join(parts)

    t = re.sub(r"R\$\s*(\d+)(?:,(\d{2}))?", money, t)
    t = re.sub(r"(\d{1,2})/(\d{1,2})(?:/\d{2,4})?\b", _date, t)
    t = re.sub(r"(\d+)\s*[ºª°]", lambda m: _ordinal(int(m[1]), m[0][-1]), t)
    t = re.sub(r"(\d+),(\d+)\s*%", lambda m: f"{m[1]} vírgula {m[2]} por cento", t)
    t = re.sub(r"(\d+)\s*%", r"\1 por cento", t)
    t = re.sub(r"(\d+),(\d+)", r"\1 vírgula \2", t)
    t = re.sub(r"(\d+)\s*h\b", lambda m: f"{m[1]} {'hora' if m[1] == '1' else 'horas'}", t)

    def repl(m: re.Match) -> str:
        nxt = t[m.end():].split(maxsplit=1)
        fem = bool(nxt) and _is_feminine(nxt[0])
        return number_to_words(int(m[0]), feminine=fem)

    return re.sub(r"\d+", repl, t)

def contar_palavras(texto: str) -> int:
    """Palavras de verdade, para o modelo de duração. Número conta como uma."""
    return len([p for p in re.split(r"\s+", texto.strip()) if p])
