import fs from 'fs'
import path from 'path'
import { ImageEmbed, MakeEmbedParams } from './types';
import { downloadImage, guessImageFormat, suffix } from './downloads';

let verbose = true

// TODO
const localConfig = {
  defaultImageEncoding: 'image/png'
}

const clog = {
  log: (...args: any[]) => {
    if (!verbose) return
    const msg = args.shift()
    console.log(msg, args && JSON.stringify(args, null, 2))
  }
}

/**
 * returns an image embed object from a local image file
 * @param params
 * @returns
 */
export const makeEmbed = async (params: MakeEmbedParams) => {
  let { agent, imageUrl, imageAlt, encoding } = params;

  let imagePath = imageUrl
  encoding = encoding || guessImageFormat(imagePath) || localConfig.defaultImageEncoding

  if (imagePath.startsWith('http')) {
    imagePath = `./temp/downloads/${Date.now()}.${suffix(imagePath)}`
    console.log('imagePath', imagePath)
    await downloadImage(imageUrl, imagePath)
  }

  if (!fs.existsSync(imagePath)) {
    const msg = `Unable to find image ${imagePath}`;
    console.error(msg);
    // FIXME dont crash in prod env if an image is missing
    throw new Error(msg);
    // return
  }

  imageAlt = imageAlt || 'image'
  clog.log('√ image file exists', { imageUrl: imagePath, encoding })
  const data = fs.readFileSync(imagePath);

  const response = await agent.uploadBlob(
    data, { encoding: 'image/jpeg' }
  )

  const { data: { blob: image } } = response;

  const embed: ImageEmbed = {
    $type: "app.bsky.embed.images",
    images: [
      {
        image,
        alt: imageAlt,
      },
    ],
  }

  return embed

}
