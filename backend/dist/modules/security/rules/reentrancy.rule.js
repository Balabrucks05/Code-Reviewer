"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReentrancyRule = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("uuid");
let ReentrancyRule = class ReentrancyRule {
    name = 'Reentrancy Detector';
    id = 'SECURITY-001';
    description = 'Detects potential reentrancy vulnerabilities in external calls';
    severity = 'critical';
    dangerousPatterns = [
        /\.call\{.*value\s*:/,
        /\.call\(/,
        /\.send\(/,
        /\.transfer\(/,
    ];
    stateChangePatterns = [
        /\w+\s*=\s*/,
        /\w+\[.*\]\s*=\s*/,
        /\w+\.\w+\s*=\s*/,
        /delete\s+/,
    ];
    async check(contract, sourceContent) {
        const issues = [];
        const lines = sourceContent.split('\n');
        const functionMatches = this.findFunctions(sourceContent);
        for (const func of functionMatches) {
            const funcBody = func.body;
            const funcStartLine = func.startLine;
            const externalCalls = this.findExternalCalls(funcBody);
            for (const call of externalCalls) {
                const codeAfterCall = funcBody.substring(call.endIndex);
                if (this.hasStateChangeAfterCall(codeAfterCall)) {
                    const lineNumber = funcStartLine + this.getLineNumber(funcBody, call.startIndex);
                    issues.push({
                        id: (0, uuid_1.v4)(),
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
    findFunctions(source) {
        const functions = [];
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
    extractFunctionBody(source, openBraceIndex) {
        let braceCount = 1;
        let index = openBraceIndex + 1;
        while (braceCount > 0 && index < source.length) {
            if (source[index] === '{')
                braceCount++;
            if (source[index] === '}')
                braceCount--;
            index++;
        }
        return source.substring(openBraceIndex, index);
    }
    findExternalCalls(funcBody) {
        const calls = [];
        for (const pattern of this.dangerousPatterns) {
            const regex = new RegExp(pattern.source, 'g');
            let match;
            while ((match = regex.exec(funcBody)) !== null) {
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
    hasStateChangeAfterCall(codeAfterCall) {
        for (const pattern of this.stateChangePatterns) {
            if (pattern.test(codeAfterCall)) {
                return true;
            }
        }
        return false;
    }
    getLineNumber(source, index) {
        return source.substring(0, index).split('\n').length;
    }
};
exports.ReentrancyRule = ReentrancyRule;
exports.ReentrancyRule = ReentrancyRule = __decorate([
    (0, common_1.Injectable)()
], ReentrancyRule);
//# sourceMappingURL=reentrancy.rule.js.map