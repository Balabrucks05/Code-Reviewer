import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface ContractSource {
    filename: string;
    content: string;
}

export interface AnalysisRequest {
    contracts: ContractSource[];
    options?: {
        enableSecurityAudit?: boolean;
        enableGasOptimization?: boolean;
        enableAiReview?: boolean;
        compilerVersion?: string;
    };
}

export interface SecurityIssue {
    id: string;
    ruleId: string;
    title: string;
    description: string;
    severity: 'critical' | 'high' | 'medium' | 'low' | 'informational';
    confidence: 'high' | 'medium' | 'low';
    location: { startLine: number; endLine: number };
    codeSnippet: string;
    recommendation: string;
    fixExample?: string;
}

export interface GasOptimization {
    id: string;
    type: string;
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    location: { startLine: number; endLine: number };
    currentCode: string;
    suggestedCode: string;
    estimatedGasSaving: number;
}

export interface AiReviewComment {
    id: string;
    category: string;
    title: string;
    reasoning: string;
    suggestion: string;
    priority: 'required' | 'recommended' | 'optional';
}

export interface ContractAnalysis {
    name: string;
    bytecodeSize: number;
    estimatedDeploymentGas: number;
    securityIssues: SecurityIssue[];
    gasOptimizations: GasOptimization[];
    aiReviewComments: AiReviewComment[];
}

export interface AnalysisResult {
    id: string;
    timestamp: Date;
    contracts: ContractAnalysis[];
    summary: {
        totalIssues: number;
        criticalCount: number;
        highCount: number;
        mediumCount: number;
        lowCount: number;
        optimizationOpportunities: number;
    };
    securityScore: number;
    gasScore: number;
    codeQualityScore: number;
    overallScore: number;
    success?: boolean;
    compilationErrors?: Array<{
        message: string;
        type: string;
        suggestion?: string;
    }>;
}

export interface SampleContract {
    name: string;
    filename: string;
    content: string;
    description: string;
}

@Injectable({ providedIn: 'root' })
export class AnalysisService {
    private readonly apiUrl = 'http://localhost:3000/api';

    isLoading = signal(false);
    currentAnalysis = signal<AnalysisResult | null>(null);

    constructor(private http: HttpClient) { }

    analyzeContract(request: AnalysisRequest): Observable<AnalysisResult> {
        this.isLoading.set(true);
        return this.http.post<AnalysisResult>(`${this.apiUrl}/analysis`, request).pipe(
            map(result => {
                this.currentAnalysis.set(result);
                this.isLoading.set(false);
                return result;
            })
        );
    }

    getAnalysis(id: string): Observable<AnalysisResult> {
        return this.http.get<AnalysisResult>(`${this.apiUrl}/analysis/${id}`);
    }

    getSampleContracts(): Observable<SampleContract[]> {
        return this.http.get<{ samples: SampleContract[] }>(`${this.apiUrl}/contracts/samples`)
            .pipe(map(res => res.samples));
    }

    fetchFromUrl(url: string): Observable<{ contracts: ContractSource[]; metadata?: any; error?: string }> {
        return this.http.post<{ contracts: ContractSource[]; metadata?: any; error?: string }>(
            `${this.apiUrl}/contracts/fetch-url`,
            { url }
        );
    }

    fetchFromGithub(url: string): Observable<{ contracts: ContractSource[]; error?: string }> {
        return this.http.post<{ contracts: ContractSource[]; error?: string }>(
            `${this.apiUrl}/contracts/fetch-github`,
            { url }
        );
    }
}
