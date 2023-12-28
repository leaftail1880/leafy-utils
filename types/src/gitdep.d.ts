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
export function defineGitDependency(config: import("./types.js").GitDependency): import("./types.js").GitDependency;
/**
 * Inits or updates dependencies
 * @param {object} o
 * {files: string[], mode?: "init" | "update", filesBase?: string}
 * @param {string[]} o.files List of files relative to fileBase. Each should `
 * export default defineGitDependency({...})`
 * @param {string} [o.filesBase] Base to resolve files from
 * @param {"init" | "update"} [o.mode] Mode. By default, will be init if there is init argv, otherwise update
 */
export function SyncGitDependencies({ files, filesBase, mode, }: {
    files: string[];
    filesBase?: string;
    mode?: "init" | "update";
}): Promise<void>;
export const logger: LeafyLogger;
import { LeafyLogger } from './LeafyLogger.js';
//# sourceMappingURL=gitdep.d.ts.map