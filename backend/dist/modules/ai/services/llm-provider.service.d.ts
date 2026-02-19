export interface LlmResponse {
    content: string;
    tokensUsed: number;
    model: string;
}
export declare class LlmProviderService {
    private readonly logger;
    private readonly apiKey;
    private readonly provider;
    constructor();
    generateCompletion(prompt: string, systemPrompt?: string): Promise<LlmResponse>;
    private callOpenAI;
    private callAnthropic;
    private useLocalHeuristics;
    private analyzeWithHeuristics;
}
