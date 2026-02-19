"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpgradeabilityRule = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("uuid");
let UpgradeabilityRule = class UpgradeabilityRule {
    name = 'Upgradeability Risk Analyzer';
    id = 'SECURITY-004';
    description = 'Detects misconfigured proxy patterns and upgrade risks';
    severity = 'high';
    async check(contract, sourceContent) {
        const issues = [];
        const lines = sourceContent.split('\n');
        issues.push(...this.checkUUPSPatterns(sourceContent, lines));
        issues.push(...this.checkInitializerIssues(sourceContent, lines));
        issues.push(...this.checkStorageGaps(sourceContent, lines));
        issues.push(...this.checkSelfdestructInUpgradeable(sourceContent, lines));
        return issues;
    }
    checkUUPSPatterns(source, lines) {
        const issues = [];
        const isUUPS = /UUPSUpgradeable/.test(source) ||
            /function\s+_authorizeUpgrade/.test(source);
        if (!isUUPS)
            return issues;
        const authorizeMatch = /function\s+_authorizeUpgrade\s*\([^)]*\)[^{]*\{([^}]*)\}/s.exec(source);
        if (authorizeMatch) {
            const funcBody = authorizeMatch[1];
            const lineNumber = this.getLineNumber(source, authorizeMatch.index);
            const hasAccessControl = /onlyOwner|onlyRole|require\s*\([^)]*msg\.sender/.test(source.substring(authorizeMatch.index, authorizeMatch.index + authorizeMatch[0].length));
            if (!hasAccessControl) {
                issues.push({
                    id: (0, uuid_1.v4)(),
                    ruleId: this.id,
                    title: 'Unprotected UUPS Upgrade Function',
                    description: `The _authorizeUpgrade function at line ${lineNumber} appears to lack access control. Anyone could upgrade the contract to a malicious implementation.`,
                    severity: 'critical',
                    confidence: 'high',
                    location: {
                        startLine: lineNumber,
                        endLine: lineNumber + 3,
                    },
                    codeSnippet: lines[lineNumber - 1]?.trim() || '',
                    recommendation: 'Add onlyOwner or onlyRole modifier to _authorizeUpgrade.',
                    fixExample: `function _authorizeUpgrade(address newImplementation) 
    internal 
    override 
    onlyOwner 
{}`,
                    references: [
                        'https://docs.openzeppelin.com/contracts/api/proxy#UUPSUpgradeable',
                    ],
                });
            }
        }
        return issues;
    }
    checkInitializerIssues(source, lines) {
        const issues = [];
        const isUpgradeable = /Initializable|initializer|reinitializer/.test(source);
        if (!isUpgradeable)
            return issues;
        const constructorMatch = /constructor\s*\([^)]*\)\s*\{([^}]+)\}/s.exec(source);
        if (constructorMatch) {
            const constructorBody = constructorMatch[1];
            const lineNumber = this.getLineNumber(source, constructorMatch.index);
            const hasOnlyDisable = /^\s*_disableInitializers\s*\(\s*\)\s*;\s*$/.test(constructorBody.trim());
            const isEmpty = /^\s*$/.test(constructorBody);
            if (!hasOnlyDisable && !isEmpty) {
                issues.push({
                    id: (0, uuid_1.v4)(),
                    ruleId: this.id,
                    title: 'State Initialization in Constructor of Upgradeable Contract',
                    description: `The constructor at line ${lineNumber} initializes state. In upgradeable contracts, constructors do not affect proxy storage.`,
                    severity: 'high',
                    confidence: 'medium',
                    location: {
                        startLine: lineNumber,
                        endLine: lineNumber + 5,
                    },
                    codeSnippet: lines[lineNumber - 1]?.trim() || '',
                    recommendation: 'Move initialization logic to an initialize() function with the initializer modifier. Constructor should only call _disableInitializers().',
                    fixExample: `/// @custom:oz-upgrades-unsafe-allow constructor
constructor() {
    _disableInitializers();
}

function initialize(address admin) external initializer {
    __Ownable_init(admin);
    // ... other initialization
}`,
                    references: [
                        'https://docs.openzeppelin.com/upgrades-plugins/writing-upgradeable',
                    ],
                });
            }
        }
        const initMatch = /function\s+initialize\s*\([^)]*\)[^{]*\{/g.exec(source);
        if (initMatch) {
            const funcDef = source.substring(initMatch.index, initMatch.index + 200);
            const hasInitializer = /initializer|reinitializer/.test(funcDef);
            if (!hasInitializer) {
                const lineNumber = this.getLineNumber(source, initMatch.index);
                issues.push({
                    id: (0, uuid_1.v4)(),
                    ruleId: this.id,
                    title: 'Missing initializer Modifier',
                    description: `The initialize function at line ${lineNumber} does not use the initializer modifier. This could allow re-initialization attacks.`,
                    severity: 'critical',
                    confidence: 'high',
                    location: {
                        startLine: lineNumber,
                        endLine: lineNumber + 2,
                    },
                    codeSnippet: lines[lineNumber - 1]?.trim() || '',
                    recommendation: 'Add the initializer modifier to prevent multiple initializations.',
                    fixExample: `function initialize(address admin) external initializer {
    // initialization logic
}`,
                });
            }
        }
        return issues;
    }
    checkStorageGaps(source, lines) {
        const issues = [];
        const isUpgradeableBase = /abstract\s+contract.*Upgradeable|is.*Initializable/.test(source);
        if (!isUpgradeableBase)
            return issues;
        const hasGap = /__gap\s*/.test(source);
        if (!hasGap) {
            const contractMatch = /contract\s+\w+/.exec(source);
            const lineNumber = contractMatch ? this.getLineNumber(source, contractMatch.index) : 1;
            issues.push({
                id: (0, uuid_1.v4)(),
                ruleId: this.id,
                title: 'Missing Storage Gap in Upgradeable Contract',
                description: 'This upgradeable contract does not define a __gap variable. Adding new state variables in upgrades could cause storage collisions.',
                severity: 'medium',
                confidence: 'medium',
                location: {
                    startLine: lineNumber,
                    endLine: lineNumber,
                },
                codeSnippet: lines[lineNumber - 1]?.trim() || '',
                recommendation: 'Add a storage gap at the end of state variables to allow future upgrades.',
                fixExample: `// Add at the end of state variables:
uint256[50] private __gap;`,
                references: [
                    'https://docs.openzeppelin.com/contracts/upgradeable#storage_gaps',
                ],
            });
        }
        return issues;
    }
    checkSelfdestructInUpgradeable(source, lines) {
        const issues = [];
        const isUpgradeable = /Initializable|Upgradeable|Proxy/.test(source);
        if (!isUpgradeable)
            return issues;
        const selfdestructMatch = /selfdestruct\s*\(|suicide\s*\(/g.exec(source);
        if (selfdestructMatch) {
            const lineNumber = this.getLineNumber(source, selfdestructMatch.index);
            issues.push({
                id: (0, uuid_1.v4)(),
                ruleId: this.id,
                title: 'Selfdestruct in Upgradeable Contract',
                description: `Selfdestruct at line ${lineNumber} in an upgradeable contract. If the implementation is destroyed, all proxies become non-functional.`,
                severity: 'critical',
                confidence: 'high',
                location: {
                    startLine: lineNumber,
                    endLine: lineNumber,
                },
                codeSnippet: lines[lineNumber - 1]?.trim() || '',
                recommendation: 'Remove selfdestruct from upgradeable implementation contracts. Use access control and pausability instead.',
            });
        }
        return issues;
    }
    getLineNumber(source, index) {
        return source.substring(0, index).split('\n').length;
    }
};
exports.UpgradeabilityRule = UpgradeabilityRule;
exports.UpgradeabilityRule = UpgradeabilityRule = __decorate([
    (0, common_1.Injectable)()
], UpgradeabilityRule);
//# sourceMappingURL=upgradeability.rule.js.map