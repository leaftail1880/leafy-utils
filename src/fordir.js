import fs from "fs/promises";
import path from "path";

/**
 * @typedef {Object} dirOptions
 * @property {string} inputPath
 * @property {string} outputPath
 * @property {Record<string, ((buffer: Buffer, givenpath: string, filename: string) => fileparseReturn | Promise<fileparseReturn>)>} extensions
 * @property {string[]} [ignoreExtensions]
 * @property {string[]} [ignoreFolders]
 * @property {string[]} [ignoreFiles]
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

	/** @type {{finalPath: string; data: string|Buffer, fileName: string}[]} */
	const writeQuene = [];

	/**
	 * Logs messages to the console.
	 * @param  {...any} messages - The messages to log.
	 * @returns
	 */
	function log(...messages) {
		if (!silentMode) console.log(...messages);
	}

	/**
	 *
	 * @param {string} path
	 * @returns
	 */
	async function getFiles(path) {
		const files = await fs.readdir(path);
		log(" ");
		log("D:", path);
		log(files);
		log(" ");
		return files;
	}

	/**
	 * @param {string} givenpath
	 * @param {string} filename
	 * @param {string} fullpath
	 */
	async function workWithFile(givenpath, filename, fullpath) {
		const file = path.parse(fullpath);
		if (
			(!(file.ext in extensions) && !options.ignoreExtensions) ||
			options.ignoreExtensions?.includes(file.ext)
		)
			return;

		const buffer = await fs.readFile(fullpath);
		log("F:", path.join(givenpath, filename));

		const result = await extensions[file.ext](buffer, givenpath, filename);
		result.modified ??= true;

		if (result.modified)
			writeQuene.push({
				finalPath: givenpath,
				data: result.data,
				fileName: result.filename ?? filename,
			});
	}

	/**
	 *
	 * @param {string} additionalPath
	 */
	async function workWithDir(additionalPath) {
		const files = await getFiles(additionalPath);

		for (const filename of files) {
			const fullpath = path.join(additionalPath, filename);

			if ((await fs.lstat(fullpath)).isFile()) {
			  if (options.ignoreFiles?.includes(filename)) continue
				await workWithFile(
					path.join(path.join(additionalPath).replace(inputPath, "")),
					filename,
					fullpath
				);
			} else {
				if (options.ignoreFolders?.includes(filename)) continue
				await workWithDir(path.join(additionalPath, filename));
			}
		}
	}

	await workWithDir(inputPath);

	for (const { data, fileName, finalPath } of writeQuene) {
		await writeFile(data, path.join(outputPath, finalPath), fileName);
	}

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
