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
    function commit({ silentMode, arg }?: {
        silentMode?: boolean;
        arg?: string;
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
    function add_commit_push({ silentMode, arg, fromBin }?: {
        silentMode?: boolean;
        arg?: string;
        fromBin?: boolean;
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
    function publish({ silentMode, arg, fromBin }?: {
        silentMode?: boolean;
        arg?: string;
        fromBin?: boolean;
    }): Promise<number | false>;
}
export type callback = {
    version: [number, number, number];
    prev_version: [number, number, number];
    package: import("./types.js").Package;
    message: string;
    type: string;
    suffix: string;
};
//# sourceMappingURL=commit.d.ts.map