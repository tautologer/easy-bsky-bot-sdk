import fs from 'fs'
import { ImageEmbed, MakeEmbedParams } from './types';

function guessEncoding(imageUrl: string) {
  const ext = imageUrl.split('.').pop()
  if (ext === 'png') return 'image/png'
  if (ext === 'jpg') return 'image/jpeg'
  if (ext === 'jpeg') return 'image/jpeg'
  if (ext === 'gif') return 'image/gif'
  throw new Error(`Unable to guess encoding for ${imageUrl}`)
}

export const makeEmbed = async (params: MakeEmbedParams) => {
  let { agent, imageUrl, imageAlt, encoding } = params;
  encoding = encoding || guessEncoding(imageUrl)
  imageAlt = imageAlt || 'image'

  const data = fs.readFileSync(imageUrl);
  const response = await agent.uploadBlob(
    data, { encoding }
  );

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

