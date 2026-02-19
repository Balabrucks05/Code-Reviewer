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
var AnalysisPipelineService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalysisPipelineService = void 0;
const common_1 = require("@nestjs/common");
const ast_parser_service_1 = require("./ast-parser.service");
const security_analyzer_service_1 = require("../../security/services/security-analyzer.service");
const gas_optimizer_service_1 = require("../../optimization/services/gas-optimizer.service");
const ai_review_service_1 = require("../../ai/services/ai-review.service");
let AnalysisPipelineService = AnalysisPipelineService_1 = class AnalysisPipelineService {
    astParser;
    securityAnalyzer;
    gasOptimizer;
    aiReview;
    logger = new common_1.Logger(AnalysisPipelineService_1.name);
    constructor(astParser, securityAnalyzer, gasOptimizer, aiReview) {
        this.astParser = astParser;
        this.securityAnalyzer = securityAnalyzer;
        this.gasOptimizer = gasOptimizer;
        this.aiReview = aiReview;
    }
    async runPipeline(input) {
        this.logger.log('Starting analysis pipeline...');
        this.logger.log('Step 1: Compiling contracts...');
        const compilationResult = await this.astParser.compile(input.contracts, input.options.compilerVersion);
        if (!compilationResult.success) {
            this.logger.warn('Compilation failed - returning error response');
            const errorMessages = compilationResult.errors.map(e => e.message).join(', ');
            const hasImportErrors = errorMessages.includes('not found') || errorMessages.includes('import');
            return {
                success: false,
                contracts: [],
                securityScore: 0,
                gasScore: 0,
                codeQualityScore: 0,
                compilationWarnings: compilationResult.warnings,
                compilationErrors: compilationResult.errors.map(e => ({
                    ...e,
                    suggestion: hasImportErrors
                        ? 'This contract has external dependencies. Please ensure all imported files are included, or analyze individual contract files without external imports.'
                        : 'Please check the Solidity syntax and try again.'
                })),
            };
        }
        const contractResults = [];
        let totalSecurityScore = 0;
        let totalGasScore = 0;
        let totalCodeQualityScore = 0;
        for (const contract of compilationResult.contracts) {
            this.logger.log(`Analyzing contract: ${contract.name}`);
            const sourceContent = input.contracts.find(c => c.content.includes(`contract ${contract.name}`))?.content || '';
            const [securityIssues, gasOptimizations, aiReviewComments] = await Promise.all([
                this.runSecurityAnalysis(contract, sourceContent, input.options.enableSecurityAudit),
                this.runGasOptimization(contract, sourceContent, input.options.enableGasOptimization),
                this.runAiReview(contract, sourceContent, input.options.enableAiReview),
            ]);
            const securityScore = this.calculateSecurityScore(securityIssues);
            const gasScore = this.calculateGasScore(contract, gasOptimizations);
            const codeQualityScore = this.calculateCodeQualityScore(aiReviewComments);
            totalSecurityScore += securityScore;
            totalGasScore += gasScore;
            totalCodeQualityScore += codeQualityScore;
            contractResults.push({
                name: contract.name,
                bytecodeSize: contract.deployedBytecode.length / 2,
                estimatedDeploymentGas: this.estimateDeploymentGas(contract.bytecode),
                securityIssues,
                gasOptimizations,
                aiReviewComments,
            });
        }
        const contractCount = compilationResult.contracts.length || 1;
        return {
            success: true,
            contracts: contractResults,
            securityScore: Math.round(totalSecurityScore / contractCount),
            gasScore: Math.round(totalGasScore / contractCount),
            codeQualityScore: Math.round(totalCodeQualityScore / contractCount),
            compilationWarnings: compilationResult.warnings,
        };
    }
    async runSecurityAnalysis(contract, sourceContent, enabled = true) {
        if (!enabled)
            return [];
        try {
            return await this.securityAnalyzer.analyze(contract, sourceContent);
        }
        catch (error) {
            this.logger.warn(`Security analysis failed for ${contract.name}: ${error.message}`);
            return [];
        }
    }
    async runGasOptimization(contract, sourceContent, enabled = true) {
        if (!enabled)
            return [];
        try {
            return await this.gasOptimizer.analyze(contract, sourceContent);
        }
        catch (error) {
            this.logger.warn(`Gas optimization failed for ${contract.name}: ${error.message}`);
            return [];
        }
    }
    async runAiReview(contract, sourceContent, enabled = true) {
        if (!enabled)
            return [];
        try {
            return await this.aiReview.reviewContract(contract, sourceContent);
        }
        catch (error) {
            this.logger.warn(`AI review failed for ${contract.name}: ${error.message}`);
            return [];
        }
    }
    calculateSecurityScore(issues) {
        if (issues.length === 0)
            return 100;
        let deductions = 0;
        for (const issue of issues) {
            switch (issue.severity) {
                case 'critical':
                    deductions += 30;
                    break;
                case 'high':
                    deductions += 20;
                    break;
                case 'medium':
                    deductions += 10;
                    break;
                case 'low':
                    deductions += 5;
                    break;
                default: deductions += 2;
            }
        }
        return Math.max(0, 100 - deductions);
    }
    calculateGasScore(contract, optimizations) {
        const bytecodeSize = contract.deployedBytecode.length / 2;
        const maxSize = 24576;
        let score = 100 - (bytecodeSize / maxSize) * 50;
        score -= optimizations.length * 3;
        return Math.max(0, Math.min(100, Math.round(score)));
    }
    calculateCodeQualityScore(comments) {
        if (comments.length === 0)
            return 95;
        let deductions = 0;
        for (const comment of comments) {
            switch (comment.priority) {
                case 'required':
                    deductions += 15;
                    break;
                case 'recommended':
                    deductions += 8;
                    break;
                case 'optional':
                    deductions += 3;
                    break;
            }
        }
        return Math.max(0, 100 - deductions);
    }
    estimateDeploymentGas(bytecode) {
        const bytes = bytecode.length / 2;
        return 21000 + bytes * 68;
    }
};
exports.AnalysisPipelineService = AnalysisPipelineService;
exports.AnalysisPipelineService = AnalysisPipelineService = AnalysisPipelineService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [ast_parser_service_1.AstParserService,
        security_analyzer_service_1.SecurityAnalyzerService,
        gas_optimizer_service_1.GasOptimizerService,
        ai_review_service_1.AiReviewService])
], AnalysisPipelineService);
//# sourceMappingURL=analysis-pipeline.service.js.map