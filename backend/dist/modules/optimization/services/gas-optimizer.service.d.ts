import { BytecodeAnalyzerService } from './bytecode-analyzer.service';
export interface GasOptimization {
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
export declare class GasOptimizerService {
    private readonly bytecodeAnalyzer;
    private readonly logger;
    constructor(bytecodeAnalyzer: BytecodeAnalyzerService);
    analyze(contract: any, sourceContent: string): Promise<GasOptimization[]>;
    private checkStoragePacking;
    private checkUnnecessaryStorage;
    private checkCalldataVsMemory;
    private checkLoopOptimizations;
    private checkCommonGasPatterns;
    private getTypeSize;
    private isInLoop;
    private getLineNumber;
}
