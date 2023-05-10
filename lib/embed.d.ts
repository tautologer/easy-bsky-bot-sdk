import { ImageEmbed, MakeEmbedParams } from './types';
/**
 * returns an image embed object from a local image file
 * @param params
 * @returns
 */
export declare const makeEmbed: (params: MakeEmbedParams) => Promise<ImageEmbed | undefined>;
