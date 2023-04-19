"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unfollow = exports.follow = exports.getFollows = exports.getFollowers = void 0;
const config_1 = require("./config");
const types_1 = require("./types");
const util_1 = require("./util");
// read
const getFollowers = async ({ agent, actor, limit, cursor, }) => {
    const res = await agent.getFollowers({ actor, limit: limit ?? config_1.DEFAULT_LIMIT, cursor }, (0, util_1.getCallOptions)(agent));
    const users = res.data.followers.map((u) => {
        const { did, handle, displayName } = u;
        if (!(0, types_1.isDid)(did))
            throw new Error(`invalid did: ${did}`);
        if (!(0, types_1.isHandle)(handle))
            throw new Error(`invalid handle: ${handle}`);
        return {
            did,
            handle,
            name: displayName,
        };
    });
    return { items: users, cursor: res.data.cursor };
};
exports.getFollowers = getFollowers;
const getFollows = async ({ agent, actor, limit, cursor, }) => {
    const res = await agent.getFollows({ actor, limit: limit ?? config_1.DEFAULT_LIMIT, cursor }, (0, util_1.getCallOptions)(agent));
    const users = res.data.follows.map((u) => {
        const { did, handle, displayName } = u;
        if (!(0, types_1.isDid)(did))
            throw new Error(`invalid did: ${did}`);
        if (!(0, types_1.isHandle)(handle))
            throw new Error(`invalid handle: ${handle}`);
        return {
            did,
            handle,
            name: displayName,
        };
    });
    return { items: users, cursor: res.data.cursor };
};
exports.getFollows = getFollows;
// write
const follow = async ({ agent, did }) => {
    await agent.follow(did); // call options ?
};
exports.follow = follow;
// returns true if unfollowed, false if not following
const unfollow = async ({ agent, identifier }) => {
    const res = await agent.getProfile({ actor: identifier }, (0, util_1.getCallOptions)(agent));
    const followUri = res.data.viewer?.following;
    if (!followUri)
        return false;
    await agent.deleteFollow(followUri); // call options ?
    return true;
};
exports.unfollow = unfollow;
