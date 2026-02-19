"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalysisModule = void 0;
const common_1 = require("@nestjs/common");
const analysis_controller_1 = require("./analysis.controller");
const analysis_service_1 = require("./services/analysis.service");
const ast_parser_service_1 = require("./services/ast-parser.service");
const analysis_pipeline_service_1 = require("./services/analysis-pipeline.service");
const import_resolver_service_1 = require("./services/import-resolver.service");
const security_module_1 = require("../security/security.module");
const optimization_module_1 = require("../optimization/optimization.module");
const ai_module_1 = require("../ai/ai.module");
let AnalysisModule = class AnalysisModule {
};
exports.AnalysisModule = AnalysisModule;
exports.AnalysisModule = AnalysisModule = __decorate([
    (0, common_1.Module)({
        imports: [security_module_1.SecurityModule, optimization_module_1.OptimizationModule, ai_module_1.AiModule],
        controllers: [analysis_controller_1.AnalysisController],
        providers: [
            analysis_service_1.AnalysisService,
            ast_parser_service_1.AstParserService,
            analysis_pipeline_service_1.AnalysisPipelineService,
            import_resolver_service_1.ImportResolverService,
        ],
        exports: [analysis_service_1.AnalysisService, ast_parser_service_1.AstParserService],
    })
], AnalysisModule);
//# sourceMappingURL=analysis.module.js.map