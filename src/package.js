import fs from "fs/promises"
import path from "path"

export class PACKAGE {
  /**
  * @private
  * @type {string}
  */
  PACKAGE_PATH;
  
  /**
  * @type {Object}
  * @property {string} version
  * @private
  */
  DATA = {};
  
  /**
   * @private
   */
  MODIFIED = false
  
  /**
  * @param {string} pathToPackageJson
  */
  constructor(pathToPackageJson = "./package.json") {
    this.PACKAGE_PATH = pathToPackageJson
    this.read()
  }
  
  get data() {
    const setModify = () => this.MODIFIED = true
    
    return new Proxy(this.DATA, {
      set(target, key, value) {
        if (Reflect.get(target, key) == value) return true
        
        setModify()
        return Reflect.set(...arguments)
      }
    })
  }
  
  async read() {
    this.DATA = JSON.parse((await fs.readFile(this.PACKAGE_PATH)).toString())
  }
  
  write() {
    return fs.writeFile(this.PACKAGE_PATH, JSON.stringify(this.DATA, null, " "))
  }
  
  end() {
    if (this.MODIFIED) return this.write()
  }
}