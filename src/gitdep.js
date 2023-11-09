import child_process from "child_process";
import { existsSync } from "fs";
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
 * @param {{ignore?: (error: child_process.ExecException, stderr: string) => boolean, failedTo: string, context?: object}} [errorHandler]
 * @returns {Promise<string>}
 */
const execAsync = (command, options, errorHandler) =>
	new Promise((resolve) =>
		child_process.exec(
			command,
			Object.assign({ encoding: "utf-8" }, options),
			(error, stdout, stderr) => {
				if (stderr && !error) error = new Error(stderr);

				if (
					errorHandler &&
					(error || stderr) &&
					!errorHandler.ignore?.(error, stderr)
				) {
					logger.error(
						"Failed to " + errorHandler.failedTo,
						errorHandler.context ?? ""
					);
					throw error;
				}
				resolve(stdout);
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
		const config = (await import("file://" + path.join(filesBase, file)))
			.default;
		const remoteName = config.remote.name ?? path.parse(file).name;
		let cwd = path.dirname(file);

		/**
		 * @param {string} command
		 * @param {Parameters<typeof execAsync>[2]} [errorHandler]
		 */
		const exec = (command, errorHandler) =>
			execAsync(command, { cwd, encoding: "utf-8" }, errorHandler);

		if (mode === "init") {
			// Add remote
			await exec(
				`git remote add ${remoteName} ${config.remote.url} -f --no-tags -t=${config.remote.branch}`,
				{
					failedTo: "Add remote",
					context: { remoteName, ...config.remote },
					ignore: (_, stderr) => {
						if (stderr.includes(`error: remote ${remoteName} already exists`)) {
							logger.warn(`Remote ${remoteName} already exists, skipping...`);
							return true;
						}
					},
				}
			);

			logger.success("Inited successfully");
		} else {
			// Merge refs
			await exec(
				`git merge -s ours --no-commit ${remoteName}/${config.remote.branch}`,
				{
					failedTo: "merge refs",
					ignore: (_, stderr) =>
						stderr.includes("fatal: refusing to merge unrelated histories"),
				}
			);

			// Get git dir
			cwd = (
				await exec("git rev-parse --show-toplevel", {
					failedTo: "get git dir",
				})
			).trim();
			logger.log("Git dir:", cwd.replace(process.cwd(), ""));

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
				const temp = "&&_git_dep_temp_&&";

				const fullLocal = path.join(cwd, local);
				const fullTemp = path.join(cwd, temp);

				async function restoreStagedTemp() {
					const changes = await exec(`git status -z -uall`, {
						failedTo: "list changed files",
					});
					if (
						!changes
							.split("\x00")
							.find((e) => e.includes("A") && e.includes(temp))
					)
						return;

					await exec(`git restore --staged "${temp}/*"`, {
						failedTo: "restore from staged",
						context: {
							changes,
							gitDir: cwd,
							files: await fs.readdir(cwd),
						},
					});
				}

				if (existsSync(fullTemp)) {
					// Restore them from stage
					await restoreStagedTemp();

					// Clear temp
					await fs.rm(fullTemp, {
						recursive: true,
						force: true,
					});
				}

				// Get remote file(s)
				await exec(
					`git read-tree --prefix="${temp}" -u ${remoteName}/${config.remote.branch}:${remotePath}`,
					{ failedTo: "Get remote files" }
				);

				// Restore them from stage
				await restoreStagedTemp();

				// Merge changes
				await fs.cp(fullTemp, fullLocal, { force: true, recursive: true });
				await fs.rm(fullTemp, {
					recursive: true,
					force: true,
				});

				// Apply changes
				await restoreStagedTemp();
			}
		}
	}

	logger.success("Everything is up to date");
}
