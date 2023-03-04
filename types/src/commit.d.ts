export namespace Commiter {
    /**
     * Runs this structure:
     *
     * ```shell
     * scripts.precommit
     * git commit -a
     * scripts.postcommit
     * ```
     */
    function commit({ type, info }?: {
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
     *
     */
    function add_commit_push({ type, info }?: {
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
     *
     */
    function build(): Promise<boolean>;
    /**
     * Runs script from package.json
     * @param {string} scriptName Script to run
     * @param {string} args Additional argument to script
     */
    function runPackageScript(scriptName: string, args?: string, log?: boolean): Promise<boolean>;
}
export type CommitArgument = {
    version: [number, number, number];
    prev_version: [number, number, number];
    package: import("./types.js").Package;
    message: string;
    type: string;
    info: string;
};
//# sourceMappingURL=commit.d.ts.map