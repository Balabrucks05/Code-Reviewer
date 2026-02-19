"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AstParserService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AstParserService = void 0;
const common_1 = require("@nestjs/common");
const solc = __importStar(require("solc"));
const import_resolver_service_1 = require("./import-resolver.service");
let AstParserService = AstParserService_1 = class AstParserService {
    importResolver;
    logger = new common_1.Logger(AstParserService_1.name);
    constructor(importResolver) {
        this.importResolver = importResolver;
    }
    async compile(sources, version = '0.8.20') {
        this.logger.log(`Compiling ${sources.length} source file(s) with solc ${version}`);
        const input = this.createCompilerInput(sources);
        try {
            const importCallback = (path) => this.importResolver.resolveImport(path);
            const output = JSON.parse(solc.compile(JSON.stringify(input), { import: importCallback }));
            return this.processCompilerOutput(output, sources);
        }
        catch (error) {
            this.logger.error(`Compilation failed: ${error.message}`);
            return {
                success: false,
                contracts: [],
                errors: [{ message: error.message, type: 'CompilationError' }],
                warnings: [],
            };
        }
    }
    createCompilerInput(sources) {
        const sourcesObj = {};
        for (const source of sources) {
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
    normalizePragma(source) {
        return source.replace(/pragma\s+solidity\s+[^;]+;/g, 'pragma solidity >=0.8.0;');
    }
    processCompilerOutput(output, sources) {
        const contracts = [];
        const errors = [];
        const warnings = [];
        if (output.errors) {
            for (const error of output.errors) {
                if (error.severity === 'error') {
                    errors.push(this.formatError(error));
                }
                else if (error.severity === 'warning') {
                    warnings.push(this.formatError(error));
                }
            }
        }
        if (errors.length > 0) {
            return { success: false, contracts, errors, warnings };
        }
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
    formatError(error) {
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
    extractContractInfo(ast) {
        if (!ast || !ast.nodes) {
            return null;
        }
        const contracts = [];
        for (const node of ast.nodes) {
            if (node.nodeType === 'ContractDefinition') {
                contracts.push(this.parseContractDefinition(node));
            }
        }
        return contracts;
    }
    parseContractDefinition(node) {
        const functions = [];
        const stateVariables = [];
        const events = [];
        const modifiers = [];
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
            baseContracts: (node.baseContracts || []).map((bc) => bc.baseName.name),
            functions,
            stateVariables,
            events,
            modifiers,
            isAbstract: node.abstract || false,
        };
    }
    parseFunctionDefinition(node) {
        return {
            name: node.name || (node.kind === 'constructor' ? 'constructor' : 'fallback'),
            visibility: node.visibility,
            stateMutability: node.stateMutability,
            isConstructor: node.kind === 'constructor',
            isReceive: node.kind === 'receive',
            isFallback: node.kind === 'fallback',
            parameters: (node.parameters?.parameters || []).map((p) => ({
                name: p.name,
                typeName: this.getTypeName(p.typeName),
                storageLocation: p.storageLocation,
            })),
            returnParameters: (node.returnParameters?.parameters || []).map((p) => ({
                name: p.name,
                typeName: this.getTypeName(p.typeName),
            })),
            modifiers: (node.modifiers || []).map((m) => m.modifierName.name),
            location: this.parseSourceLocation(node.src),
        };
    }
    parseStateVariable(node) {
        return {
            name: node.name,
            typeName: this.getTypeName(node.typeName),
            visibility: node.visibility,
            isConstant: node.constant || false,
            isImmutable: node.mutability === 'immutable',
            location: this.parseSourceLocation(node.src),
        };
    }
    parseEventDefinition(node) {
        return {
            name: node.name,
            parameters: (node.parameters?.parameters || []).map((p) => ({
                name: p.name,
                typeName: this.getTypeName(p.typeName),
                indexed: p.indexed || false,
            })),
        };
    }
    parseModifierDefinition(node) {
        return {
            name: node.name,
            parameters: (node.parameters?.parameters || []).map((p) => ({
                name: p.name,
                typeName: this.getTypeName(p.typeName),
            })),
        };
    }
    getTypeName(typeNode) {
        if (!typeNode)
            return 'unknown';
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
    parseSourceLocation(src) {
        const [start, length] = src.split(':').map(Number);
        return {
            startLine: start,
            endLine: start + length,
        };
    }
};
exports.AstParserService = AstParserService;
exports.AstParserService = AstParserService = AstParserService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [import_resolver_service_1.ImportResolverService])
], AstParserService);
//# sourceMappingURL=ast-parser.service.js.map