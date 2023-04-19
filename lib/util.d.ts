import { BskyAgent } from "@atproto/api";
export declare const sleep: (ms: number) => Promise<void>;
export declare const getUserAgent: (agent: BskyAgent) => string;
export declare const getCallOptions: (agent: BskyAgent) => {};
