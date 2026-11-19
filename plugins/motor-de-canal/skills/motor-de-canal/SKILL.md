---
name: motor-de-canal
description: Índice do framework de canais de vídeo automáticos. Use ao começar QUALQUER trabalho numa pasta que tenha canal.json, ou quando o pedido for sobre produzir Reel, Short, carrossel, vídeo longo, história animada, roteiro, narração, render, legenda, capa, agendamento ou análise de alcance de um canal. Leia esta skill antes de escolher as outras.
---

# Motor de Canal

Framework para operar um canal de vídeo curto. Ele saiu de um canal real em
produção, não de teoria: cada regra aqui existe porque algo deu errado antes.

## Antes de qualquer coisa

1. Leia o `canal.json` da pasta. Ele diz o tema, a linha editorial, os pilares,
   as séries, a cadência e quais adaptadores estão ligados.
2. Leia o `CLAUDE.md` do canal, se existir. É o diário: o que já foi produzido,
   o que o dono aprovou e reprovou, e o que ainda está pendente.
3. Só então escolha a skill do trabalho.

## As skills e quando cada uma entra

| Skill | Quando |
| --- | --- |
| `arquitetura-de-tempo` | Antes de escrever ou editar qualquer `reel.json`, `longo.json`, `historia.json`. É a invenção central do sistema. |
| `doutrina-editorial` | Ao escrever roteiro, gancho, título ou legenda. |
| `verificacao-por-medicao` | Depois de todo render, sem exceção. |
| `armadilhas-de-plataforma` | Ao montar post, capa, título ou agendamento. |
| `historia-animada` | Ao escrever uma história com personagens (motion-kit). |
| `producao-semanal` | Na rotina de produzir a semana inteira. |
| `canal-novo` | Para criar um canal do zero. |

## As cinco regras que não se negociam

Elas custaram caro. Quebrar uma delas reintroduz um defeito que já foi corrigido.

1. **O áudio manda no tempo.** Nenhuma duração é digitada. Veja
   `arquitetura-de-tempo`.
2. **Todo número da tela é recalculado por script antes do render**, nunca
   digitado duas vezes. Desenho e conta não podem divergir.
3. **Mediu, não olhou.** Render que compila não é render correto. Veja
   `verificacao-por-medicao`.
4. **Todo dado leva fonte primária**, lida no original. Resumo de terceiro não
   serve, e já contradisse a lei em três casos.
5. **O dono aprova antes de publicar.** Título, capa e agendamento passam por
   ele.

## A ordem de produção, e ela não é preferência

```
roteiro.md          escrever, com as notas visuais na 2ª coluna
     ↓
<formato>.json      montar, LENDO as notas visuais
     ↓
narrar.py           gera um áudio por fala e MEDE cada um
     ↓
renderizar.sh       o render deriva o tempo do áudio medido
     ↓
medir-*.py          conferir área segura, volume, silêncio
     ↓
montar-legenda.py   fontes e avisos vão para a legenda, não para a tela
     ↓
títulos             3 opções e uma recomendada, para o dono escolher
     ↓
publicar            só depois do sim dele
```

Pular a narração não é possível: o `renderizar.sh` recusa, de propósito.

## O que fazer quando faltar chave ou GPU

Use o adaptador `estimativa` (é o padrão). Ele gera silêncio do tamanho exato
que a fala teria, então você monta, renderiza, mede e revisa o vídeo inteiro
sem gastar nada. Só a publicação exige voz de verdade.
