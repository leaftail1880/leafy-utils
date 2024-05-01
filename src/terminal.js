import child_process from 'child_process'
import readline from 'readline'
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
    const process = child_process.spawn(command, { stdio: 'inherit', shell: true, cwd })
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
 *   code: number
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
export async function execAsync(
  command,
  options,
  { logger: Logger = logger, failedTo, context = {}, ignore = () => false, throws = true, fullResult } = {
    failedTo: 'run command',
  }
) {
  /** @type {PromiseHook<number>} */
  const codeHook = new PromiseHook()
  /** @type {PromiseHook<Omit<ExecAsyncInfo, 'code'>>} */
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

  if (code !== 0 && !ignore(info.error, info.stderr)) {
    if (throws) {
      throw new execAsync.error({ failedTo, ...result })
    } else {
      Logger.error(`Failed to ${failedTo}`, {
        ...info,
        ...context,
      })
    }
  }

  // @ts-ignore
  return fullResult ? result : result.stdout
}

/**
 * Spawns given command and resolves on command exit with exit code and successfull status
 * @param {string} command
 * @param {import('child_process').SpawnOptions} options
 * @returns {Promise<{code: number, successfull: boolean}>}
 */
export function spawnAsync(command, options) {
  return new Promise(resolve => {
    child_process.spawn(command, options).on('exit', code => {
      resolve({ code, successfull: code === 0 })
    })
  })
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

execAsync.error = class ExecAsyncError extends Error {
  /** @param {ExecAsyncInfo & { failedTo?: string }} p */
  constructor({ error, stderr, stdout, code, failedTo }) {
    super(`Failed to ${failedTo ?? error.cmd}:\n\n${stderr}${stdout ? '\n\n' + stdout : ''}`)
    this.command = error.cmd
    this.code = code
  }
}

/**
 *
 * @param {object} o - Options
 * @param {(line: string) => void | Promise<void>} o.onLine - Function that gets called for each new line
 * @param {(s: string) => void} [o.stdout] - Function that writes to stdout. Defaults to process.stdout.write
 * @param {(s: string) => void} [o.stderr] - Function that writes to stderr. Defaults to process.stderr.write
 * @param {import('./types.js').PartialPick<readline.ReadLineOptions, 'input'>} [o.options] - Extra options for the readline
 */
export function readlineWithPersistentInput({
  onLine,
  stdout = process.stdout.write.bind(process.stdout),
  stderr = process.stdout.write.bind(process.stdout),
  options,
}) {
  process.stdin.setEncoding('utf-8')

  let processingLine = false

  const rl = readline
    .createInterface({
      input: process.stdin,
      output: process.stdout,
      ...(options ?? {}),
    })
    .on('line', async line => {
      rl.prompt(true)
      processingLine = true
      try {
        await onLine(line)
      } catch (e) {}
      processingLine = false
    })

  rl.prompt(true)

  LeafyLogger.patchAll(logger => {
    logger.write.stdout = (...args) => {
      // Actually logger.write only uses 0 element from args array
      writeAndRestorePersistentInput(args[0], stdout)
    }
    logger.write.stderr = (...args) => {
      // Actually logger.write only uses 0 element from args array
      writeAndRestorePersistentInput(args[0], stderr)
    }
  })

  /**
   *
   * @param {string} text
   * @param {(s: string) => void} out
   */
  function writeAndRestorePersistentInput(text, out) {
    if (!rl) return out(text)

    // @ts-expect-error
    const rows = rl.prevRows + 1

    readline.moveCursor(process.stdout, 0, -rows)
    out('\n')
    readline.clearScreenDown(process.stdout)

    out(text)
    if (processingLine) out('\n')

    readline.moveCursor(process.stdout, 0, rows + 1)
    rl.prompt(true)
  }

  return { readline: rl, write: writeAndRestorePersistentInput, stderr, stdout }
}
