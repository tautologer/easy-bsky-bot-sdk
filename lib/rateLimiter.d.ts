export declare class RateLimiter {
    private _interval;
    private _queue;
    private _draining;
    constructor({ interval }: {
        interval: number;
    });
    private _drainQueue;
    run<F extends () => any>(fn: F): Promise<ReturnType<F>>;
}
export declare const rateLimit: <F extends (...args: any[]) => any>(fn: F, rateLimiter: RateLimiter) => (...args: Parameters<F>) => Promise<ReturnType<F>>;
