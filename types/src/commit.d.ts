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
    static getEditedSubmodules(): Promise<string[]>;
    /**
     * Returns argument for git pathspec which excludes provided pathes
     * @param {string[]} pathes
     */
    static exceptFor(pathes: string[]): string;
    /**
     * @param {undefined | string} cwd
     */
    constructor(cwd: undefined | string);
    logger: LeafyLogger;
    package: PackageJSON;
    /** @type {(s: string) => Promise<number>} */
    execute: (s: string) => Promise<number>;
    /**
     * Replace this function if you want to do something before commit
     * @param {CommitHookArgument} arg
     */
    precommit(arg: CommitHookArgument): Promise<void>;
    /**
     * Replace this function if you want to do something after commit
     * @param {CommitHookArgument} arg
     */
    postcommit(arg: CommitHookArgument): Promise<void>;
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
    commit({ type, info, add, config, }?: CommitMeta & {
        add?: string;
        config?: Record<CommitMeta['type'], [number, string]>;
    }): Promise<void>;
    /**
     * Runs package.json's scripts build field
     */
    build(): Promise<void>;
    /**
     * Runs script from package.json
     * @param {string} scriptName Script to run
     * @param {string[]} args Args to add
     */
    runPackageScript(scriptName: string, args?: string[]): Promise<boolean>;
    /**
     * @returns  {Promise<CommitMeta>}
     */
    parseArgs(helpText?: string): Promise<CommitMeta>;
}
export const Committer: CommitManager;
export type CommitMeta = {
    type?: 'fix' | 'update' | "release";
    info?: string;
};
export type CommitHookArgument = {
    version: [number, number, number];
    prev_version: [number, number, number];
    package: import("./types.js").Package;
    message: string;
    type: string;
    info: string;
};
import { LeafyLogger } from "./LeafyLogger.js";
import { PackageJSON } from "./package.js";
//# sourceMappingURL=commit.d.ts.map