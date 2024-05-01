/// <reference types="node" />
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
 *   code: number
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
export function execAsync<T extends boolean = false>(command: string, options: Partial<child_process.ExecOptions>, { logger: Logger, failedTo, context, ignore, throws, fullResult }?: ExecAsyncOptions<T>): Promise<T extends true ? ExecAsyncInfo : string>;
export namespace execAsync {
    /**
     * High-order function that returns a new function with default values
     * @template {boolean} [T=false]
     * @param {import("child_process").ExecOptions} defaults - Default options object
     * @param {Partial<ExecAsyncOptions<T>>} [errorHandlerDefaults]
     * @returns {(command: string, options: ExecAsyncOptions<T>) => ReturnType<typeof execAsync<T>>}
     */
    export function withDefaults<T_1 extends boolean = false>(defaults: child_process.ExecOptions, errorHandlerDefaults?: Partial<ExecAsyncOptions<T_1>>): (command: string, options: ExecAsyncOptions<T_1>) => Promise<T_1 extends true ? ExecAsyncInfo : string>;
    export { ExecAsyncError as error };
    /**
     * Wraps the provided promise into catch block and if execAsync error occurs prints more reliable info
     * @param {Promise<void>} promise - Promise to wrap
     */
    export function wrapForCli(promise: Promise<void>): void;
}
/**
 * Spawns given command and resolves on command exit with exit code and successfull status
 * @param {string} command
 * @param {import('child_process').SpawnOptions} options
 * @returns {Promise<{code: number, successfull: boolean}>}
 */
export function spawnAsync(command: string, options: import('child_process').SpawnOptions): Promise<{
    code: number;
    successfull: boolean;
}>;
/**
 *
 * @param {object} o - Options
 * @param {(line: string) => void | Promise<void>} o.onLine - Function that gets called for each new line
 * @param {(s: string) => void} [o.stdout] - Function that writes to stdout. Defaults to process.stdout.write
 * @param {(s: string) => void} [o.stderr] - Function that writes to stderr. Defaults to process.stderr.write
 * @param {import('./types.js').PartialPick<readline.ReadLineOptions, 'input'>} [o.options] - Extra options for the readline
 */
export function readlineWithPersistentInput({ onLine, stdout, stderr, options, }: {
    onLine: (line: string) => void | Promise<void>;
    stdout?: (s: string) => void;
    stderr?: (s: string) => void;
    options?: import('./types.js').PartialPick<readline.ReadLineOptions, 'input'>;
}): {
    readline: readline.Interface;
    write: (text: string, out: (s: string) => void) => void;
    stderr: (s: string) => void;
    stdout: (s: string) => void;
};
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
    code: number;
};
import child_process from 'child_process';
declare class ExecAsyncError extends Error {
    /** @param {ExecAsyncInfo & { failedTo?: string }} p */
    constructor({ error, stderr, stdout, code, failedTo }: ExecAsyncInfo & {
        failedTo?: string;
    });
    command: string;
    code: number;
}
import readline from 'readline';
import { LeafyLogger } from './LeafyLogger.js';
export {};
//# sourceMappingURL=terminal.d.ts.map