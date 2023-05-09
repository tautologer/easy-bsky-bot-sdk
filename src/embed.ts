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
    const msg = args.shift()
    if (verbose) console.log(msg, JSON.stringify(args, null, 2))
  }
}

export const makeEmbed = async (params: MakeEmbedParams) => {
  let { agent, imageUrl, imageAlt, encoding: imageFormat } = params;
  imageFormat = imageFormat || guessImageFormat(imageUrl)
  imageAlt = imageAlt || 'image'

  const check = fs.existsSync(imageUrl)
  if (!check) {
    const msg = `Unable to find image ${imageUrl}`;
    console.error(msg);
    // FIXME dont crash in prod env if an image is missing
    throw new Error(msg);
    // return
  }
  clog.log('file exists', { imageUrl, imageFormat })
  const data = fs.readFileSync(imageUrl);
  const buffer = await data.buffer
  // const data = new Uint8Array(buffer);
  // const buffer = await image.arrayBuffer();
  let bytes = new Uint8Array(buffer);

  clog.log('read data', {
    length: bytes.length,
    buffer: typeof buffer,
    data: typeof data,
    byes: typeof bytes,
  })

  const response = await agent.uploadBlob(
    bytes, { encoding: imageFormat }
  );
  clog.log('uploadBlob response', JSON.stringify(response, null, 2))

  if (!response.success) {
    const msg = `Unable to upload image ${imageUrl}`;
    console.error(msg, response);
    throw new Error(msg);
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

