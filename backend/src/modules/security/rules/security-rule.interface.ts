export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'informational';

export interface SecurityIssue {
    id: string;
    ruleId: string;
    title: string;
    description: string;
    severity: Severity;
    confidence: 'high' | 'medium' | 'low';
    location: {
        file?: string;
        startLine: number;
        endLine: number;
        startColumn?: number;
        endColumn?: number;
    };
    codeSnippet: string;
    recommendation: string;
    fixExample?: string;
    references?: string[];
}

export interface ISecurityRule {
    name: string;
    id: string;
    description: string;
    severity: Severity;
    check(contract: any, sourceContent: string): Promise<SecurityIssue[]>;
}
