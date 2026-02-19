import { ISecurityRule, SecurityIssue } from './security-rule.interface';
export declare class ReentrancyRule implements ISecurityRule {
    name: string;
    id: string;
    description: string;
    severity: 'critical';
    private readonly dangerousPatterns;
    private readonly stateChangePatterns;
    check(contract: any, sourceContent: string): Promise<SecurityIssue[]>;
    private findFunctions;
    private extractFunctionBody;
    private findExternalCalls;
    private hasStateChangeAfterCall;
    private getLineNumber;
}
