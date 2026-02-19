import { ISecurityRule, SecurityIssue } from './security-rule.interface';
export declare class UpgradeabilityRule implements ISecurityRule {
    name: string;
    id: string;
    description: string;
    severity: 'high';
    check(contract: any, sourceContent: string): Promise<SecurityIssue[]>;
    private checkUUPSPatterns;
    private checkInitializerIssues;
    private checkStorageGaps;
    private checkSelfdestructInUpgradeable;
    private getLineNumber;
}
