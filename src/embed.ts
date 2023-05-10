import fs from 'fs'
import { ImageEmbed, MakeEmbedParams } from './types';

function guessImageFormat(imageUrl: string) {
  const ext = imageUrl.split('.').pop()
  if (ext === 'png') return 'image/png'
  if (ext === 'jpg') return 'image/jpeg'
  if (ext === 'jpeg') return 'image/jpeg'
  if (ext === 'gif') return 'image/gif'
  throw new Error(`Unable to guess encoding for ${imageUrl}`)
}

const verbose = true

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
  encoding = encoding || guessImageFormat(imageUrl)
  imageAlt = imageAlt || 'image'

  const check = fs.existsSync(imageUrl)
  if (!check) {
    const msg = `Unable to find image ${imageUrl}`;
    console.error(msg);
    // FIXME dont crash in prod env if an image is missing
    throw new Error(msg);
    // return
  }
  clog.log('√ file exists', { imageUrl, encoding })
  const data = fs.readFileSync(imageUrl);
  let bytes = new Uint8Array(data);

  clog.log('√ read image data', { length: bytes.length })

  // try {
  const response = await agent.uploadBlob(
    data, { encoding: 'image/jpeg' }
  )
  if (response.success) {
    clog.log("OK blob uploaded")
  } else {
    console.error("ERROR failed to upload blob", response);
    return
  }

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
