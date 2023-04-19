import { AppBskyFeedDefs, BskyAgent } from "@atproto/api";
import { DEFAULT_LIMIT } from "./config";
import { Did, isDid, isHandle, User, UserIdentifier } from "./types";
import { getCallOptions } from "./util";

// read

export const getFollowers = async ({
  agent,
  actor,
  limit,
  cursor,
}: {
  agent: BskyAgent;
  actor: UserIdentifier;
  limit?: number;
  cursor?: string;
}): Promise<{ items: User[]; cursor?: string }> => {
  const res = await agent.getFollowers({ actor, limit: limit ?? DEFAULT_LIMIT, cursor }, getCallOptions(agent));
  const users = res.data.followers.map((u): User => {
    const { did, handle, displayName } = u;
    if (!isDid(did)) throw new Error(`invalid did: ${did}`);
    if (!isHandle(handle)) throw new Error(`invalid handle: ${handle}`);
    return {
      did,
      handle,
      name: displayName,
    };
  });
  return { items: users, cursor: res.data.cursor };
};

export const getFollows = async ({
  agent,
  actor,
  limit,
  cursor,
}: {
  agent: BskyAgent;
  actor: UserIdentifier;
  limit?: number;
  cursor?: string;
}): Promise<{ items: User[]; cursor?: string }> => {
  const res = await agent.getFollows({ actor, limit: limit ?? DEFAULT_LIMIT, cursor }, getCallOptions(agent));
  const users = res.data.follows.map((u): User => {
    const { did, handle, displayName } = u;
    if (!isDid(did)) throw new Error(`invalid did: ${did}`);
    if (!isHandle(handle)) throw new Error(`invalid handle: ${handle}`);
    return {
      did,
      handle,
      name: displayName,
    };
  });
  return { items: users, cursor: res.data.cursor };
};

// write

export const follow = async ({ agent, did }: { agent: BskyAgent; did: Did }) => {
  await agent.follow(did); // call options ?
};

// returns true if unfollowed, false if not following
export const unfollow = async ({ agent, identifier }: { agent: BskyAgent; identifier: UserIdentifier }) => {
  const res = await agent.getProfile({ actor: identifier }, getCallOptions(agent));
  const followUri = res.data.viewer?.following;
  if (!followUri) return false;
  await agent.deleteFollow(followUri); // call options ?
  return true;
};
