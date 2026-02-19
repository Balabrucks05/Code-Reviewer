import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface ContractSource {
    filename: string;
    content: string;
}

/**
 * Chain ID mapping for Etherscan V2 unified API.
 * See: https://docs.etherscan.io/etherscan-v2
 */
const CHAIN_IDS: Record<string, { chainId: number; name: string }> = {
    'etherscan.io': { chainId: 1, name: 'Ethereum' },
    'sepolia.etherscan.io': { chainId: 11155111, name: 'Sepolia' },
    'arbiscan.io': { chainId: 42161, name: 'Arbitrum' },
    'bscscan.com': { chainId: 56, name: 'BSC' },
    'polygonscan.com': { chainId: 137, name: 'Polygon' },
    'basescan.org': { chainId: 8453, name: 'Base' },
    'snowtrace.io': { chainId: 43114, name: 'Avalanche' },
    'scrollscan.com': { chainId: 534352, name: 'Scroll' },
    'blastscan.io': { chainId: 81457, name: 'Blast' },
    'optimistic.etherscan.io': { chainId: 10, name: 'Optimism' },
    'lineascan.build': { chainId: 59144, name: 'Linea' },
    'era.zksync.network': { chainId: 324, name: 'zkSync Era' },
    'moonscan.io': { chainId: 1284, name: 'Moonbeam' },
};

@Injectable()
export class ContractFetcherService {
    private readonly logger = new Logger(ContractFetcherService.name);
    private readonly apiKey: string;

    constructor(private configService: ConfigService) {
        this.apiKey = this.configService.get<string>('ETHERSCAN_API_KEY') || '';
        if (this.apiKey) {
            this.logger.log('Etherscan API key loaded');
        } else {
            this.logger.warn('No ETHERSCAN_API_KEY found in .env — explorer fetch will fail');
        }
    }

    /**
     * Fetch verified contract source from a block explorer URL using Etherscan V2 API.
     */
    async fetchFromExplorer(url: string): Promise<{ contracts: ContractSource[]; metadata: any }> {
        const { chainId, address, networkName } = this.parseExplorerUrl(url);

        this.logger.log(`Fetching contract ${address} from ${networkName} (chainId: ${chainId})`);

        if (!this.apiKey) {
            throw new Error('Etherscan API key not configured. Add ETHERSCAN_API_KEY to backend/.env');
        }

        // Etherscan V2 unified endpoint
        const apiUrl = `https://api.etherscan.io/v2/api?chainid=${chainId}&module=contract&action=getsourcecode&address=${address}&apikey=${this.apiKey}`;

        const response = await fetch(apiUrl);

        if (!response.ok) {
            throw new Error(`Etherscan API returned HTTP ${response.status}`);
        }

        const data = await response.json();

        if (data.status !== '1' || !data.result || data.result.length === 0) {
            const msg = data.result || data.message || 'Unknown error';
            throw new Error(`Contract not found or not verified on ${networkName}: ${msg}`);
        }

        const contractData = data.result[0];

        if (!contractData.SourceCode || contractData.SourceCode === '') {
            throw new Error('Contract source code is not verified on this explorer');
        }

        const contracts = this.parseExplorerSourceCode(contractData);

        return {
            contracts,
            metadata: {
                contractName: contractData.ContractName,
                compilerVersion: contractData.CompilerVersion,
                optimizationUsed: contractData.OptimizationUsed === '1',
                runs: parseInt(contractData.Runs) || 200,
                evmVersion: contractData.EVMVersion,
                license: contractData.LicenseType,
                network: networkName,
                address,
            },
        };
    }

    /**
     * Fetch Solidity files from a GitHub URL.
     */
    async fetchFromGithub(url: string): Promise<{ contracts: ContractSource[] }> {
        const parsed = this.parseGithubUrl(url);

        if (parsed.type === 'file') {
            this.logger.log(`Fetching single file from GitHub: ${parsed.path}`);
            const content = await this.fetchGithubRawContent(parsed.owner, parsed.repo, parsed.branch, parsed.path);
            const filename = parsed.path.split('/').pop() || 'contract.sol';
            return { contracts: [{ filename, content }] };
        }

        this.logger.log(`Fetching directory ${parsed.path} from GitHub: ${parsed.owner}/${parsed.repo}`);
        const contracts = await this.fetchGithubDirectory(parsed.owner, parsed.repo, parsed.branch, parsed.path);
        return { contracts };
    }

    /**
     * Get list of supported block explorers.
     */
    getSupportedExplorers(): string[] {
        return Object.values(CHAIN_IDS).map(c => c.name);
    }

    // --- Private helpers ---

    private parseExplorerUrl(url: string): { chainId: number; address: string; networkName: string } {
        let parsedUrl: URL;

        try {
            parsedUrl = new URL(url);
        } catch {
            // Maybe it's just an address — default to Ethereum mainnet
            if (/^0x[a-fA-F0-9]{40}$/.test(url)) {
                return { chainId: 1, address: url, networkName: 'Ethereum' };
            }
            throw new Error('Invalid URL format. Provide a valid block explorer URL or contract address.');
        }

        const hostname = parsedUrl.hostname.replace('www.', '');
        const config = CHAIN_IDS[hostname];

        if (!config) {
            throw new Error(
                `Unsupported explorer: ${hostname}. Supported: ${Object.keys(CHAIN_IDS).join(', ')}`,
            );
        }

        // Extract address from path: /address/0x1234... or /token/0x1234...
        const addressMatch = parsedUrl.pathname.match(/(0x[a-fA-F0-9]{40})/);
        if (!addressMatch) {
            throw new Error('Could not find a contract address in the URL');
        }

        return {
            chainId: config.chainId,
            address: addressMatch[1],
            networkName: config.name,
        };
    }

    private parseExplorerSourceCode(contractData: any): ContractSource[] {
        let sourceCode = contractData.SourceCode;

        // Handle double-braced JSON format: {{...}}
        if (sourceCode.startsWith('{{')) {
            sourceCode = sourceCode.slice(1, -1);
        }

        // Try to parse as JSON (multi-file format)
        if (sourceCode.startsWith('{')) {
            try {
                const parsed = JSON.parse(sourceCode);
                const sources = parsed.sources || parsed;
                return Object.entries(sources).map(([filePath, data]: [string, any]) => ({
                    filename: filePath,
                    content: data.content || data,
                }));
            } catch {
                // Not valid JSON, treat as single source
            }
        }

        // Single file source code
        return [{
            filename: `${contractData.ContractName || 'Contract'}.sol`,
            content: sourceCode,
        }];
    }

    private parseGithubUrl(url: string): {
        owner: string;
        repo: string;
        branch: string;
        path: string;
        type: 'file' | 'directory';
    } {
        let parsedUrl: URL;
        try {
            parsedUrl = new URL(url);
        } catch {
            throw new Error('Invalid GitHub URL');
        }

        if (parsedUrl.hostname !== 'github.com') {
            throw new Error('URL must be a github.com URL');
        }

        const parts = parsedUrl.pathname.split('/').filter(Boolean);

        if (parts.length < 2) {
            throw new Error('URL must include owner/repo');
        }

        const owner = parts[0];
        const repo = parts[1];

        if (parts.length >= 4 && (parts[2] === 'blob' || parts[2] === 'tree')) {
            const type = parts[2] === 'blob' ? 'file' : 'directory';
            const branch = parts[3];
            const path = parts.slice(4).join('/');
            return { owner, repo, branch, path, type };
        }

        return { owner, repo, branch: 'main', path: '', type: 'directory' };
    }

    private async fetchGithubRawContent(owner: string, repo: string, branch: string, path: string): Promise<string> {
        const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
        const response = await fetch(rawUrl);

        if (!response.ok) {
            throw new Error(`Failed to fetch from GitHub: HTTP ${response.status}. Check the URL and ensure the file exists.`);
        }

        return response.text();
    }

    private async fetchGithubDirectory(
        owner: string,
        repo: string,
        branch: string,
        dirPath: string,
    ): Promise<ContractSource[]> {
        const apiUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;
        const response = await fetch(apiUrl, {
            headers: { Accept: 'application/vnd.github.v3+json' },
        });

        if (!response.ok) {
            throw new Error(`Failed to list GitHub repo: HTTP ${response.status}. Ensure the repository is public.`);
        }

        const data = await response.json();
        const solFiles = (data.tree || [])
            .filter((item: any) => {
                const inDir = dirPath ? item.path.startsWith(dirPath) : true;
                return inDir && item.path.endsWith('.sol') && item.type === 'blob';
            })
            .slice(0, 20);

        if (solFiles.length === 0) {
            throw new Error('No .sol files found in the specified path');
        }

        this.logger.log(`Found ${solFiles.length} Solidity file(s) in ${owner}/${repo}/${dirPath || '(root)'}`);

        const contracts: ContractSource[] = [];
        for (const file of solFiles) {
            try {
                const content = await this.fetchGithubRawContent(owner, repo, branch, file.path);
                contracts.push({
                    filename: file.path.split('/').pop() || file.path,
                    content,
                });
            } catch (err) {
                this.logger.warn(`Failed to fetch ${file.path}: ${err.message}`);
            }
        }

        return contracts;
    }
}
