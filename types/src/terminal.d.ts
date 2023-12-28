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
 * @param {string} command
 * @param {string | undefined} cwd
 * @returns {Promise<number>}
 * @deprecated Use execAsync
 */
export function execute(command: string, cwd?: string | undefined): Promise<number>;
/**
 * @template {import('./types.js').CustomParseArgsConfig} T
 * @param {Record<string, (arg?: {args: string[]; raw_input: string}) => any>} commands Object with key -> function mapping. Note that function must return 0, otherwise process will be exited.
 * @param {object} [param1={}]
 * @param {string[]} [param1.commandList=[]]
 * @param {string} [param1.defaultCommand=""]
 * @param {T} [param1.options]
 * @returns {Promise<import('./types.js').CustomParseArgReturn<T>>}
 */
export function parseArgs<T extends import("./types.js").CustomParseArgsConfig>(commands: Record<string, (arg?: {
    args: string[];
    raw_input: string;
}) => any>, { commandList, defaultCommand, options }?: {
    commandList?: string[];
    defaultCommand?: string;
    options?: T;
}): Promise<import("./types.js").CustomParseArgReturn<T>>;
/**
 * @template {boolean} T
 * @typedef {{
 *   failedTo: string;
 *   ignore?: (error: child_process.ExecException, stderr: string) => boolean
 *   context?: object;
 *   logger?: LeafyLogger
 *   throws?: boolean
 *   fullResult?: T
 * }} ExecAsyncOptions
 */
/**
 * @typedef {{
 *   stdout: string,
 *   stderr: string,
 *   error: import("child_process").ExecException | null
 * }} ExecAsyncInfo
 */
/**
 * Runs provided command
 * @template {boolean} [T=false]
 * @param {string} command - Command to run
 * @param {Partial<child_process.ExecOptions>} options
 * @param {ExecAsyncOptions<T>} [errorHandler]
 * @returns {Promise<T extends true ? ExecAsyncInfo : string>}
 */
export function execAsync<T extends boolean = false>(command: string, options: Partial<child_process.ExecOptions>, errorHandler?: ExecAsyncOptions<T>): Promise<T extends true ? ExecAsyncInfo : string>;
export namespace execAsync {
    /**
     * Higher-order function that returns a new function with default values
     * @template {boolean} [T=false]
     * @param {import("child_process").ExecOptions} defaults - Default options object
     * @param {Partial<ExecAsyncOptions<T>>} [errorHandlerDefaults]
     * @returns {(command: string, options: ExecAsyncOptions<T>) => ReturnType<typeof execAsync<T>>}
     */
    export function withDefaults<T_1 extends boolean = false>(defaults: child_process.ExecOptions, errorHandlerDefaults?: Partial<ExecAsyncOptions<T_1>>): (command: string, options: ExecAsyncOptions<T_1>) => Promise<T_1 extends true ? ExecAsyncInfo : string>;
    export { ExecAsyncError as error };
}
export type ExecAsyncOptions<T extends boolean> = {
    failedTo: string;
    ignore?: (error: child_process.ExecException, stderr: string) => boolean;
    context?: object;
    logger?: LeafyLogger;
    throws?: boolean;
    fullResult?: T;
};
export type ExecAsyncInfo = {
    stdout: string;
    stderr: string;
    error: import("child_process").ExecException | null;
};
import child_process from 'child_process';
declare class ExecAsyncError {
    /** @param {ExecAsyncInfo & { code: number }} p */
    constructor({ error, stderr, stdout, code }: ExecAsyncInfo & {
        code: number;
    });
    error: child_process.ExecException;
    stderr: string;
    stdout: string;
    code: number;
}
declare const logger: LeafyLogger;
import { LeafyLogger } from './LeafyLogger.js';
export {};
//# sourceMappingURL=terminal.d.ts.map