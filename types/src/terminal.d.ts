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
 * @returns {Promise<boolean>}
 */
export function execWithLog(command: string, showLog?: boolean): Promise<boolean>;
export function clearLines(count?: number): void;
/**
 * @param {Record<string, (arg?: {args: string[]; raw_input: string}) => any>} commands Object with key -> function mapping. Note that function must return 0, otherwise process will be exited.
 */
export function checkForArgs(commands: Record<string, (arg?: {
    args: string[];
    raw_input: string;
}) => any>, { commandList, defaultCommand }?: {
    commandList?: any[];
    defaultCommand?: string;
}): Promise<{
    command: string;
    input: string[];
    raw_input: string;
}>;
//# sourceMappingURL=terminal.d.ts.map