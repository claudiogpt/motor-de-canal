# Guia da API

Todas as funções ficam em `window.MK`; os módulos opcionais acrescentam propriedades. As assinaturas e opções completas também estão documentadas junto das implementações em `src/`.

## Composição e relógio (`core.js`)

- `start({ root, width=1280, height=720, duration=8, cues={} }) → S`: prepara uma composição. Chame antes de construir elementos e ajudas.
- `S.W`, `S.H`, `S.dur`, `S.root`, `S.home`: dimensões, duração, contêiner e centro.
- `S.cue(name, end=false)`, `S.has(name)`: consulta de deixas numéricas ou pares de tempo.
- `run(S, draw) → { seek(t), duration }`: desenha imediatamente `t=0`, executa ganchos automáticos antes de `draw`, não reproduz sozinho.
- `layer(root, id, z=10) → div`: camada HTML fixa. `motion.css` define apenas posicionamento.

## Valores, tempo e cores (`core.js`)

- `clamp(x, a=0, b=1)`, `lerp(a,b,u)`, `invlerp(a,b,x)`, `remap(...)`.
- `ease`: `linear`, `smooth`, `inOut`, `sine`, `out`, `in`, `quadOut`, `quadIn`, `expoOut`, `expoIn`, `expoInOut`, `backOut`, `backIn`, `spring`, `elasticOut`.
- `ramp(t,t0,dur,ease='inOut')`: progresso interpolado de 0 a 1.
- `window(t,t0,t1,fin=0.3,fout=0.25,ease='inOut')`: envelope de visibilidade.
- `pulse(t,center,width=0.4)`: pulso suave 0→1→0.
- `mix(a,b,u)`: interpola números, arrays, objetos e cores hexadecimais de seis dígitos.
- `keys(t, [[time,value,ease?],...])`: chaves absolutas; o easing da chave vale para a chegada nela. Liste as chaves em ordem crescente.
- `moves(t,initial,[[start,target,duration,ease?],...])`: movimentos com duração a partir do estado anterior; liste em ordem crescente.
- `rand(seed) → random()`, `noise(x,seed=0)`, `blink(t,seed)`, `osc(S,t,cycles,phase)`.
- `rgb(hex) → [r,g,b]`, `hex(r,g,b)`, `mixColor(a,b,u)`, `shade(color,amount)`, `rgba(color,alpha)`.

## Desenho (`core.js`)

- `el(tag,attributes={},parent=null)`, `g(parent,attributes={})`, `attr(element,attributes)`.
- `attr` converte atributos camelCase de SVG e arredonda números. `text` altera conteúdo textual, não HTML.
- `tf(x=0,y=0,rotation=0,sx=1,sy=sx)`: string de transformação SVG.
- `defs(svg)`, `linear(svg,stops,options)`, `radial(svg,stops,options)`, `filter(svg,kind,options)`.
- `text(parent,string,{ x,y,size,fill,weight,anchor,mono,hand,... }) → SVGTextElement`.
- `ink(text,font) → { w,asc,desc }`, `fmt(value,digits,separator)`.
- `smoothPath(points,closed,tension)`, `blob(...)`, `rrect(...)`, `quad(...)`, `dist(a,b)`, `aim(a,b)`.

## Movimento (`anim.js`)

- `anim.sheet(start, [[name,duration,gap?],...])`: cada fase tem `t0`, `t1`, `dur`, `u(t,ease)`, `win(t)`. A folha também tem `start`, `end`, `list`, `at(name,fraction)`.
- `anim.go(t,t0,{ ante,back,dur,over,settle,ease })`, `goPhase(...)`: antecipação, ação e acomodação.
- `anim.enter(element,{ from,to,kind,dur,out,exit,dir,pivot,hold,manual,... })`: entrada e saída automáticas. Retorna `{ m,vis,u,draw,t0,t1 }`. `inout` é a mesma operação; `exit` agenda só saída.
- `anim.mover(element,{ pivot }) → { set(transform),wrap,el,pivot }`: pivô nomeado ou `[x,y]`; transform aceita `x,y,r,s,sx,sy,o`.
- `anim.stagger(count,{ t0,gap,order,seed,total }) → tempos`: ordem `forward`, `reverse`, `center` ou `random`.
- `anim.arc(from,to,u,{ h,ease }) → [x,y]`, `along(path,u) → {x,y,angle}`.
- `anim.squash(k,amount) → {sx,sy}`, `lag(fn,options) → fn(t)`, `wobble(...)`, `swing(...)`, `bounce(...)`, `shake(...)`, `hold(...)`, `ping(...)`.
- `anim.slowmo(t,segments)`, `hitstop(t,hits,options)`: remapeiam o relógio de um objeto ou do mundo; não são um player.
- `anim.punch(camera,t0,options)`, `nudge(camera,t0,options)`: agendam movimentos de câmera; configure antes de `run()`.
- `anim.boxes()`: diagnóstico dos elementos visíveis; precisa de `layout.js`.

## Palco, câmera e planos (`camera.js`, `shots.js`)

- `stage(S,svg,{ layers }) → st`: `st.L.sky/far/mid/main/front/hud`. A camada `hud` fica fixa; as outras usam paralaxe.
- `st.layer(name,parallax,before)` cria camada adicional.
- `camera(S,st,{ home,moves,whips,shake,breath=0,safe }) → cam`.
- `breath` aceita um número ou uma função pura `(t) => intensidade`, para reduzir ou suspender a deriva em trechos escolhidos. O padrão é zero.
- `moves`: `[[time,{at:[worldX,worldY],on:[screenX,screenY],z},duration,ease],...]` ou alvo `{x,y,z,r}`. `dur=0` é corte.
- `cam.apply(t)`, `state(t)`, `to(time,target,duration,ease)`, `toScreen(t,x,y,parallax)`.
- `transitions(S,root,st,list) → {draw(t)}`: transições `dip`, `flash`, `iris`, `blur`.
- `shots(S,st,[[name,start,set?],...]) → sh`: `group(set,layer)`, `layers(set,names)`, `at(t)`, `t0(name)`, `t1(name)`. Visibilidade automática no relógio.
- `show(element,{from,to,fade,out,shot,...})`: visibilidade automática; `to:'shot'` encerra no fim do plano.
- `worldPos(element)`, `worldBox(element)`, `screenPos(...)`, `look(element,options)`.

## Mundo e personagens

- `world(S,st) → W`: `W.add(name,{layer,life,build,update,body,...})`, `W.get(path)`, `W.report(duration)`.
- Entidade: `g`, `outer`, `obj` (retorno de build), `add`, `place`, `alive`, `age`, `u`, `pos`. `life` aceita `from`, `to`, `shot` e `set`. O relógio atualiza automaticamente entidades vivas.
- `body({at,vel,t0,r,floor,walls,bounce,friction,drag,spin,pxPerM,g,dur}) → {at(t),impacts,t0}`. Coordenadas e velocidades em px e px/s; `floor` é y do chão; `r` é raio de contato. Gravidade padrão: `9.8 * 350` px/s².
- `person(parent,{name,size,skin,hair,hairStyle,shirt,pants,seed,...}) → person`: `draw(pose,t)`, `slot(name)`, `walkPhase(distance,options)`, `anatomy()`.
- `pose.stand()`, `relaxed()`, `walk(phase)`, `run(phase)` e demais poses em `people.js` retornam objetos combináveis.
- Poses aceitam `x`, `ground`, `facing`, `scale`, `face`, `look`, `lean`, `nod`, `armN/F`, `legN/F`, `reachN/F` e outros. `N` é o membro da frente; `F`, o de trás.
- `actor(person,{x,ground,speed,...})`: `do([[time,action,options],...])`, `draw(t)`, `when(action)`, `xAt(t)`, `objAt(object,t)`.
- Ações incluem `walk`, `run`, `jump`, `reach`, `pick`, `drop`, `throw`, `point`, `look`, `pose`, `sit`, `trip`, `slip`, `say`. Uma ação não grava áudio nem cria fala sintetizada.
- `gesture.apply(pose,...gestures)`, `fidget`, `nod`, `shakeHead`, `glance`, `take`, `recoil`, `flinch`, `laugh`, `sigh`, `blinkAt`, `talkBeats`.
- `dressed(parent,options)`, `pen(parent,person,options)`, `silhouette(group,options)` e `crowd(parent,options)` são opcionais.

## Cenário, objetos e efeitos

Factories retornam grupos/controles próprios: confira o retorno no JSDoc; não há um `draw` universal para todos os objetos.

- Cenários: `sky`, `sun`, `clouds`, `hills`, `ground`, `tree`, `grass`, `room`, `roomWindow`, `table`, `chair`, `lamp`, `shelf`, `fence`, entre outros.
- Objetos: `mug`, `glass`, `paper`, `book`, `phone`, `ball`, `balloon`, `clock`, `candle`, `pot`, `laptop`, `board`, `coin`, `apple`, `car`, `kite`, `card`.
- `fx`: `ring`, `burst`, `flash`, `arrow`, `label`, `speech`, `emote`, `counter`, `speedLines`, `inset`, `measure`, `trail`, `glowDot`.
- Outros: `groove` (traço com ponta consultável), `bigNum` (texto grande).
- Atmosfera: `env(S,st,{hour,haze,wind,grade,...})` com `draw(t)`, `paint(group,key)`, `sun(t)`, `wind`; `daylight(hour)`, `mist`, `godrays`, `particles`, `birds`, `grade`.
- Clima: `weather(S,st,kind,options)` com `draw(t)`; `lightning`, `puddles`, `snowCover`, `heatHaze`. Os tipos aceitos estão em `weather.js`.
- Temáticos: `fog`, `deadTree`, `pumpkin`, `bats`, `gravestone`, `flashlight`, `cobweb`.

## Layout e diagnósticos (`layout.js`)

- `tag(element,role,{name,who,allow,inside})`, `untag(element)`. Papéis protegidos: `face`, `text`, `focus`, `label`.
- `overlap.check()`: avisos de cobertura, alcance e anatomia. Execute após `seek` e com a cena conectada ao DOM.
- `layout.place`, `labels`, `fit`, `faceBox`, `personBox`, `boxOf`, `onScreen`: organização por caixas.
- `row(parent,tokens,options)`: linha de texto/tokens com medidas.
- `scan`: estado de unidades, cortes, visibilidade e resíduos para ferramentas próprias.

Propriedades prefixadas com `__` e o array `pre` são detalhes internos, não uma API estável para aplicações.
