import { exec } from "child_process";
import path from "path";
import util from "util";
import { LeafyLogger } from "./LeafyLogger.js";
import { PackageJSON } from "./package.js";
import { execute, parseArgs } from "./terminal.js";
import { addQuotes } from "./utils.js";

/**
 * @typedef {{type?: 'fix' | 'update' | "release"; info?: string }} CommitMeta
 */

/**
 * @typedef {object} CommitHookArgument
 * @property {[number, number, number]} version
 * @property {[number, number, number]} prev_version
 * @property {import("./types.js").Package} package
 * @property {string} message
 * @property {string} type
 * @property {string} info
 */

export class CommitManager {
	/**
	 * Returns array of relative pathes for each edited module
	 */
	static async getEditedSubmodules() {
		const [submodulesRaw, statusRaw] = await Promise.all([
			util.promisify(exec)("git submodule status"),
			util.promisify(exec)("git status --porcelain"),
		]);

		// In format <commit hash> path <another info>
		const submodules = submodulesRaw.stdout
			.split("\n")
			.map((e) => e.trim().split(" ")[1])
			.filter(Boolean);

		// In format <mode> path
		const status = statusRaw.stdout.split("\n");

		return submodules.filter((e) => status.find((s) => s.includes(e)));
	}
	/**
	 * Returns argument for git pathspec which excludes provided pathes
	 * @param {string[]} pathes
	 */
	static exceptFor(pathes) {
		return `-- ${pathes.map((e) => addQuotes(`:!${e}`)).join(" ")}`;
	}
	logger = new LeafyLogger({ prefix: "commit" });
	/**
	 * @param {undefined | string} cwd
	 */
	constructor(cwd) {
		this.package = new PackageJSON(
			cwd ? path.join(cwd, "package.json") : undefined
		);
		/** @type {(s: string) => Promise<number>} */
		this.execute = (command) => execute(command, cwd);
	}
	/**
	 * Replace this function if you want to do something before commit
	 * @param {CommitHookArgument} arg
	 */
	async precommit(arg) {}
	/**
	 * Replace this function if you want to do something after commit
	 * @param {CommitHookArgument} arg
	 */
	async postcommit(arg) {}
	/**
	 * Runs this structure:
	 *
	 * ```shell
	 * git add ./
	 * precommit
	 * git commit -a
	 * postcommit
	 * ```
	 * @param {CommitMeta & {add?: string, config?: Record<CommitMeta['type'],[number, string]>}} p
	 */
	async commit({
		type = "fix",
		info = "",
		add = "./",
		config = {
			release: [0, "Release"],
			update: [1, "Update"],
			fix: [2, ""],
		},
	} = {}) {
		await this.package.init();

		const rawVersion = this.package.content.version
			?.split(".")
			?.map(Number) ?? [0, 0, 0];

		/**
		 * @type {[number, number, number]}
		 */
		const version = [rawVersion[0], rawVersion[1], rawVersion[2]];
		const [level, prefix] = config[type];

		/**
		 * @type {[number, number, number]}
		 */
		const prev_version = [version[0], version[1], version[2]];

		for (let i = 0; i < version.length; i++) {
			if (i === level) version[i]++;
			if (i > level) version[i] = 0;
		}

		const strVersion = version.join(".");
		this.package.content.version = strVersion;

		let message = strVersion;
		if (prefix) message = `${prefix}: ${message}`;
		if (info) message += ` ${info}`;

		/** @type {CommitHookArgument} */
		const args = {
			version,
			message,
			type,
			info,
			prev_version,
			package: this.package.content,
		};

		await this.precommit(args);

		// We need to save package before it will be added
		await this.package.save();
		await this.execute("git add " + add);
		await this.execute(`git commit -a --message="${message}"`);
		await this.postcommit(args);
		await this.execute("git push");
	}
	/**
	 * Runs package.json's scripts build field
	 */
	async build() {
		await this.package.init();

		if ("build" in (this.package.content.scripts ?? {})) {
			this.logger.log("Building...");
			const time = this.logger.time();
			await this.execute(this.package.content.scripts.build);
			this.logger.success("Done in", time());
		}
	}
	/**
	 * Runs script from package.json
	 * @param {string} scriptName Script to run
	 * @param {string[]} args Args to add
	 */
	async runPackageScript(scriptName, args = []) {
		await this.package.init();
		const scripts = this.package.content?.scripts;
		if (!scripts || typeof scripts !== "object" || !(scriptName in scripts))
			return false;

		const script = scripts[scriptName];
		const arg = args.map((e) => (e.includes(" ") ? `"${e}"` : e)).join(" ");

		await execute(`${script} ${arg ? arg : ""}`);
		return true;
	}
	/**
	 * @returns  {Promise<CommitMeta>}
	 */
	async parseArgs(helpText = "Commits dir where it was called.") {
		const commandList = ["fix", "update", "release"];
		const commiter = this;
		const parsed = await parseArgs(
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
					await commiter.package.init();
					console.log(commiter.package.content);
					process.exit(0);
				},
			},
			{ commandList, defaultCommand: "fix" }
		);

		return {
			// @ts-ignore
			type: parsed.command,
			info: parsed.raw_input,
		};
	}
}

export const Committer = new CommitManager(void 0);
