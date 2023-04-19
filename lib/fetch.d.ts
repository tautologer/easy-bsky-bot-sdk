import { RateLimiter } from "./rateLimiter";
import { FetchParams } from "./types";
export declare const setGlobalFetchHandler: (userAgent: string) => void;
export declare function makeFetchAll<T, P extends FetchParams>(fetcher: (params: P) => Promise<{
    items: T[];
    cursor?: string;
}>, rateLimiter?: RateLimiter): (params: P) => Promise<T[]>;
export declare const fetchAll: <T, P extends FetchParams>(fetcher: (params: P) => Promise<{
    items: T[];
    cursor?: string | undefined;
}>, params: P, rateLimiter?: RateLimiter) => Promise<T[]>;
