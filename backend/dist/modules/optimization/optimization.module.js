"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OptimizationModule = void 0;
const common_1 = require("@nestjs/common");
const gas_optimizer_service_1 = require("./services/gas-optimizer.service");
const bytecode_analyzer_service_1 = require("./services/bytecode-analyzer.service");
let OptimizationModule = class OptimizationModule {
};
exports.OptimizationModule = OptimizationModule;
exports.OptimizationModule = OptimizationModule = __decorate([
    (0, common_1.Module)({
        providers: [
            gas_optimizer_service_1.GasOptimizerService,
            bytecode_analyzer_service_1.BytecodeAnalyzerService,
        ],
        exports: [gas_optimizer_service_1.GasOptimizerService],
    })
], OptimizationModule);
//# sourceMappingURL=optimization.module.js.map