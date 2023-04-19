import { BskyAgent } from "@atproto/api";
import { isDid, isHandle, User, UserIdentifier } from "./types";
import { getCallOptions } from "./util";

// read

export const getUser = async ({
  agent,
  identifier,
}: {
  agent: BskyAgent;
  identifier: UserIdentifier;
}): Promise<User | null> => {
  try {
    const res = await agent.getProfile({ actor: identifier }, getCallOptions(agent));
    const { did, handle, displayName } = res.data;
    if (!isDid(did)) throw new Error(`invalid did when fetching user ${identifier}: ${did}`);
    if (!isHandle(handle)) throw new Error(`invalid handle when fetching user ${identifier}: ${handle}`);
    return {
      did: did,
      handle: handle,
      name: displayName,
    };
  } catch (err) {
    if (String(err).match(/not found/i)) return null;
    throw err;
  }
};

// write
