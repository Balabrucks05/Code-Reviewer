import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
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

@Injectable()
export class AnalysisService {
    private readonly logger = new Logger(AnalysisService.name);
    private readonly analysisCache = new Map<string, AnalysisResult>();

    constructor(private readonly pipelineService: AnalysisPipelineService) { }

    async analyze(dto: AnalyzeContractDto): Promise<AnalysisResult> {
        this.logger.log(`Starting analysis for ${dto.contracts.length} contract(s)`);

        const analysisId = uuidv4();
        const startTime = Date.now();

        try {
            // Run the analysis pipeline
            const result = await this.pipelineService.runPipeline({
                contracts: dto.contracts,
                options: dto.options || {},
            });

            // Handle compilation failure gracefully
            if (!result.success) {
                this.logger.warn(`Compilation failed for analysis ${analysisId}`);

                const errorResult: AnalysisResult = {
                    id: analysisId,
                    timestamp: new Date(),
                    contracts: [],
                    summary: {
                        totalIssues: 0,
                        criticalCount: 0,
                        highCount: 0,
                        mediumCount: 0,
                        lowCount: 0,
                        optimizationOpportunities: 0,
                    },
                    securityScore: 0,
                    gasScore: 0,
                    codeQualityScore: 0,
                    overallScore: 0,
                    success: false,
                    compilationErrors: result.compilationErrors,
                };

                this.analysisCache.set(analysisId, errorResult);
                return errorResult;
            }

            const analysisResult: AnalysisResult = {
                id: analysisId,
                timestamp: new Date(),
                contracts: result.contracts,
                summary: this.calculateSummary(result),
                securityScore: result.securityScore,
                gasScore: result.gasScore,
                codeQualityScore: result.codeQualityScore,
                overallScore: this.calculateOverallScore(result),
                success: true,
            };

            // Cache the result
            this.analysisCache.set(analysisId, analysisResult);

            this.logger.log(`Analysis ${analysisId} completed in ${Date.now() - startTime}ms`);
            return analysisResult;

        } catch (error) {
            this.logger.error(`Analysis failed: ${error.message}`, error.stack);
            throw error;
        }
    }

    async getAnalysisById(id: string): Promise<AnalysisResult | null> {
        return this.analysisCache.get(id) || null;
    }

    async getSecurityIssues(id: string) {
        const analysis = await this.getAnalysisById(id);
        if (!analysis) return null;

        return analysis.contracts.flatMap(c => c.securityIssues || []);
    }

    async getOptimizations(id: string) {
        const analysis = await this.getAnalysisById(id);
        if (!analysis) return null;

        return analysis.contracts.flatMap(c => c.gasOptimizations || []);
    }

    async getAiReview(id: string) {
        const analysis = await this.getAnalysisById(id);
        if (!analysis) return null;

        return analysis.contracts.flatMap(c => c.aiReviewComments || []);
    }

    private calculateSummary(result: any) {
        const allIssues = result.contracts.flatMap(c => c.securityIssues || []);

        return {
            totalIssues: allIssues.length,
            criticalCount: allIssues.filter(i => i.severity === 'critical').length,
            highCount: allIssues.filter(i => i.severity === 'high').length,
            mediumCount: allIssues.filter(i => i.severity === 'medium').length,
            lowCount: allIssues.filter(i => i.severity === 'low').length,
            optimizationOpportunities: result.contracts.flatMap(c => c.gasOptimizations || []).length,
        };
    }

    private calculateOverallScore(result: any): number {
        const weights = {
            security: 0.5,
            gas: 0.25,
            codeQuality: 0.25,
        };

        return Math.round(
            result.securityScore * weights.security +
            result.gasScore * weights.gas +
            result.codeQualityScore * weights.codeQuality
        );
    }
}
