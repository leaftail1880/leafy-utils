export interface Package {
    name: string;
    version: string;
    description?: string;
    main?: string;
    author?: string;
    license?: string;
    type?: string;
    files?: string[];
    scripts?: Record<string, string>;
    exports?: Record<string, {
        default: string;
        types?: string;
    }>;
}
export interface CustomEmitter<events extends Record<string | symbol, any>> {
    on<N extends keyof events>(eventName: N, listener: (arg: events[N]) => void): CustomEmitter<events>;
    off<N extends keyof events>(eventName: N, listener: (arg: events[N]) => void): CustomEmitter<events>;
    once<N extends keyof events>(eventName: N, listener: (arg: events[N]) => void): CustomEmitter<events>;
    emit<N extends keyof events>(eventName: N, arg: events[N]): boolean;
}
export interface GitDependency {
    remote: {
        /**
         * Url of the remote
         */
        url: string;
        /**
         * Remote branch
         */
        branch: string;
        /**
         * Name of the remote
         * @default filename
         */
        name?: string;
        /**
         * Base remote path
         * @default ""
         */
        path?: string;
    };
    /**
     * Path where dependency files will be placed
     */
    path?: string;
    /**
     * Map of the folders to copy where keys are path relative to remote.path
     * If value is string it is path relative to path
     */
    dependencies: Record<string, string | {
        /**
         * path relative to path
         */
        localPath: string;
        /**
         * Weather dependency is a file
         * @default false
         */
        file?: boolean;
    }>;
}
//# sourceMappingURL=types.d.ts.map