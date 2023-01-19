import fs from "fs/promises";
import { TypedBind } from "./utils.js";

export class PackageJSON {
	/** @private */
	PACKAGE_PATH = "";

	/** @private */
	DATA = null;

	/** @private */
	MODIFIED = false;

	/**
	 * @param {string} pathToPackage
	 */
	constructor(pathToPackage = "./package.json") {
		this.PACKAGE_PATH = pathToPackage;
	}

	/**
	 * Returns a proxy for data, which sets modified on modify
	 * @returns {import("./types.js").Package} A proxy object.
	 */
	get data() {
		const checkModify = (status = true) => {
			if (status) this.MODIFIED = true;
			return status;
		};

		return new Proxy(this.DATA, {
			set(target, p, newValue, reciever) {
				// New value is same as previous, do nothing
				if (Reflect.get(target, p) == newValue) return true;

				return checkModify(Reflect.set(target, p, newValue, reciever));
			},
			deleteProperty(target, p) {
				return checkModify(Reflect.deleteProperty(target, p));
			},
			defineProperty(target, p, a) {
				return checkModify(Reflect.defineProperty(target, p, a));
			},
		});
	}

	/**
	 * It reads the package.json file, parses it into a JSON object and saves to local var. To get it, use this.data
	 */
	async read() {
		this.DATA = JSON.parse((await fs.readFile(this.PACKAGE_PATH)).toString());
	}

	/**
	 * Reads data if it not initialized
	 */
	init() {
		if (!this.DATA) return this.read();
	}

	/**
	 * It writes the internal saved data to the package.json file
	 * @returns The return value of fs.writeFile()
	 */
	write() {
		return fs.writeFile(
			this.PACKAGE_PATH,
			JSON.stringify(this.DATA, null, "  ")
				// LF string end is bad for git, replacing it to CRLF
				.replace(/\n/g, "\r")
		);
	}

	/**
	 * Use it instead of
	 * ```js
	 * this.read();
	 * this.data.val = 1;
	 * this.save();
	 * ```
	 * @returns
	 */
	work() {
		return { data: this.DATA, save: TypedBind(this.save, this) };
	}

	/**
	 * If the file has been modified, write the changes to the file
	 * @returns promise that resolves after writing file
	 */
	save() {
		if (this.MODIFIED) return this.write();
	}
}
