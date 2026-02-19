"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccessControlRule = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("uuid");
let AccessControlRule = class AccessControlRule {
    name = 'Access Control Analyzer';
    id = 'SECURITY-002';
    description = 'Detects missing or weak access control patterns';
    severity = 'high';
    sensitivePatterns = [
        { pattern: /function\s+(mint|_mint)\s*\(/gi, name: 'mint' },
        { pattern: /function\s+(burn|_burn)\s*\(/gi, name: 'burn' },
        { pattern: /function\s+(pause|_pause)\s*\(/gi, name: 'pause' },
        { pattern: /function\s+(unpause|_unpause)\s*\(/gi, name: 'unpause' },
        { pattern: /function\s+(setOwner|transferOwnership)\s*\(/gi, name: 'ownership transfer' },
        { pattern: /function\s+(withdraw|withdrawAll|withdrawTo)\s*\(/gi, name: 'withdraw' },
        { pattern: /function\s+(upgrade|upgradeTo|upgradeToAndCall)\s*\(/gi, name: 'upgrade' },
        { pattern: /function\s+(setAdmin|addAdmin|removeAdmin)\s*\(/gi, name: 'admin management' },
        { pattern: /selfdestruct\s*\(/gi, name: 'selfdestruct' },
    ];
    accessControlModifiers = [
        'onlyOwner',
        'onlyAdmin',
        'onlyRole',
        'onlyMinter',
        'onlyPauser',
        'whenNotPaused',
        'authorized',
        'restricted',
    ];
    async check(contract, sourceContent) {
        const issues = [];
        const lines = sourceContent.split('\n');
        for (const sensitive of this.sensitivePatterns) {
            const regex = new RegExp(sensitive.pattern.source, 'gi');
            let match;
            while ((match = regex.exec(sourceContent)) !== null) {
                const lineNumber = this.getLineNumber(sourceContent, match.index);
                const functionDef = this.extractFunctionDefinition(sourceContent, match.index);
                if (!this.hasAccessControl(functionDef)) {
                    const isInternal = /\b(internal|private)\b/.test(functionDef);
                    if (!isInternal) {
                        issues.push({
                            id: (0, uuid_1.v4)(),
                            ruleId: this.id,
                            title: `Missing Access Control on ${sensitive.name} Function`,
                            description: `The ${sensitive.name} function at line ${lineNumber} appears to lack access control. This could allow unauthorized users to call sensitive operations.`,
                            severity: sensitive.name === 'selfdestruct' ? 'critical' : this.severity,
                            confidence: 'medium',
                            location: {
                                startLine: lineNumber,
                                endLine: lineNumber + 3,
                            },
                            codeSnippet: lines[lineNumber - 1]?.trim() || functionDef.substring(0, 80),
                            recommendation: `Add access control to restrict who can call this function. Consider using OpenZeppelin's Ownable or AccessControl.`,
                            fixExample: `// Using Ownable:
function ${sensitive.name}(...) external onlyOwner {
    // ...
}

// Using AccessControl:
bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

function ${sensitive.name}(...) external onlyRole(MINTER_ROLE) {
    // ...
}`,
                            references: [
                                'https://docs.openzeppelin.com/contracts/access-control',
                                'https://swcregistry.io/docs/SWC-105',
                            ],
                        });
                    }
                }
            }
        }
        const ownershipIssues = this.checkOwnershipTransfer(sourceContent, lines);
        issues.push(...ownershipIssues);
        return issues;
    }
    extractFunctionDefinition(source, startIndex) {
        const braceIndex = source.indexOf('{', startIndex);
        if (braceIndex === -1)
            return source.substring(startIndex, startIndex + 200);
        return source.substring(startIndex, braceIndex + 1);
    }
    hasAccessControl(functionDef) {
        for (const modifier of this.accessControlModifiers) {
            if (functionDef.includes(modifier)) {
                return true;
            }
        }
        if (/require\s*\([^)]*msg\.sender/.test(functionDef)) {
            return true;
        }
        if (/if\s*\([^)]*msg\.sender[^)]*\)\s*(revert|return)/.test(functionDef)) {
            return true;
        }
        return false;
    }
    checkOwnershipTransfer(source, lines) {
        const issues = [];
        const transferOwnershipMatch = /function\s+transferOwnership\s*\(\s*address\s+(\w+)\s*\)/gi;
        let match;
        while ((match = transferOwnershipMatch.exec(source)) !== null) {
            const paramName = match[1];
            const lineNumber = this.getLineNumber(source, match.index);
            const funcBody = this.extractFunctionBody(source, match.index);
            const hasZeroCheck = new RegExp(`(require|if)\\s*\\([^)]*${paramName}\\s*!=\\s*address\\s*\\(\\s*0\\s*\\)`).test(funcBody);
            if (!hasZeroCheck) {
                issues.push({
                    id: (0, uuid_1.v4)(),
                    ruleId: this.id,
                    title: 'Missing Zero-Address Check in Ownership Transfer',
                    description: `The transferOwnership function at line ${lineNumber} does not check for the zero address. This could result in permanently locking the contract.`,
                    severity: 'medium',
                    confidence: 'high',
                    location: {
                        startLine: lineNumber,
                        endLine: lineNumber + 5,
                    },
                    codeSnippet: lines[lineNumber - 1]?.trim() || '',
                    recommendation: 'Add a require statement to check that the new owner is not the zero address.',
                    fixExample: `function transferOwnership(address newOwner) external onlyOwner {
    require(newOwner != address(0), "New owner cannot be zero address");
    owner = newOwner;
}`,
                });
            }
        }
        return issues;
    }
    extractFunctionBody(source, startIndex) {
        const braceIndex = source.indexOf('{', startIndex);
        if (braceIndex === -1)
            return '';
        let braceCount = 1;
        let index = braceIndex + 1;
        while (braceCount > 0 && index < source.length) {
            if (source[index] === '{')
                braceCount++;
            if (source[index] === '}')
                braceCount--;
            index++;
        }
        return source.substring(braceIndex, index);
    }
    getLineNumber(source, index) {
        return source.substring(0, index).split('\n').length;
    }
};
exports.AccessControlRule = AccessControlRule;
exports.AccessControlRule = AccessControlRule = __decorate([
    (0, common_1.Injectable)()
], AccessControlRule);
//# sourceMappingURL=access-control.rule.js.map