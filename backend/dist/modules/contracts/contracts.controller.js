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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContractsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const contracts_service_1 = require("./contracts.service");
const contract_fetcher_service_1 = require("./contract-fetcher.service");
let ContractsController = class ContractsController {
    contractsService;
    contractFetcher;
    constructor(contractsService, contractFetcher) {
        this.contractsService = contractsService;
        this.contractFetcher = contractFetcher;
    }
    getSampleContracts() {
        return this.contractsService.getSampleContracts();
    }
    getSupportedExplorers() {
        return { explorers: this.contractFetcher.getSupportedExplorers() };
    }
    async fetchFromUrl(body) {
        try {
            return await this.contractFetcher.fetchFromExplorer(body.url);
        }
        catch (error) {
            return {
                success: false,
                error: error.message,
                contracts: [],
            };
        }
    }
    async fetchFromGithub(body) {
        try {
            return await this.contractFetcher.fetchFromGithub(body.url);
        }
        catch (error) {
            return {
                success: false,
                error: error.message,
                contracts: [],
            };
        }
    }
};
exports.ContractsController = ContractsController;
__decorate([
    (0, common_1.Get)('samples'),
    (0, swagger_1.ApiOperation)({ summary: 'Get sample contracts for testing' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ContractsController.prototype, "getSampleContracts", null);
__decorate([
    (0, common_1.Get)('supported-explorers'),
    (0, swagger_1.ApiOperation)({ summary: 'Get list of supported block explorers' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ContractsController.prototype, "getSupportedExplorers", null);
__decorate([
    (0, common_1.Post)('fetch-url'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Fetch contract source from a block explorer URL',
        description: 'Fetches verified contract source code from Etherscan, BSCScan, PolygonScan, and other block explorers',
    }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                url: { type: 'string', example: 'https://etherscan.io/address/0x...' },
            },
            required: ['url'],
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Contract source fetched successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid URL or contract not verified' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ContractsController.prototype, "fetchFromUrl", null);
__decorate([
    (0, common_1.Post)('fetch-github'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Fetch Solidity files from a GitHub repository',
        description: 'Fetches .sol files from a public GitHub repository URL',
    }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                url: { type: 'string', example: 'https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/ERC20.sol' },
            },
            required: ['url'],
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'GitHub source fetched successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid URL or repository not accessible' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ContractsController.prototype, "fetchFromGithub", null);
exports.ContractsController = ContractsController = __decorate([
    (0, swagger_1.ApiTags)('contracts'),
    (0, common_1.Controller)('api/contracts'),
    __metadata("design:paramtypes", [contracts_service_1.ContractsService,
        contract_fetcher_service_1.ContractFetcherService])
], ContractsController);
//# sourceMappingURL=contracts.controller.js.map