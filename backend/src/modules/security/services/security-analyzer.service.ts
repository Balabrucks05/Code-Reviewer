import { Injectable, Logger } from '@nestjs/common';
import { ReentrancyRule } from '../rules/reentrancy.rule';
import { AccessControlRule } from '../rules/access-control.rule';
import { UncheckedCallsRule } from '../rules/unchecked-calls.rule';
import { UpgradeabilityRule } from '../rules/upgradeability.rule';
import { StorageCollisionRule } from '../rules/storage-collision.rule';
import { SecurityIssue, ISecurityRule } from '../rules/security-rule.interface';

@Injectable()
export class SecurityAnalyzerService {
    private readonly logger = new Logger(SecurityAnalyzerService.name);
    private readonly rules: ISecurityRule[];

    constructor(
        private readonly reentrancyRule: ReentrancyRule,
        private readonly accessControlRule: AccessControlRule,
        private readonly uncheckedCallsRule: UncheckedCallsRule,
        private readonly upgradeabilityRule: UpgradeabilityRule,
        private readonly storageCollisionRule: StorageCollisionRule,
    ) {
        this.rules = [
            reentrancyRule,
            accessControlRule,
            uncheckedCallsRule,
            upgradeabilityRule,
            storageCollisionRule,
        ];
    }

    async analyze(contract: any, sourceContent: string): Promise<SecurityIssue[]> {
        this.logger.log(`Running security analysis on ${contract.name}`);

        const allIssues: SecurityIssue[] = [];

        for (const rule of this.rules) {
            try {
                const issues = await rule.check(contract, sourceContent);
                allIssues.push(...issues);

                if (issues.length > 0) {
                    this.logger.log(`${rule.name}: Found ${issues.length} issue(s)`);
                }
            } catch (error) {
                this.logger.warn(`Rule ${rule.name} failed: ${error.message}`);
            }
        }

        // Sort by severity
        return this.sortBySeverity(allIssues);
    }

    private sortBySeverity(issues: SecurityIssue[]): SecurityIssue[] {
        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, informational: 4 };

        return issues.sort((a, b) =>
            (severityOrder[a.severity] || 5) - (severityOrder[b.severity] || 5)
        );
    }
}
