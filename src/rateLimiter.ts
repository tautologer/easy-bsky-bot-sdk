import { sleep } from "./util";

type TaskEntry<F extends () => any> = {
  fn: F;
  resolve: (value: ReturnType<F>) => void;
  reject: (err: unknown) => void;
};

// TODO refactor to allow bursty behavior ? maybe ?? get the devs' input on this if possible
export class RateLimiter {
  private _interval: number;
  private _queue: TaskEntry<any>[] = [];
  private _draining: boolean = false;

  constructor({ interval }: { interval: number }) {
    this._interval = interval;
  }

  private async _drainQueue() {
    if (this._draining) return;
    this._draining = true;
    while (this._queue.length > 0) {
      const task = this._queue.shift();
      if (!task) continue;
      try {
        const res = await task.fn();
        task.resolve(res);
      } catch (err) {
        task.reject(err);
      }
      await sleep(this._interval);
    }
    this._draining = false;
  }

  public async run<F extends () => any>(fn: F): Promise<ReturnType<F>> {
    return new Promise((resolve, reject) => {
      this._queue.push({ fn, resolve, reject });
      this._drainQueue();
    });
  }
}

export const rateLimit = <F extends (...args: any[]) => any>(
  fn: F,
  rateLimiter: RateLimiter
): ((...args: Parameters<F>) => Promise<ReturnType<F>>) => {
  const rateLimitedFn = async (...args: Parameters<F>): Promise<ReturnType<F>> => rateLimiter.run(() => fn(...args));
  return rateLimitedFn;
};
