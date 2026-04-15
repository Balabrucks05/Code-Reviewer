import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

export interface BytecodeIssue {
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
export class BytecodeAnalyzerService {
    private readonly logger = new Logger(BytecodeAnalyzerService.name);
    private readonly MAX_CONTRACT_SIZE = 24576; // 24KB

    async analyze(contract: any): Promise<BytecodeIssue[]> {
        const issues: BytecodeIssue[] = [];

        if (!contract.deployedBytecode) {
            return issues;
        }

        const bytecodeSize = contract.deployedBytecode.length / 2; // hex to bytes
        this.logger.log(`Contract ${contract.name}: ${bytecodeSize} bytes (${((bytecodeSize / this.MAX_CONTRACT_SIZE) * 100).toFixed(1)}% of limit)`);

        // Check if approaching size limit
        if (bytecodeSize > this.MAX_CONTRACT_SIZE * 0.8) {
            issues.push({
                id: uuidv4(),
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

        // Analyze bytecode patterns
        const bytecode = contract.deployedBytecode;

        // Check for repeated patterns (potential for library extraction)
        const repeatedPatterns = this.findRepeatedPatterns(bytecode);
        if (repeatedPatterns.length > 0) {
            const totalBytes = repeatedPatterns.reduce((sum, p) => sum + p.savings, 0);

            issues.push({
                id: uuidv4(),
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
                estimatedGasSaving: totalBytes * 3, // Rough gas equivalent
                bytecodeSaving: totalBytes,
            });
        }

        // Check for metadata hash (can be removed in production)
        const isLikelyTestOrMock = contract.name?.toLowerCase().includes('test') || contract.name?.toLowerCase().includes('mock');
        const isLikelyUpgradeable = bytecode.includes('f4');
        if (bytecode.endsWith('0033') && !isLikelyTestOrMock && !isLikelyUpgradeable) {
            // CBOR encoded metadata is typically at the end
            const metadataLength = this.estimateMetadataSize(bytecode);

            if (metadataLength > 50) {
                issues.push({
                    id: uuidv4(),
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
                    estimatedGasSaving: metadataLength * 68, // Deployment gas savings
                    bytecodeSaving: metadataLength,
                });
            }
        }

        return issues;
    }

    private findRepeatedPatterns(bytecode: string): { pattern: string; count: number; savings: number }[] {
        const patterns: Map<string, number> = new Map();
        const minPatternLength = 20; // 10 bytes = 20 hex chars
        const maxPatternLength = 100; // 50 bytes

        // Sample the bytecode for patterns
        for (let len = minPatternLength; len <= maxPatternLength; len += 10) {
            for (let i = 0; i < bytecode.length - len; i += 10) {
                const pattern = bytecode.substring(i, i + len);

                // Skip patterns that are too uniform (likely padding)
                if (/^(00|ff)+$/.test(pattern)) continue;

                const count = patterns.get(pattern) || 0;
                patterns.set(pattern, count + 1);
            }
        }

        // Filter for patterns that appear multiple times
        const repeatedPatterns: { pattern: string; count: number; savings: number }[] = [];

        for (const [pattern, count] of patterns) {
            if (count >= 3) {
                const savings = (count - 1) * (pattern.length / 2); // Bytes saved
                repeatedPatterns.push({ pattern: pattern.substring(0, 20) + '...', count, savings });
            }
        }

        // Sort by savings
        return repeatedPatterns
            .sort((a, b) => b.savings - a.savings)
            .slice(0, 5); // Top 5
    }

    private estimateMetadataSize(bytecode: string): number {
        // CBOR metadata typically ends with a length indicator
        // This is a simplified estimation
        if (bytecode.length < 10) return 0;

        const lastTwoBytes = bytecode.slice(-4);
        try {
            const length = parseInt(lastTwoBytes, 16);
            if (length > 0 && length < 200) {
                return length + 2; // Include the length bytes
            }
        } catch {
            // Ignore parsing errors
        }

        return 53; // Default IPFS hash size + overhead
    }
}
