import { ReentrancyRule } from '../rules/reentrancy.rule';
import { AccessControlRule } from '../rules/access-control.rule';
import { UncheckedCallsRule } from '../rules/unchecked-calls.rule';
import { UpgradeabilityRule } from '../rules/upgradeability.rule';
import { StorageCollisionRule } from '../rules/storage-collision.rule';
import { SecurityIssue } from '../rules/security-rule.interface';
export declare class SecurityAnalyzerService {
    private readonly reentrancyRule;
    private readonly accessControlRule;
    private readonly uncheckedCallsRule;
    private readonly upgradeabilityRule;
    private readonly storageCollisionRule;
    private readonly logger;
    private readonly rules;
    constructor(reentrancyRule: ReentrancyRule, accessControlRule: AccessControlRule, uncheckedCallsRule: UncheckedCallsRule, upgradeabilityRule: UpgradeabilityRule, storageCollisionRule: StorageCollisionRule);
    analyze(contract: any, sourceContent: string): Promise<SecurityIssue[]>;
    private sortBySeverity;
}
