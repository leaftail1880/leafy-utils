import child_process, { spawn } from 'child_process'
import util from 'util'
import { LeafyLogger } from './LeafyLogger.js'
import { PromiseHook } from './utils.js'

const logger = new LeafyLogger({ prefix: 'terminal' })

/**
 * Ask user for input any text
 * @param {string} [text] - Text to show before input like "Count: "
 * @returns {Promise<string>}
 */
export function input(text = null) {
  if (text) print(text)
  process.stdin.resume()
  process.stdin.setEncoding('utf8')
  return new Promise(resolve => {
    process.stdin.on('data', chunk => {
      process.stdin.pause()
      resolve(chunk.toString())
    })
  })
}

/**
 * Works same as console.log but without \n every new line
 * @param {...any} data See **util.format()** for more info
 */
export function print(...data) {
  process.stdout.write(util.format(...data))
}

/**
 * @param {string} command
 * @param {string | undefined} cwd
 * @returns {Promise<number>}
 * @deprecated Use execAsync
 */
export function execute(command, cwd = undefined) {
  return new Promise((resolve, reject) => {
    const process = spawn(command, { stdio: 'inherit', shell: true, cwd })
    process.on('exit', resolve)
    process.on('error', reject)
  })
}

/**
 * @template {import('./types.js').CustomParseArgsConfig} T
 * @param {Record<string, (arg?: {args: string[]; raw_input: string}) => any>} commands Object with key -> function mapping. Note that function must return 0, otherwise process will be exited.
 * @param {object} [param1={}]
 * @param {string[]} [param1.commandList=[]]
 * @param {string} [param1.defaultCommand=""]
 * @param {T} [param1.options]
 * @returns {Promise<import('./types.js').CustomParseArgReturn<T>>}
 */
export async function parseArgs(commands, { commandList = [], defaultCommand = '', options } = {}) {
  const parsed_options = util.parseArgs({
    options: {
      help: {
        type: 'boolean',
        short: 'h',
      },
      ...options,
    },
    allowPositionals: true,
  })
  let [command, ...input] = parsed_options.positionals
  const raw_input = input.join(' ')

  function help() {
    logger.log(
      `Avaible commands:\n${Object.keys(commands)
        .concat(commandList)
        .map(e => `\n   ${e}`)
        .join('')}\n `
    )

    return 0
  }

  if (defaultCommand) command ??= defaultCommand

  commands.help ??= help
  // @ts-ignore
  if (parsed_options.values.help) {
    process.exit(await commands.help())
  }

  /**
   * If value is in executable command list
   */
  const valid = command in commands

  if (!valid && !commandList.includes(command)) {
    logger.error('Unknown command:', command)
    process.exit(await commands.help())
  }

  if (valid) {
    await commands[command]({
      args: input,
      raw_input,
    })
  }

  return {
    command,
    input,
    raw_input,

    // @ts-expect-error I love ts
    options: parsed_options.values,
  }
}
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
export async function execAsync(command, options, errorHandler) {
  /** @type {PromiseHook<number>} */
  const codeHook = new PromiseHook()
  /** @type {PromiseHook<ExecAsyncInfo>} */
  const infoHook = new PromiseHook()

  child_process
    .exec(command, options, (error, stdout, stderr) => {
      infoHook.resolve({ error, stderr, stdout })
    })
    .on('exit', code => {
      codeHook.resolve(code === null ? -1 : code)
    })

  const [code, info] = await Promise.all([codeHook, infoHook])

  const result = {
    code,
    ...info,
  }

  errorHandler.ignore ??= () => false
  if (code !== 0 && !errorHandler.ignore(info.error, info.stderr)) {
    if (info.stderr && !info.error) info.error = new Error(info.stderr)

    errorHandler.logger ??= logger
    errorHandler.logger.error('Failed to ' + errorHandler.failedTo, {
      error: info.error,
      stderr: info.stderr,
      stdout: info.stdout,
      ...(errorHandler.context ?? {}),
    })
    if (errorHandler.throws ?? true) throw new execAsync.error(result)
  }

  // @ts-ignore
  return errorHandler.fullResult ? result : result.stdout
}

/**
 * Higher-order function that returns a new function with default values
 * @template {boolean} [T=false]
 * @param {import("child_process").ExecOptions} defaults - Default options object
 * @param {Partial<ExecAsyncOptions<T>>} [errorHandlerDefaults]
 * @returns {(command: string, options: ExecAsyncOptions<T>) => ReturnType<typeof execAsync<T>>}
 */
execAsync.withDefaults =
  (defaults, errorHandlerDefaults = {}) =>
  (command, options) =>
    execAsync(command, defaults, { ...errorHandlerDefaults, ...options })

execAsync.error = class ExecAsyncError {
  /** @param {ExecAsyncInfo & { code: number }} p */
  constructor({ error, stderr, stdout, code }) {
    this.error = error
    this.stderr = stderr
    this.stdout = stdout
    this.code = code
  }
}
