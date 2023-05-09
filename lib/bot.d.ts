import { BskyAgent } from "@atproto/api";
import { HandlerMap } from "./event";
import { PostParams } from "./post";
import { Did, Handle, Post, PostReference, Uri, User, UserIdentifier } from "./types";
type PostParam = string | PostParams;
type BotOptions = {
    handle: string;
    service?: string;
    replyToBots?: boolean;
    replyToNonFollowers?: boolean;
    maxRepliesInterval?: number;
    maxRepliesPerInterval?: number;
    useNonBotHandle?: boolean;
    showPolling?: boolean;
};
export declare class BskyBot {
    _pollCount: number;
    _showPolling: boolean;
    private static _ownerHandle?;
    static setOwner({ handle, contact }: {
        handle: string;
        contact?: string;
    }): void;
    private _agent;
    get agent(): BskyAgent;
    private _handle;
    private _did?;
    private _handlers;
    private _pollIntervalRef?;
    private _polling;
    private _maintenanceIntervalRef;
    private _replyToBots;
    private _replyToNonFollowers;
    private _postRateLimiter;
    private _queryRateLimiter;
    private _updateRateLimiter;
    private _replyRecord;
    private _maxRepliesInterval;
    private _maxRepliesPerInterval;
    private _killed;
    constructor(options: BotOptions);
    login(password: string): Promise<void>;
    kill(): Promise<void>;
    get did(): Did;
    get handle(): Handle;
    private _ensureNotKilled;
    private _ensureLoggedIn;
    setHandler<K extends keyof HandlerMap>(type: K, handler: HandlerMap[K]): void;
    clearHandler<K extends keyof HandlerMap>(type: K): void;
    private _tick;
    private _poll;
    startPolling(options?: {
        interval?: number;
        includeHistorical?: boolean;
    }): Promise<void>;
    stopPolling(): void;
    getUser(identifier: UserIdentifier): Promise<User | null>;
    getUserPosts(identifier: UserIdentifier, options?: {
        limit?: number;
    }): Promise<Post[]>;
    bestEffortCheckIsBot(identifier: UserIdentifier): Promise<boolean>;
    isFollowedBy(identifier: UserIdentifier): Promise<boolean>;
    getPost(uri: Uri): Promise<Post | null>;
    getPostParents(uri: Uri): Promise<Post[]>;
    deletePost(uri: Uri): Promise<void>;
    post(post: PostParam): Promise<PostReference>;
    repost(post: Post | PostReference): Promise<PostReference>;
    reply(post: PostParam, replyTo: Post): Promise<PostReference | null>;
    like(post: Post | PostReference): Promise<PostReference>;
    follow(did: Did): Promise<void>;
    unfollow(identifier: UserIdentifier): Promise<boolean>;
    getFollowers(identifier: UserIdentifier, options?: {
        limit?: number;
    }): Promise<User[]>;
    getFollows(identifier: UserIdentifier, options?: {
        limit?: number;
    }): Promise<User[]>;
}
export {};
