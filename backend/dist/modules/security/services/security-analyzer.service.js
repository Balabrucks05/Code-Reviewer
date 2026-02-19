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
var SecurityAnalyzerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityAnalyzerService = void 0;
const common_1 = require("@nestjs/common");
const reentrancy_rule_1 = require("../rules/reentrancy.rule");
const access_control_rule_1 = require("../rules/access-control.rule");
const unchecked_calls_rule_1 = require("../rules/unchecked-calls.rule");
const upgradeability_rule_1 = require("../rules/upgradeability.rule");
const storage_collision_rule_1 = require("../rules/storage-collision.rule");
let SecurityAnalyzerService = SecurityAnalyzerService_1 = class SecurityAnalyzerService {
    reentrancyRule;
    accessControlRule;
    uncheckedCallsRule;
    upgradeabilityRule;
    storageCollisionRule;
    logger = new common_1.Logger(SecurityAnalyzerService_1.name);
    rules;
    constructor(reentrancyRule, accessControlRule, uncheckedCallsRule, upgradeabilityRule, storageCollisionRule) {
        this.reentrancyRule = reentrancyRule;
        this.accessControlRule = accessControlRule;
        this.uncheckedCallsRule = uncheckedCallsRule;
        this.upgradeabilityRule = upgradeabilityRule;
        this.storageCollisionRule = storageCollisionRule;
        this.rules = [
            reentrancyRule,
            accessControlRule,
            uncheckedCallsRule,
            upgradeabilityRule,
            storageCollisionRule,
        ];
    }
    async analyze(contract, sourceContent) {
        this.logger.log(`Running security analysis on ${contract.name}`);
        const allIssues = [];
        for (const rule of this.rules) {
            try {
                const issues = await rule.check(contract, sourceContent);
                allIssues.push(...issues);
                if (issues.length > 0) {
                    this.logger.log(`${rule.name}: Found ${issues.length} issue(s)`);
                }
            }
            catch (error) {
                this.logger.warn(`Rule ${rule.name} failed: ${error.message}`);
            }
        }
        return this.sortBySeverity(allIssues);
    }
    sortBySeverity(issues) {
        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, informational: 4 };
        return issues.sort((a, b) => (severityOrder[a.severity] || 5) - (severityOrder[b.severity] || 5));
    }
};
exports.SecurityAnalyzerService = SecurityAnalyzerService;
exports.SecurityAnalyzerService = SecurityAnalyzerService = SecurityAnalyzerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [reentrancy_rule_1.ReentrancyRule,
        access_control_rule_1.AccessControlRule,
        unchecked_calls_rule_1.UncheckedCallsRule,
        upgradeability_rule_1.UpgradeabilityRule,
        storage_collision_rule_1.StorageCollisionRule])
], SecurityAnalyzerService);
//# sourceMappingURL=security-analyzer.service.js.map