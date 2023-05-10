"use strict";
/**
 * no dependency method to download a file from a url
 * dont use external libs to avoid conflicts with custom fetch
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.guessImageFormat = exports.suffix = exports.downloadImage = void 0;
const fs_1 = __importDefault(require("fs"));
const https_1 = __importDefault(require("https"));
let verbose = false;
function ensureDirFromPath(filepath) {
    const dir = filepath.split('/').slice(0, -1).join('/');
    if (!fs_1.default.existsSync(dir)) {
        fs_1.default.mkdirSync(dir, { recursive: true });
    }
}
async function downloadImage(url, filepath) {
    console.log('downloadImage', { url, filepath });
    ensureDirFromPath(filepath);
    return new Promise((resolve, reject) => {
        https_1.default.get(url, (res) => {
            if (res.statusCode === 200) {
                res.pipe(fs_1.default.createWriteStream(filepath))
                    .on('error', reject)
                    .once('close', () => resolve(filepath));
            }
            else {
                // Consume response data to free up memory
                res.resume();
                reject(new Error(`Request Failed With a Status Code: ${res.statusCode}`));
            }
        });
    });
}
exports.downloadImage = downloadImage;
function suffix(imgName) {
    const parts = imgName.split('.'); // clone
    return parts.pop() || '';
}
exports.suffix = suffix;
function guessImageFormat(imageUrl) {
    // const ext = suffix(imageUrl)
    const exts = {
        png: 'image/png',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        gif: 'image/gif',
    };
    for (const [ext, encoding] of Object.entries(exts)) {
        if (imageUrl.endsWith(ext)) {
            return encoding;
        }
    }
    console.warn(`Unable to guess encoding for ${imageUrl}`);
}
exports.guessImageFormat = guessImageFormat;
async function test() {
    const imgPath = await downloadImage('https://www.google.com/images/srpr/logo3w.png', './examples/basic/testdata/down/google.png');
    verbose && console.log('downloaded to', imgPath);
}
// test()
