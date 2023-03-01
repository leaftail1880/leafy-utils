export namespace Commiter {
    /**
     * Emits specified event
     * @param {keyof typeof events} event_name
     * @param {callback} arg
     */
    function emit(event_name: "pre_publish" | "before_commit" | "after_commit", arg: callback): Promise<void>;
    /**
     * Subscribes to specified event
     * @param {keyof typeof events} event_name
     * @param {(arg: callback) => any} callback
     */
    function subscribe(event_name: "pre_publish" | "before_commit" | "after_commit", callback: (arg: callback) => any): void;
    /**
     * Runs this structure:
     *
     * ```shell
     * before_commit
     * git commit -a
     * after_commit
     * ```
     */
    function commit({ silentMode, type, info }?: {
        silentMode?: boolean;
        type?: string;
        info?: string;
    }): Promise<void>;
    /**
     * Runs this structure:
     * ```shell
     * git add ./
     *   before_commit
     *   git commit -a
     *   after_commit
     * git push
     * ```
     *
     */
    function add_commit_push({ silentMode, type, info, searchCommitScript, }?: {
        silentMode?: boolean;
        type?: string;
        info?: string;
        searchCommitScript?: boolean;
    }): Promise<number>;
    /**
     * Runs this structure:
     * ```shell
     * pre_publish
     * package.json["scripts"]["build"]
     *   git add ./
     *     before_commit
     *     git commit -a
     *     after_commit
     *   git push
     * ```
     *
     */
    function publish({ silentMode, type, info, searchCommitScript, }?: {
        silentMode?: boolean;
        type?: string;
        info?: string;
        searchCommitScript?: boolean;
    }): Promise<number | false>;
}
export type callback = {
    version: [number, number, number];
    prev_version: [number, number, number];
    package: import("./types.js").Package;
    message: string;
    type: string;
    info: string;
};
//# sourceMappingURL=commit.d.ts.map