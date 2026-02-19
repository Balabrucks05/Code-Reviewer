"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var GasOptimizerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GasOptimizerService = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("uuid");
const bytecode_analyzer_service_1 = require("./bytecode-analyzer.service");
let GasOptimizerService = GasOptimizerService_1 = class GasOptimizerService {
    bytecodeAnalyzer;
    logger = new common_1.Logger(GasOptimizerService_1.name);
    constructor(bytecodeAnalyzer) {
        this.bytecodeAnalyzer = bytecodeAnalyzer;
    }
    async analyze(contract, sourceContent) {
        this.logger.log(`Analyzing gas optimizations for ${contract.name}`);
        const optimizations = [];
        const lines = sourceContent.split('\n');
        optimizations.push(...this.checkStoragePacking(sourceContent, lines));
        optimizations.push(...this.checkUnnecessaryStorage(sourceContent, lines));
        optimizations.push(...this.checkCalldataVsMemory(sourceContent, lines));
        optimizations.push(...this.checkLoopOptimizations(sourceContent, lines));
        optimizations.push(...this.checkCommonGasPatterns(sourceContent, lines));
        const bytecodeOptimizations = await this.bytecodeAnalyzer.analyze(contract);
        optimizations.push(...bytecodeOptimizations);
        return optimizations;
    }
    checkStoragePacking(source, lines) {
        const optimizations = [];
        const stateVarPattern = /^\s*(uint\d+|int\d+|bool|address|bytes\d+)\s+(\w+)\s*;/gm;
        const variables = [];
        let match;
        while ((match = stateVarPattern.exec(source)) !== null) {
            const type = match[1];
            const name = match[2];
            const lineNumber = this.getLineNumber(source, match.index);
            const size = this.getTypeSize(type);
            variables.push({ type, name, lineNumber, size });
        }
        for (let i = 0; i < variables.length - 1; i++) {
            const current = variables[i];
            const next = variables[i + 1];
            if (current.size === 32 && next.size < 32) {
                const adjacentSmall = variables.filter((v, idx) => idx > i && v.size < 32 && v.size + next.size <= 32);
                if (adjacentSmall.length > 0) {
                    optimizations.push({
                        id: (0, uuid_1.v4)(),
                        type: 'storage_packing',
                        title: 'Suboptimal Storage Variable Order',
                        description: `Variables at lines ${current.lineNumber}-${next.lineNumber} could be reordered for better storage packing. Small variables (< 32 bytes) should be grouped together.`,
                        impact: 'medium',
                        location: {
                            startLine: current.lineNumber,
                            endLine: next.lineNumber + 1,
                        },
                        currentCode: lines.slice(current.lineNumber - 1, next.lineNumber).join('\n'),
                        suggestedCode: `// Group small variables together:\n// uint256 variables first (use full slot)\n// Then pack smaller types together\nbool ${next.name};\nuint8 someOther; // pack with bool\nuint256 ${current.name};`,
                        estimatedGasSaving: 2100,
                    });
                    break;
                }
            }
        }
        return optimizations;
    }
    checkUnnecessaryStorage(source, lines) {
        const optimizations = [];
        const stateVarPattern = /^\s*(uint\d*|int\d*|address|bool|bytes\d+)\s+(public\s+)?(\w+)\s*=\s*([^;]+);/gm;
        let match;
        while ((match = stateVarPattern.exec(source)) !== null) {
            const type = match[1];
            const name = match[3];
            const value = match[4];
            const lineNumber = this.getLineNumber(source, match.index);
            const line = lines[lineNumber - 1] || '';
            if (/\b(constant|immutable)\b/.test(line))
                continue;
            const isLiteral = /^[\d.]+$|^0x[a-fA-F0-9]+$|^true$|^false$|^address\(0\)$/.test(value.trim());
            if (isLiteral) {
                optimizations.push({
                    id: (0, uuid_1.v4)(),
                    type: 'unnecessary_storage',
                    title: 'Variable Should Be Constant',
                    description: `Variable '${name}' at line ${lineNumber} is initialized with a literal value. Consider making it a constant to save gas.`,
                    impact: 'medium',
                    location: {
                        startLine: lineNumber,
                        endLine: lineNumber,
                    },
                    currentCode: line.trim(),
                    suggestedCode: `${type} public constant ${name.toUpperCase()} = ${value};`,
                    estimatedGasSaving: 2100,
                });
            }
        }
        return optimizations;
    }
    checkCalldataVsMemory(source, lines) {
        const optimizations = [];
        const funcPattern = /function\s+(\w+)\s*\(([^)]*)\)\s*external/g;
        let match;
        while ((match = funcPattern.exec(source)) !== null) {
            const funcName = match[1];
            const params = match[2];
            const lineNumber = this.getLineNumber(source, match.index);
            if (/\b(string|bytes|\w+\[\])\s+memory\b/.test(params)) {
                const paramMatch = /(string|bytes|\w+\[\])\s+memory\s+(\w+)/.exec(params);
                const paramName = paramMatch ? paramMatch[2] : 'parameter';
                optimizations.push({
                    id: (0, uuid_1.v4)(),
                    type: 'calldata_vs_memory',
                    title: 'Use Calldata Instead of Memory',
                    description: `External function '${funcName}' at line ${lineNumber} uses memory for '${paramName}'. For read-only external parameters, calldata is cheaper.`,
                    impact: 'medium',
                    location: {
                        startLine: lineNumber,
                        endLine: lineNumber,
                    },
                    currentCode: lines[lineNumber - 1]?.trim() || '',
                    suggestedCode: params.replace(/\bmemory\b/g, 'calldata'),
                    estimatedGasSaving: 500,
                });
            }
        }
        return optimizations;
    }
    checkLoopOptimizations(source, lines) {
        const optimizations = [];
        const loopPattern = /for\s*\([^;]+;\s*\w+\s*<\s*(\w+)\.length\s*;/g;
        let match;
        while ((match = loopPattern.exec(source)) !== null) {
            const arrayName = match[1];
            const lineNumber = this.getLineNumber(source, match.index);
            optimizations.push({
                id: (0, uuid_1.v4)(),
                type: 'inefficient_loop',
                title: 'Cache Array Length Outside Loop',
                description: `Loop at line ${lineNumber} reads '${arrayName}.length' on every iteration. Cache it in a local variable.`,
                impact: 'low',
                location: {
                    startLine: lineNumber,
                    endLine: lineNumber,
                },
                currentCode: lines[lineNumber - 1]?.trim() || '',
                suggestedCode: `uint256 len = ${arrayName}.length;\nfor (uint256 i = 0; i < len; ) {\n    // ...\n    unchecked { ++i; }\n}`,
                estimatedGasSaving: 100,
            });
        }
        const incrementPattern = /for\s*\([^)]+\+\+\s*\)/g;
        while ((match = incrementPattern.exec(source)) !== null) {
            const lineNumber = this.getLineNumber(source, match.index);
            const line = lines[lineNumber - 1] || '';
            if (!line.includes('unchecked')) {
                if (/\w\+\+/.test(line)) {
                    optimizations.push({
                        id: (0, uuid_1.v4)(),
                        type: 'inefficient_loop',
                        title: 'Use Unchecked Increment in Loop',
                        description: `Loop at line ${lineNumber} can use unchecked increment to save gas (when overflow is impossible).`,
                        impact: 'low',
                        location: {
                            startLine: lineNumber,
                            endLine: lineNumber,
                        },
                        currentCode: line.trim(),
                        suggestedCode: line.replace(/(\w+)\+\+/, '').trim() + ' {\n    // loop body\n    unchecked { ++i; }\n}',
                        estimatedGasSaving: 30,
                    });
                }
            }
        }
        return optimizations;
    }
    checkCommonGasPatterns(source, lines) {
        const optimizations = [];
        const revertPattern = /require\s*\([^,]+,\s*"([^"]{32,})"\s*\)/g;
        let match;
        while ((match = revertPattern.exec(source)) !== null) {
            const message = match[1];
            const lineNumber = this.getLineNumber(source, match.index);
            optimizations.push({
                id: (0, uuid_1.v4)(),
                type: 'short_revert_string',
                title: 'Long Revert String',
                description: `Revert string at line ${lineNumber} is ${message.length} characters. Consider using custom errors or shorter messages.`,
                impact: 'low',
                location: {
                    startLine: lineNumber,
                    endLine: lineNumber,
                },
                currentCode: lines[lineNumber - 1]?.trim() || '',
                suggestedCode: `error CustomError();\n// ...\nif (!condition) revert CustomError();`,
                estimatedGasSaving: 200,
                bytecodeSaving: Math.ceil((message.length - 31) / 32) * 32,
            });
        }
        const assignPattern = /(\w+)\s*=\s*0\s*;/g;
        while ((match = assignPattern.exec(source)) !== null) {
            const varName = match[1];
            const lineNumber = this.getLineNumber(source, match.index);
            const isInLoop = this.isInLoop(source, match.index);
            if (!isInLoop) {
                const prevContext = source.substring(Math.max(0, match.index - 200), match.index);
                const usesValue = new RegExp(`${varName}\\s*[+\\-*/]|[+\\-*/]\\s*${varName}`).test(prevContext);
                if (usesValue) {
                    optimizations.push({
                        id: (0, uuid_1.v4)(),
                        type: 'expensive_operation',
                        title: 'Consider Using Delete for Storage Reset',
                        description: `Setting '${varName}' to 0 at line ${lineNumber}. If this is a storage variable, using 'delete' may provide gas refunds.`,
                        impact: 'low',
                        location: {
                            startLine: lineNumber,
                            endLine: lineNumber,
                        },
                        currentCode: lines[lineNumber - 1]?.trim() || '',
                        suggestedCode: `delete ${varName};`,
                        estimatedGasSaving: 100,
                    });
                }
            }
        }
        return optimizations;
    }
    getTypeSize(type) {
        if (type === 'bool')
            return 1;
        if (type === 'address')
            return 20;
        if (type.startsWith('uint') || type.startsWith('int')) {
            const bits = parseInt(type.replace(/\D/g, '')) || 256;
            return bits / 8;
        }
        if (type.startsWith('bytes')) {
            const size = parseInt(type.replace('bytes', ''));
            return isNaN(size) ? 32 : size;
        }
        return 32;
    }
    isInLoop(source, index) {
        const beforeCode = source.substring(Math.max(0, index - 500), index);
        const forCount = (beforeCode.match(/\bfor\s*\(/g) || []).length;
        const whileCount = (beforeCode.match(/\bwhile\s*\(/g) || []).length;
        const closeCount = (beforeCode.match(/\}/g) || []).length;
        return (forCount + whileCount) > closeCount;
    }
    getLineNumber(source, index) {
        return source.substring(0, index).split('\n').length;
    }
};
exports.GasOptimizerService = GasOptimizerService;
exports.GasOptimizerService = GasOptimizerService = GasOptimizerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [bytecode_analyzer_service_1.BytecodeAnalyzerService])
], GasOptimizerService);
//# sourceMappingURL=gas-optimizer.service.js.map