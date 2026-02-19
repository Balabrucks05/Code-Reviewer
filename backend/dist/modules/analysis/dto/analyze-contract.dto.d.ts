export declare class ContractSourceDto {
    filename: string;
    content: string;
}
export declare class AnalysisOptionsDto {
    enableSecurityAudit?: boolean;
    enableGasOptimization?: boolean;
    enableAiReview?: boolean;
    compilerVersion?: string;
}
export declare class AnalyzeContractDto {
    contracts: ContractSourceDto[];
    options?: AnalysisOptionsDto;
}
