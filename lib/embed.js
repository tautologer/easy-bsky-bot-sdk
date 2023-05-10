"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeEmbed = void 0;
const fs_1 = __importDefault(require("fs"));
const downloads_1 = require("./downloads");
let verbose = true;
// TODO
const localConfig = {
    defaultImageEncoding: 'image/png'
};
const clog = {
    log: (...args) => {
        if (!verbose)
            return;
        const msg = args.shift();
        console.log(msg, args && JSON.stringify(args, null, 2));
    }
};
/**
 * returns an image embed object from a local image file
 * @param params
 * @returns
 */
const makeEmbed = async (params) => {
    let { agent, imageUrl, imageAlt, encoding } = params;
    let imagePath = imageUrl;
    encoding = encoding || (0, downloads_1.guessImageFormat)(imagePath) || localConfig.defaultImageEncoding;
    if (imagePath.startsWith('http')) {
        imagePath = `./temp/downloads/${Date.now()}.${(0, downloads_1.suffix)(imagePath)}`;
        console.log('imagePath', imagePath);
        await (0, downloads_1.downloadImage)(imageUrl, imagePath);
    }
    if (!fs_1.default.existsSync(imagePath)) {
        const msg = `Unable to find image ${imagePath}`;
        console.error(msg);
        // FIXME dont crash in prod env if an image is missing
        throw new Error(msg);
        // return
    }
    imageAlt = imageAlt || 'image';
    clog.log('√ image file exists', { imageUrl: imagePath, encoding });
    const data = fs_1.default.readFileSync(imagePath);
    // let bytes = new Uint8Array(data);
    // clog.log('√ read image data', { length: bytes.length })
    const response = await agent.uploadBlob(data, { encoding: 'image/jpeg' });
    // if (response.success) {
    //   clog.log("OK blob uploaded")
    // } else {
    //   console.error("ERROR failed to upload blob", response);
    //   return
    // }
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
