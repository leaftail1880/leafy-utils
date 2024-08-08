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
 * 		"ui/": "./ui/",
 * 		"textures/": "./textures/",
 * 	},
 * });
 * ```
 * @param {import("./types.js").GitDependency} config
 */
export function defineGitDependency(config: import("./types.js").GitDependency): Promise<void>;
export const gitDepsLogger: LeafyLogger;
/** @deprecated Create logger manually, or use gitDepsLogger explicy */
export const logger: LeafyLogger;
import { LeafyLogger } from './LeafyLogger.js';
//# sourceMappingURL=gitdep.d.ts.map