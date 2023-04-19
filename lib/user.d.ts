import { BskyAgent } from "@atproto/api";
import { User, UserIdentifier } from "./types";
export declare const getUser: ({ agent, identifier, }: {
    agent: BskyAgent;
    identifier: UserIdentifier;
}) => Promise<User | null>;
