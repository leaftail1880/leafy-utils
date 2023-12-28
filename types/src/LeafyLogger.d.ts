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
    static createLogType(color: Colorizer | string): (...context?: any[]) => void;
    /**
     * @param {{filePath?: string, prefix: string}} param0
     */
    constructor({ filePath, prefix }: {
        filePath?: string;
        prefix: string;
    });
    stream: fs.WriteStream;
    prefix: string;
    error: (...context?: any[]) => void;
    warn: (...context?: any[]) => void;
    info: (...context?: any[]) => void;
    log: (...context?: any[]) => void;
    success: (...context?: any[]) => void;
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
import fs from "fs";
//# sourceMappingURL=LeafyLogger.d.ts.map