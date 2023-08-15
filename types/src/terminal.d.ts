/// <reference types="node" />
/**
 * Ask user for input any text
 * @param {string} [text] - Text to show before input like "Count: "
 * @returns {Promise<string>}
 */
export function input(text?: string): Promise<string>;
/**
 * Works same as console.log but without \n every new line
 * @param {...any} data See **util.format()** for more info
 */
export function print(...data: any[]): void;
/**
 * Executes common terminal command
 * @param {string} command Command to execute
 * @returns {Promise<{stderr: string; stdout: string}>}
 * @deprecated Use execute instead
 */
export function exec(command: string): Promise<{
    stderr: string;
    stdout: string;
}>;
/**
 * Executes common terminal command
 * @param {string} command Command to execute
 * @returns {Promise<boolean>}
 * @deprecated Use execute instead
 */
export function execWithLog(command: string, showLog?: boolean): Promise<boolean>;
/**
 * @param {string} command
 */
export function execute(command: string): Promise<any>;
/**
 * @deprecated Unusable, bagged and should be removed
 */
export function clearLines(count?: number): void;
/**
 * @param {Record<string, (arg?: {args: string[]; raw_input: string}) => any>} commands Object with key -> function mapping. Note that function must return 0, otherwise process will be exited.
 */
export function checkForArgs(commands: Record<string, (arg?: {
    args: string[];
    raw_input: string;
}) => any>, { commandList, defaultCommand }?: {
    commandList?: any[];
    defaultCommand?: string;
}): Promise<{
    command: string;
    input: string[];
    raw_input: string;
}>;
/**
 * @typedef {(...text: string[]) => string} Colorer
 */
export class LeafyLogger {
    static colors: {
        yellow: string;
        red: string;
        reset: string;
        cyan: string;
        greenBright: string;
    };
    /**
     * @param {Colorer | string} color
     */
    static createLogType(color: Colorer | string): (...context?: any[]) => void;
    constructor({ filePath, prefix }: {
        filePath?: string;
        prefix?: string;
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
     * color: Colorer | string
     * }} message
     */
    writeLog({ consoleMessage, fileMessage, color }: {
        consoleMessage?: string;
        fileMessage?: string;
        color: Colorer | string;
    }): void;
}
export type Colorer = (...text: string[]) => string;
import fs from "fs";
//# sourceMappingURL=terminal.d.ts.map