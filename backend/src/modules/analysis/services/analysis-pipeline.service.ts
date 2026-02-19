import { Injectable, Logger } from '@nestjs/common';
import { AstParserService, ParsedContract } from './ast-parser.service';
import { SecurityAnalyzerService } from '../../security/services/security-analyzer.service';
import { GasOptimizerService } from '../../optimization/services/gas-optimizer.service';
import { AiReviewService } from '../../ai/services/ai-review.service';

export interface PipelineInput {
    contracts: { filename: string; content: string }[];
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

@Injectable()
export class AnalysisPipelineService {
    private readonly logger = new Logger(AnalysisPipelineService.name);

    constructor(
        private readonly astParser: AstParserService,
        private readonly securityAnalyzer: SecurityAnalyzerService,
        private readonly gasOptimizer: GasOptimizerService,
        private readonly aiReview: AiReviewService,
    ) { }

    async runPipeline(input: PipelineInput): Promise<PipelineResult> {
        this.logger.log('Starting analysis pipeline...');

        // Step 1: Compile and parse AST
        this.logger.log('Step 1: Compiling contracts...');
        const compilationResult = await this.astParser.compile(
            input.contracts,
            input.options.compilerVersion,
        );

        if (!compilationResult.success) {
            this.logger.warn('Compilation failed - returning error response');

            // Check if it's an import error and provide helpful message
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

        // Step 2: Run analysis for each contract
        const contractResults: ContractAnalysisResult[] = [];
        let totalSecurityScore = 0;
        let totalGasScore = 0;
        let totalCodeQualityScore = 0;

        for (const contract of compilationResult.contracts) {
            this.logger.log(`Analyzing contract: ${contract.name}`);

            const sourceContent = input.contracts.find(c =>
                c.content.includes(`contract ${contract.name}`)
            )?.content || '';

            // Run parallel analysis
            const [securityIssues, gasOptimizations, aiReviewComments] = await Promise.all([
                this.runSecurityAnalysis(contract, sourceContent, input.options.enableSecurityAudit),
                this.runGasOptimization(contract, sourceContent, input.options.enableGasOptimization),
                this.runAiReview(contract, sourceContent, input.options.enableAiReview),
            ]);

            // Calculate scores
            const securityScore = this.calculateSecurityScore(securityIssues);
            const gasScore = this.calculateGasScore(contract, gasOptimizations);
            const codeQualityScore = this.calculateCodeQualityScore(aiReviewComments);

            totalSecurityScore += securityScore;
            totalGasScore += gasScore;
            totalCodeQualityScore += codeQualityScore;

            contractResults.push({
                name: contract.name,
                bytecodeSize: contract.deployedBytecode.length / 2, // hex to bytes
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

    private async runSecurityAnalysis(
        contract: ParsedContract,
        sourceContent: string,
        enabled = true,
    ): Promise<any[]> {
        if (!enabled) return [];

        try {
            return await this.securityAnalyzer.analyze(contract, sourceContent);
        } catch (error) {
            this.logger.warn(`Security analysis failed for ${contract.name}: ${error.message}`);
            return [];
        }
    }

    private async runGasOptimization(
        contract: ParsedContract,
        sourceContent: string,
        enabled = true,
    ): Promise<any[]> {
        if (!enabled) return [];

        try {
            return await this.gasOptimizer.analyze(contract, sourceContent);
        } catch (error) {
            this.logger.warn(`Gas optimization failed for ${contract.name}: ${error.message}`);
            return [];
        }
    }

    private async runAiReview(
        contract: ParsedContract,
        sourceContent: string,
        enabled = true,
    ): Promise<any[]> {
        if (!enabled) return [];

        try {
            return await this.aiReview.reviewContract(contract, sourceContent);
        } catch (error) {
            this.logger.warn(`AI review failed for ${contract.name}: ${error.message}`);
            return [];
        }
    }

    private calculateSecurityScore(issues: any[]): number {
        if (issues.length === 0) return 100;

        let deductions = 0;
        for (const issue of issues) {
            switch (issue.severity) {
                case 'critical': deductions += 30; break;
                case 'high': deductions += 20; break;
                case 'medium': deductions += 10; break;
                case 'low': deductions += 5; break;
                default: deductions += 2;
            }
        }

        return Math.max(0, 100 - deductions);
    }

    private calculateGasScore(contract: ParsedContract, optimizations: any[]): number {
        const bytecodeSize = contract.deployedBytecode.length / 2;
        const maxSize = 24576; // 24KB limit

        // Base score from bytecode size
        let score = 100 - (bytecodeSize / maxSize) * 50;

        // Deduct for each optimization opportunity
        score -= optimizations.length * 3;

        return Math.max(0, Math.min(100, Math.round(score)));
    }

    private calculateCodeQualityScore(comments: any[]): number {
        if (comments.length === 0) return 95; // No issues found

        let deductions = 0;
        for (const comment of comments) {
            switch (comment.priority) {
                case 'required': deductions += 15; break;
                case 'recommended': deductions += 8; break;
                case 'optional': deductions += 3; break;
            }
        }

        return Math.max(0, 100 - deductions);
    }

    private estimateDeploymentGas(bytecode: string): number {
        const bytes = bytecode.length / 2;
        // Base cost + per-byte cost (200 gas for non-zero, 4 for zero)
        // Rough estimate using average of 68 gas per byte
        return 21000 + bytes * 68;
    }
}
