import fs from "fs";
import util from "util";

/**
 * @typedef {(...text: string[]) => string} Colorizer
 */

export class LeafyLogger {
	static colors = {
		yellow: "\x1B[33m",
		red: "\x1B[31m",
		reset: "\x1b[0m",
		cyan: "\x1B[36m",
		greenBright: "\x1B[92m",
		darkGray: "\x1B[90m",
	};
	/**
	 * @param {Colorizer | string} color
	 */
	static createLogType(color) {
		/**
		 * @param {...any} [context]
		 */
		return function (...context) {
			const msg = util.formatWithOptions({ colors: true }, ...context);
			this.writeLog({ color, consoleMessage: msg, fileMessage: msg });
		};
	}
	/**
	 * @param {{filePath?: string, prefix: string}} param0
	 */
	constructor({ filePath = "", prefix }) {
		if (filePath) {
			this.stream = fs.createWriteStream(filePath, {
				flags: "a",
				encoding: "utf-8",
			});
			this.stream.write("\n");
		}
		this.prefix = prefix;

		this.error = LeafyLogger.createLogType(LeafyLogger.colors.red);
		this.warn = LeafyLogger.createLogType(LeafyLogger.colors.yellow);
		this.info = LeafyLogger.createLogType(LeafyLogger.colors.cyan);
		this.log = this.info;
		this.success = LeafyLogger.createLogType(LeafyLogger.colors.greenBright);
	}
	/**
	 * @param {{
	 * consoleMessage?: string,
	 * fileMessage?: string,
	 * color: Colorizer | string
	 * }} message
	 */
	writeLog({ consoleMessage, fileMessage, color = LeafyLogger.colors.yellow }) {
		/** @type {Colorizer} */
		const colorize =
			typeof color === "function"
				? color
				: (...text) => color + text.join("") + LeafyLogger.colors.reset;

		if (consoleMessage)
			console.log(
				`\x1b[0m${new Date().toLocaleString([], {
					hourCycle: "h24",
					timeStyle: "medium",
				})} ${colorize(this.prefix)} ${consoleMessage}\x1b[0m`
			);

		if (fileMessage && this.stream)
			this.stream.write(
				`[${new Date().toLocaleString()}] ${fileMessage.replace(
					/\x1b\[\d+m/g,
					""
				)}\r`
			);
	}

	time(postfix = "s") {
		const start = Date.now();
		return () => `${((Date.now() - start) / 1000).toFixed(2)}${postfix}`;
	}
}
