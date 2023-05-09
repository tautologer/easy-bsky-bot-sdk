import { BskyAgent } from "@atproto/api";
export declare type Did = string & {
    __did__: never;
};
export declare const isDid: (did: unknown) => did is Did;
export declare type Handle = string & {
    __handle__: never;
};
export declare const isHandle: (handle: unknown) => handle is Handle;
export declare type UserIdentifier = Did | Handle;
export declare const isUserIdentifier: (identifier: unknown) => identifier is UserIdentifier;
export declare type Cid = string & {
    __cid__: never;
};
export declare const isCid: (cid: unknown) => cid is Cid;
export declare type Uri = string & {
    __uri__: never;
};
export declare const isUri: (uri: unknown) => uri is Uri;
export declare type User = {
    did: Did;
    handle: Handle;
    name?: string;
};
export declare const isUser: (x: any) => x is User;
export declare type PostReference = {
    uri: Uri;
    cid: Cid;
};
export declare const isPostReference: (x: any) => x is PostReference;
export declare type Post = {
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
export declare type ReplyPost = Post & {
    root: PostReference;
    parent: PostReference;
};
export declare const isReplyPost: (x: any) => x is ReplyPost;
export declare const Events: {
    readonly FOLLOW: "FOLLOW";
    readonly MENTION: "MENTION";
    readonly REPLY: "REPLY";
};
declare type FollowEvent = {
    type: "FOLLOW";
    data: {
        user: User;
    };
};
declare type MentionEvent = {
    type: "MENTION";
    data: {
        post: Post;
    };
};
declare type ReplyEvent = {
    type: "REPLY";
    data: {
        post: Post;
    };
};
export declare type Event = FollowEvent | MentionEvent | ReplyEvent;
export declare type Feature = {
    $type: string;
    [key: string]: any;
};
export declare type MentionFeature = Feature & {
    $type: "app.bsky.richtext.facet#mention";
    did: string;
};
export declare const isMentionFeature: (feature: Feature) => feature is MentionFeature;
export declare type FetchParams = {
    limit?: number;
    cursor?: string;
};
export declare type Fetcher<T, P extends FetchParams> = (params: P) => Promise<{
    items: T[];
    cursor?: string;
}>;
export declare type Notif = Awaited<ReturnType<BskyAgent["listNotifications"]>>["data"]["notifications"][number];
export declare type Assert<T extends true> = T;
export declare type Equals<T, U> = [T] extends [U] ? ([U] extends [T] ? true : false) : false;
export declare type MakeEmbedParams = {
    agent: BskyAgent;
    imageUrl: string;
    imageAlt?: string;
    encoding?: string;
};
export declare type ImageItem = {
    image: any;
    alt: string;
};
export declare type ImageEmbed = {
    $type: "app.bsky.embed.images";
    images: ImageItem[];
};
export {};
