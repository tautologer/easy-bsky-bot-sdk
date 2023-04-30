"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_MAX_REPLIES_PER_INTERVAL = exports.DEFAULT_MAX_REPLIES_INTERVAL = exports.GETALL_LOOP_LIMIT = exports.GETALL_SLEEP_INTERVAL = exports.GETALL_LIMIT = exports.DEFAULT_UPDATE_INTERVAL = exports.DEFAULT_QUERY_INTERVAL = exports.DEFAULT_POST_INTERVAL = exports.DEFAULT_POLLING_INTERVAL = exports.DEFAULT_LIMIT = exports.VERSION = void 0;
exports.VERSION = "0.1.1";
// I'm just hardcoding all of this for now, maybe I'll make it configurable later
exports.DEFAULT_LIMIT = 50;
exports.DEFAULT_POLLING_INTERVAL = 10000; // ms
exports.DEFAULT_POST_INTERVAL = 1000; // ms
exports.DEFAULT_QUERY_INTERVAL = 100; // ms
exports.DEFAULT_UPDATE_INTERVAL = 100; // ms
exports.GETALL_LIMIT = 100; // limit used when getting all followers/follows
exports.GETALL_SLEEP_INTERVAL = 100; // ms
// limit on the number of times we'll loop while fetching just to safeguard against infinite loops
// note that we'll have to increase this as the network grows haha, this only supports 100k users/posts/etc
exports.GETALL_LOOP_LIMIT = 1000;
exports.DEFAULT_MAX_REPLIES_INTERVAL = 5 * 60 * 1000; // 5 minutes
exports.DEFAULT_MAX_REPLIES_PER_INTERVAL = 10; // max number of replies per user per MAX_REPLIES_INTERVAL
