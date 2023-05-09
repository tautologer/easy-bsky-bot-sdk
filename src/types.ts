// branded types for the various identifiers we use

import { BskyAgent } from "@atproto/api";

export type Did = string & { __did__: never };
export const isDid = (did: unknown): did is Did => typeof did === "string" && did.startsWith("did:");

export type Handle = string & { __handle__: never };
// regex to match a Fully Qualified Domain Name
const fqdnRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/;
export const isHandle = (handle: unknown): handle is Handle => typeof handle === "string" && fqdnRegex.test(handle);

export type UserIdentifier = Did | Handle;
export const isUserIdentifier = (identifier: unknown): identifier is UserIdentifier =>
  isDid(identifier) || isHandle(identifier);

export type Cid = string & { __cid__: never };
export const isCid = (cid: unknown): cid is Cid => typeof cid === "string"; // TODO i'm sure there's more we can enforce about the string

export type Uri = string & { __uri__: never };
export const isUri = (uri: unknown): uri is Uri => typeof uri === "string" && uri.startsWith("at://"); // TODO i'm sure there's more we can enforce about the string

// objects

// NOTE: on the type guards I'm using any instead of unknown because it saves us having to check that each key exists

export type User = {
  did: Did;
  handle: Handle;
  name?: string;
};
export const isUser = (x: any): x is User =>
  typeof x === "object" && x !== null && isDid(x.did) && isHandle(x.handle) && typeof x.name === "string";

// post types

export type PostReference = {
  uri: Uri;
  cid: Cid;
};
export const isPostReference = (x: any): x is PostReference =>
  typeof x === "object" && x !== null && isUri(x.uri) && isCid(x.cid);

// TODO images, quotes, embeds, etc
// TODO like, reply, repost counts
// TODO labels
// TODO postedAt
export type Post = {
  author: User;
  text: string;
  uri: Uri;
  cid: Cid;
  mentions: Did[];
  isRepost?: boolean;
  parent?: PostReference;
  root?: PostReference;
};
export const isPost = (x: any): x is Post =>
  typeof x === "object" &&
  x !== null &&
  isUser(x.author) &&
  typeof x.text === "string" &&
  isUri(x.uri) &&
  isCid(x.cid) &&
  Array.isArray(x.mentions) &&
  x.mentions.every(isDid) &&
  (x.isRepost === undefined || typeof x.isRepost === "boolean") &&
  (x.parent === undefined || isPostReference(x.parent)) &&
  (x.root === undefined || isPostReference(x.root));

export type ReplyPost = Post & {
  root: PostReference;
  parent: PostReference;
};
export const isReplyPost = (x: any): x is ReplyPost =>
  isPost(x) && isPostReference(x.root) && isPostReference(x.parent);

// types for events

// TODO implement the rest of the events
// i don't think it's an issue currently, but we'll have to think about handling reposts when creating the feed
export const Events = {
  FOLLOW: "FOLLOW",
  MENTION: "MENTION",
  REPLY: "REPLY",
  // REPOST
  // FOLLOWING_POST
} as const;

type FollowEvent = {
  type: "FOLLOW";
  data: {
    user: User;
  };
};

type MentionEvent = {
  type: "MENTION";
  data: {
    post: Post;
  };
};

type ReplyEvent = {
  type: "REPLY";
  data: {
    post: Post;
  };
};

export type Event = FollowEvent | MentionEvent | ReplyEvent;

// features

export type Feature = { $type: string;[key: string]: any };
export type MentionFeature = Feature & {
  $type: "app.bsky.richtext.facet#mention";
  did: string;
};
// TODO this can be a bit more robust
export const isMentionFeature = (feature: Feature): feature is MentionFeature =>
  feature.$type === "app.bsky.richtext.facet#mention";

// fetchers and fetch params

export type FetchParams = {
  limit?: number;
  cursor?: string;
};
export type Fetcher<T, P extends FetchParams> = (params: P) => Promise<{ items: T[]; cursor?: string }>;

// misc

// pretty convoluted type declaration lol, but it avoids importing from the @atproto/api internals which is even more annoying imo, so I'll take it
export type Notif = Awaited<ReturnType<BskyAgent["listNotifications"]>>["data"]["notifications"][number];

// utilities

export type Assert<T extends true> = T;
export type Equals<T, U> = [T] extends [U] ? ([U] extends [T] ? true : false) : false;


// embed images

export type MakeEmbedParams = {
  agent: BskyAgent;
  imageUrl: string;
  imageAlt?: string
  encoding?: string;
}

export type ImageItem = {
  image: any
  alt: string
}

export type ImageEmbed = {
  $type: "app.bsky.embed.images"
  images: ImageItem[]
}
