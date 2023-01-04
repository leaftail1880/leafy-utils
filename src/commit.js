import { EventEmitter } from "events";
import { PackageJSON } from "./package.js";
import { exec } from "./terminal.js";

/**
 * @typedef {Object} callback
 * @property {[number, number, number]} version
 * @property {string} message
 * @property {string} type
 * @property {string} suffix
 */

/** @type {CustomEmitter<{before_commit: callback; after_commit: callback; commit: any}>} */
export const commiter = new EventEmitter({ captureRejections: true });

commiter.on("commit", async () => {
	const argv = process.argv[2] ?? "fix";
	const match = argv.match(/^(.+)-?(.+)?$/);
	if (!match) {
		console.error(`Argv (${argv}) doesnt matches (.+)-?(.+)? pattern`);
		process.exit(1);
	}
	const [_, type, suffix] = match;

	const actions = {
		release() {
			updateVersion(0, "Release");
		},
		update() {
			updateVersion(1, "Update");
		},
		fix() {
			updateVersion(2);
		},
	};

	if (!(type in actions)) {
		console.error(`Type (${type}) must be one of this:\n ${Object.keys(actions).join("\n ")}`);
		process.exit(1);
	}

	const pack = new PackageJSON();
	await pack.read();
	const pack_data = pack.data;

	/** @type {[number, number, number]} */
	// @ts-expect-error
	const version = pack_data.version?.split(".")?.map(Number) ?? [0, 0, 0];

	async function updateVersion(level = 0, prefix = null) {
		version[level]++;
		const strVersion = version.join(".");
		pack_data.version = strVersion;

		let message = strVersion;
		if (prefix) message = `${prefix}: ${message}`;
		if (suffix) message += suffix;

		commiter.emit("before_commit", { version, message, type, suffix });
		await exec(`git commit -a --message="${message}"`);
		commiter.emit("after_commit", { version, message, type, suffix });
	}

	actions[argv]();

	pack.end();
});
