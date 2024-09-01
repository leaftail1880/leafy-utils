/**
 * For a given function, creates a bound function that has the same body as the original function. The this object of the bound function is associated with the specified object. Unlike {@link Function.prototype.bind} returns type of the provided function.
 * @template {Function} F
 * @param {F} func - Function to bind
 * @param {unknown} context - An object to which the this keyword can refer inside the new function.
 * @returns {F}
 */
export function typedBind<F extends Function>(func: F, context: unknown): F;
/**
 * Returns information about file based on path, provided by import.meta.url
 * @param {string} importMetaUrl import.meta.url
 */
export function pathInfo(importMetaUrl: string): {
    /**
     * Dirname of the file. For example, for
     * ```js
     * import.meta.url === 'file:///C:/Documents/script.js'
     * ```
     * it will be `C:\\Documents\\`
     */
    __dirname: string;
    /**
     * Filename. For example, for
     * ```js
     * import.meta.url === 'file:///C:/Documents/script.js'
     * ```
     * it will be `C:\\Documents\\script.js`
     */
    __filename: string;
    /**
     * Whenether if file is entrypoint for node. For example, if file was called by
     * ```cmd
     * node ./script.js
     * ```
     * Then inside this script
     * ```js
     * __cli === true
     * ```
     *
     * If the file is imported by this script, then
     * ```js
     * __cli === false
     * ```
     *
     * Similiar how __main__ in python works, isn't it?
     */
    __cli: boolean;
    /**
     * Returns path joined with {@link __dirname}
     * @param  {...string} to
     */
    relative(...to: string[]): string;
};
/**
 * Patches object
 * @author ConMaster2112
 * @template O
 * @param {O} prototype
 * @param {import('./types.js').PartialParts<O>} object
 * @returns {O}
 */
export function OverTakes<O>(prototype: O, object: import("./types.js").PartialParts<O>): O;
/**
 * The function `writeJSON` writes a JSON object to a file, with the option to replace LF line endings
 * with CRLF line endings.
 * @param {string} path - File path where the JSON data will be written to. It should
 * be a string representing the file path, including the file name and extension.
 * @param {object} json - Object that you want to write to a JSON file.
 * It will be converted to a JSON string using `JSON.stringify()` before writing it to the file.
 * @returns {ReturnType<fs['writeFile']>}
 */
export function writeJSON(path: string, json: object): ReturnType<typeof fs.writeFile>;
/**
 * Reads and parses json from file
 * @param {string} path - Path to file
 */
export function readJSON(path: string): Promise<any>;
/**
 * LF string end is bad for git, replacing it to CRLF
 * @param {string} text
 */
export function toCRLF(text: string): string;
/**
 * @param {string} text
 */
export function addQuotes(text: string, { when, quote }?: {
    when?: boolean;
    quote?: string;
}): string;
/**
 * For a given function, creates a bound function that has the same body as the original function. The this object of the bound function is associated with the specified object. Unlike {@link Function.prototype.bind} returns type of the provided function.
 * @template {Function} F
 * @param {F} func - Function to bind
 * @param {unknown} context - An object to which the this keyword can refer inside the new function.
 * @returns {F}
 */
export function TypedBind<F extends Function>(func: F, context: unknown): F;
/**
 * Utility class used to hook promise's resolve
 * @template T
 */
export class PromiseHook<T> {
    /**
     * Function used to resolve promise value
     * @type {(value: T | PromiseLike<T>) => void}
     */
    resolve: (value: T | PromiseLike<T>) => void;
    /**
     * Promise being hooked
     * @type {Promise<T>}
     */
    promise: Promise<T>;
    then: <TResult1 = T, TResult2 = never>(onfulfilled?: (value: T) => TResult1 | PromiseLike<TResult1>, onrejected?: (reason: any) => TResult2 | PromiseLike<TResult2>) => Promise<TResult1 | TResult2>;
}
import fs from 'fs/promises';
//# sourceMappingURL=utils.d.ts.map