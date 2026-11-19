/**
 * Regua do carrossel 4:5, 1080x1350. Fonte unica dos limites do formato.
 *
 * POR QUE NAO DA PARA USAR A safeArea DO brand.json. Aquela regua
 * (150/440/72/220) descreve a interface do Instagram Reels, onde botoes de
 * curtir, comentar e audio ficam EM CIMA do video. No feed do carrossel nada
 * se sobrepoe a imagem: a interface fica fora dela. Usar a regua do Reels aqui
 * jogaria 440 px de altura fora por um motivo que nao existe neste formato.
 *
 * A RESTRICAO REAL DO CARROSSEL E OUTRA: A GRADE DO PERFIL.
 *
 * O carrossel aparece em dois lugares, e eles recortam de formas diferentes:
 *
 *   1. No feed, inteiro, 1080x1350.
 *   2. Na grade do perfil, recortado, porque a grade usa bloco mais quadrado
 *      que 4:5.
 *
 * E a grade e justamente onde a conversao acontece: a meta deste formato e
 * transformar quem chega pelo Reel em seguidor, e essa pessoa decide olhando a
 * grade. Entao o slide 1, que e a capa, obedece ao recorte; os outros obedecem
 * so a MARGEM.
 *
 * SOBRE O RECORTE DA GRADE, E O QUE NAO ESTA MEDIDO. Nao medi um bloco da
 * grade ao vivo. Existem duas possibilidades e QUADRADO cobre as duas:
 *
 *   - bloco quadrado: corta 135 px do topo e 135 da base, largura inteira;
 *   - bloco 3:4: corta cerca de 34 px de cada lado, altura inteira.
 *
 * QUADRADO e a uniao segura das duas, porque MARGEM.lado (84) ja e maior que
 * os 34 px do caso 3:4. O custo de errar para o lado seguro e 135 px de altura
 * na capa, o que e barato. Se um dia o bloco for medido, da para relaxar isto.
 */

import instagram from "../../../plataformas/instagram.json";

const F = instagram.carrossel;

export const Q = { w: F.largura, h: F.altura };

/**
 * Margem de respiro do formato. Nada legivel ou desenhado fora disto.
 * Vem de plataformas/instagram.json: e fato do formato, nao da marca.
 */
export const MARGEM = { topo: F.margem.topo, base: F.margem.base, lado: F.margem.lado };

/**
 * O que sobrevive ao recorte da grade do perfil. Vale SO para o slide 1.
 * Quadrado central de 1080x1080 dentro do 1080x1350.
 */
export const QUADRADO = { topo: (Q.h - Q.w) / 2, base: Q.h - (Q.h - Q.w) / 2 };

/**
 * FOLGA entre a caixa de conteudo e a linha da margem.
 *
 * MEDIDO, NAO CHUTADO. Na primeira medicao do carrossel 1 o medidor acusou
 * pico 214 na margem direita do slide de conta. Nao era texto transbordando: os
 * valores estavam alinhados a direita EXATAMENTE em x=996, que e a linha da
 * margem. A borda suavizada do glifo ocupa o pixel seguinte, dentro da faixa
 * proibida. Margem encostada e margem respeitada nao sao a mesma coisa.
 *
 * A saida foi recuar a caixa de conteudo, nao afrouxar o limiar do medidor, que
 * cegaria justamente a verificacao que interessa.
 */
export const FOLGA = F.folga.px;

/** Largura util entre as margens, ja com a folga: 896 px. */
export const COL = Q.w - (MARGEM.lado + FOLGA) * 2;

/**
 * NENHUM ELEMENTO SANGRA ATE A BORDA, E ISSO E DECISAO, NAO DESCUIDO.
 *
 * As capas 16:9 do video longo tem uma barra de ouro sangrada na base, que e a
 * assinatura do avatar da marca. Aqui ela nao entra: o medidor
 * (medir-carrossel.py) confere as quatro faixas de MARGEM pedindo o brilho
 * maximo ao ffmpeg, e ouro (brilho perto de 201) numa faixa dessas acusaria
 * estouro em todo slide. A alternativa seria declarar excecoes de decoracao no
 * medidor, o que cega justamente a verificacao que interessa.
 *
 * Entao a assinatura da marca no carrossel fica DENTRO da margem: o selo hanko
 * e o losango. O unico elemento que cruza a borda e o fundo (gradiente e
 * grade), que fica abaixo do limiar de proposito.
 */
export const LIMIAR_MEDIDOR = 80;

/**
 * O LIMIAR E POR CANAL RGB, NAO POR LUMA, E ISSO FOI MEDIDO.
 *
 * O medidor do video longo 16:9 usa luma com limiar 110. Aqui isso nao serve: o
 * vermelho tijolo da marca, #B5452F, tem luma 101 e passaria por baixo do
 * limiar sem ser visto, embora o canal R dele seja 181. Medido com
 * `signalstats` sobre um quadro solido: R=181, G=68, B=47, luma=101.
 *
 * Com 80 por canal, o que o medidor ve:
 *
 *   fundo da marca   #0F0E0C ->  15   passa
 *   grade            #2A2621 ->  42   passa
 *   brilho de ouro a 17% sobre o fundo -> perto de 46   passa
 *   texto apagado    #6E675B -> 110   ACUSA
 *   ouro             #C9A227 -> 201   ACUSA
 *   custo            #B5452F -> 181   ACUSA
 *   texto            #F3EFE6 -> 243   ACUSA
 */

/**
 * Tamanho de fonte derivado do comprimento do texto.
 *
 * O projeto ja errou isto quatro vezes, sempre do mesmo jeito: componente
 * dimensionado para o texto que o autor tinha na mao no dia. Foi o `rodape.agora`
 * dos Reels em outubro, a cena `declara` do video longo, e a razao de largura
 * das capas 16:9, que precisou de tres medicoes (0,56 -> 0,63 -> 0,68).
 *
 * Nao existe @remotion/layout-utils instalado neste projeto, entao nao da para
 * medir a fonte de verdade. Esta conta e aproximacao por contagem de caractere,
 * e NAO substitui a medicao: todo slide novo passa pelo medidor.
 *
 * `razao` e a largura media de um caractere como fracao do corpo da fonte.
 * 0,52 para a display pesada em caixa normal, medido nas capas 16:9.
 */
export const fonte = (
  texto: string,
  { max, min, largura = COL, razao = 0.52, linhas = 1 }:
    { max: number; min: number; largura?: number; razao?: number; linhas?: number },
) => {
  const porLinha = Math.max(1, Math.ceil(texto.length / linhas));
  return Math.max(min, Math.min(max, Math.floor(largura / (razao * porLinha))));
};

/**
 * Tamanho de fonte que faz o texto CABER NUMA CAIXA, largura e altura.
 *
 * `fonte` acima resolve so a largura, e foi assim que a cena `declara` do
 * primeiro video longo estourou topo e base em 125 quadros: titulo mais cinco
 * linhas de 56 px passavam dos 864 px uteis, e nada no componente olhava a
 * altura. Aqui o corpo desce ate o texto caber nos dois eixos.
 *
 * A estimativa de quantas linhas o texto vai ocupar e aproximada, pelo mesmo
 * motivo de sempre (sem medicao real da fonte), e por isso ela e PESSIMISTA:
 * arredonda linhas para cima. Errar para o lado de fonte menor e visivel e
 * barato; errar para o lado maior corta texto em silencio.
 */
export const fonteCaixa = (
  texto: string,
  { max, min, largura = COL, altura, razao = 0.5, lh = 1.28 }:
    { max: number; min: number; largura?: number; altura: number; razao?: number; lh?: number },
) => {
  for (let s = max; s > min; s -= 2) {
    const porLinha = Math.max(1, Math.floor(largura / (razao * s)));
    const linhas = Math.ceil(texto.length / porLinha);
    if (linhas * s * lh <= altura) return s;
  }
  return min;
};
