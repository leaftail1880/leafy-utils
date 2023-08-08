export namespace Commiter {
    /**
     * Replace this function if you want to do something before commit
     * @param {CommitArgument} arg
     */
    export function precommit(arg: CommitArgument): Promise<void>;
    /**
     * Replace this function if you want to do something after commit
     * @param {CommitArgument} arg
     */
    export function postcommit(arg: CommitArgument): Promise<void>;
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
    export function commit({ type, info }?: {
        type?: string;
        info?: string;
    }): Promise<void>;
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
    export function add_commit_push({ type, info }?: {
        type?: string;
        info?: string;
    }): Promise<void>;
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
    export function build(): Promise<void>;
    /**
     * Runs script from package.json
     * @param {string} scriptName Script to run
     * @param {string[]} args Args to add
     * @readonly
     */
    export function runPackageScript(scriptName: string, args?: string[], log?: boolean): Promise<boolean>;
    export function checkForCommitArgs(helpText?: string): Promise<{
        type: string;
        info: string;
    }>;
    export { PACKAGE as package };
}
export type CommitArgument = {
    version: [number, number, number];
    prev_version: [number, number, number];
    package: import("./types.js").Package;
    message: string;
    type: string;
    info: string;
};
declare const PACKAGE: PackageJSON;
import { PackageJSON } from "./package.js";
export {};
//# sourceMappingURL=commit.d.ts.map