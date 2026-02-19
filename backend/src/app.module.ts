import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AnalysisModule } from './modules/analysis/analysis.module';
import { SecurityModule } from './modules/security/security.module';
import { OptimizationModule } from './modules/optimization/optimization.module';
import { AiModule } from './modules/ai/ai.module';
import { ContractsModule } from './modules/contracts/contracts.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AnalysisModule,
    SecurityModule,
    OptimizationModule,
    AiModule,
    ContractsModule,
  ],
})
export class AppModule { }

