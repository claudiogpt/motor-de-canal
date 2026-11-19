# Padrões comuns de animação

Estas são técnicas gerais, não uma direção de arte obrigatória. Ajuste durações à intenção, ao tamanho do objeto e ao contexto. Cada cena pode escolher sua própria linguagem visual.

## Tempo legível

| Uso | Faixa inicial sugerida | Interpolação |
| --- | --- | --- |
| resposta curta de interface | 0,10–0,20 s | `out` |
| entrada de objeto ou cartão | 0,20–0,45 s | `expoOut` |
| saída | 50–70% da entrada | `in` |
| gesto corporal | 0,30–0,60 s | `inOut` |
| movimento suave de câmera | 0,70–1,50 s | `inOut` |
| intervalo em uma cascata | 0,06–0,15 s | depende da entrada |

São faixas de partida, não limites de validação. `MK.anim.D` oferece presets opcionais em segundos e `MK.fr(n)` converte quadros na referência de `MK.FPS` (60 por padrão). O relógio em segundos não depende da taxa de reprodução.

Evite usar mola em opacidade: ela pode passar de 0 ou 1. Reserve overshoot para escala e posição. Use linear quando a velocidade constante for parte do movimento, por exemplo ao percorrer uma parábola já definida.

## Antecipação → ação → reação

Antes de um salto, o corpo abaixa; antes de um lançamento, o braço recua. Depois da ação, dê tempo para perceber a consequência. Organize o evento em uma folha de tempos:

```js
const X = MK.anim.sheet(1, [
  ['prepare', 0.25], ['fly', 0.7], ['land', 0.12], ['react', 0.6],
]);
const u = X.fly.u(t, 'linear');
const [x, y] = MK.anim.arc([200, 500], [900, 500], u, { h: 240 });
```

`anim.go` combina recuo, avanço, ultrapassagem e acomodação para movimentos simples. A antecipação ocorre **antes** de `t0`; a ação começa em `t0`.

## Peso, arcos e material

- Articulações giram; trajetórias curvas costumam ler melhor que translações retas de corpo inteiro.
- Objetos macios podem esticar no voo e achatar no pouso. `anim.squash` conserva a área aproximada com `sx * sy = 1`.
- Coloque o pivô na base quando o objeto deve manter contato com o chão.
- Objetos rígidos não precisam deformar: rotação, duração, sombra e reação já comunicam peso.
- Use `MK.body` para gravidade e quique aproximados; use `anim.arc` quando a trajetória precisa ser dirigida explicitamente.

## Entrada, permanência e saída

Escolha a entrada pelo comportamento do elemento:

| Tipo | Uso comum |
| --- | --- |
| `pop` | ícone, selo, objeto pequeno |
| `rise`, `drop`, `slide` | algo que vem de fora do quadro |
| `unfold` | cartão ou placa que abre |
| `spin` | moeda ou elemento rotativo |
| `draw` | linha, seta ou contorno com stroke |
| `wipe`, `type` | revelação por recorte, sem deslocar o texto |
| `fade` | luz, ambiente ou transição discreta |
| `slam` | ênfase breve e deliberada |

Declare o fim de vida (`to`), não apenas a entrada. Em uma cena com planos, `to: 'shot'` permite encerrar no fim do plano. Use cascatas quando houver ordem de leitura; não faça muitos objetos disputarem atenção ao mesmo tempo.

## Sobreposição e atuação

O olhar pode chegar antes da cabeça, que chega antes do tronco. Cabelo ou objeto carregado podem assentar depois do corpo. `anim.lag` dá atraso amortecido a uma função de tempo; ela também precisa ser determinística.

`gesture.apply` combina pose e pequenos gestos: olhar, concordar, susto, riso e mudança de peso. Use gestos para reforçar a ação, não como ruído constante. Mãos e pés precisam parecer em contato com os objetos e apoios. `person.walkPhase` ajuda a ajustar a passada à distância.

## Câmera e atenção

A câmera pode revelar contexto, seguir uma ação ou destacar um detalhe. Evite movimentá-la só porque existe um método disponível. O foco padrão é o centro da composição; `safe` e `on` são escolhas explícitas da aplicação. Não há reenquadramento específico de plataforma nem retorno automático ao início.

Um movimento grande de câmera e uma entrada grande de texto podem competir. Confira também a composição final do movimento, textos perto das bordas e se o zoom cortou rosto ou mãos. `breath` é opcional e desligado por padrão.

## Checklist de qualidade

1. Busque o começo, o meio, o fim e as transições em ordem aleatória: o quadro continua igual?
2. A ação principal é clara sem áudio? Há contraste e tempo de leitura?
3. Todo elemento temporário sai? Planos anteriores deixam resíduos?
4. Pivôs, apoios, sombras e alcance das mãos fazem sentido?
5. Há saltos de posição, cortes acidentais ou texto coberto?
6. O movimento pode ser pausado ou reduzido numa interface?
7. Observe o exemplo em tamanho pequeno e em câmera lenta. Diagnóstico geométrico ajuda, mas não substitui olhar.
