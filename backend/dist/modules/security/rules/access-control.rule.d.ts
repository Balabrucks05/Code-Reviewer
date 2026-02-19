import { ISecurityRule, SecurityIssue } from './security-rule.interface';
export declare class AccessControlRule implements ISecurityRule {
    name: string;
    id: string;
    description: string;
    severity: 'high';
    private readonly sensitivePatterns;
    private readonly accessControlModifiers;
    check(contract: any, sourceContent: string): Promise<SecurityIssue[]>;
    private extractFunctionDefinition;
    private hasAccessControl;
    private checkOwnershipTransfer;
    private extractFunctionBody;
    private getLineNumber;
}
