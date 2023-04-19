"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.repost = exports.like = exports.reply = exports.post = exports.validatePostParams = exports.getUserPosts = exports.getPostParents = exports.getPost = exports.extractMentionsFromFacets = void 0;
const api_1 = require("@atproto/api");
const config_1 = require("./config");
const types_1 = require("./types");
const util_1 = require("./util");
// util
const extractMentionsFromFacets = (facets) => {
    if (!facets)
        return [];
    // TODO type check the facets?
    const tags = [];
    try {
        for (const facet of facets) {
            if (!facet.features)
                continue; // TODO should we throw? or just be permissive
            const { features } = facet;
            for (const feature of features) {
                if ((0, types_1.isMentionFeature)(feature)) {
                    if (!(0, types_1.isDid)(feature.did)) {
                        console.warn("invalid mention did:", feature.did);
                        continue;
                    }
                    tags.push(feature.did);
                }
            }
        }
    }
    catch (err) {
        console.log("error extracting mentions from facets:", err);
    }
    finally {
        return tags;
    }
};
exports.extractMentionsFromFacets = extractMentionsFromFacets;
// read
const mapBskyAuthorToAuthor = (bskyAuthor) => {
    const did = bskyAuthor.did;
    if (!(0, types_1.isDid)(did))
        throw new Error(`invalid did: ${did}`);
    const handle = bskyAuthor.handle;
    if (!(0, types_1.isHandle)(handle))
        throw new Error(`invalid handle: ${handle}`);
    const name = bskyAuthor.displayName;
    if (name !== undefined && typeof name !== "string")
        throw new Error(`invalid name: ${name}`);
    return {
        did,
        handle,
        name,
    };
};
const mapBskyFeedPostToPost = (bskyFeedPost) => {
    const record = bskyFeedPost.record;
    if (record.$type !== "app.bsky.feed.post")
        throw new Error(`unexpected post record type: ${record.$type}`);
    const uri = bskyFeedPost.uri;
    if (!(0, types_1.isUri)(uri))
        throw new Error(`invalid uri: ${uri}`);
    const cid = bskyFeedPost.cid;
    if (!(0, types_1.isCid)(cid))
        throw new Error(`invalid cid: ${cid}`);
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
        if (!(0, types_1.isPostReference)(replyDetails.parent))
            throw new Error(`invalid parent: ${JSON.stringify(replyDetails.parent)}`);
        if (!(0, types_1.isPostReference)(replyDetails.root))
            throw new Error(`invalid root: ${JSON.stringify(replyDetails.root)}`);
    }
    const text = record.text ?? "";
    if (typeof text !== "string")
        throw new Error(`invalid text: ${text} (type: ${typeof text})`);
    return {
        author: mapBskyAuthorToAuthor(bskyFeedPost.author),
        uri,
        cid,
        text,
        ...replyDetails,
        mentions: (0, exports.extractMentionsFromFacets)(record.facets),
    };
};
const mapThreadViewPostToPost = (threadViewPost) => {
    // TODO type check here
    if (!threadViewPost)
        throw new Error(`invalid threadViewPost: ${threadViewPost}`);
    const { post } = threadViewPost;
    return mapBskyFeedPostToPost(post);
};
// TODO explore possibly introducing CID comparison as part of this
// can eg throw if the CID doesn't match what you pass in
const getPost = async (params) => {
    const { agent } = params;
    const uri = "uri" in params ? params.uri : params.postReference.uri;
    // TODO is there a better way to do this than calling getPostThread?
    let res;
    try {
        res = await agent.getPostThread({ uri, depth: 0 }, (0, util_1.getCallOptions)(agent));
    }
    catch (err) {
        if (String(err).match(/not found/i))
            return null;
        throw err;
    }
    // I don't love the cast to any here, but the types are really annoying to work with
    // and we're going to check the shape carefully at the end, so it's not a big deal
    const thread = res.data.thread;
    if (thread.notFound)
        return null;
    return mapThreadViewPostToPost(thread); // TODO i really don't love the cast but it works for now
};
exports.getPost = getPost;
const getPostParents = async (params) => {
    const { agent } = params;
    const uri = "uri" in params ? params.uri : params.postReference.uri;
    const res = await agent.getPostThread({ uri });
    const parents = [];
    let currentPost = res.data.thread; // TODO again i don't love the cast but oh well
    while (currentPost) {
        parents.push(mapThreadViewPostToPost(currentPost));
        currentPost = currentPost.parent;
    }
    return parents.reverse();
};
exports.getPostParents = getPostParents;
const getUserPosts = async ({ agent, identifier, limit, cursor, }) => {
    const res = await agent.getAuthorFeed({ actor: identifier, limit: limit ?? config_1.DEFAULT_LIMIT, cursor }, (0, util_1.getCallOptions)(agent));
    const posts = res.data.feed.map((entry) => {
        const isRepost = entry.reason?.$type === "app.bsky.feed.defs#reasonRepost";
        const post = mapBskyFeedPostToPost(entry.post);
        if (isRepost) {
            post.isRepost = true;
        }
        return post;
    });
    return { items: posts, cursor: res.data.cursor };
};
exports.getUserPosts = getUserPosts;
const validatePostParams = (params) => {
    if (!Object.keys(params).length)
        throw new Error("post params must contain at least one field");
};
exports.validatePostParams = validatePostParams;
const _post = async (params) => {
    const { agent } = params;
    const _params = {};
    // TODO suport passing in custom facets and entities ?
    const richText = params.richText ?? new api_1.RichText({ text: params.text ?? "" });
    await richText.detectFacets(agent);
    if (params.replyTo) {
        let parent = params.replyTo;
        let root;
        if ((0, types_1.isReplyPost)(parent)) {
            root = parent.root;
        }
        else {
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
    const { uri, cid } = await agent.post({ text: richText.text, facets: richText.facets, ..._params }); // call options ?
    if (!(0, types_1.isUri)(uri))
        throw new Error(`unexpected uri: ${uri}`);
    if (!(0, types_1.isCid)(cid))
        throw new Error(`unexpected cid: ${cid}`);
    return { uri, cid };
};
const post = async (params) => {
    return await _post(params);
};
exports.post = post;
const reply = async (params) => {
    return await _post(params);
};
exports.reply = reply;
const like = async ({ agent, post }) => {
    const { uri, cid } = await agent.like(post.uri, post.cid); // call options ?
    if (!(0, types_1.isCid)(cid))
        throw new Error(`unexpected cid: ${cid}`);
    if (!(0, types_1.isUri)(uri))
        throw new Error(`unexpected uri: ${uri}`);
    return { uri, cid };
};
exports.like = like;
const repost = async ({ agent, post }) => {
    const { uri, cid } = await agent.repost(post.uri, post.cid); // call options ?
    if (!(0, types_1.isCid)(cid))
        throw new Error(`unexpected cid: ${cid}`);
    if (!(0, types_1.isUri)(uri))
        throw new Error(`unexpected uri: ${uri}`);
    return { uri, cid };
};
exports.repost = repost;
