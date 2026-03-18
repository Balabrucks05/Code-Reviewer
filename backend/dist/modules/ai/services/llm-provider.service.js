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
var LlmProviderService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LlmProviderService = void 0;
const common_1 = require("@nestjs/common");
let LlmProviderService = LlmProviderService_1 = class LlmProviderService {
    logger = new common_1.Logger(LlmProviderService_1.name);
    apiKey;
    model;
    constructor() {
        if (!process.env.OPENAI_API_KEY) {
            const errorMsg = 'CRITICAL: OPENAI_API_KEY is missing. AI Code Reviews cannot be generated until this is configured.';
            this.logger.error(errorMsg);
            throw new Error(errorMsg);
        }
        this.apiKey = process.env.OPENAI_API_KEY;
        this.model = process.env.OPENAI_MODEL || 'gpt-4o';
        this.logger.debug(`LLM Provider initialized exclusively with OpenAI [Model: ${this.model}]`);
    }
    async generateCompletion(prompt, systemPrompt) {
        const activeSystemPrompt = systemPrompt ||
            `You are a senior Solidity smart contract security auditor. Your primary directive is to review the provided smart contract code for vulnerabilities, logic flaws, out-of-bounds errors, reentrancy attacks, and access control issues. You must also suggest gas optimizations. Be extremely concise. Format your response strictly in Markdown format, using clear headings and bullet points. Focus purely on technical defects.`;
        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [
                        { role: 'system', content: activeSystemPrompt },
                        { role: 'user', content: prompt }
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
        }
        catch (error) {
            this.logger.error(`OpenAI Execution Error: ${error.message}`);
            throw new Error(`OpenAI Provider Failed: ${error.message}`);
        }
    }
};
exports.LlmProviderService = LlmProviderService;
exports.LlmProviderService = LlmProviderService = LlmProviderService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], LlmProviderService);
//# sourceMappingURL=llm-provider.service.js.map