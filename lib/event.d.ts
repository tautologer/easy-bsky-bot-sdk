import { Event, Notif } from "./types";
type DataMap = {
    [K in Event["type"]]: Extract<Event, {
        type: K;
    }>["data"];
};
export type HandlerMap = {
    [K in keyof DataMap]: (event: DataMap[K]) => void | Promise<void>;
};
export declare const handleNotification: (handlers: Partial<HandlerMap>, notif: Notif) => Promise<void>;
export {};
