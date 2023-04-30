# easy-bsky-bot-sdk

A typescript SDK for easily writing bots for bsky.app

Current supported version: 0.1.1

Please use this SDK responsibly.
You are responsible for your use of this bot.
Please be a good citizen of the AT Protocol and the Bluesky communities in which your bot participates.
We have an amazing opportunity to build a better social web: let's not waste it.

In particular, please try not to spam people's notifications or timelines, and be careful not to get into infinite loops with other bots.

## Status

This project is in the extremely early stages. It is missing many desirable or possibly even essential features. PRs are welcome -- see the contribution guide at the bottom of this readme for more details.

This project is likely to contain bugs and usability issues.

You should assume that every release will have breaking changes. However, if at all possible, please do your best to upgrade to new versions when they're available. They will likely include important upgrades to the functionality, reliability, and network citizenship of your bot.

## Installation

A recent version of Node.js is required. If you don't have node installed, I recommend installing it with [nvm](https://github.com/nvm-sh/nvm).

`npm install --save easy-bsky-bot-sdk`

<!--
### Easy mode

Read (TODO_script_path_goes_here) and confirm that it is trustworthy and does what it says it does. Then either download and execute it, or copy and paste the following into your terminal:

```
wget # TODO
```
-->

## Basic Usage

The Typescript types should explain most of how to use the `BskyBot` class, hopefully this is pretty intuitive.

There is a simple example project in the `examples/` directory.

```typescript
import { BskyBot, Events } from "easy-bsky-bot-sdk.ts";

async function main() {
  // you are required to call this once, globally
  // this information will go in the bot's user-agent string, so it will be visible to the server you connect to but no one else
  BskyBot.setOwner({ handle: "your.handle.here", contact: "your.contact@info.here" });

  // there are a number of optional parameters in addition to the only required parameter, your bot's handle
  const bot = new BskyBot({ handle: "your.bot.handle.here" });

  // ideally don't hardcode your password, get it from environment variables or similar
  await bot.login("your-password-here");

  await bot.post({ text: "Hello, world!" });

  // three event types currently supported: MENTION, REPLY, and LIKE
  bot.setHandler(Events.MENTION, async ({ post }) => {
    console.log(`mentioned by @${post.author.handle}: ${post.text}`);
    await bot.like(post);
    await bot.reply("thanks for the mention!", { replyTo: post });
  });

  // you have to start polling for events
  bot.startPolling();
  // bot will now poll forever until you call bot.stopPolling()
}

main();
```

## Contribution guide

PRs are welcome, though not guaranteed to be accepted.

TODO write contribution guide

tl;dr use Prettier, try to stick to the style/patterns of existing code
