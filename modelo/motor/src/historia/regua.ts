import instagram from "../../../plataformas/instagram.json";
import youtube from "../../../plataformas/youtube.json";

/**
 * A régua da história, derivada do formato. NÃO é número escolhido a olho.
 *
 * O motion-kit foi escrito para 1280x720 com rótulos curtos, e por isso
 * `MK.text` não quebra linha nem conhece margem. Numa frase em português num
 * quadro de 1080 isso estoura em silêncio: a primeira história renderizada
 * teve 56 quadros passando da esquerda E da direita, e só o medidor viu.
 *
 * Então toda cena desenha dentro desta régua, e texto passa por `frase()`,
 * que usa MK.row com `maxW`.
 */
export type Regua = {
  W: number;
  H: number;
  /** Limites úteis. */
  esquerda: number;
  direita: number;
  topo: number;
  base: number;
  /** Largura útil para texto. */
  largura: number;
  /** Linha do chão onde os personagens pisam. */
  chao: number;
  /** Altura de um personagem adulto. */
  pessoa: number;
  /** Corpo de texto de uma frase de cena. */
  corpo: number;
};

export const regua = (formato: "9:16" | "16:9"): Regua => {
  if (formato === "16:9") {
    const { largura: W, altura: H, areaSegura: s } = youtube.longo;
    return {
      W, H,
      esquerda: s.esquerda,
      direita: W - s.direita,
      topo: s.topo,
      base: H - s.base,
      largura: W - s.esquerda - s.direita,
      // Os pés ficam acima da barra de controle do player.
      chao: Math.round((H - s.base) * 0.94),
      pessoa: Math.round(H * 0.42),
      corpo: Math.round(H * 0.052),
    };
  }
  const { largura: W, altura: H, areaSegura: s, colunaCentral: col } = instagram.reel;
  return {
    W, H,
    esquerda: col.esquerda,
    direita: W - col.direita,
    topo: s.topo,
    base: H - s.base,
    largura: W - col.esquerda - col.direita,
    // Os pés ficam acima da faixa da legenda do Instagram, que começa em
    // y = 1480. Personagem pisando ali some atrás do texto do app.
    chao: Math.round((H - s.base) * 0.93),
    pessoa: Math.round(H * 0.30),
    corpo: Math.round(H * 0.036),
  };
};
