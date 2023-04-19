import { extractMentionsFromFacets } from "./post";
import { Event, Events, isCid, isDid, isHandle, isUri, Notif, Post, User } from "./types";

type DataMap = {
  [K in Event["type"]]: Extract<Event, { type: K }>["data"];
};
export type HandlerMap = {
  [K in keyof DataMap]: (event: DataMap[K]) => void | Promise<void>;
};
type MapperMap = {
  [K in keyof DataMap]: (notif: Notif) => DataMap[K];
};

const extractUser = (notif: Notif): User => {
  const { author } = notif;
  if (!isDid(author.did)) throw new Error(`invalid did: ${author.did}`);
  if (!isHandle(author.handle)) throw new Error(`invalid handle: ${author.handle}`);
  return {
    did: author.did,
    handle: author.handle,
    name: author.displayName,
  };
};

// TODO handle images, embeds, quotes, etc
const extractPost = (notif: Notif): Post => {
  // TODO get rid of any and use a type guard
  const record: any = notif.record;
  // TODO more comprehensive type guard?
  if (record.$type !== "app.bsky.feed.post") throw new Error(`failed to extract post of type ${record.type}}`);
  if (!isUri(notif.uri)) throw new Error(`invalid uri: ${record.uri}`);
  if (!isCid(notif.cid)) throw new Error(`invalid cid: ${record.cid}`);
  const replyDetails = record.reply
    ? {
        parent: {
          uri: record.reply.parent.uri,
          cid: record.reply.parent.cid,
        },
        root: {
          uri: record.reply.root.uri,
          cid: record.reply.root.cid,
        },
      }
    : {};
  return {
    author: extractUser(notif),
    uri: notif.uri,
    cid: notif.cid,
    text: record.text,
    mentions: extractMentionsFromFacets(record.facets),
  };
};

// map event type to function that extracts the data from the notification
const mappers: MapperMap = {
  FOLLOW: (notif) => ({ user: extractUser(notif) }),
  MENTION: (notif) => ({ post: extractPost(notif) }),
  REPLY: (notif) => ({ post: extractPost(notif) }),
};

// TODO a post can both be a reply and a mention -- should we handle that here, or should we punt it to the user?
// I'm kind of inclined to think that any post that mentions the bot should be handled as a mention,
// but that means drilling the bot DID into this function so we can check if it's a mention or not
// and that's a bit of a pain
// probably worth it but I'm definitely not going to do it right now
const getEventType = (notif: Notif): Event["type"] | undefined => {
  switch (notif.reason) {
    case "follow":
      return Events.FOLLOW;
    case "mention":
      return Events.MENTION;
    case "reply":
      return Events.REPLY;
    default:
      console.warn(`unrecognized notification reason: ${notif.reason}`);
      return undefined;
  }
};

export const handleNotification = async (handlers: Partial<HandlerMap>, notif: Notif) => {
  const type = getEventType(notif);
  if (!type) return;

  const handler = handlers[type];
  if (!handler) return;

  const mapper = mappers[type];

  try {
    await handler(mapper(notif) as any);
  } catch (err) {
    console.error(`uncaught error in ${type} handler:`, err);
  }
};
