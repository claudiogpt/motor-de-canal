/**
 * Layout do video longo, 1920x1080.
 *
 * Nao reaproveita a safeArea do brand.json de proposito: aquela descreve a
 * interface do Instagram Reels em 1080x1920, que nao existe aqui. O YouTube em
 * 16:9 tem outra restricao: a barra de controle do player cobre a faixa de
 * baixo quando o espectador move o mouse, e o cartao de "proximo video" entra
 * no canto. Entao a margem de baixo e maior que a de cima.
 */
import youtube from "../../../plataformas/youtube.json";

export const Q = { w: youtube.longo.largura, h: youtube.longo.altura };

/**
 * Vem de plataformas/youtube.json, nao declarado aqui: a regua do player e
 * fato da plataforma e vale para qualquer canal.
 */
export const seguro = {
  top: youtube.longo.areaSegura.topo,
  /** Maior que o topo: controles do player e cartao de fim de tela. */
  bottom: youtube.longo.areaSegura.base,
  left: youtube.longo.areaSegura.esquerda,
  right: youtube.longo.areaSegura.direita,
};

/** Largura util de conteudo. */
export const LARG = Q.w - seguro.left - seguro.right; // 1696
/** Altura util de conteudo. */
export const ALT = Q.h - seguro.top - seguro.bottom; // 864

/**
 * Tipografia do longo.
 *
 * Baixada cerca de 25%, a pedido do dono do canal: na escala anterior
 * o texto "gritava" no YouTube. O Reel e visto de perto, com o celular na mao,
 * e aguenta corpo grande; o longo e visto numa tela maior e de mais longe, com
 * mais texto por tela, e corpo grande ali vira parede.
 */
export const T = {
  heroi: 92,
  titulo: 56,
  corpo: 42,
  rotulo: 32,
  numero: 112,
  numeroMedio: 80,
  nota: 28,
};
