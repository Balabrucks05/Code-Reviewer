import { LlmProviderService } from './llm-provider.service';
export interface AiReviewComment {
    id: string;
    category: string;
    title: string;
    reasoning: string;
    suggestion: string;
    location?: {
        startLine: number;
        endLine: number;
    };
    priority: 'required' | 'recommended' | 'optional';
    codeExample?: string;
}
export declare class AiReviewService {
    private readonly llmProvider;
    private readonly logger;
    constructor(llmProvider: LlmProviderService);
    reviewContract(contract: any, sourceContent: string): Promise<AiReviewComment[]>;
    private runHeuristicChecks;
    private checkDocumentation;
    private checkNamingConventions;
    private checkArchitecture;
    private checkUpgradeSafety;
    private runLlmAnalysis;
    private parseLlmResponse;
    private toUpperSnakeCase;
    private getLineNumber;
}
