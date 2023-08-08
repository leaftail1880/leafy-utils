import { PackageJSON } from "./package.js";
import { checkForArgs, execWithLog, runs } from "./terminal.js";

const PACKAGE = new PackageJSON();

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
		await PACKAGE.init();

		const rawVersion = PACKAGE.data.version?.split(".")?.map(Number) ?? [
			0, 0, 0,
		];

		/**
		 * @type {[number, number, number]}
		 */
		const version = [rawVersion[0], rawVersion[1], rawVersion[2]];
		const actions = {
			release: () => updateVersion(0, "Release"),
			update: () => updateVersion(1, "Update"),
			fix: () => updateVersion(2),
		};

		await actions[type]();

		async function updateVersion(level = 0, prefix = null) {
			/**
			 * @type {[number, number, number]}
			 */
			const prev_version = [version[0], version[1], version[2]];

			for (let i = 0; i < version.length; i++) {
				if (i === level) version[i]++;
				if (i > level) version[i] = 0;
			}

			const strVersion = version.join(".");
			PACKAGE.data.version = strVersion;

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
				package: PACKAGE.data,
			};

			await Commiter.precommit(arg_obj);
			// We need to save package before it will be commited
			await PACKAGE.save();
			await runs(`git`, ["commit", "-a", '--message="${message}"']);
			await Commiter.postcommit(arg_obj);
		}
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
		await PACKAGE.init();

		await runs("git", ["add", "./"]);
		await this.commit({ type, info });
		await runs("git", ["push"]);
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
		await PACKAGE.init();

		if ("build" in (PACKAGE.data.scripts ?? {})) {
			console.log("Building...");
			const start = Date.now();
			await execWithLog(PACKAGE.data.scripts.build);
			console.log("Done in", ((Date.now() - start) / 1000).toFixed(2), "sec");
		}
	},
	/**
	 * Runs script from package.json
	 * @param {string} scriptName Script to run
	 * @param {string[]} args Args to add
	 * @readonly
	 */
	async runPackageScript(scriptName, args = [], log = true) {
		await PACKAGE.init();
		const scripts = PACKAGE.data?.scripts;
		if (!scripts || typeof scripts !== "object" || !(scriptName in scripts))
			return false;

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
					await PACKAGE.init();
					console.log(PACKAGE.data);
					process.exit(0);
				},
			},
			{ commandList, defaultCommand: "fix" }
		);

		return { type: parsed.command, info: parsed.raw_input };
	},
	package: PACKAGE,
};
