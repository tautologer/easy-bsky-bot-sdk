import { BskyAgent } from "@atproto/api";

export const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

// helpers for getting the user agent and call options for making requests
export const getUserAgent = (agent: BskyAgent): string => {
  if (!agent.session) throw new Error("not logged in");
  return `easy-bsky-bot-sdk/${agent.session.did}`;
};
// old version that we're not using at the moment, preserved in case we need it again
// export const getCallOptions = (agent: BskyAgent): { headers: { "User-Agent": string } } => ({
//   headers: { "User-Agent": getUserAgent(agent) },
// });

// TODO making this a no-op for now because the agent doesn't support passing call options to all methods,
// so we're force to set a global fetch handler
// ideally this gets obsoleted because we can set a userAgent on the agent itself
// but for now I'm leaving this in as a no-op because I'm too lazy to remove all the call sites,
// especially if we might still need it in the future
export const getCallOptions = (agent: BskyAgent): {} => ({});
