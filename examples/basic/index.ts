import * as dotenv from "dotenv";
import {
  Events,
  MakeEmbedParams
} from '../../lib/types'

import { BskyBot } from "../../lib/bot";

// load environment variables from .env file
dotenv.config();

async function testImagePost(bot: BskyBot) {
  // const imageUrl = './testdata/slice.png'
  const imageUrl = './testdata/test-cat.jpg'
  // const imageUrl = './testdata/test.png'

  // const params: MakeEmbedParams = {
  //   agent: bot.agent,
  //   imageUrl: imageUrl
  // }
  // const embed = await bot.makeEmbed(params)

  // try {
  //   const result = await bot.post({
  //     text: "here's an image",
  //     embed,
  //   });
  //   console.log('posted image', result)
  // } catch (err) {
  //   console.error('error posting image', err)
  // }

  await bot.post({
    text: "catz",
    imageUrl,
    imageAlt: 'test cat pic',
  })

}

async function main() {
  const handle = process.env.BOT_HANDLE;
  if (!handle) throw new Error("BOT_HANDLE not set in .env");
  const password = process.env.BOT_PASSWORD;
  if (!password) throw new Error("BOT_PASSWORD not set in .env");

  BskyBot.setOwner({
    handle,
    contact: `support@${handle}`,
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

    const { text } = post;

    if (text === 'img') {
      await testImagePost(bot)
    }

  });

  bot.setHandler(Events.FOLLOW, async (event) => {
    const { user } = event;
    console.log(`got follow from ${user.handle}`);
    await bot.follow(user.did);
  });


  bot.startPolling(); // start polling for events
  await testImagePost(bot)

}

main().catch((err) => {
  console.error("uncaught error in main:", err);
  process.exit(1);
});
