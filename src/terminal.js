import fs from "fs/promises"
import util from "util"
import path from "path"
import child_process from "child_process"

/**
 * Ask user for input any text
 * @param {string} [text] - Text to show before input like "Count: "
 * @returns {Promise<string>}
 */
export function input(text = null) {
  if (text) print(text)
  process.stdin.resume()
  process.stdin.setEncoding('utf8')
  return new Promise((resolve) => {
    process.stdin.on('data', (chunk) => {
      process.stdin.pause()
      resolve(chunk)
    })
  })
}

/** 
 * Works same as console.lpg but without \n every new line
 * @param {..any} data See **util.format()** for more info
 */
export function print(...data) {
  process.stdout.write(util.format(...data))
}

/**
 * Executes common terminal command
 * @param {string} command Command to execute
 */
export function exec(command, callback = (error, stdout, stderr) => {
  if (error) throw error
  if (stderr) throw stderr
  if (stdout) console.log(stdout)
}) {
  child_process.exec(command, callback)
}