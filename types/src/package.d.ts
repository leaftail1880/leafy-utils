export class PackageJSON {
    /**
     * @param {string} pathToPackage
     */
    constructor(pathToPackage?: string, fileName?: string);
    /** @private */
    private PACKAGE_PATH;
    /** @private @type {import("./types.js").Package | null} */
    private CONTENT;
    /** @private */
    private MODIFIED;
    /**
     * Returns a proxy for data, which sets modified on modify
     * @returns {import("./types.js").Package} A proxy object.
     */
    get content(): import("./types.js").Package;
    /**
     * It reads the package.json file, parses it into a JSON object and saves to local var. To get it, use this.data
     */
    read(): Promise<void>;
    /**
     * Reads data if it not initialized
     */
    init(): Promise<void>;
    /**
     * It writes the internal saved data to the package.json file
     * @returns The return value of fs.writeFile()
     */
    write(): Promise<void>;
    /**
     * If the file has been modified, write the changes to the file
     * @returns promise that resolves after writing file
     */
    save(): Promise<void>;
}
//# sourceMappingURL=package.d.ts.map