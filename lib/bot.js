"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BskyBot = void 0;
const api_1 = require("@atproto/api");
const config_1 = require("./config");
const event_1 = require("./event");
const fetch_1 = require("./fetch");
const graph_1 = require("./graph");
const post_1 = require("./post");
const rateLimiter_1 = require("./rateLimiter");
const types_1 = require("./types");
const user_1 = require("./user");
const getPostParams = (param) => {
    if (typeof param === "string")
        return { text: param };
    (0, post_1.validatePostParams)(param);
    return param;
};
const BOT_DEFAULTS = {
    handle: "",
    service: "https://bsky.social",
    replyToBots: false,
    replyToNonFollowers: false,
    maxRepliesInterval: config_1.DEFAULT_MAX_REPLIES_INTERVAL,
    maxRepliesPerInterval: config_1.DEFAULT_MAX_REPLIES_PER_INTERVAL,
    useNonBotHandle: false,
};
// regex to test that a handle conains one of ".bot." or "-bot"
const botHandleRegex = /(\.bot\.|-bot)/i;
class BskyBot {
    // fetch handler with user-agent
    static _ownerHandle;
    static setOwner({ handle, contact }) {
        if (!(0, types_1.isHandle)(handle))
            throw new Error(`invalid handle: ${handle}`);
        this._ownerHandle = handle;
        const userAgent = `easy-bsky-bot-sdk/${config_1.VERSION} (owner:${handle}` + (contact ? `; contact:${contact})` : ")");
        (0, fetch_1.setGlobalFetchHandler)(userAgent);
    }
    // we're making _agent private and writing a getter
    // in order to decrease the likelihood that the bot
    // is able to continue doing stuff after it's killed
    // if i'm lucky it will behave properly like that for free
    _agent;
    get agent() {
        this._ensureNotKilled();
        return this._agent;
    }
    _handle;
    _did;
    _handlers = {};
    _pollIntervalRef; // we don't know if we're in node or the browser
    _polling = false;
    _maintenanceIntervalRef; // we don't know if we're in node or the browser
    _replyToBots;
    _replyToNonFollowers;
    _postRateLimiter;
    _queryRateLimiter;
    _updateRateLimiter;
    _replyRecord;
    _maxRepliesInterval;
    _maxRepliesPerInterval;
    _killed = false;
    constructor(options) {
        // TODO delete this out before publishing the release
        console.log("WARN: this is a pre-release version dated 2023-04-18");
        console.log("WARN: if you are using it, please check github and update when a full release is available");
        console.log("WARN: this version is not guaranteed to be stable or secure\n");
        if (!BskyBot._ownerHandle)
            throw new Error("must call BskyBot.setOwner() before creating a bot");
        options = { ...BOT_DEFAULTS, ...options };
        // hm the nullish coalescing clauses shouldn't be necessary since we spread BOT_DEFAULTS into options, but typescript doesn't seem to realize that
        this._replyToBots = options.replyToBots ?? BOT_DEFAULTS.replyToBots;
        this._replyToNonFollowers = options.replyToNonFollowers ?? BOT_DEFAULTS.replyToNonFollowers;
        if (!(0, types_1.isHandle)(options.handle))
            throw new Error("invalid handle");
        if (!options.useNonBotHandle && !botHandleRegex.test(options.handle)) {
            console.log('Please consider using a handle with ".bot." or "-bot" in it to indicate to users that this account is a bot.');
        }
        this._handle = options.handle;
        // these default rate limits have been chosen after consultation with the bluesky devs
        // please consider carefully before changing them
        this._postRateLimiter = new rateLimiter_1.RateLimiter({ interval: config_1.DEFAULT_POST_INTERVAL });
        this._queryRateLimiter = new rateLimiter_1.RateLimiter({ interval: config_1.DEFAULT_QUERY_INTERVAL });
        this._updateRateLimiter = new rateLimiter_1.RateLimiter({ interval: config_1.DEFAULT_UPDATE_INTERVAL });
        this._replyRecord = [];
        this._maxRepliesInterval = options.maxRepliesInterval ?? BOT_DEFAULTS.maxRepliesInterval;
        this._maxRepliesPerInterval = options.maxRepliesPerInterval ?? BOT_DEFAULTS.maxRepliesPerInterval;
        this._agent = new api_1.BskyAgent({
            service: options.service ?? "https://bsky.social",
        });
        // periodically prune the reply record, just so it doesn't grow without bounds
        //
        // note that this can lead to a memory leak: it'll keep the bot instance around in memory forever
        // even if it would otherwise be garbage-collected since this interval is never cleared
        // and the closure has a reference to the bot instance
        // (the same is true of the polling interval if the user never calls stopPolling())
        // I don't think that's an issue in practice though, I don't expect people to create
        // lots of ephemeral bot instances. if they do and this turns out to be a problem we
        // can figure out a solution to this problem
        // in practice the best (only?) solution is to just switch the ts target to es2022 and use WeakRef
        // which we should be able to freely do once we publish as an npm package, i think (will have to check node/browser support)
        //
        // in the meantime I've implemented the kill() method which will clear the interval among other things
        // so if people really need a solution to this problem they can call kill() when they're done with the bot
        this._maintenanceIntervalRef = setInterval(() => {
            const now = Date.now();
            this._replyRecord = this._replyRecord.filter((r) => now - r.timestamp < this._maxRepliesInterval);
        }, 1000 * 60 * 5); // every 5 minutes
    }
    // login and identity
    async login(password) {
        this._ensureNotKilled();
        if (this._did)
            throw new Error("already logged in");
        try {
            const resolveHandleResult = await this.agent.com.atproto.identity.resolveHandle({ handle: BskyBot._ownerHandle });
            if (!resolveHandleResult.success || !resolveHandleResult.data?.did) {
                throw new Error(`must call BskyBot.setOwner() with a valid handle before logging in`);
            }
        }
        catch (err) {
            if (String(err).match(/unable to resolve/i))
                throw new Error(`invalid owner handle: ${BskyBot._ownerHandle}`);
            throw err;
        }
        const res = await this.agent.login({ identifier: this._handle, password });
        const { did } = res.data;
        if (!(0, types_1.isDid)(did))
            throw new Error("invalid did received from server");
        this._did = did;
    }
    // calling this should clear up all internal self references
    // and allow the bot to be garbage collected
    // as well as preventing the bot from doing anything further
    async kill() {
        this._ensureNotKilled();
        this.stopPolling();
        clearInterval(this._maintenanceIntervalRef);
        this._killed = true;
        this._did = undefined;
        // this might cause errors if there are still pending requests --
        // but I'm fine with that, I think it's better to throw an error
        // than let the bot continue doing stuff after it's been killed
        // (imo if the bot does continue doing stuff instead of throwing an error that's a bug)
        // anyway it's the user's responsibility to await all promises before calling kill()
        // and if they don't, it'll probably be unhandledPromiseRejections
        this.agent = null;
    }
    get did() {
        this._ensureNotKilled();
        if (!this._did)
            throw new Error("not logged in");
        return this._did;
    }
    get handle() {
        this._ensureNotKilled();
        return this._handle;
    }
    _ensureNotKilled() {
        if (this._killed)
            throw new Error("bot is killed");
    }
    _ensureLoggedIn() {
        this._ensureNotKilled();
        if (!this._did)
            throw new Error("not logged in");
    }
    // event handling and polling
    setHandler(type, handler) {
        this._ensureNotKilled();
        this._handlers[type] = handler;
    }
    clearHandler(type) {
        this._ensureNotKilled();
        delete this._handlers[type];
    }
    async _poll() {
        this._ensureNotKilled();
        if (this._polling)
            return;
        this._polling = true;
        const listNotifications = (0, rateLimiter_1.rateLimit)(this.agent.listNotifications, this._queryRateLimiter);
        try {
            const checkedNotificationsAt = new Date();
            // we can't just use a normal makeFetchAll() here because
            // notifs will go on WAY longer than we want them to...
            // we care about reading notifs until the first unread,
            // which we have to do manually here
            const notifications = [];
            let cursor;
            let allUnread = true;
            do {
                const res = await listNotifications({ limit: 100, cursor });
                cursor = res.data.cursor;
                notifications.push(...res.data.notifications);
                allUnread = res.data.notifications.every((n) => !n.isRead);
            } while (cursor && allUnread);
            await this._queryRateLimiter.run(() => this.agent.updateSeenNotifications(checkedNotificationsAt.toISOString()));
            const unreadNotifs = notifications.filter((n) => !n.isRead);
            for (const notif of unreadNotifs) {
                // we can safely fire off every handler at once since all requests should be rate-limited, so we won't swamp the server
                (0, event_1.handleNotification)(this._handlers, notif);
            }
        }
        catch (err) {
            console.error("error while polling:", err);
        }
        finally {
            this._polling = false;
        }
    }
    async startPolling(options) {
        this.stopPolling();
        // make historical options opt-in to avoid an incredible surge of activity
        // from a popular bot that's been offline for a while
        // I'm thinking of you, Berduck
        if (!options?.includeHistorical)
            await this.agent.updateSeenNotifications();
        // see comment in the constructor about using WeakRef to avoid this memory leak
        this._pollIntervalRef = setInterval(() => this._poll(), options?.interval ?? config_1.DEFAULT_POLLING_INTERVAL);
    }
    stopPolling() {
        if (this._pollIntervalRef)
            clearInterval(this._pollIntervalRef);
    }
    // user
    async getUser(identifier) {
        this._ensureLoggedIn();
        return await this._queryRateLimiter.run(() => (0, user_1.getUser)({ agent: this.agent, identifier }));
    }
    async getUserPosts(identifier, options = {}) {
        this._ensureLoggedIn();
        if (!options.limit)
            options.limit = config_1.DEFAULT_LIMIT;
        return (0, fetch_1.fetchAll)(post_1.getUserPosts, { agent: this.agent, identifier, limit: options.limit }, this._queryRateLimiter);
    }
    async bestEffortCheckIsBot(identifier) {
        if ((0, types_1.isHandle)(identifier) && botHandleRegex.test(identifier))
            return true; // save a network request
        const user = await this.getUser(identifier);
        if (!user)
            return false;
        if (botHandleRegex.test(user.handle))
            return true;
        // TODO check nonstandard isBot profile field?
        return false;
    }
    async isFollowedBy(identifier) {
        this._ensureLoggedIn();
        // TODO factor this out & make it nice or something idk
        const res = await this._queryRateLimiter.run(() => this.agent.getProfile({ actor: identifier }));
        return !!res.data.viewer?.followedBy;
    }
    // post
    async getPost(uri) {
        this._ensureLoggedIn();
        return await this._queryRateLimiter.run(() => (0, post_1.getPost)({ agent: this.agent, uri }));
    }
    async getPostParents(uri) {
        this._ensureLoggedIn();
        return await this._queryRateLimiter.run(() => (0, post_1.getPostParents)({ agent: this.agent, uri }));
    }
    async deletePost(uri) {
        this._ensureLoggedIn();
        // deliberately NOT rate-limiting deletes for safety reasons
        // if people spam deletes, you know what, the server can deal
        return await this.agent.deletePost(uri);
    }
    async post(post) {
        this._ensureLoggedIn();
        return await this._postRateLimiter.run(() => (0, post_1.post)({ agent: this.agent, ...getPostParams(post) }));
    }
    async repost(post) {
        this._ensureLoggedIn();
        return await this._postRateLimiter.run(() => (0, post_1.repost)({ agent: this.agent, post }));
    }
    async reply(post, replyTo) {
        this._ensureLoggedIn();
        const now = Date.now(); // don't want the timestamp to be affected by the async calls that follow
        // only reply to bots if we have been configured to do so
        if ((await this.bestEffortCheckIsBot(replyTo.author.handle)) && !this._replyToBots) {
            return null;
        }
        // only reply to non-followers if we have been configured to do so
        if (!(await this.isFollowedBy(replyTo.author.did)) && !this._replyToNonFollowers) {
            return null;
        }
        // don't respond to the user more than 10 times per 5 minutes
        // extra safety against infinite loops
        if (this._replyRecord.filter(({ did, timestamp }) => did === replyTo.author.did && timestamp > now - this._maxRepliesInterval).length >= this._maxRepliesPerInterval) {
            return null;
        }
        // we're good, reply
        this._replyRecord.push({ did: replyTo.author.did, timestamp: now });
        return await this._postRateLimiter.run(() => (0, post_1.reply)({ agent: this.agent, ...getPostParams(post), replyTo }));
    }
    // yeah, Post | PostReference is redundant since Post extends PostReference
    // but I want to make it clear to people using vscode hover types that you can pass either
    async like(post) {
        this._ensureLoggedIn();
        return await this._updateRateLimiter.run(() => (0, post_1.like)({ agent: this.agent, post }));
    }
    // graph
    async follow(did) {
        this._ensureLoggedIn();
        return await this._updateRateLimiter.run(() => (0, graph_1.follow)({ agent: this.agent, did }));
    }
    async unfollow(identifier) {
        this._ensureLoggedIn();
        return await this._updateRateLimiter.run(() => (0, graph_1.unfollow)({ agent: this.agent, identifier }));
    }
    async getFollowers(identifier, options = {}) {
        this._ensureLoggedIn();
        if (!options.limit)
            options.limit = config_1.DEFAULT_LIMIT;
        return await (0, fetch_1.fetchAll)(graph_1.getFollowers, { agent: this.agent, actor: identifier, limit: options.limit }, this._queryRateLimiter);
    }
    async getFollows(identifier, options = {}) {
        this._ensureLoggedIn();
        if (!options.limit)
            options.limit = config_1.DEFAULT_LIMIT;
        return await (0, fetch_1.fetchAll)(graph_1.getFollows, { agent: this.agent, actor: identifier, limit: options.limit }, this._queryRateLimiter);
    }
}
exports.BskyBot = BskyBot;
