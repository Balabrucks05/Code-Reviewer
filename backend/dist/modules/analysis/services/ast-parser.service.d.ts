import { ImportResolverService } from './import-resolver.service';
export interface ParsedContract {
    name: string;
    ast: any;
    abi: any[];
    bytecode: string;
    deployedBytecode: string;
    sourceMap: string;
}
export interface CompilationResult {
    success: boolean;
    contracts: ParsedContract[];
    errors: any[];
    warnings: any[];
}
export declare class AstParserService {
    private readonly importResolver;
    private readonly logger;
    constructor(importResolver: ImportResolverService);
    compile(sources: {
        filename: string;
        content: string;
    }[], version?: string): Promise<CompilationResult>;
    private createCompilerInput;
    private normalizePragma;
    private processCompilerOutput;
    private formatError;
    extractContractInfo(ast: any): any;
    private parseContractDefinition;
    private parseFunctionDefinition;
    private parseStateVariable;
    private parseEventDefinition;
    private parseModifierDefinition;
    private getTypeName;
    private parseSourceLocation;
}
