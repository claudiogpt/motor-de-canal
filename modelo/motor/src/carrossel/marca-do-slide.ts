import type { Marca, Slide } from "./tipos";

/**
 * Decide se o slide leva losango no rodape e, se levar, se ele sai CHEIO
 * (fato) ou VAZADO (hipotese). `null` significa nenhum losango.
 *
 * REGRA, decidida pelo dono do canal: O LOSANGO SO MARCA NUMERO.
 *
 * Slide de prosa nao recebe marca nenhuma. Argumento nao e fato nem hipotese
 * no sentido que a identidade da a essas palavras; marcar prosa gastaria o
 * simbolo em tela onde ele nao tem o que dizer, e marca que aparece sempre
 * para de ser lida.
 *
 * Onde HA numero, vale o elo mais fraco: basta uma estimativa ou um calculo
 * nosso na tela para o slide inteiro sair vazado. Cheio exige que todo numero
 * venha de lei ou de serie oficial.
 *
 * POR QUE A PROVENIENCIA VEM DO JSON E NAO E DEDUZIDA AQUI. Nenhuma funcao
 * consegue olhar "R$ 4.323" e saber se aquilo saiu da Lei 8.036 ou de um
 * calculo de blog. Quem sabe e quem escreveu o slide, e e por isso que `marca`
 * continua no JSON: ela declara a proveniencia. O que esta funcao decide e o
 * que fazer com essa declaracao, e o que fazer quando ela nao vem.
 *
 * E O SILENCIO CAI PARA HIPOTESE, nao para fato. Antes o padrao era cheio, ou
 * seja, esquecer de declarar afirmava fato. Para um canal cuja regra e mostrar
 * o mecanismo e declarar a ressalva, o esquecimento tem que cair para o lado
 * mais fraco, nao para o mais forte.
 */
export const marcaDoSlide = (slide: Slide): Marca | null => {
  // Declaracao explicita manda, inclusive para forcar o losango num slide de
  // prosa que por acaso traga um numero no corpo.
  if (slide.marca) return slide.marca;

  // Prosa e pergunta: sem numero por construcao, sem losango.
  if (slide.tipo === "conceito" || slide.tipo === "cta") return null;

  // Tem numero e ninguem declarou de onde ele veio.
  return "hipotese";
};
