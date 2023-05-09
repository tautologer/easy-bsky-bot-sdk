import { BskyAgent } from "@atproto/api";
import { Did, Feature, Post, PostReference, Uri, UserIdentifier, ImageEmbed } from "./types";
export declare const extractMentionsFromFacets: (facets: {
    features: Feature[];
}[] | undefined) => Did[];
export declare const getPost: (params: {
    agent: BskyAgent;
} & ({
    uri: Uri;
} | {
    postReference: PostReference;
})) => Promise<Post | null>;
export declare const getPostParents: (params: {
    agent: BskyAgent;
} & ({
    uri: Uri;
} | {
    postReference: PostReference;
})) => Promise<Post[]>;
export declare const getUserPosts: ({ agent, identifier, limit, cursor, }: {
    agent: BskyAgent;
    identifier: UserIdentifier;
    limit?: number | undefined;
    cursor?: string | undefined;
}) => Promise<{
    items: Post[];
    cursor?: string | undefined;
}>;
export type PostParams = {
    text?: string;
    embed?: ImageEmbed;
};
export declare const validatePostParams: (params: PostParams) => void;
type BasePostParams = PostParams & {
    agent: BskyAgent;
};
export declare const post: (params: BasePostParams) => Promise<PostReference>;
export declare const reply: (params: BasePostParams & {
    replyTo: Post;
}) => Promise<PostReference>;
export declare const like: ({ agent, post }: {
    agent: BskyAgent;
    post: PostReference;
}) => Promise<PostReference>;
export declare const repost: ({ agent, post }: {
    agent: BskyAgent;
    post: PostReference;
}) => Promise<PostReference>;
export {};
