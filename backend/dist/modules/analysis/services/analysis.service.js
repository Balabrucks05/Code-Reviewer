"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AnalysisService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalysisService = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("uuid");
const analysis_pipeline_service_1 = require("./analysis-pipeline.service");
let AnalysisService = AnalysisService_1 = class AnalysisService {
    pipelineService;
    logger = new common_1.Logger(AnalysisService_1.name);
    analysisCache = new Map();
    constructor(pipelineService) {
        this.pipelineService = pipelineService;
    }
    async analyze(dto) {
        this.logger.log(`Starting analysis for ${dto.contracts.length} contract(s)`);
        const analysisId = (0, uuid_1.v4)();
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
            };
            this.analysisCache.set(analysisId, analysisResult);
            this.logger.log(`Analysis ${analysisId} completed in ${Date.now() - startTime}ms`);
            return analysisResult;
        }
        catch (error) {
            this.logger.error(`Analysis failed: ${error.message}`, error.stack);
            throw error;
        }
    }
    async getAnalysisById(id) {
        return this.analysisCache.get(id) || null;
    }
    async getSecurityIssues(id) {
        const analysis = await this.getAnalysisById(id);
        if (!analysis)
            return null;
        return analysis.contracts.flatMap(c => c.securityIssues || []);
    }
    async getOptimizations(id) {
        const analysis = await this.getAnalysisById(id);
        if (!analysis)
            return null;
        return analysis.contracts.flatMap(c => c.gasOptimizations || []);
    }
    async getAiReview(id) {
        const analysis = await this.getAnalysisById(id);
        if (!analysis)
            return null;
        return analysis.contracts.flatMap(c => c.aiReviewComments || []);
    }
    calculateSummary(result) {
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
    calculateOverallScore(result) {
        const weights = {
            security: 0.5,
            gas: 0.25,
            codeQuality: 0.25,
        };
        return Math.round(result.securityScore * weights.security +
            result.gasScore * weights.gas +
            result.codeQualityScore * weights.codeQuality);
    }
};
exports.AnalysisService = AnalysisService;
exports.AnalysisService = AnalysisService = AnalysisService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [analysis_pipeline_service_1.AnalysisPipelineService])
], AnalysisService);
//# sourceMappingURL=analysis.service.js.map