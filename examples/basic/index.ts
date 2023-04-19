import * as dotenv from "dotenv";
import { BskyBot, Events } from "easy-bsky-bot-sdk";

// load environment variables from .env file
dotenv.config();

async function main() {
  const handle = process.env.BOT_HANDLE;
  if (!handle) throw new Error("BOT_HANDLE not set in .env");
  const password = process.env.BOT_PASSWORD;
  if (!password) throw new Error("BOT_PASSWORD not set in .env");

  BskyBot.setOwner({
    handle: "example.bsky.social",
    contact: "example.contact@example.com",
  });

  const bot = new BskyBot({
    handle: handle,
  });

  await bot.login(password);

  bot.setHandler(Events.MENTION, async (event) => {
    const { post } = event;
    console.log(`got mention from ${post.author.handle}: ${post.text}`);
    await bot.like(post);
    await bot.reply("thanks for the mention!", post);
  });

  bot.setHandler(Events.REPLY, async (event) => {
    const { post } = event;
    console.log(`got reply from ${post.author.handle}: ${post.text}`);
    await bot.like(post);
  });

  bot.setHandler(Events.FOLLOW, async (event) => {
    const { user } = event;
    console.log(`got follow from ${user.handle}`);
    await bot.follow(user.did);
  });

  bot.startPolling(); // start polling for events
}

main().catch((err) => {
  console.error("uncaught error in main:", err);
  process.exit(1);
});
