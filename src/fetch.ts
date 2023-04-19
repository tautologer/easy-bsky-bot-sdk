import { AtpAgentFetchHandler, AtpAgentFetchHandlerResponse, BskyAgent } from "@atproto/api";
import { GETALL_LIMIT, GETALL_LOOP_LIMIT, GETALL_SLEEP_INTERVAL } from "./config";
import { rateLimit, RateLimiter } from "./rateLimiter";
import { FetchParams } from "./types";

export const setGlobalFetchHandler = (userAgent: string) => {
  const fetchHandler: AtpAgentFetchHandler = async (httpUri, httpMethod, httpHeaders, httpReqBody) => {
    // set request headers
    const headersList = new Headers();
    Object.keys(httpHeaders).forEach((name) => {
      headersList.set(name, httpHeaders[name]);
    });
    const existingHeader = headersList.get("User-Agent") ?? "";
    headersList.set("User-Agent", existingHeader ? `${existingHeader} ${userAgent}` : userAgent);
    const headers: Record<string, string> = {};
    headersList.forEach((value, key) => {
      headers[key] = value;
    });

    // set request body
    let body: string | undefined;
    if (typeof httpReqBody === "string") {
      body = httpReqBody;
    } else if (httpReqBody !== undefined) {
      body = JSON.stringify(httpReqBody);
      headersList.set("Content-Type", "application/json");
    }

    // set up request object
    const init: RequestInit = {
      method: httpMethod,
      headers: headers,
      ...(body ? { body } : {}),
    };

    // make request
    const res = await fetch(httpUri, init);

    // parse response
    const responseHeaders: Record<string, string> = {};
    for (const [key, value] of res.headers.entries()) {
      responseHeaders[key] = value;
    }
    const result: AtpAgentFetchHandlerResponse = {
      status: res.status,
      headers: responseHeaders,
      body: undefined,
    };
    if (res.headers.get("Content-Type")?.match(/application\/json/i)) {
      result.body = await res.json();
    } else {
      result.body = await res.text();
    }

    return result;
  };

  BskyAgent.configure({
    fetch: fetchHandler,
  });
};

// TODO consider a Paginator-type pattern instead of this, see comment below
export function makeFetchAll<T, P extends FetchParams>(
  fetcher: (params: P) => Promise<{ items: T[]; cursor?: string }>,
  rateLimiter?: RateLimiter
) {
  return async (params: P): Promise<T[]> => {
    if (params.limit && params.limit < 1) return [];

    const items: T[] = [];
    let cursor: string | undefined;
    let fetches = 0;

    rateLimiter = rateLimiter ?? new RateLimiter({ interval: GETALL_SLEEP_INTERVAL });
    const rateLimitedFetcher = rateLimit(fetcher, rateLimiter);

    do {
      if (++fetches > GETALL_LOOP_LIMIT) {
        throw new Error(
          `possible infinite loop in getAll(${fetcher.name || "anonymous"}) with params ${JSON.stringify(params)}`
        );
      }

      const limit = params.limit ? Math.min(params.limit - items.length, GETALL_LIMIT) : GETALL_LIMIT;

      const { items: newItems, cursor: newCursor } = await rateLimitedFetcher({ ...params, cursor, limit });
      items.push(...newItems);

      if (params.limit && items.length >= params.limit) break;
      if (!newCursor || newItems.length < limit) break;
      cursor = newCursor;
    } while (cursor && (!params.limit || items.length < params.limit));

    // don't return more than params.limit items
    return params.limit ? items.slice(0, params.limit) : items;
  };
}

export const fetchAll = <T, P extends FetchParams>(
  fetcher: (params: P) => Promise<{ items: T[]; cursor?: string }>,
  params: P,
  rateLimiter?: RateLimiter
): Promise<T[]> => makeFetchAll(fetcher, rateLimiter)(params);

// TODO consider this pattern instead, it could be a lot cleaner ?
type Paginator<T> = (cursor?: string) => Promise<T[]>;
// see https://github.com/bluesky-social/atproto/blob/aa46ad1e1ca8b5557f0dea1683538a9dfacead5d/packages/pds/tests/views/notifications.test.ts#L216-L227
