import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { LlmProviderService } from './llm-provider.service';

export interface AiReviewComment {
    id: string;
    category: string;
    title: string;
    reasoning: string;
    suggestion: string;
    location?: { startLine: number; endLine: number };
    priority: 'required' | 'recommended' | 'optional';
    codeExample?: string;
}

@Injectable()
export class AiReviewService {
    private readonly logger = new Logger(AiReviewService.name);

    constructor(private readonly llmProvider: LlmProviderService) { }

    async reviewContract(contract: any, sourceContent: string): Promise<AiReviewComment[]> {
        this.logger.log(`Starting AI review for ${contract.name}`);

        const comments: AiReviewComment[] = [];

        // Run heuristic checks first (always available)
        comments.push(...this.runHeuristicChecks(sourceContent));

        // Try LLM-based analysis
        try {
            const llmComments = await this.runLlmAnalysis(contract, sourceContent);
            comments.push(...llmComments);
        } catch (error) {
            this.logger.warn(`LLM analysis failed: ${error.message}`);
        }

        return comments;
    }

    private runHeuristicChecks(source: string): AiReviewComment[] {
        const comments: AiReviewComment[] = [];
        const lines = source.split('\n');

        // Check for documentation
        comments.push(...this.checkDocumentation(source, lines));

        // Check naming conventions
        comments.push(...this.checkNamingConventions(source, lines));

        // Check architecture patterns
        comments.push(...this.checkArchitecture(source, lines));

        // Check upgrade safety
        comments.push(...this.checkUpgradeSafety(source, lines));

        return comments;
    }

    private checkDocumentation(source: string, lines: string[]): AiReviewComment[] {
        const comments: AiReviewComment[] = [];

        // Check contract-level documentation
        const contractMatch = /contract\s+(\w+)/.exec(source);
        if (contractMatch) {
            const contractLine = this.getLineNumber(source, contractMatch.index);
            const prevLines = lines.slice(Math.max(0, contractLine - 5), contractLine - 1).join('\n');

            if (!/@title|@notice|@dev|\/\/\//.test(prevLines)) {
                comments.push({
                    id: uuidv4(),
                    category: 'documentation',
                    title: 'Missing Contract Documentation',
                    reasoning: 'Well-documented contracts are easier to audit, maintain, and integrate. NatSpec documentation is essential for production contracts.',
                    suggestion: 'Add NatSpec documentation to the contract with @title, @author, @notice, and @dev tags.',
                    location: { startLine: contractLine, endLine: contractLine },
                    priority: 'recommended',
                    codeExample: `/// @title ${contractMatch[1]}
/// @author Your Name
/// @notice Explain what this contract does
/// @dev Implementation details for developers
contract ${contractMatch[1]} {`,
                });
            }
        }

        // Check for undocumented public functions
        const publicFuncPattern = /function\s+(\w+)\s*\([^)]*\)\s*(public|external)/g;
        let match;

        while ((match = publicFuncPattern.exec(source)) !== null) {
            const funcName = match[1];
            const funcLine = this.getLineNumber(source, match.index);
            const prevLines = lines.slice(Math.max(0, funcLine - 4), funcLine - 1).join('\n');

            if (!/@notice|@dev|\/\/\//.test(prevLines) && funcName !== 'constructor') {
                comments.push({
                    id: uuidv4(),
                    category: 'documentation',
                    title: `Missing Documentation for ${funcName}`,
                    reasoning: 'Public functions are part of the contract\'s API and should be documented for users and integrators.',
                    suggestion: `Add NatSpec documentation for the ${funcName} function.`,
                    location: { startLine: funcLine, endLine: funcLine },
                    priority: 'optional',
                });
            }
        }

        return comments;
    }

    private checkNamingConventions(source: string, lines: string[]): AiReviewComment[] {
        const comments: AiReviewComment[] = [];

        // Check constant naming (should be UPPER_CASE)
        const constantPattern = /\b(uint\d*|int\d*|address|bool|bytes\d*)\s+.*\bconstant\s+(\w+)/g;
        let match;

        while ((match = constantPattern.exec(source)) !== null) {
            const constName = match[2];
            const lineNumber = this.getLineNumber(source, match.index);

            if (!/^[A-Z][A-Z0-9_]*$/.test(constName)) {
                comments.push({
                    id: uuidv4(),
                    category: 'naming',
                    title: 'Non-Standard Constant Naming',
                    reasoning: 'Constants should use UPPER_CASE_WITH_UNDERSCORES per Solidity style guide for immediate recognition.',
                    suggestion: `Rename '${constName}' to '${this.toUpperSnakeCase(constName)}'.`,
                    location: { startLine: lineNumber, endLine: lineNumber },
                    priority: 'optional',
                });
            }
        }

        // Check internal/private function naming (should start with underscore)
        const privateFuncPattern = /function\s+(\w+)[^{]*\b(internal|private)\b/g;

        while ((match = privateFuncPattern.exec(source)) !== null) {
            const funcName = match[1];
            const lineNumber = this.getLineNumber(source, match.index);

            if (!funcName.startsWith('_') && funcName !== 'constructor') {
                comments.push({
                    id: uuidv4(),
                    category: 'naming',
                    title: 'Internal Function Naming Convention',
                    reasoning: 'Internal and private functions are conventionally prefixed with underscore to distinguish from external API.',
                    suggestion: `Consider renaming '${funcName}' to '_${funcName}'.`,
                    location: { startLine: lineNumber, endLine: lineNumber },
                    priority: 'optional',
                });
            }
        }

        return comments;
    }

    private checkArchitecture(source: string, lines: string[]): AiReviewComment[] {
        const comments: AiReviewComment[] = [];

        // Check for god contract (too many functions)
        const funcCount = (source.match(/function\s+\w+/g) || []).length;

        if (funcCount > 20) {
            comments.push({
                id: uuidv4(),
                category: 'architecture',
                title: 'Consider Contract Decomposition',
                reasoning: `Contract has ${funcCount} functions. Large contracts are harder to audit, test, and maintain.`,
                suggestion: 'Consider splitting into smaller, focused contracts using composition or inheritance.',
                priority: 'recommended',
            });
        }

        // Check for missing interface
        const contractMatch = /contract\s+(\w+)/.exec(source);
        if (contractMatch && !source.includes('interface I' + contractMatch[1])) {
            const hasPublicFuncs = /function\s+\w+[^{]*(public|external)/.test(source);

            if (hasPublicFuncs) {
                comments.push({
                    id: uuidv4(),
                    category: 'architecture',
                    title: 'Consider Defining an Interface',
                    reasoning: 'Interfaces improve composability, testing, and serve as documentation for the contract\'s API.',
                    suggestion: `Extract public functions to an I${contractMatch[1]} interface.`,
                    priority: 'optional',
                });
            }
        }

        // Check for missing events on state changes
        const stateChanges = source.match(/\b\w+\s*=\s*[^=]/g) || [];
        const eventEmits = source.match(/emit\s+\w+/g) || [];

        if (stateChanges.length > eventEmits.length * 2) {
            comments.push({
                id: uuidv4(),
                category: 'architecture',
                title: 'Consider Adding Events',
                reasoning: 'Events enable off-chain monitoring and indexing. The contract has many state changes but few event emissions.',
                suggestion: 'Add events for important state changes to improve transparency and enable event-driven integrations.',
                priority: 'recommended',
            });
        }

        return comments;
    }

    private checkUpgradeSafety(source: string, lines: string[]): AiReviewComment[] {
        const comments: AiReviewComment[] = [];

        // Only check if it appears to be upgradeable
        if (!/Upgradeable|Initializable|Proxy/.test(source)) {
            return comments;
        }

        // Check for direct variable declarations that could break on upgrade
        const hasStorageVars = /^\s*(uint\d*|int\d*|address|bool|bytes\d*|mapping|string)\s+\w+/m.test(source);
        const hasGap = /__gap/.test(source);

        if (hasStorageVars && !hasGap) {
            comments.push({
                id: uuidv4(),
                category: 'upgrade_safety',
                title: 'Missing Storage Gap for Future Upgrades',
                reasoning: 'Without a storage gap, adding new state variables in future upgrades could corrupt existing storage.',
                suggestion: 'Add a storage gap at the end of state variables: uint256[50] private __gap;',
                priority: 'required',
                codeExample: `// Add at the end of state variables:
uint256[50] private __gap;`,
            });
        }

        // Check for selfdestruct or delegatecall
        if (/selfdestruct|delegatecall/.test(source)) {
            const match = /selfdestruct|delegatecall/.exec(source);
            const lineNumber = match ? this.getLineNumber(source, match.index) : 1;

            comments.push({
                id: uuidv4(),
                category: 'upgrade_safety',
                title: 'Dangerous Operation in Upgradeable Contract',
                reasoning: 'selfdestruct and unrestricted delegatecall can destroy or corrupt the implementation, breaking all proxies.',
                suggestion: 'Remove selfdestruct. For delegatecall, ensure strict access control and target validation.',
                location: { startLine: lineNumber, endLine: lineNumber },
                priority: 'required',
            });
        }

        return comments;
    }

    private async runLlmAnalysis(contract: any, source: string): Promise<AiReviewComment[]> {
        const systemPrompt = `You are a senior Solidity security auditor and code reviewer. Analyze the following smart contract and provide constructive feedback on:
1. Code readability and organization
2. Best practices compliance
3. Production readiness
4. Architecture decisions

Respond in JSON format with an array of comments, each having:
- category: one of [architecture, readability, best_practice, production_readiness]
- title: short title
- reasoning: why this matters
- suggestion: what to do
- priority: one of [required, recommended, optional]`;

        const prompt = `Analyze this Solidity contract:\n\n\`\`\`solidity\n${source.substring(0, 4000)}\n\`\`\``;

        const response = await this.llmProvider.generateCompletion(prompt, systemPrompt);

        // Parse LLM response (handle both structured and unstructured)
        return this.parseLlmResponse(response.content);
    }

    private parseLlmResponse(content: string): AiReviewComment[] {
        try {
            // Try to parse as JSON
            const jsonMatch = content.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return parsed.map((item: any) => ({
                    id: uuidv4(),
                    category: item.category || 'best_practice',
                    title: item.title || 'AI Review Comment',
                    reasoning: item.reasoning || item.reason || '',
                    suggestion: item.suggestion || item.fix || '',
                    priority: item.priority || 'recommended',
                }));
            }
        } catch {
            // If JSON parsing fails, extract from text
        }

        // Fallback: treat as single comment
        if (content.length > 50) {
            return [{
                id: uuidv4(),
                category: 'best_practice',
                title: 'AI Review Summary',
                reasoning: content.substring(0, 500),
                suggestion: 'Review the AI analysis above for specific recommendations.',
                priority: 'recommended',
            }];
        }

        return [];
    }

    private toUpperSnakeCase(str: string): string {
        return str
            .replace(/([a-z])([A-Z])/g, '$1_$2')
            .replace(/[\s-]+/g, '_')
            .toUpperCase();
    }

    private getLineNumber(source: string, index: number): number {
        return source.substring(0, index).split('\n').length;
    }
}
