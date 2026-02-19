"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageCollisionRule = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("uuid");
let StorageCollisionRule = class StorageCollisionRule {
    name = 'Storage Collision Detector';
    id = 'SECURITY-005';
    description = 'Detects potential storage slot collisions in proxy patterns';
    severity = 'critical';
    async check(contract, sourceContent) {
        const issues = [];
        const lines = sourceContent.split('\n');
        issues.push(...this.checkManualStorageSlots(sourceContent, lines));
        issues.push(...this.checkInheritanceOrder(sourceContent, lines, contract));
        issues.push(...this.checkNamespacedStorage(sourceContent, lines));
        return issues;
    }
    checkManualStorageSlots(source, lines) {
        const issues = [];
        const assemblyPattern = /assembly\s*\{([^}]+)\}/gs;
        let match;
        while ((match = assemblyPattern.exec(source)) !== null) {
            const assemblyBody = match[1];
            const lineNumber = this.getLineNumber(source, match.index);
            const hardcodedSlot = /s(store|load)\s*\(\s*(0x[0-9a-fA-F]+|\d+)/.exec(assemblyBody);
            if (hardcodedSlot) {
                const knownSlots = [
                    '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc',
                    '0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103',
                    '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbd',
                ];
                const slot = hardcodedSlot[2];
                const isKnownSlot = knownSlots.includes(slot.toLowerCase());
                if (!isKnownSlot) {
                    issues.push({
                        id: (0, uuid_1.v4)(),
                        ruleId: this.id,
                        title: 'Non-Standard Storage Slot Usage',
                        description: `Assembly block at line ${lineNumber} uses a hardcoded storage slot (${slot}). If this overlaps with regular storage variables, data corruption could occur.`,
                        severity: 'high',
                        confidence: 'medium',
                        location: {
                            startLine: lineNumber,
                            endLine: lineNumber + 5,
                        },
                        codeSnippet: lines[lineNumber - 1]?.trim() || '',
                        recommendation: 'Use EIP-1967 standard storage slots or ERC-7201 namespaced storage pattern to avoid collisions.',
                        fixExample: `// Use ERC-7201 pattern:
/// @custom:storage-location erc7201:myproject.storage.main
struct MainStorage {
    uint256 value;
    mapping(address => uint256) balances;
}

// keccak256(abi.encode(uint256(keccak256("myproject.storage.main")) - 1)) & ~bytes32(uint256(0xff))
bytes32 private constant MAIN_STORAGE_LOCATION = 
    0x...;

function _getMainStorage() private pure returns (MainStorage storage $) {
    assembly {
        $.slot := MAIN_STORAGE_LOCATION
    }
}`,
                        references: [
                            'https://eips.ethereum.org/EIPS/eip-1967',
                            'https://eips.ethereum.org/EIPS/eip-7201',
                        ],
                    });
                }
            }
        }
        return issues;
    }
    checkInheritanceOrder(source, lines, contract) {
        const issues = [];
        const contractDefMatch = /contract\s+(\w+)\s+is\s+([^{]+)\{/.exec(source);
        if (contractDefMatch) {
            const baseContracts = contractDefMatch[2].split(',').map(c => c.trim());
            const lineNumber = this.getLineNumber(source, contractDefMatch.index);
            if (baseContracts.length >= 3) {
                const hasStorageContracts = baseContracts.some(c => !c.includes('Interface') &&
                    !c.includes('Abstract') &&
                    !/^I[A-Z]/.test(c));
                if (hasStorageContracts) {
                    issues.push({
                        id: (0, uuid_1.v4)(),
                        ruleId: this.id,
                        title: 'Complex Inheritance with Potential Storage Collision',
                        description: `Contract at line ${lineNumber} inherits from ${baseContracts.length} contracts. Changing inheritance order could shift storage slots unexpectedly.`,
                        severity: 'medium',
                        confidence: 'low',
                        location: {
                            startLine: lineNumber,
                            endLine: lineNumber + 2,
                        },
                        codeSnippet: lines[lineNumber - 1]?.trim() || '',
                        recommendation: 'Document the inheritance order carefully. Use storage gaps in base contracts. Consider ERC-7201 namespaced storage.',
                        references: [
                            'https://docs.openzeppelin.com/contracts/upgradeable',
                        ],
                    });
                }
            }
        }
        return issues;
    }
    checkNamespacedStorage(source, lines) {
        const issues = [];
        const hasErc7201 = /erc7201:|storage-location/.test(source);
        if (hasErc7201) {
            const locationPattern = /bytes32\s+private\s+constant\s+(\w+)\s*=\s*(0x[a-fA-F0-9]+)/g;
            let match;
            while ((match = locationPattern.exec(source)) !== null) {
                const varName = match[1];
                const hashValue = match[2];
                const lineNumber = this.getLineNumber(source, match.index);
                if (!hashValue.endsWith('00')) {
                    issues.push({
                        id: (0, uuid_1.v4)(),
                        ruleId: this.id,
                        title: 'ERC-7201 Storage Location Not Properly Masked',
                        description: `Storage location constant ${varName} at line ${lineNumber} does not end with 00. Per ERC-7201, the location should be masked with ~bytes32(uint256(0xff)).`,
                        severity: 'medium',
                        confidence: 'medium',
                        location: {
                            startLine: lineNumber,
                            endLine: lineNumber,
                        },
                        codeSnippet: lines[lineNumber - 1]?.trim() || '',
                        recommendation: 'Ensure the storage location is computed using: keccak256(abi.encode(uint256(keccak256("namespace")) - 1)) & ~bytes32(uint256(0xff))',
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
exports.StorageCollisionRule = StorageCollisionRule;
exports.StorageCollisionRule = StorageCollisionRule = __decorate([
    (0, common_1.Injectable)()
], StorageCollisionRule);
//# sourceMappingURL=storage-collision.rule.js.map