import fs from 'fs/promises'
import os from 'os'
import path from 'path'
import url from 'url'

/**
 * For a given function, creates a bound function that has the same body as the original function. The this object of the bound function is associated with the specified object. Unlike {@link Function.prototype.bind} returns type of the provided function.
 * @template {Function} F
 * @param {F} func - Function to bind
 * @param {unknown} context - An object to which the this keyword can refer inside the new function.
 * @returns {F}
 */
export function typedBind(func, context) {
  if (typeof func !== 'function') return func
  return func.bind(context)
}

/**
 * @deprecated Use {@link typedBind} instead.
 */
export const TypedBind = typedBind

/**
 * Returns information about file based on path, provided by import.meta.url
 * @param {string} importMetaUrl import.meta.url
 */
export function pathInfo(importMetaUrl) {
  const __dirname = url.fileURLToPath(new URL('.', importMetaUrl))
  const __filename = url.fileURLToPath(importMetaUrl)
  return {
    /**
     * Dirname of the file. For example, for
     * ```js
     * import.meta.url === 'file:///C:/Documents/script.js'
     * ```
     * it will be `C:\\Documents\\`
     */
    __dirname,
    /**
     * Filename. For example, for
     * ```js
     * import.meta.url === 'file:///C:/Documents/script.js'
     * ```
     * it will be `C:\\Documents\\script.js`
     */
    __filename,
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
    __cli: process.argv[1] && __filename && path.resolve(__filename).includes(path.resolve(process.argv[1])),
    /**
     * Returns path joined with {@link __dirname}
     * @param  {...string} to
     */
    relative(...to) {
      return path.join(__dirname, ...to)
    },
  }
}

/**
 * Patches object
 * @author ConMaster2112
 * @template O
 * @param {O} prototype
 * @param {import('./types.js').PartialParts<O>} object
 * @returns {O}
 */
export function OverTakes(prototype, object) {
  const prototypeOrigin = Object.setPrototypeOf(
    Object.defineProperties({}, Object.getOwnPropertyDescriptors(prototype)),
    Object.getPrototypeOf(prototype)
  )
  Object.setPrototypeOf(object, prototypeOrigin)
  Object.defineProperties(prototype, Object.getOwnPropertyDescriptors(object))
  return prototypeOrigin
}

/**
 * The function `writeJSON` writes a JSON object to a file, with the option to replace LF line endings
 * with CRLF line endings.
 * @param {string} path - File path where the JSON data will be written to. It should
 * be a string representing the file path, including the file name and extension.
 * @param {object} json - Object that you want to write to a JSON file.
 * It will be converted to a JSON string using `JSON.stringify()` before writing it to the file.
 * @returns {ReturnType<fs['writeFile']>}
 */
export function writeJSON(path, json) {
  return fs.writeFile(path, toCRLF(JSON.stringify(json, null, 2) + '\n'))
}

/**
 * Reads and parses json from file
 * @param {string} path - Path to file
 */
export async function readJSON(path) {
  return JSON.parse(await fs.readFile(path, 'utf-8'))
}

/**
 * LF string end is bad for git, replacing it to CRLF
 * @param {string} text
 */
export function toCRLF(text) {
  return text.replace(/\n/g, '\r\n')
}

/**
 * @param {string} text
 */
export function addQuotes(text, { when = os.platform() !== 'win32', quote = '' } = {}) {
  if (when) return `${quote}${text}${quote}`
  return text
}

/**
 * Utility class used to hook promise's resolve
 * @template T
 */
export class PromiseHook {
  /**
   * Function used to resolve promise value
   * @type {(value: T | PromiseLike<T>) => void}
   */
  resolve
  /**
   * Promise being hooked
   * @type {Promise<T>}
   */
  promise = new Promise(r => (this.resolve = r))
  then = typedBind(this.promise.then, this.promise)
}
