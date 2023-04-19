"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimit = exports.RateLimiter = void 0;
const util_1 = require("./util");
// TODO refactor to allow bursty behavior ? maybe ?? get the devs' input on this if possible
class RateLimiter {
    _interval;
    _queue = [];
    _draining = false;
    constructor({ interval }) {
        this._interval = interval;
    }
    async _drainQueue() {
        if (this._draining)
            return;
        this._draining = true;
        while (this._queue.length > 0) {
            const task = this._queue.shift();
            if (!task)
                continue;
            try {
                const res = await task.fn();
                task.resolve(res);
            }
            catch (err) {
                task.reject(err);
            }
            await (0, util_1.sleep)(this._interval);
        }
        this._draining = false;
    }
    async run(fn) {
        return new Promise((resolve, reject) => {
            this._queue.push({ fn, resolve, reject });
            this._drainQueue();
        });
    }
}
exports.RateLimiter = RateLimiter;
const rateLimit = (fn, rateLimiter) => {
    const rateLimitedFn = async (...args) => rateLimiter.run(() => fn(...args));
    return rateLimitedFn;
};
exports.rateLimit = rateLimit;
