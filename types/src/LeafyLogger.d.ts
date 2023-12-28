/// <reference types="node" />
/**
 * @typedef {(...text: string[]) => string} Colorizer
 */
export class LeafyLogger {
    static colors: {
        yellow: string;
        red: string;
        reset: string;
        cyan: string;
        greenBright: string;
        darkGray: string;
    };
    /**
     * @param {Colorizer | string} color
     */
    static createLogType(color: Colorizer | string): (this: LeafyLogger, ...context?: any[]) => void;
    /**
     * @param {{filePath?: string, prefix: string}} param0
     */
    constructor({ filePath, prefix }: {
        filePath?: string;
        prefix: string;
    });
    stream: fs.WriteStream;
    prefix: string;
    error: (this: LeafyLogger, ...context?: any[]) => void;
    warn: (this: LeafyLogger, ...context?: any[]) => void;
    info: (this: LeafyLogger, ...context?: any[]) => void;
    log: (this: LeafyLogger, ...context?: any[]) => void;
    success: (this: LeafyLogger, ...context?: any[]) => void;
    /**
     * @param {{
     * consoleMessage?: string,
     * fileMessage?: string,
     * color: Colorizer | string
     * }} message
     */
    writeLog({ consoleMessage, fileMessage, color }: {
        consoleMessage?: string;
        fileMessage?: string;
        color: Colorizer | string;
    }): void;
    time(postfix?: string): () => string;
}
export type Colorizer = (...text: string[]) => string;
import fs from 'fs';
//# sourceMappingURL=LeafyLogger.d.ts.map