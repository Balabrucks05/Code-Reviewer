import { Injectable, Logger } from '@nestjs/common';
import * as solc from 'solc';
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

@Injectable()
export class AstParserService {
    private readonly logger = new Logger(AstParserService.name);

    constructor(private readonly importResolver: ImportResolverService) { }

    async compile(sources: { filename: string; content: string }[], version = '0.8.20'): Promise<CompilationResult> {
        this.logger.log(`Compiling ${sources.length} source file(s) with solc ${version}`);

        const input = this.createCompilerInput(sources);

        try {
            const importCallback = (path: string) => this.importResolver.resolveImport(path);
            const output = JSON.parse(solc.compile(JSON.stringify(input), { import: importCallback }));

            return this.processCompilerOutput(output, sources);
        } catch (error) {
            this.logger.error(`Compilation failed: ${error.message}`);
            return {
                success: false,
                contracts: [],
                errors: [{ message: error.message, type: 'CompilationError' }],
                warnings: [],
            };
        }
    }

    private createCompilerInput(sources: { filename: string; content: string }[]) {
        const sourcesObj: Record<string, { content: string }> = {};

        for (const source of sources) {
            // Normalize pragma to allow any 0.8.x version to compile
            const normalizedContent = this.normalizePragma(source.content);
            sourcesObj[source.filename] = { content: normalizedContent };
        }

        return {
            language: 'Solidity',
            sources: sourcesObj,
            settings: {
                outputSelection: {
                    '*': {
                        '*': ['abi', 'evm.bytecode', 'evm.deployedBytecode', 'evm.bytecode.sourceMap'],
                        '': ['ast'],
                    },
                },
                optimizer: {
                    enabled: true,
                    runs: 200,
                },
            },
        };
    }

    /**
     * Normalize pragma to be compatible with the installed solc version.
     * Replaces specific version constraints with a more permissive ^0.8.0
     */
    private normalizePragma(source: string): string {
        // Match pragma solidity statements and replace with a permissive version
        // This handles: ^0.8.20, >=0.8.0 <0.9.0, 0.8.20, etc.
        return source.replace(
            /pragma\s+solidity\s+[^;]+;/g,
            'pragma solidity >=0.8.0;'
        );
    }

    private processCompilerOutput(output: any, sources: { filename: string; content: string }[]): CompilationResult {
        const contracts: ParsedContract[] = [];
        const errors: any[] = [];
        const warnings: any[] = [];

        // Process errors and warnings
        if (output.errors) {
            for (const error of output.errors) {
                if (error.severity === 'error') {
                    errors.push(this.formatError(error));
                } else if (error.severity === 'warning') {
                    warnings.push(this.formatError(error));
                }
            }
        }

        // If there are fatal errors, return early
        if (errors.length > 0) {
            return { success: false, contracts, errors, warnings };
        }

        // Process contracts
        if (output.contracts) {
            for (const filename of Object.keys(output.contracts)) {
                for (const contractName of Object.keys(output.contracts[filename])) {
                    const contract = output.contracts[filename][contractName];

                    contracts.push({
                        name: contractName,
                        ast: output.sources[filename]?.ast,
                        abi: contract.abi || [],
                        bytecode: contract.evm?.bytecode?.object || '',
                        deployedBytecode: contract.evm?.deployedBytecode?.object || '',
                        sourceMap: contract.evm?.bytecode?.sourceMap || '',
                    });
                }
            }
        }

        return {
            success: true,
            contracts,
            errors,
            warnings,
        };
    }

    private formatError(error: any) {
        return {
            type: error.severity,
            message: error.message,
            formattedMessage: error.formattedMessage,
            sourceLocation: error.sourceLocation ? {
                file: error.sourceLocation.file,
                startLine: error.sourceLocation.start,
                endLine: error.sourceLocation.end,
            } : undefined,
        };
    }

    extractContractInfo(ast: any): any {
        if (!ast || !ast.nodes) {
            return null;
        }

        const contracts: any[] = [];

        for (const node of ast.nodes) {
            if (node.nodeType === 'ContractDefinition') {
                contracts.push(this.parseContractDefinition(node));
            }
        }

        return contracts;
    }

    private parseContractDefinition(node: any) {
        const functions: any[] = [];
        const stateVariables: any[] = [];
        const events: any[] = [];
        const modifiers: any[] = [];

        for (const child of node.nodes || []) {
            switch (child.nodeType) {
                case 'FunctionDefinition':
                    functions.push(this.parseFunctionDefinition(child));
                    break;
                case 'VariableDeclaration':
                    stateVariables.push(this.parseStateVariable(child));
                    break;
                case 'EventDefinition':
                    events.push(this.parseEventDefinition(child));
                    break;
                case 'ModifierDefinition':
                    modifiers.push(this.parseModifierDefinition(child));
                    break;
            }
        }

        return {
            name: node.name,
            kind: node.contractKind,
            baseContracts: (node.baseContracts || []).map((bc: any) => bc.baseName.name),
            functions,
            stateVariables,
            events,
            modifiers,
            isAbstract: node.abstract || false,
        };
    }

    private parseFunctionDefinition(node: any) {
        return {
            name: node.name || (node.kind === 'constructor' ? 'constructor' : 'fallback'),
            visibility: node.visibility,
            stateMutability: node.stateMutability,
            isConstructor: node.kind === 'constructor',
            isReceive: node.kind === 'receive',
            isFallback: node.kind === 'fallback',
            parameters: (node.parameters?.parameters || []).map((p: any) => ({
                name: p.name,
                typeName: this.getTypeName(p.typeName),
                storageLocation: p.storageLocation,
            })),
            returnParameters: (node.returnParameters?.parameters || []).map((p: any) => ({
                name: p.name,
                typeName: this.getTypeName(p.typeName),
            })),
            modifiers: (node.modifiers || []).map((m: any) => m.modifierName.name),
            location: this.parseSourceLocation(node.src),
        };
    }

    private parseStateVariable(node: any) {
        return {
            name: node.name,
            typeName: this.getTypeName(node.typeName),
            visibility: node.visibility,
            isConstant: node.constant || false,
            isImmutable: node.mutability === 'immutable',
            location: this.parseSourceLocation(node.src),
        };
    }

    private parseEventDefinition(node: any) {
        return {
            name: node.name,
            parameters: (node.parameters?.parameters || []).map((p: any) => ({
                name: p.name,
                typeName: this.getTypeName(p.typeName),
                indexed: p.indexed || false,
            })),
        };
    }

    private parseModifierDefinition(node: any) {
        return {
            name: node.name,
            parameters: (node.parameters?.parameters || []).map((p: any) => ({
                name: p.name,
                typeName: this.getTypeName(p.typeName),
            })),
        };
    }

    private getTypeName(typeNode: any): string {
        if (!typeNode) return 'unknown';

        switch (typeNode.nodeType) {
            case 'ElementaryTypeName':
                return typeNode.name;
            case 'ArrayTypeName':
                return `${this.getTypeName(typeNode.baseType)}[]`;
            case 'Mapping':
                return `mapping(${this.getTypeName(typeNode.keyType)} => ${this.getTypeName(typeNode.valueType)})`;
            case 'UserDefinedTypeName':
                return typeNode.pathNode?.name || typeNode.name || 'UserDefined';
            default:
                return typeNode.typeDescriptions?.typeString || 'unknown';
        }
    }

    private parseSourceLocation(src: string): { startLine: number; endLine: number } {
        const [start, length] = src.split(':').map(Number);
        return {
            startLine: start,
            endLine: start + length,
        };
    }
}
