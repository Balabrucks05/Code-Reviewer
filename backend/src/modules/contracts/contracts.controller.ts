import { Controller, Get, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';
import { ContractsService } from './contracts.service';
import { ContractFetcherService } from './contract-fetcher.service';

@ApiTags('contracts')
@Controller('api/contracts')
export class ContractsController {
    constructor(
        private readonly contractsService: ContractsService,
        private readonly contractFetcher: ContractFetcherService,
    ) { }

    @Get('samples')
    @ApiOperation({ summary: 'Get sample contracts for testing' })
    getSampleContracts() {
        return this.contractsService.getSampleContracts();
    }

    @Get('supported-explorers')
    @ApiOperation({ summary: 'Get list of supported block explorers' })
    getSupportedExplorers() {
        return { explorers: this.contractFetcher.getSupportedExplorers() };
    }

    @Post('fetch-url')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Fetch contract source from a block explorer URL',
        description: 'Fetches verified contract source code from Etherscan, BSCScan, PolygonScan, and other block explorers',
    })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                url: { type: 'string', example: 'https://etherscan.io/address/0x...' },
            },
            required: ['url'],
        },
    })
    @ApiResponse({ status: 200, description: 'Contract source fetched successfully' })
    @ApiResponse({ status: 400, description: 'Invalid URL or contract not verified' })
    async fetchFromUrl(@Body() body: { url: string }) {
        try {
            return await this.contractFetcher.fetchFromExplorer(body.url);
        } catch (error) {
            return {
                success: false,
                error: error.message,
                contracts: [],
            };
        }
    }

    @Post('fetch-github')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Fetch Solidity files from a GitHub repository',
        description: 'Fetches .sol files from a public GitHub repository URL',
    })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                url: { type: 'string', example: 'https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/ERC20.sol' },
            },
            required: ['url'],
        },
    })
    @ApiResponse({ status: 200, description: 'GitHub source fetched successfully' })
    @ApiResponse({ status: 400, description: 'Invalid URL or repository not accessible' })
    async fetchFromGithub(@Body() body: { url: string }) {
        try {
            return await this.contractFetcher.fetchFromGithub(body.url);
        } catch (error) {
            return {
                success: false,
                error: error.message,
                contracts: [],
            };
        }
    }
}
