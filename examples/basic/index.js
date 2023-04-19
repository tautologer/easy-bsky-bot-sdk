"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = __importStar(require("dotenv"));
const easy_bsky_bot_sdk_1 = require("./easy-bsky-bot-sdk");
// load environment variables from .env file
dotenv.config();
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const handle = process.env.BOT_HANDLE;
        if (!handle)
            throw new Error("BOT_HANDLE not set in .env");
        const password = process.env.BOT_PASSWORD;
        if (!password)
            throw new Error("BOT_PASSWORD not set in .env");
        // BskyBot.setOwner({
        //   handle: "example.bsky.social",
        //   contact: "example.contact@example.com",
        // });
        easy_bsky_bot_sdk_1.BskyBot.setOwner({
            handle: "tautologer.com",
        });
        const bot = new easy_bsky_bot_sdk_1.BskyBot({
            handle: handle,
        });
        yield bot.login(password);
        bot.setHandler(easy_bsky_bot_sdk_1.Events.MENTION, (event) => __awaiter(this, void 0, void 0, function* () {
            const { post } = event;
            console.log(`got mention from ${post.author.handle}: ${post.text}`);
            yield bot.like(post);
            yield bot.reply("thanks for the mention!", post);
        }));
        bot.setHandler(easy_bsky_bot_sdk_1.Events.REPLY, (event) => __awaiter(this, void 0, void 0, function* () {
            const { post } = event;
            console.log(`got reply from ${post.author.handle}: ${post.text}`);
            yield bot.like(post);
        }));
        bot.setHandler(easy_bsky_bot_sdk_1.Events.FOLLOW, (event) => __awaiter(this, void 0, void 0, function* () {
            const { user } = event;
            console.log(`got follow from ${user.handle}`);
            yield bot.follow(user.did);
        }));
        bot.startPolling(); // start polling for events
    });
}
main().catch((err) => {
    console.error("uncaught error in main:", err);
    process.exit(1);
});
