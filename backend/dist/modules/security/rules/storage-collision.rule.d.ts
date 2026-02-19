import { ISecurityRule, SecurityIssue } from './security-rule.interface';
export declare class StorageCollisionRule implements ISecurityRule {
    name: string;
    id: string;
    description: string;
    severity: 'critical';
    check(contract: any, sourceContent: string): Promise<SecurityIssue[]>;
    private checkManualStorageSlots;
    private checkInheritanceOrder;
    private checkNamespacedStorage;
    private getLineNumber;
}
