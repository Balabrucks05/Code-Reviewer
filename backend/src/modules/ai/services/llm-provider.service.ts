import { Injectable, Logger } from '@nestjs/common';

export interface LlmResponse {
  content: string;
  tokensUsed: number;
  model: string;
}

@Injectable()
export class LlmProviderService {
  private readonly logger = new Logger(LlmProviderService.name);
  private readonly apiKey: string;
  private readonly model: string;
  private readonly isAvailable: boolean;

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      this.logger.warn(
        'OPENAI_API_KEY is not set. AI reviews will use heuristic analysis instead. Set the key for full AI-powered reviews.',
      );
      this.apiKey = '';
      this.model = '';
      this.isAvailable = false;
      return;
    }
    this.apiKey = process.env.OPENAI_API_KEY;
    this.model = process.env.OPENAI_MODEL || 'gpt-4o';
    this.isAvailable = true;
    this.logger.debug(`LLM Provider initialized with OpenAI [Model: ${this.model}]`);
  }

  async generateCompletion(prompt: string, systemPrompt?: string): Promise<LlmResponse> {
    if (!this.isAvailable) {
      return {
        content: 'AI review is not available (OPENAI_API_KEY not configured). Heuristic analysis was used instead.',
        tokensUsed: 0,
        model: 'heuristic',
      };
    }

    const activeSystemPrompt =
      systemPrompt ||
      `You are a senior Solidity smart contract security auditor. Your primary directive is to review the provided smart contract code for vulnerabilities, logic flaws, out-of-bounds errors, reentrancy attacks, and access control issues. You must also suggest gas optimizations. Be extremely concise. Format your response strictly in Markdown format, using clear headings and bullet points. Focus purely on technical defects.`;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: activeSystemPrompt },
            { role: 'user', content: prompt },
          ],
          temperature: 0.2,
          max_tokens: 3000,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.error?.message || `OpenAI API returned HTTP ${response.status}`;
        throw new Error(errorMsg);
      }

      return {
        content: data.choices?.[0]?.message?.content || '',
        tokensUsed: data.usage?.total_tokens || 0,
        model: this.model,
      };
    } catch (error) {
      this.logger.error(`OpenAI Execution Error: ${error.message}`);
      throw new Error(`OpenAI Provider Failed: ${error.message}`);
    }
  }
}
