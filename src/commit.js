import {
  exec
} from "./terminal.js"
import {
  PACKAGE
} from "./package.js"

/**
* @callback on_commit_clb
* @param {[number, number, number]} version
* @param {string} message
* @param {string} argv
*/

let on_commit_clb = () => void 0
/**
* @param {on_commit_clb} callback
*/
export function on_commit(callback) {
  on_commit_clb = callback
}

export async function commit() {
  const argv = process.argv[2] ?? "f"

  const actions = {
    r() {
      updateVersion(0,
        "Release: ")
    },
    u() {
      updateVersion(1,
        "Update: ")
    },
    f() {
      updateVersion(2)
    }
  }

  if (!(argv in actions)) {
    console.error(
      `First argv (${argv}) must be one of this:\n ${Object.keys(actions).join("\n ")}`
    )
    process.exit(1)
  }

  const pack = new PACKAGE()
  await pack.read()
  const pack_data = pack.data

  const version = pack_data.version?.split(".") ?? [0,
    0,
    0]

  function updateVersion(level, prefix = null) {
    version[level]++
    const strVersion = version.join(".")
    pack_data.version = strVersion

    let message = strVersion
    if (prefix) message = `${prefix}: ${message}`

    on_commit_clb(version, message, arg)
    exec(`git commit -a --message=${message}`)
  }


  actions[argv]()


  pack.end()
}