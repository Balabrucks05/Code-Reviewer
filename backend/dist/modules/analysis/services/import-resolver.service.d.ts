export declare class ImportResolverService {
    private readonly logger;
    private readonly nodeModulesPath;
    private readonly v4Aliases;
    constructor();
    resolveImport(importPath: string, sourceRef?: string): {
        contents: string;
    } | {
        error: string;
    };
}
