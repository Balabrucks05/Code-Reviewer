export interface BytecodeIssue {
    id: string;
    type: string;
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    location: {
        startLine: number;
        endLine: number;
    };
    currentCode: string;
    suggestedCode: string;
    estimatedGasSaving: number;
    bytecodeSaving?: number;
}
export declare class BytecodeAnalyzerService {
    private readonly logger;
    private readonly MAX_CONTRACT_SIZE;
    analyze(contract: any): Promise<BytecodeIssue[]>;
    private findRepeatedPatterns;
    private estimateMetadataSize;
}
