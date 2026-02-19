import { ConfigService } from '@nestjs/config';
export interface ContractSource {
    filename: string;
    content: string;
}
export declare class ContractFetcherService {
    private configService;
    private readonly logger;
    private readonly apiKey;
    constructor(configService: ConfigService);
    fetchFromExplorer(url: string): Promise<{
        contracts: ContractSource[];
        metadata: any;
    }>;
    fetchFromGithub(url: string): Promise<{
        contracts: ContractSource[];
    }>;
    getSupportedExplorers(): string[];
    private parseExplorerUrl;
    private parseExplorerSourceCode;
    private parseGithubUrl;
    private fetchGithubRawContent;
    private fetchGithubDirectory;
}
