import fs from 'fs/promises'
import os from 'os'
import path from 'path'
import url from 'url'

/**
 * Typed bind
 * @template {Function} F
 * @param {F} func
 * @param {unknown} context
 * @returns {F}
 */
export function TypedBind(func, context) {
  if (typeof func !== 'function') return func
  return func.bind(context)
}

/**
 * Returns info about file based on meta url
 * @param {string} metaUrl import.meta.url
 */
export function pathInfo(metaUrl) {
  const __dirname = url.fileURLToPath(new URL('.', metaUrl))
  const __filename = url.fileURLToPath(metaUrl)
  return {
    __dirname,
    __filename,
    __cli: process.argv[1] && __filename && path.resolve(__filename).includes(path.resolve(process.argv[1])),
    /**
     * Returns path joined with __dirname
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
  then = TypedBind(this.promise.then, this.promise)
}
