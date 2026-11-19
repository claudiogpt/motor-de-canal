# Motion Kit

Biblioteca gráfica em JavaScript para desenhar e animar SVG no navegador. Cada quadro é calculado pelo tempo: você pode avançar, voltar e buscar um instante sem reproduzir os anteriores.

Inclui movimento, personagens configuráveis, ações, câmera com paralaxe, cenários, objetos, atmosfera, clima e diagnósticos de layout. Sem framework, bundler, fontes externas ou dependências de execução.

## Experimentar

```sh
git clone https://github.com/Gaok1/motion-kit.git
cd motion-kit
node scripts/serve.mjs
```

Abra **http://127.0.0.1:4173**. Há exemplos de movimento, personagens e ambiente, além de um [exemplo mínimo](examples/minimal.html). O botão reproduz; a barra permite buscar qualquer quadro. Não é preciso instalar pacotes para ver os exemplos.

## Usar no seu projeto

Copie `src/` para o projeto. Carregue `core.js` primeiro e apenas os módulos necessários:

```html
<link rel="stylesheet" href="src/motion.css">
<div id="scene"><svg id="drawing" class="mk-layer" viewBox="0 0 1280 720"></svg></div>
<script src="src/core.js"></script>
<script src="src/anim.js"></script>
<script>
  const S = MK.start({ root: document.querySelector('#scene'), duration: 5 });
  const ball = MK.el('circle', { r: 32, fill: '#7c3aed' }, document.querySelector('#drawing'));
  const clock = MK.run(S, (t) => {
    const u = MK.ramp(t, 0, 3, 'inOut');
    MK.attr(ball, { cx: MK.lerp(100, 1180, u), cy: 360 });
  });
  clock.seek(1.5); // tempo absoluto em segundos
</script>
```

`run()` desenha o quadro inicial e devolve um relógio manual. Ele **não inicia reprodução automática**. Conecte `seek(t)` ao relógio da sua aplicação; [examples/player.js](examples/player.js) mostra um preview com controles.

## Documentação

- [Primeiros passos, módulos e integração](docs/usage.md)
- [Guia da API](docs/api.md)
- [Princípios e padrões comuns de animação](docs/animation.md)
- [Receitas reutilizáveis](docs/recipes.md)
- [Como contribuir e usar uma dependência versionada](CONTRIBUTING.md)

## Testar e contribuir

Node.js 20 ou superior. A biblioteca é destinada a navegadores modernos com SVG, Canvas 2D, DOMMatrix e DOMPoint. Não há suporte a SSR nem declaração TypeScript nesta versão.

```sh
npm test                         # utilitários, física, sintaxe e conteúdo
npm ci                           # dependência de desenvolvimento dos testes visuais
npx playwright install chromium  # necessário se não houver navegador compatível
npm run test:browser              # exemplos, busca fora de ordem e diagnósticos reais de SVG
```

O teste de navegador também aceita `BROWSER_CHANNEL=msedge` ou `BROWSER_CHANNEL=chrome`, ou `BROWSER_EXECUTABLE` apontando para um executável local. No PowerShell: `$env:BROWSER_CHANNEL='msedge'`.

Ao contribuir, mantenha a API genérica, acrescente um exemplo ou teste e não introduza assets de terceiros sem licença. A versão `0.x` ainda pode receber mudanças incompatíveis. O código em `src/` é a distribuição: não há etapa de build. `private: true` no `package.json` só impede publicação acidental no npm; o repositório é público.

## Escopo

A biblioteca não inclui editor de vídeo, renderizador, áudio, narração, roteiros, publicação em redes, personagens fixos ou identidade visual. A aplicação escolhe suas próprias cores, fontes, enquadramentos e linguagem de movimento. Os presets são pontos de partida opcionais, não regras editoriais.

## Licença

[MIT](LICENSE). Você pode usar, modificar e compartilhar, inclusive comercialmente, preservando a licença.
