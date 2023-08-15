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
     * precommit
     * git commit -a
     * postcommit
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
     * git add ./
     *   precommit
     *   git commit -a
     *   postcommit
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
     *   git add ./
     *     precommit
     *     git commit -a
     *     postcommit
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
    export function runPackageScript(scriptName: string, args?: string[]): Promise<any>;
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