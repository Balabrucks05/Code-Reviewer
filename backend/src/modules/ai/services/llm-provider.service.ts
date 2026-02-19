import { Injectable, Logger } from '@nestjs/common';

export interface LlmResponse {
    content: string;
    tokensUsed: number;
    model: string;
}

@Injectable()
export class LlmProviderService {
    private readonly logger = new Logger(LlmProviderService.name);
    private readonly apiKey: string | undefined;
    private readonly provider: 'openai' | 'anthropic' | 'local';

    constructor() {
        // Configure based on environment
        this.apiKey = process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY;
        this.provider = process.env.LLM_PROVIDER as any || 'local';

        this.logger.log(`LLM Provider initialized: ${this.provider}`);
    }

    async generateCompletion(prompt: string, systemPrompt?: string): Promise<LlmResponse> {
        this.logger.debug(`Generating completion with ${this.provider}`);

        switch (this.provider) {
            case 'openai':
                return this.callOpenAI(prompt, systemPrompt);
            case 'anthropic':
                return this.callAnthropic(prompt, systemPrompt);
            case 'local':
            default:
                return this.useLocalHeuristics(prompt);
        }
    }

    private async callOpenAI(prompt: string, systemPrompt?: string): Promise<LlmResponse> {
        if (!this.apiKey) {
            this.logger.warn('OpenAI API key not configured, using local heuristics');
            return this.useLocalHeuristics(prompt);
        }

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                },
                body: JSON.stringify({
                    model: 'gpt-4-turbo-preview',
                    messages: [
                        { role: 'system', content: systemPrompt || 'You are a senior Solidity security auditor.' },
                        { role: 'user', content: prompt },
                    ],
                    temperature: 0.3,
                    max_tokens: 2000,
                }),
            });

            const data = await response.json();

            return {
                content: data.choices?.[0]?.message?.content || '',
                tokensUsed: data.usage?.total_tokens || 0,
                model: 'gpt-4-turbo-preview',
            };
        } catch (error) {
            this.logger.error(`OpenAI API error: ${error.message}`);
            return this.useLocalHeuristics(prompt);
        }
    }

    private async callAnthropic(prompt: string, systemPrompt?: string): Promise<LlmResponse> {
        if (!this.apiKey) {
            this.logger.warn('Anthropic API key not configured, using local heuristics');
            return this.useLocalHeuristics(prompt);
        }

        try {
            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey,
                    'anthropic-version': '2023-06-01',
                },
                body: JSON.stringify({
                    model: 'claude-3-opus-20240229',
                    max_tokens: 2000,
                    system: systemPrompt || 'You are a senior Solidity security auditor.',
                    messages: [
                        { role: 'user', content: prompt },
                    ],
                }),
            });

            const data = await response.json();

            return {
                content: data.content?.[0]?.text || '',
                tokensUsed: data.usage?.input_tokens + data.usage?.output_tokens || 0,
                model: 'claude-3-opus-20240229',
            };
        } catch (error) {
            this.logger.error(`Anthropic API error: ${error.message}`);
            return this.useLocalHeuristics(prompt);
        }
    }

    private async useLocalHeuristics(prompt: string): Promise<LlmResponse> {
        // Fallback to rule-based analysis when no API is configured
        this.logger.debug('Using local heuristics for AI analysis');

        // This provides basic pattern matching as a fallback
        const content = this.analyzeWithHeuristics(prompt);

        return {
            content,
            tokensUsed: 0,
            model: 'local-heuristics',
        };
    }

    private analyzeWithHeuristics(prompt: string): string {
        const issues: string[] = [];
        const code = prompt.toLowerCase();

        // Check for common patterns
        if (code.includes('public') && !code.includes('external')) {
            issues.push('Consider using `external` instead of `public` for functions only called externally.');
        }

        if (code.includes('require') && !code.includes('custom error')) {
            issues.push('Consider using custom errors instead of require statements for gas efficiency.');
        }

        if (!code.includes('natspec') && !code.includes('@notice') && !code.includes('@dev')) {
            issues.push('Add NatSpec documentation for better code readability and documentation generation.');
        }

        if (code.includes('for') && code.includes('length')) {
            issues.push('Consider caching array length outside loops for gas optimization.');
        }

        if (!code.includes('event')) {
            issues.push('Consider adding events for important state changes to enable off-chain monitoring.');
        }

        if (code.includes('magic number') || /[^a-z]\d{3,}[^a-z]/i.test(code)) {
            issues.push('Consider replacing magic numbers with named constants for better readability.');
        }

        return issues.length > 0
            ? issues.map((issue, i) => `${i + 1}. ${issue}`).join('\n')
            : 'No significant issues detected by local analysis. Configure an LLM API for deeper analysis.';
    }
}
