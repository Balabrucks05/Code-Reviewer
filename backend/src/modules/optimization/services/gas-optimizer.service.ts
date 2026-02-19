import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { BytecodeAnalyzerService } from './bytecode-analyzer.service';

export interface GasOptimization {
    id: string;
    type: string;
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    location: { startLine: number; endLine: number };
    currentCode: string;
    suggestedCode: string;
    estimatedGasSaving: number;
    bytecodeSaving?: number;
}

@Injectable()
export class GasOptimizerService {
    private readonly logger = new Logger(GasOptimizerService.name);

    constructor(private readonly bytecodeAnalyzer: BytecodeAnalyzerService) { }

    async analyze(contract: any, sourceContent: string): Promise<GasOptimization[]> {
        this.logger.log(`Analyzing gas optimizations for ${contract.name}`);

        const optimizations: GasOptimization[] = [];
        const lines = sourceContent.split('\n');

        // Storage optimization checks
        optimizations.push(...this.checkStoragePacking(sourceContent, lines));
        optimizations.push(...this.checkUnnecessaryStorage(sourceContent, lines));

        // Memory/calldata optimization
        optimizations.push(...this.checkCalldataVsMemory(sourceContent, lines));

        // Loop optimizations
        optimizations.push(...this.checkLoopOptimizations(sourceContent, lines));

        // Common gas patterns
        optimizations.push(...this.checkCommonGasPatterns(sourceContent, lines));

        // Bytecode size analysis
        const bytecodeOptimizations = await this.bytecodeAnalyzer.analyze(contract);
        optimizations.push(...bytecodeOptimizations);

        return optimizations;
    }

    private checkStoragePacking(source: string, lines: string[]): GasOptimization[] {
        const optimizations: GasOptimization[] = [];

        // Find state variable declarations
        const stateVarPattern = /^\s*(uint\d+|int\d+|bool|address|bytes\d+)\s+(\w+)\s*;/gm;
        const variables: { type: string; name: string; lineNumber: number; size: number }[] = [];

        let match;
        while ((match = stateVarPattern.exec(source)) !== null) {
            const type = match[1];
            const name = match[2];
            const lineNumber = this.getLineNumber(source, match.index);
            const size = this.getTypeSize(type);

            variables.push({ type, name, lineNumber, size });
        }

        // Check for suboptimal ordering
        for (let i = 0; i < variables.length - 1; i++) {
            const current = variables[i];
            const next = variables[i + 1];

            // If current ends a slot and next small variable starts a new slot
            if (current.size === 32 && next.size < 32) {
                // Check if there are adjacent small variables that could pack
                const adjacentSmall = variables.filter((v, idx) =>
                    idx > i && v.size < 32 && v.size + next.size <= 32
                );

                if (adjacentSmall.length > 0) {
                    optimizations.push({
                        id: uuidv4(),
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
                        estimatedGasSaving: 2100, // ~1 SSTORE saved = 20000, but average is 2100 for warm
                    });
                    break; // Only report once
                }
            }
        }

        return optimizations;
    }

    private checkUnnecessaryStorage(source: string, lines: string[]): GasOptimization[] {
        const optimizations: GasOptimization[] = [];

        // Find variables that could be constants or immutables
        const stateVarPattern = /^\s*(uint\d*|int\d*|address|bool|bytes\d+)\s+(public\s+)?(\w+)\s*=\s*([^;]+);/gm;
        let match;

        while ((match = stateVarPattern.exec(source)) !== null) {
            const type = match[1];
            const name = match[3];
            const value = match[4];
            const lineNumber = this.getLineNumber(source, match.index);

            // Check if it's already constant/immutable
            const line = lines[lineNumber - 1] || '';
            if (/\b(constant|immutable)\b/.test(line)) continue;

            // Check if value is a literal or deterministic
            const isLiteral = /^[\d.]+$|^0x[a-fA-F0-9]+$|^true$|^false$|^address\(0\)$/.test(value.trim());

            if (isLiteral) {
                optimizations.push({
                    id: uuidv4(),
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
                    estimatedGasSaving: 2100, // Saves SLOAD on each access
                });
            }
        }

        return optimizations;
    }

    private checkCalldataVsMemory(source: string, lines: string[]): GasOptimization[] {
        const optimizations: GasOptimization[] = [];

        // Find external functions with memory arrays/strings
        const funcPattern = /function\s+(\w+)\s*\(([^)]*)\)\s*external/g;
        let match;

        while ((match = funcPattern.exec(source)) !== null) {
            const funcName = match[1];
            const params = match[2];
            const lineNumber = this.getLineNumber(source, match.index);

            // Check for memory keyword with arrays or strings
            if (/\b(string|bytes|\w+\[\])\s+memory\b/.test(params)) {
                const paramMatch = /(string|bytes|\w+\[\])\s+memory\s+(\w+)/.exec(params);
                const paramName = paramMatch ? paramMatch[2] : 'parameter';

                optimizations.push({
                    id: uuidv4(),
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
                    estimatedGasSaving: 500, // Varies based on data size
                });
            }
        }

        return optimizations;
    }

    private checkLoopOptimizations(source: string, lines: string[]): GasOptimization[] {
        const optimizations: GasOptimization[] = [];

        // Find loops with array.length in condition
        const loopPattern = /for\s*\([^;]+;\s*\w+\s*<\s*(\w+)\.length\s*;/g;
        let match;

        while ((match = loopPattern.exec(source)) !== null) {
            const arrayName = match[1];
            const lineNumber = this.getLineNumber(source, match.index);

            optimizations.push({
                id: uuidv4(),
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
                estimatedGasSaving: 100, // Per iteration savings
            });
        }

        // Find loops with i++ instead of ++i or unchecked
        const incrementPattern = /for\s*\([^)]+\+\+\s*\)/g;

        while ((match = incrementPattern.exec(source)) !== null) {
            const lineNumber = this.getLineNumber(source, match.index);
            const line = lines[lineNumber - 1] || '';

            if (!line.includes('unchecked')) {
                // Check if using i++ instead of ++i
                if (/\w\+\+/.test(line)) {
                    optimizations.push({
                        id: uuidv4(),
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
                        estimatedGasSaving: 30, // Per iteration
                    });
                }
            }
        }

        return optimizations;
    }

    private checkCommonGasPatterns(source: string, lines: string[]): GasOptimization[] {
        const optimizations: GasOptimization[] = [];

        // Long revert strings
        const revertPattern = /require\s*\([^,]+,\s*"([^"]{32,})"\s*\)/g;
        let match;

        while ((match = revertPattern.exec(source)) !== null) {
            const message = match[1];
            const lineNumber = this.getLineNumber(source, match.index);

            optimizations.push({
                id: uuidv4(),
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
                estimatedGasSaving: 200, // Per additional 32-byte word
                bytecodeSaving: Math.ceil((message.length - 31) / 32) * 32,
            });
        }

        // Non-zero to non-zero storage updates
        const assignPattern = /(\w+)\s*=\s*0\s*;/g;

        while ((match = assignPattern.exec(source)) !== null) {
            const varName = match[1];
            const lineNumber = this.getLineNumber(source, match.index);

            // Check if it's likely a storage variable reset
            const isInLoop = this.isInLoop(source, match.index);

            if (!isInLoop) {
                // Context check - is this after a read?
                const prevContext = source.substring(Math.max(0, match.index - 200), match.index);
                const usesValue = new RegExp(`${varName}\\s*[+\\-*/]|[+\\-*/]\\s*${varName}`).test(prevContext);

                if (usesValue) {
                    optimizations.push({
                        id: uuidv4(),
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
                        estimatedGasSaving: 100, // Potential refund benefit
                    });
                }
            }
        }

        return optimizations;
    }

    private getTypeSize(type: string): number {
        if (type === 'bool') return 1;
        if (type === 'address') return 20;
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

    private isInLoop(source: string, index: number): boolean {
        const beforeCode = source.substring(Math.max(0, index - 500), index);
        const forCount = (beforeCode.match(/\bfor\s*\(/g) || []).length;
        const whileCount = (beforeCode.match(/\bwhile\s*\(/g) || []).length;
        const closeCount = (beforeCode.match(/\}/g) || []).length;

        return (forCount + whileCount) > closeCount;
    }

    private getLineNumber(source: string, index: number): number {
        return source.substring(0, index).split('\n').length;
    }
}
