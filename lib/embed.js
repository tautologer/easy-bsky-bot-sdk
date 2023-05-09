"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeEmbed = void 0;
const fs_1 = __importDefault(require("fs"));
function guessImageFormat(imageUrl) {
    const ext = imageUrl.split('.').pop();
    if (ext === 'png')
        return 'image/png';
    if (ext === 'jpg')
        return 'image/jpeg';
    if (ext === 'jpeg')
        return 'image/jpeg';
    if (ext === 'gif')
        return 'image/gif';
    throw new Error(`Unable to guess encoding for ${imageUrl}`);
}
const verbose = true;
const clog = {
    log: (...args) => {
        const msg = args.shift();
        if (verbose)
            console.log(msg, JSON.stringify(args, null, 2));
    }
};
/**
 * returns an image embed object from a local image file
 * @param params
 * @returns
 */
const makeEmbed = async (params) => {
    let { agent, imageUrl, imageAlt, encoding } = params;
    encoding = encoding || guessImageFormat(imageUrl);
    imageAlt = imageAlt || 'image';
    const check = fs_1.default.existsSync(imageUrl);
    if (!check) {
        const msg = `Unable to find image ${imageUrl}`;
        console.error(msg);
        // FIXME dont crash in prod env if an image is missing
        throw new Error(msg);
        // return
    }
    clog.log('file exists', { imageUrl, encoding });
    const data = fs_1.default.readFileSync(imageUrl);
    const buffer = await data.buffer;
    // const data = new Uint8Array(buffer);
    // const buffer = await image.arrayBuffer();
    let bytes = new Uint8Array(buffer);
    clog.log('read data', {
        length: bytes.length,
        buffer: typeof buffer,
        data: typeof data,
        bytes: typeof bytes,
    });
    const response = await agent.uploadBlob(bytes, { encoding });
    console.log('upload OK');
    console.log('response => ', response);
    // clog.log('uploadBlob response', JSON.stringify(response, null, 2))
    if (!response.success) {
        const msg = `Unable to upload image ${imageUrl}`;
        console.error(msg, response);
        throw new Error(msg);
    }
    const { data: { blob: image } } = response;
    const embed = {
        $type: "app.bsky.embed.images",
        images: [
            {
                image,
                alt: imageAlt,
            },
        ],
    };
    return embed;
};
exports.makeEmbed = makeEmbed;
