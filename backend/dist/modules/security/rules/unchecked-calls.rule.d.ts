import { ISecurityRule, SecurityIssue } from './security-rule.interface';
export declare class UncheckedCallsRule implements ISecurityRule {
    name: string;
    id: string;
    description: string;
    severity: 'high';
    check(contract: any, sourceContent: string): Promise<SecurityIssue[]>;
    private checkUncheckedLowLevelCalls;
    private checkUncheckedERC20;
    private getLineNumber;
}
