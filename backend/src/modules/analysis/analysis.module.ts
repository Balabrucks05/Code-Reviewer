import { Module } from '@nestjs/common';
import { AnalysisController } from './analysis.controller';
import { AnalysisService } from './services/analysis.service';
import { AstParserService } from './services/ast-parser.service';
import { AnalysisPipelineService } from './services/analysis-pipeline.service';
import { ImportResolverService } from './services/import-resolver.service';
import { SecurityModule } from '../security/security.module';
import { OptimizationModule } from '../optimization/optimization.module';
import { AiModule } from '../ai/ai.module';

@Module({
    imports: [SecurityModule, OptimizationModule, AiModule],
    controllers: [AnalysisController],
    providers: [
        AnalysisService,
        AstParserService,
        AnalysisPipelineService,
        ImportResolverService,
    ],
    exports: [AnalysisService, AstParserService],
})
export class AnalysisModule { }

