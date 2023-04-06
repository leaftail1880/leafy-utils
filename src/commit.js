import { PackageJSON } from "./package.js";
import { checkForArgs, execWithLog } from "./terminal.js";

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
	 * Replace this function if you want to do something before commit
	 * @param {CommitArgument} arg
	 */
	async precommit(arg) {},
	/**
	 * Replace this function if you want to do something after commit
	 * @param {CommitArgument} arg
	 */
	async postcommit(arg) {},
	/**
	 * Runs this structure:
	 *
	 * ```shell
	 * this.precommit
	 * git commit -a
	 * this.postcommit
	 * ```
	 * @readonly
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

			await t.precommit(arg_obj);
			// We need to save package before it will be commited
			await pack_package.save();
			await execWithLog(`git commit -a --message="${message}"`);
			await t.postcommit(arg_obj);
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
	 *   this.precommit
	 *   git commit -a
	 *   thus.postcommit
	 * git push
	 * ```
	 * @readonly
	 */
	async add_commit_push({ type = "fix", info = "" } = {}) {
		await pack_package.init();

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
	 *     this.precommit
	 *     git commit -a
	 *     this.postcommit
	 *   git push
	 * ```
	 * @readonly
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
	 * @param {string[]} args Args to add
	 * @readonly
	 */
	runPackageScript(scriptName, args = [], log = true) {
		const scripts = pack_package.data?.scripts;
		if (typeof scripts !== "object" || !(scriptName in scripts)) return false;

		const script = scripts[scriptName];
		const arg = args.map((e) => (e.includes(" ") ? `"${e}"` : e)).join(" ");

		return execWithLog(`${script} ${arg ? arg : ""}`, log);
	},
	async checkForCommitArgs(helpText = "Commits dir where it was called.") {
		const commandList = ["fix", "update", "release"];
		const parsed = await checkForArgs(
			{
				help() {
					console.log(
						`${helpText}

Usage:

  [option?] [info?]

Options:
  
  fix - Default commit (0.0.0 -> 0.0.1 [info])

  update - Run this if you adding something new. (0.0.0 -> Update: 0.1.0 [info])

  release - Run this on breaking changes. (0.0.0 -> Release: 1.0.0 [info])

  package - Prints current package.json and exites.

  --help | help - Prints this and exites.

`
					);
					process.exit();
				},
				async package() {
					await pack_package.init();
					console.log(pack_package.data);
					process.exit(0);
				},
			},
			{ commandList, defaultCommand: "fix" }
		);

		return { type: parsed.command, info: parsed.raw_input };
	},
	pack_package,
};
