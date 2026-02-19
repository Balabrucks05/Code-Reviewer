"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UncheckedCallsRule = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("uuid");
let UncheckedCallsRule = class UncheckedCallsRule {
    name = 'Unchecked External Calls Detector';
    id = 'SECURITY-003';
    description = 'Detects external calls without proper return value validation';
    severity = 'high';
    async check(contract, sourceContent) {
        const issues = [];
        const lines = sourceContent.split('\n');
        issues.push(...this.checkUncheckedLowLevelCalls(sourceContent, lines));
        issues.push(...this.checkUncheckedERC20(sourceContent, lines));
        return issues;
    }
    checkUncheckedLowLevelCalls(source, lines) {
        const issues = [];
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
                const prevContext = source.substring(Math.max(0, match.index - 50), match.index);
                const hasReturnCapture = /\(\s*bool\s+\w+\s*,?\s*\)?\s*=\s*$/.test(prevContext) ||
                    /bool\s+\w+\s*=\s*$/.test(prevContext);
                if (!hasReturnCapture) {
                    issues.push({
                        id: (0, uuid_1.v4)(),
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
    checkUncheckedERC20(source, lines) {
        const issues = [];
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
                const prevContext = source.substring(Math.max(0, match.index - 30), match.index);
                const hasCheck = /require\s*\($/.test(prevContext) ||
                    /bool\s+\w+\s*=\s*$/.test(prevContext) ||
                    /if\s*\(\s*!?$/.test(prevContext) ||
                    /safeTransfer/.test(line);
                if (!hasCheck) {
                    issues.push({
                        id: (0, uuid_1.v4)(),
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
    getLineNumber(source, index) {
        return source.substring(0, index).split('\n').length;
    }
};
exports.UncheckedCallsRule = UncheckedCallsRule;
exports.UncheckedCallsRule = UncheckedCallsRule = __decorate([
    (0, common_1.Injectable)()
], UncheckedCallsRule);
//# sourceMappingURL=unchecked-calls.rule.js.map