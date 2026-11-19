# Primeiros passos

## Arquivos e ordem de carga

Todos os arquivos JS são scripts de navegador que estendem `window.MK`. Não são módulos ES, pacotes React ou código de servidor. Coloque as tags depois do HTML da cena, ou use `defer` em todas elas, mantendo a ordem.

| Arquivo | Recursos | Carregar antes |
| --- | --- | --- |
| `core.js` | números, easing, SVG, cores, texto e relógio | nenhum |
| `camera.js` | palco, camadas, câmera, transições | core |
| `shots.js` | planos, visibilidade, posição e alvos de câmera | core; camera para palco/câmera |
| `world.js` | entidades, vida útil e física | core; camera e shots para entidades |
| `people.js` | anatomia, expressões, poses e personagens | core |
| `actions.js` | andar, correr, pegar, apontar e outras ações | core, people, shots, world |
| `scenery.js` | cenário externo e interno | core |
| `props.js` | objetos cotidianos | core |
| `fx.js` | rótulos, balões, setas e efeitos | core; layout para proteção de rostos/rótulos |
| `garb.js` | figurino e escrita | core, people |
| `atmos.js` | céu, luz, vento e partículas | core, scenery; camera para ambiente em camadas |
| `weather.js` | chuva, neve e eventos meteorológicos | core, scenery, atmos |
| `layout.js` | organização e diagnósticos geométricos | core; shots para coordenadas de mundo |
| `anim.js` | movimento, entradas, gestos e diagnóstico | core; layout para `anim.boxes()` |
| `spooky.js` | objetos e efeitos temáticos opcionais | core, props |

O exemplo principal carrega todos nessa ordem. Para um círculo que se move, só `core.js` basta. Para animar entradas SVG, acrescente `anim.js`.

## Ciclo de uma cena

1. Crie um contêiner HTML e um SVG com classe `mk-layer`; carregue `motion.css`.
2. Chame `MK.start({ root, width, height, duration, cues })`.
3. Construa elementos, personagens, câmera e entradas **uma vez**.
4. Registre `MK.run(S, draw)` **por último**, depois de todas as ajudas automáticas.
5. Busque instantes com `clock.seek(t)`. O tempo é limitado a `0..duration`.

`width`, `height` e `duration` precisam ser números positivos e finitos. Os valores padrão são `1280`, `720` e `8`. Coordenadas são pixels lógicos; ângulos são graus; durações e deixas são segundos. A origem SVG está no alto à esquerda; y cresce para baixo.

O contêiner recebe suas dimensões fixas. Para caber numa área responsiva, escale o contêiner por fora, como no player de exemplo. Isso preserva medidas, texto e enquadramento.

## Tempo e deixas

```js
const S = MK.start({ root, duration: 12, cues: { arrival: 2, reveal: [5, 6.5] } });
S.cue('arrival');       // 2
S.cue('reveal', true);  // 6.5
S.has('missing');      // false
```

Deixas são números ou pares `[início, fim]`. Uma deixa ausente gera erro, em vez de falhar silenciosamente. Várias ajudas (`anim.enter`, `anim.sheet`, `actor.do`) aceitam o nome diretamente. Não há busca de JSON, rede ou integração obrigatória com voz.

## Reprodutibilidade

`draw(2)` deve produzir o mesmo resultado antes ou depois de `draw(8)`. Calcule posição a partir de `t`, não acumule deltas. Use `MK.rand(seed)` para construir elementos e `MK.noise(t, seed)` para variações contínuas. Cache interno é permitido se o resultado não depender da ordem das consultas.

`MK.attr` mantém um cache de atributos: não altere o mesmo atributo diretamente por `setAttribute` enquanto também usa `MK.attr` nele. Cada transformação deve ter um dono; `anim.mover` cria um grupo extra para não disputar a transformação do elemento.

## Fontes, cores e acessibilidade

As fontes são as do sistema. Antes de construir texto, personalize `MK.FONT`, `MK.MONO` e `MK.HAND`, se quiser. Fontes próprias pertencem à aplicação; espere `document.fonts.ready` antes de medir texto.

`MK.C` tem cores de fallback genéricas, substituíveis antes da construção dos objetos. Muitos objetos também aceitam cores nas opções. A biblioteca não aplica tema global ao documento.

Adicione título e descrição ao SVG quando ele transmitir informação. Garanta contraste e alternativas textuais. Em páginas interativas, respeite `prefers-reduced-motion`: não inicie reprodução automaticamente e permita pausa ou estado estático. Os exemplos começam pausados.

## Limites

- Uma composição ativa por página. `MK.start` reinicia registradores globais; não misture relógios de duas cenas no mesmo documento. Para cenas independentes simultâneas, use iframes.
- Construa todas as entradas, planos e entidades antes de `run()`, que captura os ganchos existentes.
- Use uma cena nova ao remontar: remova o DOM antigo e não continue buscando o relógio anterior.
- Física e seguidores amortecidos guardam amostras a 240 Hz; memória cresce com o tempo consultado. Use intervalos finitos e evite buscar tempos muito grandes diretamente nessas ajudas.
- A física é uma aproximação visual, não um simulador científico de precisão.
- A conferência de layout usa a geometria SVG; não substitui inspeção visual, e máscaras complexas podem não ser reconhecidas.
- `world` registra erros de `update` no console e desativa a entidade defeituosa. Trate mensagens de erro como falha da cena.
- A biblioteca desenha no navegador. Captura de quadros, exportação de vídeo e qualquer integração com renderizadores pertencem à aplicação.
