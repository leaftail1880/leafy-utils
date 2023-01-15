/// <reference types="node" />
/**
 * @typedef {Object} Events
 * @property {{req: typeof IncomingMessage; res: typeof ServerResponse; incomingFromIP: string;}} message
 */
/** @type {import("./types.js").CustomEmitter<Events>} */
export const SyncEvents: import("./types.js").CustomEmitter<Events>;
export namespace SyncProcess {
    /**
     * Makes request to ip with message
     * @param {{ip: string; message: string; port: number}} options
     */
    function message({ ip, port, message }: {
        ip: string;
        message: string;
        port: number;
    }): Promise<void>;
}
export type Events = {
    message: {
        req: typeof IncomingMessage;
        res: typeof ServerResponse;
        incomingFromIP: string;
    };
};
import { IncomingMessage } from "http";
import { ServerResponse } from "http";
//# sourceMappingURL=sync.d.ts.map