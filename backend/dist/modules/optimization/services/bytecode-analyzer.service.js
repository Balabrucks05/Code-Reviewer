"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var BytecodeAnalyzerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BytecodeAnalyzerService = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("uuid");
let BytecodeAnalyzerService = BytecodeAnalyzerService_1 = class BytecodeAnalyzerService {
    logger = new common_1.Logger(BytecodeAnalyzerService_1.name);
    MAX_CONTRACT_SIZE = 24576;
    async analyze(contract) {
        const issues = [];
        if (!contract.deployedBytecode) {
            return issues;
        }
        const bytecodeSize = contract.deployedBytecode.length / 2;
        this.logger.debug(`Contract ${contract.name}: ${bytecodeSize} bytes (${((bytecodeSize / this.MAX_CONTRACT_SIZE) * 100).toFixed(1)}% of limit)`);
        if (bytecodeSize > this.MAX_CONTRACT_SIZE * 0.8) {
            issues.push({
                id: (0, uuid_1.v4)(),
                type: 'bytecode_size',
                title: 'Contract Approaching Size Limit',
                description: `Contract is ${bytecodeSize} bytes (${((bytecodeSize / this.MAX_CONTRACT_SIZE) * 100).toFixed(1)}% of 24KB limit). Consider splitting into multiple contracts or using libraries.`,
                impact: 'high',
                location: { startLine: 1, endLine: 1 },
                currentCode: `// Contract size: ${bytecodeSize} bytes`,
                suggestedCode: `// Consider:
// 1. Extract logic to libraries (delegatecall)
// 2. Use EIP-2535 Diamond Pattern
// 3. Remove unused functions
// 4. Use shorter error messages or custom errors
// 5. Enable optimizer with high runs`,
                estimatedGasSaving: 0,
                bytecodeSaving: bytecodeSize - this.MAX_CONTRACT_SIZE * 0.7,
            });
        }
        const bytecode = contract.deployedBytecode;
        const repeatedPatterns = this.findRepeatedPatterns(bytecode);
        if (repeatedPatterns.length > 0) {
            const totalBytes = repeatedPatterns.reduce((sum, p) => sum + p.savings, 0);
            issues.push({
                id: (0, uuid_1.v4)(),
                type: 'redundant_code',
                title: 'Repeated Bytecode Patterns Detected',
                description: `Found ${repeatedPatterns.length} repeated bytecode patterns. Extracting to internal functions or libraries could save ~${totalBytes} bytes.`,
                impact: totalBytes > 500 ? 'high' : 'medium',
                location: { startLine: 1, endLine: 1 },
                currentCode: `// ${repeatedPatterns.length} repeated patterns found`,
                suggestedCode: `// Extract repeated logic to internal functions:
function _commonLogic() internal {
    // repeated code here
}`,
                estimatedGasSaving: totalBytes * 3,
                bytecodeSaving: totalBytes,
            });
        }
        const isLikelyTestOrMock = contract.name?.toLowerCase().includes('test') || contract.name?.toLowerCase().includes('mock');
        const isLikelyUpgradeable = bytecode.includes('f4');
        if (bytecode.endsWith('0033') && !isLikelyTestOrMock && !isLikelyUpgradeable) {
            const metadataLength = this.estimateMetadataSize(bytecode);
            if (metadataLength > 50) {
                issues.push({
                    id: (0, uuid_1.v4)(),
                    type: 'bytecode_size',
                    title: 'Consider Removing Bytecode Metadata',
                    description: `Contract includes ~${metadataLength} bytes of metadata. For production, consider compiling with metadata hash set to "none".`,
                    impact: 'low',
                    location: { startLine: 1, endLine: 1 },
                    currentCode: '// Metadata included in bytecode',
                    suggestedCode: `// In solc settings:
{
  "settings": {
    "metadata": {
      "bytecodeHash": "none"
    }
  }
}`,
                    estimatedGasSaving: metadataLength * 68,
                    bytecodeSaving: metadataLength,
                });
            }
        }
        return issues;
    }
    findRepeatedPatterns(bytecode) {
        const patterns = new Map();
        const minPatternLength = 20;
        const maxPatternLength = 100;
        for (let len = minPatternLength; len <= maxPatternLength; len += 10) {
            for (let i = 0; i < bytecode.length - len; i += 10) {
                const pattern = bytecode.substring(i, i + len);
                if (/^(00|ff)+$/.test(pattern))
                    continue;
                const count = patterns.get(pattern) || 0;
                patterns.set(pattern, count + 1);
            }
        }
        const repeatedPatterns = [];
        for (const [pattern, count] of patterns) {
            if (count >= 3) {
                const savings = (count - 1) * (pattern.length / 2);
                repeatedPatterns.push({ pattern: pattern.substring(0, 20) + '...', count, savings });
            }
        }
        return repeatedPatterns
            .sort((a, b) => b.savings - a.savings)
            .slice(0, 5);
    }
    estimateMetadataSize(bytecode) {
        if (bytecode.length < 10)
            return 0;
        const lastTwoBytes = bytecode.slice(-4);
        try {
            const length = parseInt(lastTwoBytes, 16);
            if (length > 0 && length < 200) {
                return length + 2;
            }
        }
        catch {
        }
        return 53;
    }
};
exports.BytecodeAnalyzerService = BytecodeAnalyzerService;
exports.BytecodeAnalyzerService = BytecodeAnalyzerService = BytecodeAnalyzerService_1 = __decorate([
    (0, common_1.Injectable)()
], BytecodeAnalyzerService);
//# sourceMappingURL=bytecode-analyzer.service.js.map