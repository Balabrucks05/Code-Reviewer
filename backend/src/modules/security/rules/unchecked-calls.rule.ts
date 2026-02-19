import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { ISecurityRule, SecurityIssue } from './security-rule.interface';

@Injectable()
export class UncheckedCallsRule implements ISecurityRule {
    name = 'Unchecked External Calls Detector';
    id = 'SECURITY-003';
    description = 'Detects external calls without proper return value validation';
    severity: 'high' = 'high';

    async check(contract: any, sourceContent: string): Promise<SecurityIssue[]> {
        const issues: SecurityIssue[] = [];
        const lines = sourceContent.split('\n');

        // Check for unchecked low-level calls
        issues.push(...this.checkUncheckedLowLevelCalls(sourceContent, lines));

        // Check for unchecked ERC20 transfers
        issues.push(...this.checkUncheckedERC20(sourceContent, lines));

        return issues;
    }

    private checkUncheckedLowLevelCalls(source: string, lines: string[]): SecurityIssue[] {
        const issues: SecurityIssue[] = [];

        // Pattern for .call() that doesn't check return value
        // Look for .call that is NOT preceded by (bool success,) = or similar
        const callPatterns = [
            { pattern: /(\w+)\.call\{[^}]*\}\s*\([^)]*\)\s*;/g, type: 'call' },
            { pattern: /(\w+)\.call\([^)]*\)\s*;/g, type: 'call' },
            { pattern: /(\w+)\.delegatecall\([^)]*\)\s*;/g, type: 'delegatecall' },
            { pattern: /(\w+)\.staticcall\([^)]*\)\s*;/g, type: 'staticcall' },
        ];

        for (const { pattern, type } of callPatterns) {
            let match;
            const regex = new RegExp(pattern.source, 'g');

            while ((match = regex.exec(source)) !== null) {
                const lineNumber = this.getLineNumber(source, match.index);
                const line = lines[lineNumber - 1] || '';

                // Check if return value is captured
                const prevContext = source.substring(Math.max(0, match.index - 50), match.index);
                const hasReturnCapture = /\(\s*bool\s+\w+\s*,?\s*\)?\s*=\s*$/.test(prevContext) ||
                    /bool\s+\w+\s*=\s*$/.test(prevContext);

                if (!hasReturnCapture) {
                    issues.push({
                        id: uuidv4(),
                        ruleId: this.id,
                        title: `Unchecked ${type} Return Value`,
                        description: `The ${type} at line ${lineNumber} does not check the return value. If the call fails, execution will continue silently.`,
                        severity: type === 'delegatecall' ? 'critical' : this.severity,
                        confidence: 'high',
                        location: {
                            startLine: lineNumber,
                            endLine: lineNumber,
                        },
                        codeSnippet: line.trim(),
                        recommendation: `Always check the return value of ${type}. If the call fails and you don't check, funds or state could be corrupted.`,
                        fixExample: `// Unsafe:
payable(recipient).call{value: amount}("");

// Safe:
(bool success, ) = payable(recipient).call{value: amount}("");
require(success, "Transfer failed");`,
                        references: [
                            'https://swcregistry.io/docs/SWC-104',
                        ],
                    });
                }
            }
        }

        return issues;
    }

    private checkUncheckedERC20(source: string, lines: string[]): SecurityIssue[] {
        const issues: SecurityIssue[] = [];

        // Check for unchecked ERC20 transfer/transferFrom/approve
        const erc20Patterns = [
            /\.transfer\s*\([^)]+\)\s*;/g,
            /\.transferFrom\s*\([^)]+\)\s*;/g,
            /\.approve\s*\([^)]+\)\s*;/g,
        ];

        for (const pattern of erc20Patterns) {
            let match;

            while ((match = pattern.exec(source)) !== null) {
                const lineNumber = this.getLineNumber(source, match.index);
                const line = lines[lineNumber - 1] || '';

                // Check if return value is checked
                const prevContext = source.substring(Math.max(0, match.index - 30), match.index);
                const hasCheck = /require\s*\($/.test(prevContext) ||
                    /bool\s+\w+\s*=\s*$/.test(prevContext) ||
                    /if\s*\(\s*!?$/.test(prevContext) ||
                    /safeTransfer/.test(line);

                if (!hasCheck) {
                    issues.push({
                        id: uuidv4(),
                        ruleId: this.id,
                        title: 'Unchecked ERC20 Return Value',
                        description: `The ERC20 call at line ${lineNumber} does not check the return value. Some tokens (like USDT) don't revert on failure but return false.`,
                        severity: 'medium',
                        confidence: 'medium',
                        location: {
                            startLine: lineNumber,
                            endLine: lineNumber,
                        },
                        codeSnippet: line.trim(),
                        recommendation: 'Use OpenZeppelin\'s SafeERC20 library with safeTransfer/safeTransferFrom/safeApprove.',
                        fixExample: `// Using SafeERC20:
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

using SafeERC20 for IERC20;

// Instead of:
token.transfer(recipient, amount);

// Use:
token.safeTransfer(recipient, amount);`,
                        references: [
                            'https://github.com/d-xo/weird-erc20',
                        ],
                    });
                }
            }
        }

        return issues;
    }

    private getLineNumber(source: string, index: number): number {
        return source.substring(0, index).split('\n').length;
    }
}
