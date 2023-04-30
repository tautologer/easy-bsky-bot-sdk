export const VERSION = "0.1.1";

// I'm just hardcoding all of this for now, maybe I'll make it configurable later

export const DEFAULT_LIMIT = 50;
export const DEFAULT_POLLING_INTERVAL = 10000; // ms

export const DEFAULT_POST_INTERVAL = 1000; // ms
export const DEFAULT_QUERY_INTERVAL = 100; // ms
export const DEFAULT_UPDATE_INTERVAL = 100; // ms

export const GETALL_LIMIT = 100; // limit used when getting all followers/follows
export const GETALL_SLEEP_INTERVAL = 100; // ms
// limit on the number of times we'll loop while fetching just to safeguard against infinite loops
// note that we'll have to increase this as the network grows haha, this only supports 100k users/posts/etc
export const GETALL_LOOP_LIMIT = 1000;

export const DEFAULT_MAX_REPLIES_INTERVAL = 5 * 60 * 1000; // 5 minutes
export const DEFAULT_MAX_REPLIES_PER_INTERVAL = 10; // max number of replies per user per MAX_REPLIES_INTERVAL
