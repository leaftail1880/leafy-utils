import path from "path";
import url from "url";

/**
 * Typed bind
 * @template {Function} F
 * @param {F} func
 * @param {unknown} context
 * @returns {F}
 */
export function TypedBind(func, context) {
	if (typeof func !== "function") return func;
	return func.bind(context);
}

/**
 * Returns info about file based on meta url
 * @param {string} metaUrl import.meta.url
 */
export function pathInfo(metaUrl) {
	const __dirname = url.fileURLToPath(new URL(".", metaUrl));
	const __filename = url.fileURLToPath(metaUrl);
	return {
		__dirname,
		__filename,
		__cli:
			process.argv[1] &&
			__filename &&
			path.resolve(__filename).includes(path.resolve(process.argv[1])),
		/**
		 * Returns path joined with __dirname
		 * @param  {...string} to
		 */
		relative(...to) {
			return path.join(__dirname, ...to);
		},
	};
}
