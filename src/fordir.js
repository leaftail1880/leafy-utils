import fs from "fs/promises";
import path from "path";

/**
 * @typedef {Object} dirOptions
 * @property {string} inputPath
 * @property {string} outputPath
 * @property {Record<string, ((buffer: Buffer, givenpath: string, filename: string) => fileparseReturn | Promise<fileparseReturn>)>} extensions
 * @property {boolean=} [silentMode=false]
 */

/**
 * @typedef {Object} fileparseReturn
 * @property {string|Buffer} data
 * @property {string} [filename]
 * @property {boolean} [modified=true]
 */

/**
 * @param {dirOptions} options
 */
export async function fordir(options) {
	let { silentMode, inputPath, outputPath, extensions } = options;
	inputPath = path.join(inputPath);
	outputPath = path.join(outputPath);

	/** @type {{$path: string; result: fileparseReturn}[]} */
	const writeQuene = [];

	/**
	 * Logs messages to the console.
	 * @param  {...any} messages - The messages to log.
	 * @returns
	 */
	function log(...messages) {
		if (silentMode) return;
		console.log(...messages);
	}

	/**
	 *
	 * @param {string} path
	 * @returns
	 */
	async function getFiles(path) {
		const files = await fs.readdir(path);
		log("Files on", path + ":", files);
		return files;
	}

	/**
	 *
	 * @param {string} givenpath
	 * @param {string} filename
	 * @returns
	 */
	async function workWithFile(givenpath, filename) {
		const fullpath = path.join(givenpath, filename);
		const buffer = await fs.readFile(fullpath);
		log("Working with file:", fullpath);
		const file = path.parse(fullpath);
		const ext = file.ext;
		if (!(ext in extensions)) return;

		givenpath = path.join(path.join(givenpath).replace(new RegExp(`^${inputPath}`), ""));
		const result = await extensions[ext](buffer, givenpath, filename);
		if (!("modified" in result)) result.modified = true;

		if (result.modified)
			writeQuene.push({
				$path: givenpath,
				result,
			});
	}

	/**
	 *
	 * @param {string} additionalPath
	 */
	async function workWithDir(additionalPath) {
		const files = await getFiles(additionalPath);

		for (const filename of files)
			try {
				await workWithFile(additionalPath, filename);
			} catch (e) {
				if (e.code === "EISDIR") {
					// Error code EISDIR mean that this is dir
					await workWithDir(path.join(additionalPath, filename));
				} else {
					throw e;
				}
			}
	}

	await workWithDir(inputPath);

	for (const {
		result: { data, filename },
		$path,
	} of writeQuene)
		await writeFile(data, path.join(outputPath, $path), filename);

	/**
	 *
	 * @param {Buffer | string} buffer
	 * @param {string} $path
	 * @param {string} filename
	 */
	async function writeFile(buffer, $path, filename) {
		const fullpath = path.join($path, filename);
		try {
			await fs.writeFile(fullpath, buffer);
		} catch (e) {
			if (e.code === "ENOENT") {
				await fs.mkdir($path, {
					recursive: true,
				});
				await fs.writeFile(fullpath, buffer);
			} else throw e;
		}
	}
}
