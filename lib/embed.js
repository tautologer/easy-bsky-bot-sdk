"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeEmbed = void 0;
const fs_1 = __importDefault(require("fs"));
function guessEncoding(imageUrl) {
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
const makeEmbed = async (params) => {
    let { agent, imageUrl, imageAlt, encoding } = params;
    encoding = encoding || guessEncoding(imageUrl);
    imageAlt = imageAlt || 'image';
    const data = fs_1.default.readFileSync(imageUrl);
    const response = await agent.uploadBlob(data, { encoding });
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
