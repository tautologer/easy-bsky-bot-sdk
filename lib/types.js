"use strict";
// branded types for the various identifiers we use
Object.defineProperty(exports, "__esModule", { value: true });
exports.isMentionFeature = exports.Events = exports.isReplyPost = exports.isPost = exports.isPostReference = exports.isUser = exports.isUri = exports.isCid = exports.isUserIdentifier = exports.isHandle = exports.isDid = void 0;
const isDid = (did) => typeof did === "string" && did.startsWith("did:");
exports.isDid = isDid;
// regex to match a Fully Qualified Domain Name
const fqdnRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/;
const isHandle = (handle) => typeof handle === "string" && fqdnRegex.test(handle);
exports.isHandle = isHandle;
const isUserIdentifier = (identifier) => (0, exports.isDid)(identifier) || (0, exports.isHandle)(identifier);
exports.isUserIdentifier = isUserIdentifier;
const isCid = (cid) => typeof cid === "string"; // TODO i'm sure there's more we can enforce about the string
exports.isCid = isCid;
const isUri = (uri) => typeof uri === "string" && uri.startsWith("at://"); // TODO i'm sure there's more we can enforce about the string
exports.isUri = isUri;
const isUser = (x) => typeof x === "object" && x !== null && (0, exports.isDid)(x.did) && (0, exports.isHandle)(x.handle) && typeof x.name === "string";
exports.isUser = isUser;
const isPostReference = (x) => typeof x === "object" && x !== null && (0, exports.isUri)(x.uri) && (0, exports.isCid)(x.cid);
exports.isPostReference = isPostReference;
const isPost = (x) => typeof x === "object" &&
    x !== null &&
    (0, exports.isUser)(x.author) &&
    typeof x.text === "string" &&
    (0, exports.isUri)(x.uri) &&
    (0, exports.isCid)(x.cid) &&
    Array.isArray(x.mentions) &&
    x.mentions.every(exports.isDid) &&
    (x.isRepost === undefined || typeof x.isRepost === "boolean") &&
    (x.parent === undefined || (0, exports.isPostReference)(x.parent)) &&
    (x.root === undefined || (0, exports.isPostReference)(x.root));
exports.isPost = isPost;
const isReplyPost = (x) => (0, exports.isPost)(x) && (0, exports.isPostReference)(x.root) && (0, exports.isPostReference)(x.parent);
exports.isReplyPost = isReplyPost;
// types for events
// TODO implement the rest of the events
// i don't think it's an issue currently, but we'll have to think about handling reposts when creating the feed
exports.Events = {
    FOLLOW: "FOLLOW",
    MENTION: "MENTION",
    REPLY: "REPLY",
    // REPOST
    // FOLLOWING_POST
};
// TODO this can be a bit more robust
const isMentionFeature = (feature) => feature.$type === "app.bsky.richtext.facet#mention";
exports.isMentionFeature = isMentionFeature;
