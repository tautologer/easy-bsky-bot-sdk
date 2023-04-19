"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUser = void 0;
const types_1 = require("./types");
const util_1 = require("./util");
// read
const getUser = async ({ agent, identifier, }) => {
    try {
        const res = await agent.getProfile({ actor: identifier }, (0, util_1.getCallOptions)(agent));
        const { did, handle, displayName } = res.data;
        if (!(0, types_1.isDid)(did))
            throw new Error(`invalid did when fetching user ${identifier}: ${did}`);
        if (!(0, types_1.isHandle)(handle))
            throw new Error(`invalid handle when fetching user ${identifier}: ${handle}`);
        return {
            did: did,
            handle: handle,
            name: displayName,
        };
    }
    catch (err) {
        if (String(err).match(/not found/i))
            return null;
        throw err;
    }
};
exports.getUser = getUser;
// write
