/**
 * @typedef {Object} dirOptions
 * @property {string} inputPath
 * @property {string} outputPath
 * @property {Record<string, ((buffer: Buffer, givenpath: string, filename: string) => fileparseReturn | Promise<fileparseReturn>) | true | false>} extensions
 * @property {string[]} [ignoreFolders]
 * @property {string[]} [ignoreFiles]
 * @property {boolean=} [silentMode=false]
 */
/**
 * @typedef {Object} fileparseReturn
 * @property {string|Buffer} data
 * @property {string} [filename]
 * @property {boolean} [modified=true]
 */
/**
 * @param {dirOptions} options
 */
export function fordir(options: dirOptions): Promise<void>;
export type dirOptions = {
    inputPath: string;
    outputPath: string;
    extensions: Record<string, boolean | ((buffer: Buffer, givenpath: string, filename: string) => fileparseReturn | Promise<fileparseReturn>)>;
    ignoreFolders?: string[];
    ignoreFiles?: string[];
    silentMode?: boolean | undefined;
};
export type fileparseReturn = {
    data: string | Buffer;
    filename?: string;
    modified?: boolean;
};
//# sourceMappingURL=fordir.d.ts.map