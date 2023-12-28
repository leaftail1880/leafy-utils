import { spawn } from "child_process";
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
 * Works same as console.log but without \n every new line
 * @param {...any} data See **util.format()** for more info
 */
export function print(...data) {
	process.stdout.write(util.format(...data));
}

/**
 * @param {string} command
 * @param {string | undefined} cwd
 * @returns {Promise<number>}
 */
export function execute(command, cwd = undefined) {
	return new Promise((resolve, reject) => {
		const process = spawn(command, { stdio: "inherit", shell: true, cwd });
		process.on("exit", resolve);
		process.on("error", reject);
	});
}

/**
 * @param {Record<string, (arg?: {args: string[]; raw_input: string}) => any>} commands Object with key -> function mapping. Note that function must return 0, otherwise process will be exited.
 * @param {object} [param1={}]
 * @param {string[]} [param1.commandList=[]]
 * @param {string} [param1.defaultCommand=""]
 */
export async function parseArgs(
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
