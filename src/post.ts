import { AppBskyFeedPost, AppBskyFeedDefs, BskyAgent, RichText } from "@atproto/api";
import { DEFAULT_LIMIT } from "./config";
import {
  Did,
  Feature,
  isCid,
  isDid,
  isHandle,
  isMentionFeature,
  isPostReference,
  isReplyPost,
  isUri,
  Post,
  PostReference,
  Uri,
  UserIdentifier,
  ImageEmbed
} from "./types";
import { getCallOptions } from "./util";
import { makeEmbed } from "./embed";


// util

export const extractMentionsFromFacets = (
  facets:
    | {
      features: Feature[];
    }[]
    | undefined
): Did[] => {
  if (!facets) return [];
  // TODO type check the facets?
  const tags: Did[] = [];
  try {
    for (const facet of facets) {
      if (!facet.features) continue; // TODO should we throw? or just be permissive
      const { features } = facet;
      for (const feature of features) {
        if (isMentionFeature(feature)) {
          if (!isDid(feature.did)) {
            console.warn("invalid mention did:", feature.did);
            continue;
          }
          tags.push(feature.did);
        }
      }
    }
  } catch (err) {
    console.log("error extracting mentions from facets:", err);
  } finally {
    return tags;
  }
};

// read

const mapBskyAuthorToAuthor = (bskyAuthor: AppBskyFeedDefs.PostView["author"]): Post["author"] => {
  const did = bskyAuthor.did;
  if (!isDid(did)) throw new Error(`invalid did: ${did}`);
  const handle = bskyAuthor.handle;
  if (!isHandle(handle)) throw new Error(`invalid handle: ${handle}`);
  const name = bskyAuthor.displayName;
  if (name !== undefined && typeof name !== "string") throw new Error(`invalid name: ${name}`);
  return {
    did,
    handle,
    name,
  };
};

const mapBskyFeedPostToPost = (bskyFeedPost: AppBskyFeedDefs.PostView): Omit<Post, "isRepost"> => {
  const record: any = bskyFeedPost.record;
  if (record.$type !== "app.bsky.feed.post") throw new Error(`unexpected post record type: ${record.$type}`);

  const uri = bskyFeedPost.uri;
  if (!isUri(uri)) throw new Error(`invalid uri: ${uri}`);
  const cid = bskyFeedPost.cid;
  if (!isCid(cid)) throw new Error(`invalid cid: ${cid}`);

  const replyDetails = record.reply
    ? {
      parent: { uri: record.reply.parent.uri, cid: record.reply.parent.cid },
      root: { uri: record.reply.root.uri, cid: record.reply.root.cid },
    }
    : {};

  // note that we have no way of knowing whether or not this is a repost --
  // it's up to the caller to set that property

  // type check replyDetails -- it's typed as any above
  if (replyDetails.parent || replyDetails.root) {
    if (!isPostReference(replyDetails.parent))
      throw new Error(`invalid parent: ${JSON.stringify(replyDetails.parent)}`);
    if (!isPostReference(replyDetails.root)) throw new Error(`invalid root: ${JSON.stringify(replyDetails.root)}`);
  }

  const text: string | undefined = record.text ?? "";
  if (typeof text !== "string") throw new Error(`invalid text: ${text} (type: ${typeof text})`);

  return {
    author: mapBskyAuthorToAuthor(bskyFeedPost.author),
    uri,
    cid,
    text,
    ...replyDetails,
    mentions: extractMentionsFromFacets(record.facets),
  };
};

const mapThreadViewPostToPost = (threadViewPost: AppBskyFeedDefs.ThreadViewPost): Post => {
  // TODO type check here
  if (!threadViewPost) throw new Error(`invalid threadViewPost: ${threadViewPost}`);
  const { post } = threadViewPost;
  return mapBskyFeedPostToPost(post);
};

// TODO explore possibly introducing CID comparison as part of this
// can eg throw if the CID doesn't match what you pass in

export const getPost = async (
  params: { agent: BskyAgent } & ({ uri: Uri } | { postReference: PostReference })
): Promise<Post | null> => {
  const { agent } = params;
  const uri = "uri" in params ? params.uri : params.postReference.uri;

  // TODO is there a better way to do this than calling getPostThread?
  let res: Awaited<ReturnType<typeof agent.getPostThread>>;
  try {
    res = await agent.getPostThread({ uri, depth: 0 }, getCallOptions(agent));
  } catch (err) {
    if (String(err).match(/not found/i)) return null;
    throw err;
  }

  // I don't love the cast to any here, but the types are really annoying to work with
  // and we're going to check the shape carefully at the end, so it's not a big deal
  const thread = res.data.thread;
  if (thread.notFound) return null;

  return mapThreadViewPostToPost(thread as any); // TODO i really don't love the cast but it works for now
};

export const getPostParents = async (
  params: { agent: BskyAgent } & ({ uri: Uri } | { postReference: PostReference })
): Promise<Post[]> => {
  const { agent } = params;
  const uri = "uri" in params ? params.uri : params.postReference.uri;
  const res = await agent.getPostThread({ uri });

  const parents: Post[] = [];
  let currentPost: any = res.data.thread; // TODO again i don't love the cast but oh well
  while (currentPost) {
    parents.push(mapThreadViewPostToPost(currentPost));
    currentPost = currentPost.parent;
  }

  return parents.reverse();
};

export const getUserPosts = async ({
  agent,
  identifier,
  limit,
  cursor,
}: {
  agent: BskyAgent;
  identifier: UserIdentifier;
  limit?: number;
  cursor?: string;
}): Promise<{ items: Post[]; cursor?: string }> => {
  const res = await agent.getAuthorFeed(
    { actor: identifier, limit: limit ?? DEFAULT_LIMIT, cursor },
    getCallOptions(agent)
  );
  const posts = res.data.feed.map((entry): Post => {
    const isRepost = entry.reason?.$type === "app.bsky.feed.defs#reasonRepost";
    const post: Post = mapBskyFeedPostToPost(entry.post);
    if (isRepost) {
      post.isRepost = true;
    }
    return post;
  });
  return { items: posts, cursor: res.data.cursor };
};

// write

export type PostParams = {
  text?: string;
  embed?: ImageEmbed;

  // ?? we could also bundle this in a struct?
  imageUrl?: string; // TODO support buffer and URI types
  imageAlt?: string;
  encoding?: string;

  // TODO more options & types: images, external embeds, quotes, etc
};
export const validatePostParams = (params: PostParams): void => {
  if (!Object.keys(params).length) throw new Error("post params must contain at least one field");
};

type BasePostParams = PostParams & {
  agent: BskyAgent;
};

type InternalPostParams = BasePostParams & {
  richText?: RichText;
  text?: string;
  replyTo?: Post;
};

const _post = async (params: InternalPostParams): Promise<PostReference> => {
  const { agent, imageUrl, imageAlt, encoding } = params;
  let { embed } = params;
  const _params: Partial<AppBskyFeedPost.Record> = {};

  if (imageUrl) {
    // TODO handle buffer and URI types
    // check if embed also passed as we can only have one?
    if (typeof imageUrl !== 'string') {
      throw new Error(`invalid image: ${imageUrl} (type: ${typeof imageUrl}) only local paths are supported`);
    }
    if (embed) {
      throw new Error(`cannot pass embed and imageUrl`);
    }
    embed = await makeEmbed({
      agent,
      imageUrl,
      imageAlt,
      encoding
    })
  }

  // TODO suport passing in custom facets and entities ?
  const richText = params.richText ?? new RichText({ text: params.text ?? "" });
  await richText.detectFacets(agent);

  if (params.replyTo) {
    let parent: Post = params.replyTo;
    let root: PostReference;
    if (isReplyPost(parent)) {
      root = parent.root;
    } else {
      root = parent;
    }
    _params.reply = {
      parent: {
        uri: parent.uri,
        cid: parent.cid,
      },
      root: {
        uri: root.uri,
        cid: root.cid,
      },
    };
  }

  const { uri, cid } = await agent.post({
    text: richText.text,
    facets: richText.facets,
    embed,
    ..._params
  }); // call options ?
  if (!isUri(uri)) throw new Error(`unexpected uri: ${uri}`);
  if (!isCid(cid)) throw new Error(`unexpected cid: ${cid}`);
  return { uri, cid };
};

export const post = async (params: BasePostParams) => {
  return await _post(params);
};

export const reply = async (params: BasePostParams & { replyTo: Post }) => {
  return await _post(params);
};

export const like = async ({ agent, post }: { agent: BskyAgent; post: PostReference }): Promise<PostReference> => {
  const { uri, cid } = await agent.like(post.uri, post.cid); // call options ?
  if (!isCid(cid)) throw new Error(`unexpected cid: ${cid}`);
  if (!isUri(uri)) throw new Error(`unexpected uri: ${uri}`);
  return { uri, cid };
};

export const repost = async ({ agent, post }: { agent: BskyAgent; post: PostReference }): Promise<PostReference> => {
  const { uri, cid } = await agent.repost(post.uri, post.cid); // call options ?
  if (!isCid(cid)) throw new Error(`unexpected cid: ${cid}`);
  if (!isUri(uri)) throw new Error(`unexpected uri: ${uri}`);
  return { uri, cid };
};
