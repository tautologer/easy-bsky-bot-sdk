import { BskyAgent } from "@atproto/api";
export type Did = string & {
    __did__: never;
};
export declare const isDid: (did: unknown) => did is Did;
export type Handle = string & {
    __handle__: never;
};
export declare const isHandle: (handle: unknown) => handle is Handle;
export type UserIdentifier = Did | Handle;
export declare const isUserIdentifier: (identifier: unknown) => identifier is UserIdentifier;
export type Cid = string & {
    __cid__: never;
};
export declare const isCid: (cid: unknown) => cid is Cid;
export type Uri = string & {
    __uri__: never;
};
export declare const isUri: (uri: unknown) => uri is Uri;
export type User = {
    did: Did;
    handle: Handle;
    name?: string;
};
export declare const isUser: (x: any) => x is User;
export type PostReference = {
    uri: Uri;
    cid: Cid;
};
export declare const isPostReference: (x: any) => x is PostReference;
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
export declare const isPost: (x: any) => x is Post;
export type ReplyPost = Post & {
    root: PostReference;
    parent: PostReference;
};
export declare const isReplyPost: (x: any) => x is ReplyPost;
export declare const Events: {
    readonly FOLLOW: "FOLLOW";
    readonly MENTION: "MENTION";
    readonly REPLY: "REPLY";
};
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
export type Feature = {
    $type: string;
    [key: string]: any;
};
export type MentionFeature = Feature & {
    $type: "app.bsky.richtext.facet#mention";
    did: string;
};
export declare const isMentionFeature: (feature: Feature) => feature is MentionFeature;
export type FetchParams = {
    limit?: number;
    cursor?: string;
};
export type Fetcher<T, P extends FetchParams> = (params: P) => Promise<{
    items: T[];
    cursor?: string;
}>;
export type Notif = Awaited<ReturnType<BskyAgent["listNotifications"]>>["data"]["notifications"][number];
export type Assert<T extends true> = T;
export type Equals<T, U> = [T] extends [U] ? ([U] extends [T] ? true : false) : false;
export {};
