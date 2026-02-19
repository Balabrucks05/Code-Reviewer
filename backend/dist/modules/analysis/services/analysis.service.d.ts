import { AnalysisPipelineService } from './analysis-pipeline.service';
import { AnalyzeContractDto } from '../dto/analyze-contract.dto';
export interface AnalysisResult {
    id: string;
    timestamp: Date;
    contracts: any[];
    summary: {
        totalIssues: number;
        criticalCount: number;
        highCount: number;
        mediumCount: number;
        lowCount: number;
        optimizationOpportunities: number;
    };
    securityScore: number;
    gasScore: number;
    codeQualityScore: number;
    overallScore: number;
    success?: boolean;
    compilationErrors?: any[];
}
export declare class AnalysisService {
    private readonly pipelineService;
    private readonly logger;
    private readonly analysisCache;
    constructor(pipelineService: AnalysisPipelineService);
    analyze(dto: AnalyzeContractDto): Promise<AnalysisResult>;
    getAnalysisById(id: string): Promise<AnalysisResult | null>;
    getSecurityIssues(id: string): Promise<any[] | null>;
    getOptimizations(id: string): Promise<any[] | null>;
    getAiReview(id: string): Promise<any[] | null>;
    private calculateSummary;
    private calculateOverallScore;
}
