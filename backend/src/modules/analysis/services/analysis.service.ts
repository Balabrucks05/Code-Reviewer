import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { AnalysisPipelineService } from './analysis-pipeline.service';
import { AnalyzeContractDto } from '../dto/analyze-contract.dto';

@Injectable()
export class AnalysisService {
  private readonly logger = new Logger(AnalysisService.name);
  private readonly analysisCache = new Map<string, any>();

  constructor(private readonly pipelineService: AnalysisPipelineService) {}

  async analyze(dto: AnalyzeContractDto) {
    this.logger.debug(`Starting analysis for ${dto.contracts.length} contract(s)`);
    const analysisId = uuidv4();
    const startTime = Date.now();

    try {
      const result = await this.pipelineService.runPipeline({
        contracts: dto.contracts,
        options: dto.options || {},
      });

      if (!result.success) {
        this.logger.warn(`Compilation failed for analysis ${analysisId}`);
        const errorResult = {
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
          userId: dto.userId,
        };
        this.analysisCache.set(analysisId, errorResult);
        return errorResult;
      }

      const analysisResult = {
        id: analysisId,
        timestamp: new Date(),
        contracts: result.contracts,
        summary: this.calculateSummary(result),
        securityScore: result.securityScore,
        gasScore: result.gasScore,
        codeQualityScore: result.codeQualityScore,
        overallScore: this.calculateOverallScore(result),
        success: true,
        userId: dto.userId,
      };

      this.analysisCache.set(analysisId, analysisResult);
      this.logger.debug(`Analysis ${analysisId} completed in ${Date.now() - startTime}ms`);
      return analysisResult;
    } catch (error) {
      this.logger.error(`Analysis failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getAnalysisById(id: string, userId?: string) {
    const analysis = this.analysisCache.get(id);
    if (!analysis) return null;
    if (analysis.userId && analysis.userId !== userId) {
      throw new Error('Forbidden: You do not have access to this report.');
    }
    return analysis;
  }

  async getHistoryByUserId(userId: string) {
    const history = Array.from(this.analysisCache.values()).filter(
      (a) => a.userId === userId,
    );
    return history.sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
    );
  }

  async getSecurityIssues(id: string) {
    const analysis = await this.getAnalysisById(id);
    if (!analysis) return null;
    return analysis.contracts.flatMap((c: any) => c.securityIssues || []);
  }

  async getOptimizations(id: string) {
    const analysis = await this.getAnalysisById(id);
    if (!analysis) return null;
    return analysis.contracts.flatMap((c: any) => c.gasOptimizations || []);
  }

  async getAiReview(id: string) {
    const analysis = await this.getAnalysisById(id);
    if (!analysis) return null;
    return analysis.contracts.flatMap((c: any) => c.aiReviewComments || []);
  }

  private calculateSummary(result: any) {
    const allIssues = result.contracts.flatMap((c: any) => c.securityIssues || []);
    return {
      totalIssues: allIssues.length,
      criticalCount: allIssues.filter((i: any) => i.severity === 'critical').length,
      highCount: allIssues.filter((i: any) => i.severity === 'high').length,
      mediumCount: allIssues.filter((i: any) => i.severity === 'medium').length,
      lowCount: allIssues.filter((i: any) => i.severity === 'low').length,
      optimizationOpportunities: result.contracts.flatMap((c: any) => c.gasOptimizations || [])
        .length,
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
        result.codeQualityScore * weights.codeQuality,
    );
  }
}
