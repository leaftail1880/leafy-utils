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
