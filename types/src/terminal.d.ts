/**
 * Ask user for input any text
 * @param {string} [text] - Text to show before input like "Count: "
 * @returns {Promise<string>}
 */
export function input(text?: string): Promise<string>;
/**
 * Works same as console.log but without \n every new line
 * @param {...any} data See **util.format()** for more info
 */
export function print(...data: any[]): void;
/**
 * @param {string} command
 * @param {string | undefined} cwd
 * @returns {Promise<number>}
 */
export function execute(command: string, cwd?: string | undefined): Promise<number>;
/**
 * @param {Record<string, (arg?: {args: string[]; raw_input: string}) => any>} commands Object with key -> function mapping. Note that function must return 0, otherwise process will be exited.
 * @param {object} [param1={}]
 * @param {string[]} [param1.commandList=[]]
 * @param {string} [param1.defaultCommand=""]
 */
export function parseArgs(commands: Record<string, (arg?: {
    args: string[];
    raw_input: string;
}) => any>, { commandList, defaultCommand }?: {
    commandList?: string[];
    defaultCommand?: string;
}): Promise<{
    command: string;
    input: string[];
    raw_input: string;
}>;
//# sourceMappingURL=terminal.d.ts.map