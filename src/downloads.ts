/**
 * no dependency method to download a file from a url
 * dont use external libs to avoid conflicts with custom fetch
 */

import fs from 'fs'
import client from 'https'

let verbose = false

function ensureDirFromPath(filepath: string) {
  const dir = filepath.split('/').slice(0, -1).join('/')
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}


export async function downloadImage(url: string, filepath: string) {
  console.log('downloadImage', { url, filepath })
  ensureDirFromPath(filepath)

  return new Promise((resolve, reject) => {
    client.get(url, (res) => {
      if (res.statusCode === 200) {
        res.pipe(fs.createWriteStream(filepath))
          .on('error', reject)
          .once('close', () => resolve(filepath));
      } else {
        // Consume response data to free up memory
        res.resume();
        reject(new Error(`Request Failed With a Status Code: ${res.statusCode}`));
      }
    });
  });
}

export function suffix(imgName: string): string {
  const parts = imgName.split('.') // clone
  return parts.pop() || ''
}

export function guessImageFormat(imageUrl: string): string | undefined {
  // const ext = suffix(imageUrl)
  const exts = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
  }

  for (const [ext, encoding] of Object.entries(exts)) {
    if (imageUrl.endsWith(ext)) {
      return encoding
    }
  }

  console.warn(`Unable to guess encoding for ${imageUrl}`)

}


async function test() {
  const imgPath = await downloadImage(
    'https://www.google.com/images/srpr/logo3w.png',
    './examples/basic/testdata/down/google.png'
  )
  verbose && console.log('downloaded to', imgPath)
}

// test()
