import { PackageJSON } from "./package.js";
import { execWithLog } from "./terminal.js";

const pack_package = new PackageJSON();

/**
 * @typedef {object} callback
 * @property {[number, number, number]} version
 * @property {[number, number, number]} prev_version
 * @property {import("./types.js").Package} package
 * @property {string} message
 * @property {string} type
 * @property {string} suffix
 */

export const Commiter = {
	/**
	 * Emits specified event
	 * @param {keyof typeof events} event_name
	 * @param {callback} arg
	 */
	async emit(event_name, arg) {
		for (const EventCallback of events[event_name]) {
			await EventCallback(arg);
		}
	},
	/**
	 * Subscribes to specified event
	 * @param {keyof typeof events} event_name
	 * @param {(arg: callback) => any} callback
	 */
	subscribe(event_name, callback) {
		events[event_name].push(callback);
	},

	/**
	 * Runs this structure:
	 *
	 * ```shell
	 * before_commit
	 * git commit -a
	 * after_commit
	 * ```
	 */
	async commit({ silentMode = false, arg = "fix" } = {}) {
		const match = arg.match(/^(.+)-?(.+)?$/);
		if (!match) {
			console.error(`Arg (${arg}) doesn't matches (type)-?(additional commit info)? pattern`);
			process.exit(1);
		}
		const [_, type, suffix] = match;

		const actions = {
			release: () => updateVersion(0, "Release"),
			update: () => updateVersion(1, "Update"),
			fix: () => updateVersion(2),
		};
		actions["r"] = actions.release;
		actions["u"] = actions.update;
		actions["f"] = actions.fix;

		if (!(type in actions)) {
			console.error(`Type (${type}) must be one of this:\n ${Object.keys(actions).join("\n ")}`);
			process.exit(1);
		}

		await pack_package.init();

		/** @type {[number, number, number]} */
		// @ts-expect-error
		const version = pack_package.data.version?.split(".")?.map(Number) ?? [0, 0, 0];

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
			if (suffix) message += `-${suffix}`;

			await t.emit("before_commit", { version, message, type, suffix, prev_version, package: pack_package.data });
			await execWithLog(`git commit -a --message="${message}"`, !silentMode);
			await t.emit("after_commit", { version, message, type, suffix, prev_version, package: pack_package.data });
		}

		// We need to save package before it will be commited
		this.subscribe("before_commit", () => pack_package.save());
		await actions[arg]();
	},

	/**
	 * Runs this structure:
	 * ```shell
	 * git add ./
	 *   before_commit
	 *   git commit -a
	 *   after_commit
	 * git push
	 * ```
	 *
	 */
	async add_commit_push({ silentMode = false, arg = "fix", searchCommitScript = false } = {}) {
		await pack_package.init();

		const external_script = pack_package.data?.scripts?.commit;
		if (external_script && searchCommitScript) {
			console.log('Running external script (package.json["scripts"]["commit])...');
			console.log(external_script);
			const result = await execWithLog(`${external_script}${arg !== "fix" ? ` ${arg}` : ""}`);
			process.exit(result ? 0 : 1);
		}

		await execWithLog("git add ./", !silentMode);
		await this.commit({ silentMode, arg });
		await execWithLog("git push", !silentMode);
		return 0;
	},
	/**
	 * Runs this structure:
	 * ```shell
	 * pre_publish
	 * package.json["scripts"]["build"]
	 *   git add ./
	 *     before_commit
	 *     git commit -a
	 *     after_commit
	 *   git push
	 * ```
	 *
	 */
	async publish({ silentMode = false, arg = "fix", searchCommitScript = false } = {}) {
		await pack_package.init();

		if ("build" in pack_package.data.scripts) {
			console.log("Building...");
			const date = Date.now();
			const success = await execWithLog(pack_package.data.scripts.build);
			if (!success) return false;
			console.log("Building done in", (Date.now() - date / 60).toFixed(2), "sec");
		}

		return await this.add_commit_push({ silentMode, arg, searchCommitScript });
	},
};

const events = {
	pre_publish: [],
	before_commit: [],
	after_commit: [],
};
