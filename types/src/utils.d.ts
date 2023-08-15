/**
 * Typed bind
 * @template {Function} F
 * @param {F} func
 * @param {unknown} context
 * @returns {F}
 */
export function TypedBind<F extends Function>(func: F, context: unknown): F;
/**
 * Returns info about file based on meta url
 * @param {string} metaUrl import.meta.url
 */
export function pathInfo(metaUrl: string): {
    __dirname: string;
    __filename: string;
    __cli: boolean;
    /**
     * Returns path joined with __dirname
     * @param  {...string} to
     */
    relative(...to: string[]): string;
};
//# sourceMappingURL=utils.d.ts.map