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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyzeContractDto = exports.AnalysisOptionsDto = exports.ContractSourceDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
class ContractSourceDto {
    filename;
    content;
}
exports.ContractSourceDto = ContractSourceDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Filename of the contract',
        example: 'MyToken.sol'
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ContractSourceDto.prototype, "filename", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Solidity source code content',
        example: 'pragma solidity ^0.8.0; contract MyToken { ... }'
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ContractSourceDto.prototype, "content", void 0);
class AnalysisOptionsDto {
    enableSecurityAudit = true;
    enableGasOptimization = true;
    enableAiReview = true;
    compilerVersion = '0.8.20';
}
exports.AnalysisOptionsDto = AnalysisOptionsDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Enable security vulnerability scanning', default: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], AnalysisOptionsDto.prototype, "enableSecurityAudit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Enable gas optimization analysis', default: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], AnalysisOptionsDto.prototype, "enableGasOptimization", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Enable AI-powered code review', default: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], AnalysisOptionsDto.prototype, "enableAiReview", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Solidity compiler version', default: '0.8.20' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AnalysisOptionsDto.prototype, "compilerVersion", void 0);
class AnalyzeContractDto {
    contracts;
    options;
}
exports.AnalyzeContractDto = AnalyzeContractDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        type: [ContractSourceDto],
        description: 'Array of contract source files to analyze'
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => ContractSourceDto),
    __metadata("design:type", Array)
], AnalyzeContractDto.prototype, "contracts", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: AnalysisOptionsDto }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => AnalysisOptionsDto),
    __metadata("design:type", AnalysisOptionsDto)
], AnalyzeContractDto.prototype, "options", void 0);
//# sourceMappingURL=analyze-contract.dto.js.map