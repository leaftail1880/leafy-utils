import { LeafyLogger } from './LeafyLogger.js'
import { PackageJSON } from './package.js'
import { execAsync, parseArgs, spawnAsync } from './terminal.js'
import { addQuotes } from './utils.js'

/**
 * @typedef {{
 *   type?: 'fix' | 'update' | "release"
 *   info?: string
 * }} CommitMeta
 */

/**
 * @typedef {object} CommitHookArgument
 * @property {[number, number, number]} version
 * @property {[number, number, number]} prev_version
 * @property {import("./types.js").PackageMeta} package
 * @property {string} message
 * @property {string} type
 * @property {string} info
 */

export class CommitManager {
  /**
   * Returns array of relative pathes for each edited module
   */
  static async getEditedSubmodules() {
    const [submodulesRaw, statusRaw] = await Promise.all([
      execAsync('git submodule status', {}, { failedTo: 'get submodule status' }),
      execAsync('git status --porcelain', {}, { failedTo: 'get repository status' }),
    ])

    // In format <commit hash> path <another info>
    const submodules = submodulesRaw
      .split('\n')
      .map(e => e.trim().split(' ')[1])
      .filter(Boolean)

    // In format <mode> path
    const status = statusRaw.split('\n')

    return submodules.filter(e => status.find(s => s.includes(e)))
  }
  /**
   * Returns argument for git pathspec which excludes provided pathes
   * @param {string[]} pathes
   */
  static exceptFor(pathes, positional = '--') {
    return `${positional} ${pathes.map(e => addQuotes(`:!${e}`)).join(' ')}`
  }

  static logger = new LeafyLogger({ prefix: 'commit' })

  /**
   * @param {undefined | string} cwd
   * @param {object} [o]
   * @param {boolean} [o.prefix] Whenther to include cwd into prefix or not
   */
  constructor(cwd, { prefix = false } = {}) {
    this.package = new PackageJSON(cwd)
    this.logger = prefix ? new LeafyLogger({ prefix: `commit (${cwd})` }) : CommitManager.logger

    /**
     * @param {string} command
     * @param {import('./terminal.js').ExecAsyncOptions<false>} options
     */
    this.exec = async (command, options) => {
      const output = await execAsync(command, { cwd }, options)
      this.logger.log(output)
      return output
    }
  }

  /**
   * Replace this function if you want to do something before commit
   * @param {CommitHookArgument} arg
   * @this {CommitManager}
   */
  async precommit(arg) {}
  /**
   * Replace this function if you want to do something after commit
   * @param {CommitHookArgument} arg
   * @this {CommitManager}
   */
  async postcommit(arg) {}
  /**
   * Runs this structure:
   *
   * ```shell
   * precommit
   * git add {arg} (if not false)
   * git commit
   * postcommit
   * git push
   * ```
   * @param {CommitMeta & {
   *   add?: string | false,
   *   config?: Record<CommitMeta['type'],[number, string]>,
   *   origin?: string,
   *   branch?: string
   *   pushDryRun?: boolean,
   * }} p
   */
  async commit({
    type = 'fix',
    info = '',
    add = './',
    origin = 'origin',
    branch = 'HEAD',
    pushDryRun = false,
    config = {
      release: [0, 'Release'],
      update: [1, 'Update'],
      fix: [2, ''],
    },
  } = {}) {
    await this.package.init()

    const rawVersion = this.package.content.version?.split('.')?.map(Number) ?? [0, 0, 0]

    /**
     * @type {[number, number, number]}
     */
    const version = [rawVersion[0], rawVersion[1], rawVersion[2]]
    const [level, prefix] = config[type]

    /**
     * @type {[number, number, number]}
     */
    const prev_version = [version[0], version[1], version[2]]

    for (let i = 0; i < version.length; i++) {
      if (i === level) version[i]++
      if (i > level) version[i] = 0
    }

    const strVersion = version.join('.')
    this.package.content.version = strVersion

    let message = strVersion
    if (prefix) message = `${prefix}: ${message}`
    if (info) message += ` ${info}`

    /** @type {CommitHookArgument} */
    const args = {
      version,
      message,
      type,
      info,
      prev_version,
      package: this.package.content,
    }

    await this.precommit(args)

    // We need to save package before it will be added
    await this.package.save()

    if (add) {
      await this.exec('git add ' + add, {
        failedTo: 'add files',
        context: { arg: add },
      })
    }
    await this.exec(`git commit --message="${message}"`, {
      failedTo: 'commit',
      context: { message },
    })
    await this.postcommit(args)
    await this.exec(`git push ${origin} ${branch} ${pushDryRun ? '--dry-run' : ''}`, { failedTo: 'push' })
  }
  /**
   * Runs package.json's scripts build field
   */
  async build() {
    await this.package.init()

    if ('build' in (this.package.content.scripts ?? {})) {
      this.logger.log('Building...')
      const time = this.logger.time()
      await this.exec(this.package.content.scripts.build, {
        failedTo: 'build',
      })
      this.logger.success('Done in', time())
    }
  }
  /**
   * Runs script from package.json
   * @param {string} scriptName Script to run
   * @param {string[]} args Args to add
   */
  async runPackageScript(scriptName, args = []) {
    await this.package.init()
    const scripts = this.package.content?.scripts
    if (!scripts || typeof scripts !== 'object' || !(scriptName in scripts)) return false

    const script = scripts[scriptName]
    const arg = args.map(e => (e.includes(' ') ? `"${e}"` : e)).join(' ')

    const result = await spawnAsync(`${script} ${arg ? arg : ''}`, {
      shell: true,
      stdio: 'inherit',
    })

    if (!result.successfull) {
      this.logger.error(`'${script}' exited with status code ${result.code}.`)
    }
    return true
  }
  /**
   * @template {import('./types.js').CustomParseArgsConfig} T
   * @param {T} [config]
   * @returns {Promise<CommitMeta & {options: import('./types.js').CustomParseArgReturn<T>['options']}>}
   */
  async parseArgs(helpText = 'Commits dir where it was called.', helpOptions = '', config) {
    const commandList = ['fix', 'update', 'release']
    const commiter = this
    const parsed = await parseArgs(
      {
        help() {
          console.log(
            `${helpText}

Usage:

  [option?] [info?]

Options:
  ${helpOptions}
  fix - Default commit (0.0.0 -> 0.0.1 [info])

  update - Run this if you adding something new. (0.0.0 -> Update: 0.1.0 [info])

  release - Run this on breaking changes. (0.0.0 -> Release: 1.0.0 [info])

  package - Prints current package.json and exites.

  --help | help - Prints this and exits.

`
          )
          process.exit()
        },
        async package() {
          await commiter.package.init()
          console.log(commiter.package.content)
          process.exit(0)
        },
      },
      { commandList, defaultCommand: 'fix', options: config }
    )

    return {
      // @ts-ignore
      type: parsed.command,
      info: parsed.raw_input,
      options: parsed.options,
    }
  }
}

export const Committer = new CommitManager(void 0)
