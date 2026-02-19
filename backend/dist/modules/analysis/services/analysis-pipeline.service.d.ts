import { AstParserService } from './ast-parser.service';
import { SecurityAnalyzerService } from '../../security/services/security-analyzer.service';
import { GasOptimizerService } from '../../optimization/services/gas-optimizer.service';
import { AiReviewService } from '../../ai/services/ai-review.service';
export interface PipelineInput {
    contracts: {
        filename: string;
        content: string;
    }[];
    options: {
        enableSecurityAudit?: boolean;
        enableGasOptimization?: boolean;
        enableAiReview?: boolean;
        compilerVersion?: string;
    };
}
export interface PipelineResult {
    contracts: ContractAnalysisResult[];
    securityScore: number;
    gasScore: number;
    codeQualityScore: number;
    compilationWarnings: any[];
    compilationErrors?: any[];
    success: boolean;
}
export interface ContractAnalysisResult {
    name: string;
    bytecodeSize: number;
    estimatedDeploymentGas: number;
    securityIssues: any[];
    gasOptimizations: any[];
    aiReviewComments: any[];
}
export declare class AnalysisPipelineService {
    private readonly astParser;
    private readonly securityAnalyzer;
    private readonly gasOptimizer;
    private readonly aiReview;
    private readonly logger;
    constructor(astParser: AstParserService, securityAnalyzer: SecurityAnalyzerService, gasOptimizer: GasOptimizerService, aiReview: AiReviewService);
    runPipeline(input: PipelineInput): Promise<PipelineResult>;
    private runSecurityAnalysis;
    private runGasOptimization;
    private runAiReview;
    private calculateSecurityScore;
    private calculateGasScore;
    private calculateCodeQualityScore;
    private estimateDeploymentGas;
}
