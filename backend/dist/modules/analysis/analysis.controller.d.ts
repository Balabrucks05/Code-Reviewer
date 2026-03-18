import { AnalysisService } from './services/analysis.service';
import { AnalyzeContractDto } from './dto/analyze-contract.dto';
export declare class AnalysisController {
    private readonly analysisService;
    constructor(analysisService: AnalysisService);
    analyzeContract(dto: AnalyzeContractDto): Promise<import("./services/analysis.service").AnalysisResult>;
    getHistory(userId: string): Promise<import("./services/analysis.service").AnalysisResult[]>;
    getAnalysis(id: string, userId?: string): Promise<import("./services/analysis.service").AnalysisResult>;
    getSecurityIssues(id: string): Promise<any[] | null>;
    getOptimizations(id: string): Promise<any[] | null>;
    getAiReview(id: string): Promise<any[] | null>;
}
