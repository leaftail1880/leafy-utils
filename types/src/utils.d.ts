/// <reference types="node" />
/**
 * Typed bind
 * @template {Function} F
 * @param {F} func
 * @param {unknown} context
 * @returns {F}
 */
export function TypedBind<F extends Function>(func: F, context: unknown): F;
/**
 * Returns info about file based on meta url
 * @param {string} metaUrl import.meta.url
 */
export function pathInfo(metaUrl: string): {
    __dirname: string;
    __filename: string;
    __cli: boolean;
    /**
     * Returns path joined with __dirname
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
export function OverTakes<O>(prototype: O, object: import("./types.js").PartialParts<O, O>): O;
/**
 * The function `writeJSON` writes a JSON object to a file, with the option to replace LF line endings
 * with CRLF line endings.
 * @param {string} path - File path where the JSON data will be written to. It should
 * be a string representing the file path, including the file name and extension.
 * @param {object} json - Object that you want to write to a JSON file.
 * It will be converted to a JSON string using `JSON.stringify()` before writing it to the file.
 * @returns {ReturnType<fs['writeFile']>}
 */
export function writeJSON(path: string, json: object): ReturnType<(typeof fs)['writeFile']>;
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