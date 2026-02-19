import { Module } from '@nestjs/common';
import { ContractsController } from './contracts.controller';
import { ContractsService } from './contracts.service';
import { ContractFetcherService } from './contract-fetcher.service';

@Module({
    controllers: [ContractsController],
    providers: [ContractsService, ContractFetcherService],
    exports: [ContractsService],
})
export class ContractsModule { }

