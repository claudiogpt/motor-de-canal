# Produzir uma semana

Com a IA: `/produzir semana`. Ela para nos títulos e espera o seu sim.

## O caminho inteiro, com a parada

```mermaid
flowchart TD
    A["1. ler canal.json + CLAUDE.md"] --> B["2. escolher os conceitos"]
    B --> C["3. CHECAR OS FATOS DATADOS"]
    C --> D["4. roteiro.md<br/><i>2ª coluna = notas visuais</i>"]
    D --> E["5. duracao.py<br/><i>antes de gastar GPU</i>"]
    E --> F["6. montar o JSON<br/><i>LENDO as notas visuais</i>"]
    F --> G["7. recalcular os números<br/>por script"]
    G --> H["8. narrar.py"]
    H --> I["9. renderizar.sh"]
    I --> J["10. MEDIR"]
    J --> K["11. montar-legenda.py"]
    K --> L["12. titulos.md<br/>3 opções, 1 recomendada"]
    L --> STOP{"🛑 VOCÊ APROVA<br/>OS TÍTULOS"}
    STOP -->|sim| M["13. subir mídia<br/>+ criar os posts"]
    STOP -->|não| D
    M --> N["14. capas<br/>Instagram + YouTube"]
    N --> O["15. conferir a fila"]
    O --> P["16. DEPOIS DO AR<br/>capa do Short + oembed"]

    style C fill:#2a2518,stroke:#C9A227,color:#F2F2F0
    style J fill:#2a2518,stroke:#C9A227,color:#F2F2F0
    style STOP fill:#3a2420,stroke:#B5452F,color:#F2F2F0
    style P fill:#2a2518,stroke:#C9A227,color:#F2F2F0
```

**Não suba mídia nem crie post antes do sim.** É a única parada obrigatória.

---

## As duas plataformas querem coisas OPOSTAS

Mesmo acervo, mesmo canal:

| Vídeo | YouTube | Instagram |
| --- | ---: | ---: |
| provocação filosófica | **1.113** `████████████████` | 109 `██` |
| conta concreta de dinheiro | 7 `▏` | **439** `██████` |

```mermaid
flowchart LR
    Y["📺 YouTube"] --> YP["provocação filosófica"]
    I["📱 Instagram"] --> IP["conta concreta<br/>de dinheiro"]
    style YP fill:#2a2518,stroke:#C9A227,color:#F2F2F0
    style IP fill:#2a2518,stroke:#C9A227,color:#F2F2F0
```

Meça no seu canal antes de generalizar. Mas **não assuma que o que funciona num
lugar funciona no outro.**

---

## Título: duas regras vindas de dado

| Regra | Evidência |
| --- | --- |
| **Rótulo ideológico mata o alcance** | "libertarianismo explicado" → mediana **66** views · "economia explicada rápido" → **316 mil** |
| **Use o termo que as pessoas buscam** | "escala 6x1" → o assunto · "6x1" → placar de futebol |

3 opções em `titulos.md`, 1 recomendada. **Guarde o porquê da recomendação:**
quando você escolhe outra e o vídeo vai mal, o registro é o que permite
aprender.

---

## Checar os fatos ANTES de escrever

```mermaid
flowchart LR
    A["fato datado<br/><i>lei, decisão, número oficial</i>"] --> B{"fonte primária,<br/>lida no original?"}
    B -->|sim| C["usa"]
    B -->|"só resumo"| D["NÃO usa"]
    B -->|"não achou"| E["tira a afirmação"]
    style C fill:#1f2e22,stroke:#5F7A58,color:#F2F2F0
    style D fill:#3a2420,stroke:#B5452F,color:#F2F2F0
    style E fill:#3a2420,stroke:#B5452F,color:#F2F2F0
```

**Resumo de terceiro já contradisse a lei em três casos num só canal** —
inclusive uma página oficial desatualizada contra a própria lei que ela resume.

> ⚠️ **Gancho com data.** "Hoje a República faz 137 anos" num vídeo que vai ao
> ar quatro dias depois está errado, e consertar implica **narração nova e
> render novo**. Decida a data de publicação antes de escrever o gancho.

---

## O que dá e o que NÃO dá para corrigir depois

| | YouTube | Instagram |
| --- | :---: | :---: |
| título | ✅ | — *(não tem campo)* |
| descrição / legenda | ✅ | ❌ *(API não cobre)* |
| capa | ✅ *depois do ar* | ❌ *só à mão no app* |
| **áudio** | ❌ | ❌ |

Uma narração que afirmou algo sem ressalva **não se conserta**. A descrição dá
para editar; a fala não.

---

## Depois do ar, e nada dispara sozinho

| Passo | Confira onde |
| --- | --- |
| aplicar a capa do Short | URL **assinada** (`yt-dlp --dump-json`) |
| conferir o título | **oembed** |
| conferir a capa do Reel | **grade do perfil** |

Nunca pelo campo de analytics: ele serve um asset cacheado e **já indicou falha
numa correção que tinha funcionado**.

---

## Custo

**< US$ 0,50** por semana de 9 vídeos narrados.

O que custa caro é refazer. O que faz refazer é pular a medição.
