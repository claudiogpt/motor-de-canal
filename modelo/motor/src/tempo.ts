/**
 * Conversao de tempo da composicao.
 *
 * Aqui existia `fatiarLegenda`, que distribuia a legenda queimada por
 * contagem de caractere dentro de uma duracao digitada a mao. O proprio
 * comentario dela avisava: "quando a voz for gravada, troque este calculo
 * pelos tempos reais". Nunca foi trocado, e o resultado foi legenda sempre
 * adiantada em relacao a voz e 18% da semana em tela parada.
 *
 * Agora a duracao vem de audio/tempos.json e cada elemento entra na batida da
 * sua fala (ver batida.ts). Nao ha mais o que estimar.
 */

/** Converte segundos em frames, arredondando para o frame mais proximo. */
export const seg = (s: number, fps: number) => Math.round(s * fps);
