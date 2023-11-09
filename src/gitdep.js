import child_process from "child_process";
import fs from "fs/promises";
import path from "path";
import { LeafyLogger } from "./terminal.js";

const logger = new LeafyLogger({ prefix: "gitdeps" });

/**
 * Defines git dependency config
 * ```js
 * import { defineGitDependency } from "leafy-utils";
 *
 * export default defineGitDependency({
 * 	remote: {
 * 		url: "https://github.com/Herobrine643928/Chest-UI",
 * 		branch: "main",
 * 		path: "RP",
 * 	},
 * 	dependencies: {
 * 		"ui/": "/ui/",
 * 		"textures/": "/textures/",
 * 	},
 * });
 * ```
 * @param {import("./types.js").GitDependency} config
 */
export function defineGitDependency(config) {
	return config;
}

/**
 *
 * @param {string} command
 * @param {Partial<child_process.ExecOptionsWithStringEncoding>} options
 * @returns {Promise<{stdout: string, stderr: string, error?: child_process.ExecException}>}
 */
const execAsync = (command, options) =>
	new Promise((resolve) =>
		child_process.exec(
			command,
			Object.assign({ encoding: "utf-8" }, options),
			(error, stdout, stderr) => {
				if (stderr && !error) error = new Error(stderr);
				resolve({ stderr, stdout, error });
			}
		)
	);

/**
 * Inits or updates dependencies
 * @param {object} o
 * {files: string[], mode?: "init" | "update", filesBase?: string}
 * @param {string[]} o.files List of files relative to fileBase. Each should `
 * export default defineGitDependency({...})`
 * @param {string} [o.filesBase] Base to resolve files from
 * @param {"init" | "update"} [o.mode] Mode. By default, will be init if there is init argv, otherwise update
 */
export async function SyncGitDependencies({
	files = [],
	filesBase = process.cwd(),
	mode = process.argv.find((e) => e === "init") ? "init" : "update",
}) {
	for (const file of files) {
		/** @type {import("./types.js").GitDependency} */
		const config = (await import(path.join(filesBase, file))).default;
		const remoteName = config.remote.name ?? path.parse(file).name;
		const cwd = path.dirname(file);

		/** @param {string} command */
		const exec = (command) => execAsync(command, { cwd, encoding: "utf-8" });

		if (mode === "init") {
			// Add remote
			const remoteAdd = await exec(
				`git remote add ${remoteName} ${config.remote.url} -f --no-tags -t=${config.remote.branch}`
			);

			// If exists - skip
			if (remoteAdd.stderr) {
				if (
					remoteAdd.stderr.includes(
						`error: remote ${remoteName} already exists`
					)
				) {
					logger.warn(`Remote ${remoteAdd} already exists, skipping...`);
				} else throw remoteAdd.error;
			}

			logger.success("Inited successfully");
		} else {
			// Merge refs
			const merge = await exec(
				`git merge -s ours --no-commit ${remoteName}/${config.remote.branch}`
			);
			if (
				!merge.stderr.includes("fatal: refusing to merge unrelated histories")
			) {
				logger.error("Failed to merge refs:");
				throw merge.error;
			}

			// Get git dir
			const gitDirExec = await exec("git rev-parse --show-toplevel");
			if (gitDirExec.error) throw gitDirExec.error;
			const gitDir = gitDirExec.stdout.trim();
			logger.log("Git dir:", gitDir);

			// Update files
			for (let [remote, options] of Object.entries(config.dependencies)) {
				if (typeof options === "string") options = { localPath: options };
				if (!options.file && path.parse(options.localPath).ext) {
					logger.warn(
						`Threating '${options.localPath}' as a file. Replace ${remote} dependency to { localPath: '${options.localPath}', file: true } to remove this warning`
					);
					options.file = true;
				}

				// Parse remote path relative to specified base
				const remotePath = path
					.join(config.remote.path ?? "", remote)
					.replace(/\\/g, "/");

				// Parse local path relative to specified base and remove starting /
				const local = path
					.join(config.path ?? "", options.localPath)
					.replace(/\\/g, "/")
					.replace(/^\//g, "");

				logger.info("Path:", local);

				// Define temp path
				const temp = options.file ? "&&temp&&/file" : "&&temp&&";

				const fullLocal = path.join(gitDir, local);
				const fullTemp = path.join(gitDir, temp);

				// Clear temp
				await fs.rm(fullTemp, {
					recursive: true,
					force: true,
				});

				// Get remote file(s)
				const readTree = await exec(
					`git read-tree --prefix="${temp}" -u ${remoteName}/${config.remote.branch}:${remotePath}`
				);
				if (readTree.error) throw readTree.error;

				// Restore them from stage
				const restoreStaged = await exec(`git restore --staged "${temp}"`);
				if (restoreStaged.error) throw restoreStaged.error;

				// Merge changes
				await fs.cp(fullTemp, fullLocal, { force: true, recursive: true });
				await fs.rm(fullTemp, {
					recursive: true,
					force: true,
				});
			}
		}
	}

	logger.success("Done");
}
