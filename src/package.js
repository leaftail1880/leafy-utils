import path from 'path'
import { readJSON, writeJSON } from './utils.js'

export class PackageJSON {
  /** @private */
  PACKAGE_PATH = ''

  /** @private @type {import("./types.js").Package | null} */
  CONTENT = null

  /** @private */
  MODIFIED = false

  /**
   * @param {string} pathToPackage
   */
  constructor(pathToPackage = '.', fileName = 'package.json') {
    this.PACKAGE_PATH = path.join(pathToPackage, fileName)
  }

  /**
   * Returns a proxy for data, which sets modified on modify
   * @returns {import("./types.js").Package} A proxy object.
   */
  get content() {
    const checkModify = (status = true) => {
      if (status) this.MODIFIED = true
      return status
    }

    return new Proxy(this.CONTENT, {
      set(target, p, newValue, reciever) {
        // New value is same as previous, do nothing
        if (Reflect.get(target, p) == newValue) return true

        return checkModify(Reflect.set(target, p, newValue, reciever))
      },
      deleteProperty(target, p) {
        return checkModify(Reflect.deleteProperty(target, p))
      },
      defineProperty(target, p, a) {
        return checkModify(Reflect.defineProperty(target, p, a))
      },
    })
  }

  /**
   * It reads the package.json file, parses it into a JSON object and saves to local var. To get it, use this.data
   */
  async read() {
    this.CONTENT = await readJSON(this.PACKAGE_PATH)
  }

  /**
   * Reads data if it not initialized
   */
  init() {
    if (!this.CONTENT) return this.read()
  }

  /**
   * It writes the internal saved data to the package.json file
   * @returns The return value of fs.writeFile()
   */
  write() {
    return writeJSON(this.PACKAGE_PATH, this.CONTENT)
  }

  /**
   * If the file has been modified, write the changes to the file
   * @returns promise that resolves after writing file
   */
  save() {
    if (this.MODIFIED) return this.write()
  }
}
