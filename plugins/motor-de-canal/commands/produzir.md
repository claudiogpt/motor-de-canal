---
description: Produz um vídeo ou uma semana inteira, do conceito ao título
argument-hint: "[conceito ou \"semana\"]"
---

Pedido: `$1`

Carregue `motor-de-canal` e, conforme o caso, `producao-semanal`. Leia o
`canal.json` e o `CLAUDE.md` do canal antes de escrever qualquer coisa.

Siga a ordem da skill `producao-semanal`. Três pontos onde o trabalho costuma
dar errado, e que valem atenção explícita:

- **Cheque os fatos datados ANTES de escrever**, não depois de renderizar.
- **Leia a segunda coluna do `roteiro.md`** (notas visuais) antes de montar o
  JSON. Um canal teve um vídeo inteiro reprovado porque o motor achatou tudo em
  cartão de texto.
- **Recalcule todo número por script** antes do render. Número digitado duas
  vezes diverge.

**PARE no passo 12**, com os títulos escritos e o vídeo medido. Mostre ao
usuário:

- o que foi produzido, com duração medida e resultado do medidor;
- as 3 opções de título por vídeo, com a sua recomendação e o porquê;
- o que você mudou em relação ao plano, e por quê;
- o que não conseguiu confirmar em fonte primária.

Não suba mídia nem crie post antes do sim dele.
