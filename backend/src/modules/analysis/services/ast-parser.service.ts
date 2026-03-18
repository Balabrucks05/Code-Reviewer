import { Injectable, Logger } from '@nestjs/common';
import * as solc from 'solc';
import { ImportResolverService } from './import-resolver.service';

@Injectable()
export class AstParserService {
  private readonly logger = new Logger(AstParserService.name);

  constructor(private readonly importResolver: ImportResolverService) {}

  async compile(sources: any[], version = '0.8.20') {
    this.logger.debug(`Compiling ${sources.length} source file(s) with solc ${version}`);
    const input = this.createCompilerInput(sources);

    try {
      const combinedSource = sources.map((s: any) => s.content).join('\n');
      const importCallback = (path: string) =>
        this.importResolver.resolveImport(path, combinedSource);
      const output = JSON.parse(
        solc.compile(JSON.stringify(input), { import: importCallback }),
      );
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

  private createCompilerInput(sources: any[]) {
    const sourcesObj: Record<string, { content: string }> = {};
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

  private normalizePragma(source: string): string {
    return source.replace(/pragma\s+solidity\s+[^;]+;/g, 'pragma solidity >=0.8.0;');
  }

  private processCompilerOutput(output: any, sources: any[]) {
    const contracts: any[] = [];
    const errors: any[] = [];
    const warnings: any[] = [];

    if (output.errors) {
      for (const error of output.errors) {
        if (error.severity === 'error') {
          errors.push(this.formatError(error));
        } else if (error.severity === 'warning') {
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

  private formatError(error: any) {
    return {
      type: error.severity,
      message: error.message,
      formattedMessage: error.formattedMessage,
      sourceLocation: error.sourceLocation
        ? {
            file: error.sourceLocation.file,
            startLine: error.sourceLocation.start,
            endLine: error.sourceLocation.end,
          }
        : undefined,
    };
  }

  extractContractInfo(ast: any) {
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

  private parseSourceLocation(src: string) {
    const [start, length] = src.split(':').map(Number);
    return {
      startLine: start,
      endLine: start + length,
    };
  }
}
