import { PackageJSON } from "./package.js";
import { execWithLog } from "./terminal.js";

const pack_package = new PackageJSON();

/**
 * @typedef {object} CommitArgument
 * @property {[number, number, number]} version
 * @property {[number, number, number]} prev_version
 * @property {import("./types.js").Package} package
 * @property {string} message
 * @property {string} type
 * @property {string} info
 */

export const Commiter = {
	/**
	 * Runs this structure:
	 *
	 * ```shell
	 * scripts.precommit
	 * git commit -a
	 * scripts.postcommit
	 * ```
	 */
	async commit({ type = "fix", info = "" } = {}) {
		await pack_package.init();

		const raw = pack_package.data.version?.split(".")?.map(Number) ?? [0, 0, 0];
		/** @type {[number, number, number]} */
		const version = [raw[0], raw[1], raw[2]];

		const t = this;
		async function updateVersion(level = 0, prefix = null) {
			/** @type {[number, number, number]} */
			const prev_version = [version[0], version[1], version[2]];

			for (let i = 0; i < version.length; i++) {
				if (i > level) version[i] = 0;
			}
			version[level]++;
			const strVersion = version.join(".");
			pack_package.data.version = strVersion;

			let message = strVersion;
			if (prefix) message = `${prefix}: ${message}`;
			if (info) message += ` ${info}`;

			/** @type {CommitArgument} */
			const arg_obj = {
				version,
				message,
				type,
				info,
				prev_version,
				package: pack_package.data,
			};
			const arg = JSON.stringify(arg_obj);

			await t.runPackageScript("precommit", arg);
			// We need to save package before it will be commited
			await pack_package.save();
			await execWithLog(`git commit -a --message="${message}"`);
			await t.runPackageScript("postcommit", arg);
		}

		const actions = {
			release: () => updateVersion(0, "Release"),
			update: () => updateVersion(1, "Update"),
			fix: () => updateVersion(2),
		};

		await actions[type]();
	},

	/**
	 * Runs this structure:
	 * ```shell
	 * scripts.preadd
	 * git add ./
	 *   scripts.precommit
	 *   git commit -a
	 *   scripts.postcommit
	 * git push
	 * ```
	 *
	 */
	async add_commit_push({ type = "fix", info = "" } = {}) {
		await pack_package.init();
		await this.runPackageScript("preadd");

		await execWithLog("git add ./");
		await this.commit({ type, info });
		await execWithLog("git push");
	},
	/**
	 * Runs this structure:
	 * ```shell
	 * scripts.build
	 *   scripts.preadd
	 *   git add ./
	 *     scripts.precommit
	 *     git commit -a
	 *     scripts.postcommit
	 *   git push
	 * ```
	 *
	 */
	async build() {
		await pack_package.init();

		if ("build" in pack_package.data.scripts) {
			console.log("Building...");
			const date = Date.now();
			const success = await execWithLog(pack_package.data.scripts.build);
			if (!success) return false;
			console.log(
				"Building done in",
				((Date.now() - date) / 1000).toFixed(2),
				"sec"
			);
		}
	},
	/**
	 * Runs script from package.json
	 * @param {string} scriptName Script to run
	 * @param {string} args Additional argument to script
	 */
	runPackageScript(scriptName, args = "", log = true) {
		const scripts = pack_package.data?.scripts;
		if (typeof scripts !== "object" || !(scriptName in scripts)) return;

		return execWithLog(`${scripts[scriptName]} ${args}`, log);
	},
};
