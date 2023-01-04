import { EventEmitter } from "events";
import { PackageJSON } from "./package.js";
import { exec } from "./terminal.js";

/**
 * @typedef {Object} callback
 * @property {[number, number, number]} version
 * @property {[number, number, number]} prev_version
 * @property {string} message
 * @property {string} type
 * @property {string} suffix
 */

/** @type {import("./declarations.js").CustomEmitter<{before_commit: callback; after_commit: callback; commit: {silentMode: boolean}}>} */
export const commiter = new EventEmitter({ captureRejections: true });

commiter.on("commit", async ({ silentMode }) => {
	const argv = process.argv[2] ?? "fix";
	const match = argv.match(/^(.+)-?(.+)?$/);
	if (!match) {
		console.error(`Argv (${argv}) doesn't matches (.+)-?(.+)? pattern`);
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
		/** @type {[number, number, number]} */
		const prev_version = [version[0], version[1], version[2]];

		for (let i = 0; i < version.length; i++) {
			if (i > level) version[i] = 0;
		}
		version[level]++;
		const strVersion = version.join(".");
		pack_data.version = strVersion;

		let message = strVersion;
		if (prefix) message = `${prefix}: ${message}`;
		if (suffix) message += `-${suffix}`;

		commiter.emit("before_commit", { version, message, type, suffix, prev_version });

		const result = await exec(`git commit -a --message="${message}"`);
		if (!silentMode) {
			if (result.stderr) console.error(result.stderr);
			console.log(result.stdout);
		}

		commiter.emit("after_commit", { version, message, type, suffix, prev_version });
	}

	actions[argv]();

	pack.end();
});
