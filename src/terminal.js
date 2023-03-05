import child_process from "child_process";
import util from "util";

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
 * Works same as console.lpg but without \n every new line
 * @param {...any} data See **util.format()** for more info
 */
export function print(...data) {
	process.stdout.write(util.format(...data));
}

/**
 * Executes common terminal command
 * @param {string} command Command to execute
 * @returns {Promise<{stderr: string; stdout: string}>}
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
	commands["--help"] ??= help;

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
