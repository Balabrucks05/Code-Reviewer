import { ContractsService } from './contracts.service';
import { ContractFetcherService } from './contract-fetcher.service';
export declare class ContractsController {
    private readonly contractsService;
    private readonly contractFetcher;
    constructor(contractsService: ContractsService, contractFetcher: ContractFetcherService);
    getSampleContracts(): {
        samples: {
            name: string;
            filename: string;
            content: string;
            description: string;
        }[];
    };
    getSupportedExplorers(): {
        explorers: string[];
    };
    fetchFromUrl(body: {
        url: string;
    }): Promise<{
        contracts: import("./contract-fetcher.service").ContractSource[];
        metadata: any;
    } | {
        success: boolean;
        error: any;
        contracts: never[];
    }>;
    fetchFromGithub(body: {
        url: string;
    }): Promise<{
        contracts: import("./contract-fetcher.service").ContractSource[];
    } | {
        success: boolean;
        error: any;
        contracts: never[];
    }>;
}
