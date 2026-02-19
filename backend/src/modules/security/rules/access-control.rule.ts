import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { ISecurityRule, SecurityIssue } from './security-rule.interface';

@Injectable()
export class AccessControlRule implements ISecurityRule {
    name = 'Access Control Analyzer';
    id = 'SECURITY-002';
    description = 'Detects missing or weak access control patterns';
    severity: 'high' = 'high';

    // Sensitive functions that should have access control
    private readonly sensitivePatterns = [
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

    // Access control modifiers
    private readonly accessControlModifiers = [
        'onlyOwner',
        'onlyAdmin',
        'onlyRole',
        'onlyMinter',
        'onlyPauser',
        'whenNotPaused',
        'authorized',
        'restricted',
    ];

    async check(contract: any, sourceContent: string): Promise<SecurityIssue[]> {
        const issues: SecurityIssue[] = [];
        const lines = sourceContent.split('\n');

        for (const sensitive of this.sensitivePatterns) {
            const regex = new RegExp(sensitive.pattern.source, 'gi');
            let match;

            while ((match = regex.exec(sourceContent)) !== null) {
                const lineNumber = this.getLineNumber(sourceContent, match.index);
                const functionDef = this.extractFunctionDefinition(sourceContent, match.index);

                if (!this.hasAccessControl(functionDef)) {
                    // Check if it's a private/internal function (less severe)
                    const isInternal = /\b(internal|private)\b/.test(functionDef);

                    if (!isInternal) {
                        issues.push({
                            id: uuidv4(),
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

        // Check for missing zero-address validation in ownership transfers
        const ownershipIssues = this.checkOwnershipTransfer(sourceContent, lines);
        issues.push(...ownershipIssues);

        return issues;
    }

    private extractFunctionDefinition(source: string, startIndex: number): string {
        // Find the opening brace
        const braceIndex = source.indexOf('{', startIndex);
        if (braceIndex === -1) return source.substring(startIndex, startIndex + 200);

        return source.substring(startIndex, braceIndex + 1);
    }

    private hasAccessControl(functionDef: string): boolean {
        for (const modifier of this.accessControlModifiers) {
            if (functionDef.includes(modifier)) {
                return true;
            }
        }

        // Check for require statements with msg.sender
        if (/require\s*\([^)]*msg\.sender/.test(functionDef)) {
            return true;
        }

        // Check for if statements with revert on msg.sender
        if (/if\s*\([^)]*msg\.sender[^)]*\)\s*(revert|return)/.test(functionDef)) {
            return true;
        }

        return false;
    }

    private checkOwnershipTransfer(source: string, lines: string[]): SecurityIssue[] {
        const issues: SecurityIssue[] = [];

        const transferOwnershipMatch = /function\s+transferOwnership\s*\(\s*address\s+(\w+)\s*\)/gi;
        let match;

        while ((match = transferOwnershipMatch.exec(source)) !== null) {
            const paramName = match[1];
            const lineNumber = this.getLineNumber(source, match.index);
            const funcBody = this.extractFunctionBody(source, match.index);

            // Check if there's a zero-address check
            const hasZeroCheck = new RegExp(
                `(require|if)\\s*\\([^)]*${paramName}\\s*!=\\s*address\\s*\\(\\s*0\\s*\\)`
            ).test(funcBody);

            if (!hasZeroCheck) {
                issues.push({
                    id: uuidv4(),
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

    private extractFunctionBody(source: string, startIndex: number): string {
        const braceIndex = source.indexOf('{', startIndex);
        if (braceIndex === -1) return '';

        let braceCount = 1;
        let index = braceIndex + 1;

        while (braceCount > 0 && index < source.length) {
            if (source[index] === '{') braceCount++;
            if (source[index] === '}') braceCount--;
            index++;
        }

        return source.substring(braceIndex, index);
    }

    private getLineNumber(source: string, index: number): number {
        return source.substring(0, index).split('\n').length;
    }
}
