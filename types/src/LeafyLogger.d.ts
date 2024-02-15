/// <reference types="node" />
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
    static colors: {
        reset: string;
        red: string;
        yellow: string;
        cyan: string;
        greenBright: string;
        white: string;
        darkGray: string;
        bgRed: string;
    };
    /**
     * Defines the log levels and their corresponding colors.
     * Each log level is represented by a key-value pair, where the key is the log level name
     * (e.g., "error", "warn", "info") and the value is an array containing the color
     * and an optional boolean flag which defines whenether is log level is error or not.
     * @satisfies {Record<string, [color: string, error?: boolean]>}
     */
    static levels: {
        error: [string, true];
        warn: [string, true];
        info: [string];
        log: [string];
        success: [string];
        debug: [string];
    };
    /**
     * Creates alias to this.write
     * @param {Colorizer | string} color - Color used to color prefix
     * @param {LeafyLogLevel} [level]
     */
    static createColoredWriter(color: Colorizer | string, error?: boolean, level?: LeafyLogLevel): (this: LeafyLogger, ...messages?: any | undefined) => void;
    /**
     * Creates different levels of logger functions based on {@link LeafyLogger.levels}
     */
    static createLevels(): Record<"error" | "warn" | "info" | "log" | "success" | "debug", (this: LeafyLogger, ...messages?: any | undefined) => void>;
    /** @deprecated Use {@link LeafyLogger.createColoredWriter createColoredWriter} instead */
    static createLogWriter: typeof LeafyLogger.createColoredWriter;
    /**
     * Sets error handlers for 'uncaughtException' and 'unhandledRejection'
     * and removes handlers which were previously setup by LeafyLogger.handleGlobalExceptions
     * @param {LeafyLogger} logger - Logger which error method will be used
     */
    static handleGlobalExceptions(logger: LeafyLogger): void;
    /**
     * Handler used to handle 'uncaughtException' and 'unhandledRejection'
     * @private
     * @type {undefined | ((e: Error) => void)}
     */
    private static handler;
    /**
     * Function that gets called each time new logger is created
     * @param {LeafyLogger} logger
     */
    static patch(logger: LeafyLogger): void;
    /**
     * Patches all existsing loggers and subscribing to creations of new ones
     * @param {(typeof LeafyLogger)['patch']} fn
     */
    static patchAll(fn: (typeof LeafyLogger)['patch']): void;
    /**
     * List of loggers
     * @type {LeafyLogger[]}
     */
    static loggers: LeafyLogger[];
    /**
     * Creates new instance of the LeafyLogger.
     * @param {object} o - Options
     * @param {string} o.prefix - Prefix of the logs
     * @param {string} [o.filePath] - Path to log file
     */
    constructor({ prefix, filePath }: {
        prefix: string;
        filePath?: string;
    });
    error: (this: LeafyLogger, ...messages?: any | undefined) => void;
    warn: (this: LeafyLogger, ...messages?: any | undefined) => void;
    info: (this: LeafyLogger, ...messages?: any | undefined) => void;
    log: (this: LeafyLogger, ...messages?: any | undefined) => void;
    success: (this: LeafyLogger, ...messages?: any | undefined) => void;
    debug: (this: LeafyLogger, ...messages?: any | undefined) => void;
    /**
     * Function writes message to console or file
     * Object provides more write options
     */
    write: ((this: LeafyLogger, { consoleMessage, fileMessage, error, color, level }: {
        consoleMessage?: string;
        fileMessage?: string;
        color?: Colorizer | string;
        error?: boolean;
        level?: LeafyLogLevel;
    }) => void) & {
        prefix: string;
        /**
         * @type {fs.WriteStream | undefined}
         */
        file: fs.WriteStream | undefined;
        /**
         * Removes ANSI color codes from string.
         * Uses {@link util.stripVTControlCharacters} if available
         * @param {string} string
         */
        stripAnsi(string: string): string;
        /**
         * Returns formatted date. Defaults for new Date().toLocaleString()
         * @param {boolean} file - Whenether date is for file or not
         */
        formatDate(file?: boolean): string;
        /**
         * Converts colorizer function or color string into colorizer function
         * Usefull for extending default behaivor
         * @param {string | Colorizer} color
         * @returns {Colorizer}
         */
        toColorize(color: string | Colorizer): Colorizer;
        /**
         * Function to write to the stdout. Defaults to console.log
         * Usefull to change when enabling monitoring
         * @type {(message: string) => void}
         */
        stdout: (message: string) => void;
        /**
         * Function to write to the stderr. Defaults to console.error
         * Used only if useStderr is enabled
         * Usefull to change when enabling monitoring
         * @type {(message: string) => void}
         */
        stderr: (message: string) => void;
        /**
         * Whenether to use stderr.
         * @default false
         */
        useStderr: boolean;
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
        hook(arg: {
            message: string;
            colorize: Colorizer;
            coloredPrefix: string;
            date: string;
            error: boolean;
            level: string;
        }): void;
    };
    /**
     * Returns closure that calculates the time elapsed since the function was called and
     * appends a given postfix to the string value returned.
     * @param {string} postfix - The `postfix` parameter is a string that will be appended to the time value.
     * It is optional and defaults to 's' if not provided.
     */
    time(postfix?: string): () => string;
    /** @deprecated Use {@link LeafyLogger.prototype.write write} instead */
    writeLog: ((this: LeafyLogger, { consoleMessage, fileMessage, error, color, level }: {
        consoleMessage?: string;
        fileMessage?: string;
        color?: Colorizer | string;
        error?: boolean;
        level?: LeafyLogLevel;
    }) => void) & {
        prefix: string;
        /**
         * @type {fs.WriteStream | undefined}
         */
        file: fs.WriteStream | undefined;
        /**
         * Removes ANSI color codes from string.
         * Uses {@link util.stripVTControlCharacters} if available
         * @param {string} string
         */
        stripAnsi(string: string): string;
        /**
         * Returns formatted date. Defaults for new Date().toLocaleString()
         * @param {boolean} file - Whenether date is for file or not
         */
        formatDate(file?: boolean): string;
        /**
         * Converts colorizer function or color string into colorizer function
         * Usefull for extending default behaivor
         * @param {string | Colorizer} color
         * @returns {Colorizer}
         */
        toColorize(color: string | Colorizer): Colorizer;
        /**
         * Function to write to the stdout. Defaults to console.log
         * Usefull to change when enabling monitoring
         * @type {(message: string) => void}
         */
        stdout: (message: string) => void;
        /**
         * Function to write to the stderr. Defaults to console.error
         * Used only if useStderr is enabled
         * Usefull to change when enabling monitoring
         * @type {(message: string) => void}
         */
        stderr: (message: string) => void;
        /**
         * Whenether to use stderr.
         * @default false
         */
        useStderr: boolean;
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
        hook(arg: {
            message: string;
            colorize: Colorizer;
            coloredPrefix: string;
            date: string;
            error: boolean;
            level: string;
        }): void;
    };
    /** @deprecated Use {@link LeafyLogger.prototype.write.file write.file} instead */
    stream: fs.WriteStream;
    /** @deprecated Use {@link LeafyLogger.prototype.write.prefix write.prefix} instead */
    set prefix(prefix: string);
    /** @deprecated Use {@link LeafyLogger.prototype.write.prefix write.prefix} instead */
    get prefix(): string;
}
/**
 * - Function used to colorize message
 */
export type Colorizer = (...text: string[]) => string;
/**
 * - Union type which describes log level (e.g. 'log', 'error', etc)
 */
export type LeafyLogLevel = keyof (typeof LeafyLogger)['levels'];
export type LeafyColoredWriter = ReturnType<(typeof LeafyLogger)['createColoredWriter']>;
import fs from 'fs';
//# sourceMappingURL=LeafyLogger.d.ts.map