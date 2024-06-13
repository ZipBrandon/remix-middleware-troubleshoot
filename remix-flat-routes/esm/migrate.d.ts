export declare type RoutingConvention = 'flat-files' | 'flat-folders';
export declare type MigrateOptions = {
    convention: RoutingConvention;
};
export declare function migrate(sourceDir: string, targetDir: string, options?: MigrateOptions): void;
export declare function flatFiles(sourceDir: string, targetDir: string): (file: string) => void;
export declare function flatFolders(sourceDir: string, targetDir: string): (file: string) => void;
export declare function convertToRoute(name: string): string;
