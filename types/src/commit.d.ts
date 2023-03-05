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
     * scripts.precommit
     * git commit -a
     * scripts.postcommit
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
     *   scripts.precommit
     *   git commit -a
     *   scripts.postcommit
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
     *     scripts.precommit
     *     git commit -a
     *     scripts.postcommit
     *   git push
     * ```
     * @readonly
     */
    export function build(): Promise<boolean>;
    /**
     * Runs script from package.json
     * @param {string} scriptName Script to run
     * @param {string[] | string} args Args to add
     * @readonly
     */
    export function runPackageScript(scriptName: string, args?: string | string[], log?: boolean): false | Promise<boolean>;
    export function checkForCommitArgs(): Promise<{
        type: string;
        info: string;
    }>;
    export { pack_package };
}
export type CommitArgument = {
    version: [number, number, number];
    prev_version: [number, number, number];
    package: import("./types.js").Package;
    message: string;
    type: string;
    info: string;
};
declare const pack_package: PackageJSON;
import { PackageJSON } from "./package.js";
export {};
//# sourceMappingURL=commit.d.ts.map