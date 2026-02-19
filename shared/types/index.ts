// Shared types for Smart Contract Review Platform

// ============ Analysis Types ============

export interface ContractSource {
    filename: string;
    content: string;
}

export interface AnalysisRequest {
    contracts: ContractSource[];
    options?: AnalysisOptions;
}

export interface AnalysisOptions {
    enableSecurityAudit?: boolean;
    enableGasOptimization?: boolean;
    enableAiReview?: boolean;
    compilerVersion?: string;
}

export interface AnalysisResult {
    id: string;
    timestamp: Date;
    contracts: ContractAnalysis[];
    summary: AnalysisSummary;
    securityScore: number;
    gasScore: number;
    codeQualityScore: number;
    overallScore: number;
}

export interface ContractAnalysis {
    name: string;
    securityIssues: SecurityIssue[];
    gasOptimizations: GasOptimization[];
    aiReviewComments: AiReviewComment[];
    bytecodeSize: number;
    estimatedDeploymentGas: number;
}

export interface AnalysisSummary {
    totalIssues: number;
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
    optimizationOpportunities: number;
}

// ============ Security Types ============

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'informational';

export interface SecurityIssue {
    id: string;
    ruleId: string;
    title: string;
    description: string;
    severity: Severity;
    confidence: 'high' | 'medium' | 'low';
    location: CodeLocation;
    codeSnippet: string;
    recommendation: string;
    fixExample?: string;
    references?: string[];
}

export interface CodeLocation {
    file: string;
    startLine: number;
    endLine: number;
    startColumn?: number;
    endColumn?: number;
}

// ============ Optimization Types ============

export interface GasOptimization {
    id: string;
    type: OptimizationType;
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    location: CodeLocation;
    currentCode: string;
    suggestedCode: string;
    estimatedGasSaving: number;
    bytecodeSaving?: number;
}

export type OptimizationType =
    | 'storage_packing'
    | 'unnecessary_storage'
    | 'inefficient_loop'
    | 'redundant_code'
    | 'unused_variable'
    | 'expensive_operation'
    | 'calldata_vs_memory'
    | 'short_revert_string'
    | 'tight_variable_packing'
    | 'assembly_optimization';

// ============ AI Review Types ============

export interface AiReviewComment {
    id: string;
    category: ReviewCategory;
    title: string;
    reasoning: string;
    suggestion: string;
    location?: CodeLocation;
    priority: 'required' | 'recommended' | 'optional';
    codeExample?: string;
}

export type ReviewCategory =
    | 'architecture'
    | 'readability'
    | 'naming'
    | 'documentation'
    | 'best_practice'
    | 'upgrade_safety'
    | 'modularization'
    | 'testing'
    | 'production_readiness';

// ============ AST Types ============

export interface SolidityAST {
    absolutePath: string;
    nodeType: string;
    nodes: ASTNode[];
}

export interface ASTNode {
    id: number;
    nodeType: string;
    name?: string;
    src: string;
    nodes?: ASTNode[];
    body?: ASTNode;
    statements?: ASTNode[];
    expression?: ASTNode;
    [key: string]: any;
}

export interface ContractDefinition {
    name: string;
    kind: 'contract' | 'interface' | 'library' | 'abstract';
    baseContracts: string[];
    functions: FunctionDefinition[];
    stateVariables: StateVariable[];
    events: EventDefinition[];
    modifiers: ModifierDefinition[];
}

export interface FunctionDefinition {
    name: string;
    visibility: 'public' | 'private' | 'internal' | 'external';
    stateMutability: 'pure' | 'view' | 'payable' | 'nonpayable';
    parameters: Parameter[];
    returnParameters: Parameter[];
    modifiers: string[];
    isConstructor: boolean;
    location: CodeLocation;
}

export interface StateVariable {
    name: string;
    typeName: string;
    visibility: 'public' | 'private' | 'internal';
    isConstant: boolean;
    isImmutable: boolean;
    storageSlot?: number;
    location: CodeLocation;
}

export interface EventDefinition {
    name: string;
    parameters: Parameter[];
}

export interface ModifierDefinition {
    name: string;
    parameters: Parameter[];
}

export interface Parameter {
    name: string;
    typeName: string;
    storageLocation?: 'memory' | 'storage' | 'calldata';
}

// ============ Compilation Types ============

export interface CompilationResult {
    success: boolean;
    contracts: CompiledContract[];
    errors: CompilationError[];
    warnings: CompilationError[];
}

export interface CompiledContract {
    name: string;
    abi: any[];
    bytecode: string;
    deployedBytecode: string;
    ast: SolidityAST;
}

export interface CompilationError {
    type: 'error' | 'warning';
    message: string;
    formattedMessage: string;
    sourceLocation?: CodeLocation;
}
