/**
 * Ask user for input any text
 * @param {string} [text] - Text to show before input like "Count: "
 * @returns {Promise<string>}
 */
export function input(text?: string): Promise<string>;
/**
 * Works same as console.lpg but without \n every new line
 * @param {...any} data See **util.format()** for more info
 */
export function print(...data: any[]): void;
/**
 * Executes common terminal command
 * @param {string} command Command to execute
 * @returns {Promise<{stderr: string; stdout: string}>}
 */
export function exec(command: string): Promise<{
    stderr: string;
    stdout: string;
}>;
/**
 * Executes common terminal command
 * @param {string} command Command to execute
 * @returns {Promise<void>}
 */
export function execWithLog(command: string, showLog?: boolean): Promise<void>;
export function clearLines(count?: number): void;
//# sourceMappingURL=terminal.d.ts.map