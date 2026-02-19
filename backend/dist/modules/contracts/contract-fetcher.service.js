"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ContractFetcherService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContractFetcherService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const CHAIN_IDS = {
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
let ContractFetcherService = ContractFetcherService_1 = class ContractFetcherService {
    configService;
    logger = new common_1.Logger(ContractFetcherService_1.name);
    apiKey;
    constructor(configService) {
        this.configService = configService;
        this.apiKey = this.configService.get('ETHERSCAN_API_KEY') || '';
        if (this.apiKey) {
            this.logger.log('Etherscan API key loaded');
        }
        else {
            this.logger.warn('No ETHERSCAN_API_KEY found in .env — explorer fetch will fail');
        }
    }
    async fetchFromExplorer(url) {
        const { chainId, address, networkName } = this.parseExplorerUrl(url);
        this.logger.log(`Fetching contract ${address} from ${networkName} (chainId: ${chainId})`);
        if (!this.apiKey) {
            throw new Error('Etherscan API key not configured. Add ETHERSCAN_API_KEY to backend/.env');
        }
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
    async fetchFromGithub(url) {
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
    getSupportedExplorers() {
        return Object.values(CHAIN_IDS).map(c => c.name);
    }
    parseExplorerUrl(url) {
        let parsedUrl;
        try {
            parsedUrl = new URL(url);
        }
        catch {
            if (/^0x[a-fA-F0-9]{40}$/.test(url)) {
                return { chainId: 1, address: url, networkName: 'Ethereum' };
            }
            throw new Error('Invalid URL format. Provide a valid block explorer URL or contract address.');
        }
        const hostname = parsedUrl.hostname.replace('www.', '');
        const config = CHAIN_IDS[hostname];
        if (!config) {
            throw new Error(`Unsupported explorer: ${hostname}. Supported: ${Object.keys(CHAIN_IDS).join(', ')}`);
        }
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
    parseExplorerSourceCode(contractData) {
        let sourceCode = contractData.SourceCode;
        if (sourceCode.startsWith('{{')) {
            sourceCode = sourceCode.slice(1, -1);
        }
        if (sourceCode.startsWith('{')) {
            try {
                const parsed = JSON.parse(sourceCode);
                const sources = parsed.sources || parsed;
                return Object.entries(sources).map(([filePath, data]) => ({
                    filename: filePath,
                    content: data.content || data,
                }));
            }
            catch {
            }
        }
        return [{
                filename: `${contractData.ContractName || 'Contract'}.sol`,
                content: sourceCode,
            }];
    }
    parseGithubUrl(url) {
        let parsedUrl;
        try {
            parsedUrl = new URL(url);
        }
        catch {
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
    async fetchGithubRawContent(owner, repo, branch, path) {
        const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
        const response = await fetch(rawUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch from GitHub: HTTP ${response.status}. Check the URL and ensure the file exists.`);
        }
        return response.text();
    }
    async fetchGithubDirectory(owner, repo, branch, dirPath) {
        const apiUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;
        const response = await fetch(apiUrl, {
            headers: { Accept: 'application/vnd.github.v3+json' },
        });
        if (!response.ok) {
            throw new Error(`Failed to list GitHub repo: HTTP ${response.status}. Ensure the repository is public.`);
        }
        const data = await response.json();
        const solFiles = (data.tree || [])
            .filter((item) => {
            const inDir = dirPath ? item.path.startsWith(dirPath) : true;
            return inDir && item.path.endsWith('.sol') && item.type === 'blob';
        })
            .slice(0, 20);
        if (solFiles.length === 0) {
            throw new Error('No .sol files found in the specified path');
        }
        this.logger.log(`Found ${solFiles.length} Solidity file(s) in ${owner}/${repo}/${dirPath || '(root)'}`);
        const contracts = [];
        for (const file of solFiles) {
            try {
                const content = await this.fetchGithubRawContent(owner, repo, branch, file.path);
                contracts.push({
                    filename: file.path.split('/').pop() || file.path,
                    content,
                });
            }
            catch (err) {
                this.logger.warn(`Failed to fetch ${file.path}: ${err.message}`);
            }
        }
        return contracts;
    }
};
exports.ContractFetcherService = ContractFetcherService;
exports.ContractFetcherService = ContractFetcherService = ContractFetcherService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], ContractFetcherService);
//# sourceMappingURL=contract-fetcher.service.js.map