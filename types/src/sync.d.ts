export class SyncProccess {
    /**
     * Makes request to ip with message
     * @param {{ip: string; data: Record<string, any>; port: number}} options
     * @returns {Promise<{succesfull: boolean; response: import("axios").AxiosResponse}>}
     */
    static message({ ip, port, data }: {
        ip: string;
        data: Record<string, any>;
        port: number;
    }): Promise<{
        succesfull: boolean;
        response: import("axios").AxiosResponse;
    }>;
    static get publicIP(): string[];
    /**
     * Starts the sync server on specified port
     * @param {number} port
     */
    constructor(port?: number);
    port: number;
    server: import("express-serve-static-core").Express;
    listen(): void;
    /**
     * @param {"put" | "get"} type
     */
    onMessageType(type: "put" | "get"): (((name: string) => any) & import("express-serve-static-core").IRouterMatcher<import("express-serve-static-core").Express, any>) | import("express-serve-static-core").IRouterMatcher<import("express-serve-static-core").Express, "put">;
    get syncIP(): string;
}
//# sourceMappingURL=sync.d.ts.map