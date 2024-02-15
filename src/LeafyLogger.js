import fs from 'fs'
import util from 'util'

/**
 * @typedef {(...text: string[]) => string} Colorizer - Function used to colorize message
 */

/**
 * @typedef {keyof (typeof LeafyLogger)['levels']} LeafyLogLevel - Union type which describes log level (e.g. 'log', 'error', etc)
 */

/**
 * @typedef {ReturnType<(typeof LeafyLogger)['createColoredWriter']>} LeafyColoredWriter
 */

/**
 * Easy log manipulations
 */
export class LeafyLogger {
  /**
   * Defines basic colors used by logger
   */
  static colors = {
    reset: '\x1b[0m',
    red: '\x1B[31m',
    yellow: '\x1B[33m',
    cyan: '\x1B[36m',
    greenBright: '\x1B[92m',
    white: '\x1B[37m',
    darkGray: '\x1B[90m',
    bgRed: '\x1B[41m\x1B[37m',
  }

  /**
   * Defines the log levels and their corresponding colors.
   * Each log level is represented by a key-value pair, where the key is the log level name
   * (e.g., "error", "warn", "info") and the value is an array containing the color
   * and an optional boolean flag which defines whenether is log level is error or not.
   * @satisfies {Record<string, [color: string, error?: boolean]>}
   */
  static levels = {
    error: [this.colors.bgRed + this.colors.white, true],
    warn: [this.colors.yellow, true],
    info: [this.colors.cyan],
    log: [this.colors.cyan],
    success: [this.colors.greenBright],
    debug: [this.colors.yellow],
  }
  /**
   * Creates alias to this.write
   * @param {Colorizer | string} color - Color used to color prefix
   * @param {LeafyLogLevel} [level]
   */
  static createColoredWriter(color, error = false, level = 'log') {
    /**
     * Writes context to console/file using {@link LeafyLogger.write}
     * @param {any | undefined} [messages] - Messages to write
     * @this {LeafyLogger}
     */
    return function coloredWriter(...messages) {
      const message = util.formatWithOptions({ colors: true, depth: 100 }, ...messages)
      this.write({ color, consoleMessage: message, fileMessage: message, error, level })
    }
  }

  /**
   * Creates different levels of logger functions based on {@link LeafyLogger.levels}
   */
  static createLevels() {
    /** @type {Record<LeafyLogLevel, LeafyColoredWriter>} */
    // @ts-expect-error
    const levels = {}

    for (const [level, [color, error]] of Object.entries(this.levels)) {
      // @ts-expect-error
      levels[level] = this.createColoredWriter(color, error, level)
    }

    return levels
  }

  /** @deprecated Use {@link LeafyLogger.createColoredWriter createColoredWriter} instead */
  static createLogWriter = this.createColoredWriter

  /**
   * Sets error handlers for 'uncaughtException' and 'unhandledRejection'
   * and removes handlers which were previously setup by LeafyLogger.handleGlobalExceptions
   * @param {LeafyLogger} logger - Logger which error method will be used
   */
  static handleGlobalExceptions(logger) {
    if (this.handler) {
      process.off('uncaughtException', this.handler)
      process.off('unhandledRejection', this.handler)
    }

    this.handler = error => logger.error(error)
    process.on('uncaughtException', this.handler)
    process.on('unhandledRejection', this.handler)
  }

  /**
   * Handler used to handle 'uncaughtException' and 'unhandledRejection'
   * @private
   * @type {undefined | ((e: Error) => void)}
   */
  static handler

  /**
   * Function that gets called each time new logger is created
   * @param {LeafyLogger} logger
   */
  static patch(logger) {}

  /**
   * Patches all existsing loggers and subscribing to creations of new ones
   * @param {(typeof LeafyLogger)['patch']} fn
   */
  static patchAll(fn) {
    this.loggers.forEach(logger => fn(logger))
    this.patch = fn
  }

  /**
   * List of loggers
   * @type {LeafyLogger[]}
   */
  static loggers = []

  /**
   * Creates new instance of the LeafyLogger.
   * @param {object} o - Options
   * @param {string} o.prefix - Prefix of the logs
   * @param {string} [o.filePath] - Path to log file
   */
  constructor({ prefix, filePath = '' }) {
    this.write.prefix = prefix

    if (filePath) {
      this.write.file = fs.createWriteStream(filePath, {
        flags: 'a',
        encoding: 'utf-8',
      })
      this.write.file.write('\n')
    }

    const { error, warn, info, log, success, debug } = LeafyLogger.createLevels()
    this.error = error
    this.warn = warn
    this.info = info
    this.log = log
    this.success = success
    this.debug = debug

    LeafyLogger.loggers.push(this)
    LeafyLogger.patch(this)
  }

  /**
   * Function writes message to console or file
   * Object provides more write options
   */
  write = Object.assign(
    /**
     * Writes message to console or file (if provided)
     * @this {LeafyLogger}
     * @param {{
     *  consoleMessage?: string,
     *  fileMessage?: string,
     *  color?: Colorizer | string
     *  error?: boolean
     *  level?: LeafyLogLevel
     * }} message
     */
    function write({ consoleMessage, fileMessage, error = false, color = LeafyLogger.colors.yellow, level = 'log' }) {
      if (consoleMessage) {
        const reset = LeafyLogger.colors.reset
        const date = this.write.formatDate()
        const colorize = this.write.toColorize(color)
        const coloredPrefix = colorize(this.write.prefix)
        const std = error && this.write.useStderr ? this.write.stderr : this.write.stdout

        std.call(this.write, `${reset}${date} ${coloredPrefix} ${consoleMessage}${reset}`)
        this.write.hook({ message: consoleMessage, error, coloredPrefix, colorize, date, level })
      }

      if (fileMessage && this.write.file) {
        this.write.file.write(`[${this.write.formatDate(true)}] ${this.write.stripAnsi(fileMessage)}\r\n`)
      }
    },
    {
      prefix: '',

      /**
       * @type {fs.WriteStream | undefined}
       */
      file: void 0,

      /**
       * Removes ANSI color codes from string.
       * Uses {@link util.stripVTControlCharacters} if available
       * @param {string} string
       */
      stripAnsi(string) {
        if (util.stripVTControlCharacters) {
          return util.stripVTControlCharacters(string)
        } else {
          return string.replace(/\x1B/g, '\\x1B').replace(/\\x1B\[([0-9]{1,3}(;[0-9]{1,2};?)?)?[mGK]/g, '')
        }
      },

      /**
       * Returns formatted date. Defaults for new Date().toLocaleString()
       * @param {boolean} file - Whenether date is for file or not
       */
      formatDate(file = false) {
        if (file) {
          return new Date().toLocaleString()
        } else {
          return new Date().toLocaleString([], {
            hourCycle: 'h24',
            timeStyle: 'medium',
          })
        }
      },

      /**
       * Converts colorizer function or color string into colorizer function
       * Usefull for extending default behaivor
       * @param {string | Colorizer} color
       * @returns {Colorizer}
       */
      toColorize(color) {
        return typeof color === 'function' ? color : (...text) => color + text.join('') + LeafyLogger.colors.reset
      },

      /**
       * Function to write to the stdout. Defaults to console.log
       * Usefull to change when enabling monitoring
       * @type {(message: string) => void}
       */
      stdout: console.log.bind(console),

      /**
       * Function to write to the stderr. Defaults to console.error
       * Used only if useStderr is enabled
       * Usefull to change when enabling monitoring
       * @type {(message: string) => void}
       */
      stderr: console.error.bind(console),

      /**
       * Whenether to use stderr.
       * @default false
       */
      useStderr: false,

      /**
       * Replace this with your own function, it will be called
       * each time any log level is used. Usefull for implementing monitorings.
       * @param {{
       *   message: string,
       *   colorize: Colorizer
       *   coloredPrefix: string,
       *   date: string,
       *   error: boolean,
       *   level: string,
       * }} arg
       */
      hook(arg) {},
    }
  )

  /**
   * Returns closure that calculates the time elapsed since the function was called and
   * appends a given postfix to the string value returned.
   * @param {string} postfix - The `postfix` parameter is a string that will be appended to the time value.
   * It is optional and defaults to 's' if not provided.
   */
  time(postfix = 's') {
    const start = Date.now()
    return () => `${((Date.now() - start) / 1000).toFixed(2)}${postfix}`
  }

  /** @deprecated Use {@link LeafyLogger.prototype.write write} instead */
  writeLog = this.write

  /** @deprecated Use {@link LeafyLogger.prototype.write.file write.file} instead */
  stream = this.write.file

  /** @deprecated Use {@link LeafyLogger.prototype.write.prefix write.prefix} instead */
  get prefix() {
    return this.write.prefix
  }

  /** @deprecated Use {@link LeafyLogger.prototype.write.prefix write.prefix} instead */
  set prefix(prefix) {
    this.write.prefix = prefix
  }
}
