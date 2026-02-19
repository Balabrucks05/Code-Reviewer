import { Module } from '@nestjs/common';
import { GasOptimizerService } from './services/gas-optimizer.service';
import { BytecodeAnalyzerService } from './services/bytecode-analyzer.service';

@Module({
    providers: [
        GasOptimizerService,
        BytecodeAnalyzerService,
    ],
    exports: [GasOptimizerService],
})
export class OptimizationModule { }
