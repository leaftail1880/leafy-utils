import child_process, { spawn } from "child_process";
import fs from "fs";
import util from "util";

/**
 * @typedef {(...text: string[]) => string} Colorer
 */

export class LeafyLogger {
	static colors = {
		yellow: "\x1B[33m",
		red: "\x1B[31m",
		reset: "\x1b[0m",
		cyan: "\x1B[36m",
		greenBright: "\x1B[92m",
	};
	/**
	 * @param {Colorer | string} color
	 */
	static createLogType(color) {
		/**
		 * @param {...any} [context]
		 */
		return function (...context) {
			const msg = util.format(...context);
			this.writeLog({ color, consoleMessage: msg, fileMessage: msg });
		};
	}
	constructor({ filePath = "", prefix = "" }) {
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
	 * color: Colorer | string
	 * }} message
	 */
	writeLog({ consoleMessage, fileMessage, color = LeafyLogger.colors.yellow }) {
		/** @type {Colorer} */
		const colorify =
			typeof color === "function"
				? color
				: (...text) => color + text.join("") + LeafyLogger.colors.reset;

		if (consoleMessage)
			console.log(
				`\x1b[0m${new Date().toLocaleString([], {
					hourCycle: "h24",
					timeStyle: "medium",
				})} ${colorify(this.prefix)} ${consoleMessage}\x1b[0m`
			);

		if (fileMessage && this.stream)
			this.stream.write(
				`[${new Date().toLocaleString()}] ${fileMessage.replace(
					/\x1b\[\d+m/g,
					""
				)}\r`
			);
	}
}

/**
 * Ask user for input any text
 * @param {string} [text] - Text to show before input like "Count: "
 * @returns {Promise<string>}
 */
export function input(text = null) {
	if (text) print(text);
	process.stdin.resume();
	process.stdin.setEncoding("utf8");
	return new Promise((resolve) => {
		process.stdin.on("data", (chunk) => {
			process.stdin.pause();
			resolve(chunk.toString());
		});
	});
}

/**
 * Works same as console.log but without \n every new line
 * @param {...any} data See **util.format()** for more info
 */
export function print(...data) {
	process.stdout.write(util.format(...data));
}

/**
 * Executes common terminal command
 * @param {string} command Command to execute
 * @returns {Promise<{stderr: string; stdout: string}>}
 * @deprecated Use execute instead
 */
export async function exec(command) {
	return new Promise((resolve, reject) => {
		const proc = child_process.exec(command, (error, stdout, stderr) => {
			if (error) reject(error);
			else resolve({ stderr, stdout });
		});

		proc.stdout.setEncoding("utf-8");
		proc.stderr.setEncoding("utf-8");
	});
}

/**
 * Executes common terminal command
 * @param {string} command Command to execute
 * @returns {Promise<boolean>}
 * @deprecated Use execute instead
 */
export async function execWithLog(command, showLog = true) {
	const info = await exec(command);
	if (showLog) {
		if (info.stdout) console.log(info.stdout);
		if (info.stderr) console.log(info.stderr);
	}
	//                 Debugger attached and disconected
	//                 writes to stderr but this isnt error
	if (info.stderr && !info.stderr.includes("debugger")) return false;
	else return true;
}

/**
 * @param {string} command
 */
export function execute(command) {
	return new Promise((resolve, reject) => {
		const process = spawn(command, { stdio: "inherit", shell: true });
		process.on("exit", resolve);
		process.on("error", reject);
	});
}

/**
 * @deprecated Unusable, bagged and should be removed
 */
export function clearLines(count = -1) {
	process.stdout.moveCursor(0, count); // up one line
	process.stdout.clearLine(1); // from cursor to end
}

/**
 * @param {Record<string, (arg?: {args: string[]; raw_input: string}) => any>} commands Object with key -> function mapping. Note that function must return 0, otherwise process will be exited.
 */
export async function checkForArgs(
	commands,
	{ commandList = [], defaultCommand = "" } = {}
) {
	let [, , command, ...input] = process.argv;
	const raw_input = input.join(" ");

	function help() {
		console.log(
			`Avaible commands:\n${Object.keys(commands)
				.concat(commandList)
				.map((e) => `\n   ${e}`)
				.join("")}\n `
		);
		process.exit(0);
	}

	if (defaultCommand) command ??= defaultCommand;
	commands.help ??= help;
	commands["--help"] ??= commands.help;

	/**
	 * If value is in executable command list
	 */
	const isCMD = command in commands;

	if (!isCMD && !commandList.includes(command)) {
		console.log("Unknown command:", command);
		process.exit(await commands.help());
	}

	if (isCMD) {
		await commands[command]({
			args: input,
			raw_input,
		});
	}

	return { command, input, raw_input };
}
