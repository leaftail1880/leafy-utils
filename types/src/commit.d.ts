/**
 * @typedef {Object} callback
 * @property {[number, number, number]} version
 * @property {[number, number, number]} prev_version
 * @property {string} message
 * @property {string} type
 * @property {string} suffix
 */
/**
 * @typedef {Object} events
 * @property {callback} before_commit
 * @property {callback} after_commit
 * @property {{silentMode: boolean}} commit
 * @property {{silentMode: boolean}} add_commit_push
 * @property {callback} after_add_commit_push
 */
/** @type {import("./declarations.js").CustomEmitter<events>} */
export const commiter: import("./declarations.js").CustomEmitter<events>;
export type callback = {
    version: [number, number, number];
    prev_version: [number, number, number];
    message: string;
    type: string;
    suffix: string;
};
export type events = {
    before_commit: callback;
    after_commit: callback;
    commit: {
        silentMode: boolean;
    };
    add_commit_push: {
        silentMode: boolean;
    };
    after_add_commit_push: callback;
};
//# sourceMappingURL=commit.d.ts.map