import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { ISecurityRule, SecurityIssue } from './security-rule.interface';

@Injectable()
export class ReentrancyRule implements ISecurityRule {
    name = 'Reentrancy Detector';
    id = 'SECURITY-001';
    description = 'Detects potential reentrancy vulnerabilities in external calls';
    severity: 'critical' = 'critical';

    // Patterns that indicate potential reentrancy
    private readonly dangerousPatterns = [
        /\.call\{.*value\s*:/,
        /\.call\(/,
        /\.send\(/,
        /\.transfer\(/,
    ];

    // State-changing operations after external calls
    private readonly stateChangePatterns = [
        /\w+\s*=\s*/,
        /\w+\[.*\]\s*=\s*/,
        /\w+\.\w+\s*=\s*/,
        /delete\s+/,
    ];

    async check(contract: any, sourceContent: string): Promise<SecurityIssue[]> {
        const issues: SecurityIssue[] = [];
        const lines = sourceContent.split('\n');

        // Find all functions in the source
        const functionMatches = this.findFunctions(sourceContent);

        for (const func of functionMatches) {
            const funcBody = func.body;
            const funcStartLine = func.startLine;

            // Find external calls in function
            const externalCalls = this.findExternalCalls(funcBody);

            for (const call of externalCalls) {
                // Check if there are state changes after the external call
                const codeAfterCall = funcBody.substring(call.endIndex);

                if (this.hasStateChangeAfterCall(codeAfterCall)) {
                    const lineNumber = funcStartLine + this.getLineNumber(funcBody, call.startIndex);

                    issues.push({
                        id: uuidv4(),
                        ruleId: this.id,
                        title: 'Potential Reentrancy Vulnerability',
                        description: `External call at line ${lineNumber} is followed by state changes. This pattern is vulnerable to reentrancy attacks where the called contract can re-enter this function before state is updated.`,
                        severity: this.severity,
                        confidence: 'high',
                        location: {
                            startLine: lineNumber,
                            endLine: lineNumber + 2,
                        },
                        codeSnippet: lines[lineNumber - 1]?.trim() || call.code,
                        recommendation: 'Apply the Checks-Effects-Interactions pattern: perform all state changes before making external calls. Consider using OpenZeppelin\'s ReentrancyGuard.',
                        fixExample: `// Before (vulnerable):
function withdraw(uint amount) external {
    require(balances[msg.sender] >= amount);
    (bool success,) = msg.sender.call{value: amount}("");
    require(success);
    balances[msg.sender] -= amount;  // State change after call
}

// After (secure):
function withdraw(uint amount) external nonReentrant {
    require(balances[msg.sender] >= amount);
    balances[msg.sender] -= amount;  // State change before call
    (bool success,) = msg.sender.call{value: amount}("");
    require(success);
}`,
                        references: [
                            'https://swcregistry.io/docs/SWC-107',
                            'https://consensys.github.io/smart-contract-best-practices/attacks/reentrancy/',
                        ],
                    });
                }
            }
        }

        return issues;
    }

    private findFunctions(source: string): { name: string; body: string; startLine: number }[] {
        const functions: { name: string; body: string; startLine: number }[] = [];
        const functionRegex = /function\s+(\w+)\s*\([^)]*\)[^{]*\{/g;
        let match;

        while ((match = functionRegex.exec(source)) !== null) {
            const startIndex = match.index;
            const startLine = this.getLineNumber(source, startIndex);
            const body = this.extractFunctionBody(source, match.index + match[0].length - 1);

            functions.push({
                name: match[1],
                body,
                startLine,
            });
        }

        return functions;
    }

    private extractFunctionBody(source: string, openBraceIndex: number): string {
        let braceCount = 1;
        let index = openBraceIndex + 1;

        while (braceCount > 0 && index < source.length) {
            if (source[index] === '{') braceCount++;
            if (source[index] === '}') braceCount--;
            index++;
        }

        return source.substring(openBraceIndex, index);
    }

    private findExternalCalls(funcBody: string): { code: string; startIndex: number; endIndex: number }[] {
        const calls: { code: string; startIndex: number; endIndex: number }[] = [];

        for (const pattern of this.dangerousPatterns) {
            const regex = new RegExp(pattern.source, 'g');
            let match;

            while ((match = regex.exec(funcBody)) !== null) {
                // Find the complete statement
                const statementEnd = funcBody.indexOf(';', match.index);
                const code = funcBody.substring(match.index, statementEnd + 1);

                calls.push({
                    code,
                    startIndex: match.index,
                    endIndex: statementEnd + 1,
                });
            }
        }

        return calls;
    }

    private hasStateChangeAfterCall(codeAfterCall: string): boolean {
        for (const pattern of this.stateChangePatterns) {
            if (pattern.test(codeAfterCall)) {
                return true;
            }
        }
        return false;
    }

    private getLineNumber(source: string, index: number): number {
        return source.substring(0, index).split('\n').length;
    }
}
