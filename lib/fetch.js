"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchAll = exports.makeFetchAll = exports.setGlobalFetchHandler = void 0;
const api_1 = require("@atproto/api");
const config_1 = require("./config");
const rateLimiter_1 = require("./rateLimiter");
const setGlobalFetchHandler = (userAgent) => {
    const fetchHandler = async (httpUri, httpMethod, httpHeaders, httpReqBody) => {
        // set request headers
        const headersList = new Headers();
        Object.keys(httpHeaders).forEach((name) => {
            headersList.set(name, httpHeaders[name]);
        });
        const existingHeader = headersList.get("User-Agent") ?? "";
        headersList.set("User-Agent", existingHeader ? `${existingHeader} ${userAgent}` : userAgent);
        const headers = {};
        headersList.forEach((value, key) => {
            headers[key] = value;
        });
        // set request body
        let body;
        if (typeof httpReqBody === "string") {
            body = httpReqBody;
        }
        else if (httpReqBody !== undefined) {
            body = JSON.stringify(httpReqBody);
            headersList.set("Content-Type", "application/json");
        }
        // set up request object
        const init = {
            method: httpMethod,
            headers: headers,
            ...(body ? { body } : {}),
        };
        // make request
        const res = await fetch(httpUri, init);
        // parse response
        const responseHeaders = {};
        for (const [key, value] of res.headers.entries()) {
            responseHeaders[key] = value;
        }
        const result = {
            status: res.status,
            headers: responseHeaders,
            body: undefined,
        };
        if (res.headers.get("Content-Type")?.match(/application\/json/i)) {
            result.body = await res.json();
        }
        else {
            result.body = await res.text();
        }
        return result;
    };
    api_1.BskyAgent.configure({
        fetch: fetchHandler,
    });
};
exports.setGlobalFetchHandler = setGlobalFetchHandler;
// TODO consider a Paginator-type pattern instead of this, see comment below
function makeFetchAll(fetcher, rateLimiter) {
    return async (params) => {
        if (params.limit && params.limit < 1)
            return [];
        const items = [];
        let cursor;
        let fetches = 0;
        rateLimiter = rateLimiter ?? new rateLimiter_1.RateLimiter({ interval: config_1.GETALL_SLEEP_INTERVAL });
        const rateLimitedFetcher = (0, rateLimiter_1.rateLimit)(fetcher, rateLimiter);
        do {
            if (++fetches > config_1.GETALL_LOOP_LIMIT) {
                throw new Error(`possible infinite loop in getAll(${fetcher.name || "anonymous"}) with params ${JSON.stringify(params)}`);
            }
            const limit = params.limit ? Math.min(params.limit - items.length, config_1.GETALL_LIMIT) : config_1.GETALL_LIMIT;
            const { items: newItems, cursor: newCursor } = await rateLimitedFetcher({ ...params, cursor, limit });
            items.push(...newItems);
            if (params.limit && items.length >= params.limit)
                break;
            if (!newCursor || newItems.length < limit)
                break;
            cursor = newCursor;
        } while (cursor && (!params.limit || items.length < params.limit));
        // don't return more than params.limit items
        return params.limit ? items.slice(0, params.limit) : items;
    };
}
exports.makeFetchAll = makeFetchAll;
const fetchAll = (fetcher, params, rateLimiter) => makeFetchAll(fetcher, rateLimiter)(params);
exports.fetchAll = fetchAll;
// see https://github.com/bluesky-social/atproto/blob/aa46ad1e1ca8b5557f0dea1683538a9dfacead5d/packages/pds/tests/views/notifications.test.ts#L216-L227
