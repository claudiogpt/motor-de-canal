/**
 * Fonte única de marca e régua para os formatos 9:16 (Reel e Short).
 *
 * TRÊS ARQUIVOS, TRÊS DONOS. Isto já foi um arquivo só, e a mistura custou
 * correções:
 *
 *   marca/marca.json            cor e tipografia. É do CANAL. Troca por tema.
 *   plataformas/instagram.json  medidas da interface. É da PLATAFORMA. Igual
 *                               para todo canal, e medida em frame.
 *   canal.json                  o editorial. Não entra no render.
 *
 * Separar importa porque um canal novo não tem que remedir a coluna de ícones
 * do Instagram para escolher as próprias cores.
 *
 * Os nomes exportados aqui (c, t, fonts, safe, coluna) são usados por 21
 * componentes. Mudar um nome aqui é mudar 21 arquivos: mapeie em vez de
 * renomear.
 */
import marcaJson from "../../marca/marca.json";
import instagram from "../../plataformas/instagram.json";

export const marca = marcaJson;
export const c = marcaJson.cores;
export const t = marcaJson.tipografia;
export const fonts = marcaJson.fontes;

/** Compatibilidade: o nome antigo deste módulo. */
export const brand = marcaJson;

const areaSegura = instagram.reel.areaSegura;

/**
 * Zona segura do Instagram Reels em 1080x1920.
 * Fora disto a interface do app cobre o conteúdo.
 *
 * Vem do arquivo da plataforma e não é redeclarada aqui: já houve divergência
 * entre duas declarações, e a margem direita renderizou 40 px maior do que a
 * marca pedia, em silêncio.
 */
export const safe = {
  top: areaSegura.topo,
  bottom: areaSegura.base,
  left: areaSegura.esquerda,
  right: areaSegura.direita,
};

/**
 * Coluna das cenas: simétrica, para o conteúdo ficar no centro do quadro.
 * Topo e base continuam os da área segura.
 */
export const coluna = {
  ...safe,
  left: instagram.reel.colunaCentral.esquerda,
  right: instagram.reel.colunaCentral.direita,
};

/** Largura útil da coluna de conteúdo principal. */
export const COL = instagram.reel.largura - safe.left - safe.right;

/**
 * DUAS RÉGUAS PARA ALTURAS DIFERENTES, e é a armadilha que mais voltou.
 *
 * Os ícones do Instagram ocupam a faixa direita SÓ no terço de baixo. Então o
 * limite da direita não é um número: é 934 em cima e 860 a partir de y=1280.
 * Qualquer coisa que cresça em altura (nome longo, texto que quebra em duas
 * linhas, selo que entra numa batida tardia) pode empurrar a base de um
 * elemento para dentro da faixa estreita e estourar sem ninguém ver.
 *
 * Use isto ao conferir por conta própria. O medidor em
 * ferramentas/medir-reel.py já separa as faixas.
 */
export const limiteDireitaEmY = (y: number): number =>
  y >= instagram.reel.faixaDeIcones.aPartirDeY
    ? instagram.reel.faixaDeIcones.limiteDireita
    : instagram.reel.largura - coluna.right;

export const Q = { w: instagram.reel.largura, h: instagram.reel.altura };
