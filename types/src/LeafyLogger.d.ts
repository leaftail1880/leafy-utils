/// <reference types="node" />
/**
 * @typedef {(...text: string[]) => string} Colorizer
 */
/**
 * @typedef {keyof (typeof LeafyLogger)['levels']} LeafyLogLevel
 */
export class LeafyLogger {
    static colors: {
        yellow: string;
        red: string;
        reset: string;
        cyan: string;
        greenBright: string;
        darkGray: string;
    };
    /**
     * @satisfies {Record<string, [string, boolean?]>}
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
    static createColoredWriter(color: Colorizer | string, error?: boolean, level?: LeafyLogLevel): (this: LeafyLogger, ...context?: any[]) => void;
    static createLevels(): Record<"error" | "warn" | "info" | "log" | "success" | "debug", (this: LeafyLogger, ...context?: any[]) => void>;
    /** @deprecated Use `createColoredWriter` instead */
    static createLogWriter: typeof LeafyLogger.createColoredWriter;
    /**
     * Sets error handlers for 'uncaughtException' and 'unhandledRejection'
     * and removes handlers which were previously setup by LeafyLogger.handleGlobalExceptions
     * @param {LeafyLogger} logger - Logger which error method will be used
     */
    static handleGlobalExceptions(logger: LeafyLogger): void;
    /**
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
     * Creates new instance of the leafy logger.
     * @param {object} o - Options
     * @param {string} o.prefix - Prefix of the logs
     * @param {string} [o.filePath] - Path to log file
     */
    constructor({ prefix, filePath }: {
        prefix: string;
        filePath?: string;
    });
    prefix: string;
    error: (this: LeafyLogger, ...context?: any[]) => void;
    warn: (this: LeafyLogger, ...context?: any[]) => void;
    info: (this: LeafyLogger, ...context?: any[]) => void;
    log: (this: LeafyLogger, ...context?: any[]) => void;
    success: (this: LeafyLogger, ...context?: any[]) => void;
    debug: (this: LeafyLogger, ...context?: any[]) => void;
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
         * @type {(...args: string[]) => void}
         */
        stdout: (...args: string[]) => void;
        /**
         * Function to write to the stderr. Defaults to console.error
         * Used only if useStderr is enabled
         * Usefull to change when enabling monitoring
         * @type {(...args: string[]) => void}
         */
        stderr: (...args: string[]) => void;
        /**
         * Whenether to use stderr.
         * @default false
         */
        useStderr: boolean;
        /**
         * Hooks call to write. Replace this with your own function
         * Usefull for implementing monitorings
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
    /** @deprecated Use `write` instead */
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
         * @type {(...args: string[]) => void}
         */
        stdout: (...args: string[]) => void;
        /**
         * Function to write to the stderr. Defaults to console.error
         * Used only if useStderr is enabled
         * Usefull to change when enabling monitoring
         * @type {(...args: string[]) => void}
         */
        stderr: (...args: string[]) => void;
        /**
         * Whenether to use stderr.
         * @default false
         */
        useStderr: boolean;
        /**
         * Hooks call to write. Replace this with your own function
         * Usefull for implementing monitorings
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
    /** @deprecated Use write.fileStream instead */
    stream: fs.WriteStream;
    /**
     * Returns functon that calculates time elapsed between creating and call
     * @param {string} postfix - Postfix using after time, e.g. sec
     */
    time(postfix?: string): () => string;
}
export type Colorizer = (...text: string[]) => string;
export type LeafyLogLevel = keyof (typeof LeafyLogger)['levels'];
import fs from 'fs';
//# sourceMappingURL=LeafyLogger.d.ts.map