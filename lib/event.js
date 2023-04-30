"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleNotification = void 0;
const post_1 = require("./post");
const types_1 = require("./types");
const extractUser = (notif) => {
    const { author } = notif;
    if (!(0, types_1.isDid)(author.did))
        throw new Error(`invalid did: ${author.did}`);
    if (!(0, types_1.isHandle)(author.handle))
        throw new Error(`invalid handle: ${author.handle}`);
    return {
        did: author.did,
        handle: author.handle,
        name: author.displayName,
    };
};
// TODO handle images, embeds, quotes, etc
const extractPost = (notif) => {
    // TODO get rid of any and use a type guard
    const record = notif.record;
    // TODO more comprehensive type guard?
    if (record.$type !== "app.bsky.feed.post")
        throw new Error(`failed to extract post of type ${record.type}}`);
    if (!(0, types_1.isUri)(notif.uri))
        throw new Error(`invalid uri: ${record.uri}`);
    if (!(0, types_1.isCid)(notif.cid))
        throw new Error(`invalid cid: ${record.cid}`);
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
        mentions: (0, post_1.extractMentionsFromFacets)(record.facets),
    };
};
// map event type to function that extracts the data from the notification
const mappers = {
    FOLLOW: (notif) => ({ user: extractUser(notif) }),
    MENTION: (notif) => ({ post: extractPost(notif) }),
    REPLY: (notif) => ({ post: extractPost(notif) }),
};
// TODO a post can both be a reply and a mention -- should we handle that here, or should we punt it to the user?
// I'm kind of inclined to think that any post that mentions the bot should be handled as a mention,
// but that means drilling the bot DID into this function so we can check if it's a mention or not
// and that's a bit of a pain
// probably worth it but I'm definitely not going to do it right now
const getEventType = (notif) => {
    switch (notif.reason) {
        case "follow":
            return types_1.Events.FOLLOW;
        case "mention":
            return types_1.Events.MENTION;
        case "reply":
            return types_1.Events.REPLY;
        default:
            // TODO log something here?
            return undefined;
    }
};
const handleNotification = async (handlers, notif) => {
    const type = getEventType(notif);
    if (!type)
        return;
    const handler = handlers[type];
    if (!handler)
        return;
    const mapper = mappers[type];
    try {
        await handler(mapper(notif));
    }
    catch (err) {
        console.error(`uncaught error in ${type} handler:`, err);
    }
};
exports.handleNotification = handleNotification;
