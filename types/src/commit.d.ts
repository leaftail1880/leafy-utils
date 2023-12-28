/**
 * @typedef {{
 *   type?: 'fix' | 'update' | "release"
 *   info?: string
 * }} CommitMeta
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
    static logger: LeafyLogger;
    /**
     * @param {undefined | string} cwd
     */
    constructor(cwd: undefined | string);
    package: PackageJSON;
    /**
     * @param {string} command
     * @param {import('./terminal.js').ExecAsyncOptions<false>} options
     */
    exec: (command: string, options: import('./terminal.js').ExecAsyncOptions<false>) => Promise<string>;
    logger: LeafyLogger;
    /**
     * Replace this function if you want to do something before commit
     * @param {CommitHookArgument} arg
     * @this {CommitManager}
     */
    precommit(this: CommitManager, arg: CommitHookArgument): Promise<void>;
    /**
     * Replace this function if you want to do something after commit
     * @param {CommitHookArgument} arg
     * @this {CommitManager}
     */
    postcommit(this: CommitManager, arg: CommitHookArgument): Promise<void>;
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
     * @template {import('./types.js').CustomParseArgsConfig} T
     * @param {T} [config]
     * @returns {Promise<CommitMeta & {options: import('./types.js').CustomParseArgReturn<T>['options']}>}
     */
    parseArgs<T extends import("./types.js").CustomParseArgsConfig>(helpText?: string, helpOptions?: string, config?: T): Promise<CommitMeta & {
        options: import("./types.js").CustomParsedArgs<T> & {
            help: boolean;
        };
    }>;
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
import { PackageJSON } from './package.js';
import { LeafyLogger } from './LeafyLogger.js';
//# sourceMappingURL=commit.d.ts.map