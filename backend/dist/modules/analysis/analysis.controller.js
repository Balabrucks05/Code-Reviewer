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
exports.AnalysisController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const analysis_service_1 = require("./services/analysis.service");
const analyze_contract_dto_1 = require("./dto/analyze-contract.dto");
let AnalysisController = class AnalysisController {
    analysisService;
    constructor(analysisService) {
        this.analysisService = analysisService;
    }
    async analyzeContract(dto) {
        return this.analysisService.analyze(dto);
    }
    async getHistory(userId) {
        return this.analysisService.getHistoryByUserId(userId);
    }
    async getAnalysis(id, userId) {
        try {
            const analysis = await this.analysisService.getAnalysisById(id, userId);
            if (!analysis) {
                throw new common_1.NotFoundException('Analysis not found');
            }
            return analysis;
        }
        catch (error) {
            if (error.message.includes('Forbidden')) {
                throw new common_1.ForbiddenException(error.message);
            }
            throw error;
        }
    }
    async getSecurityIssues(id) {
        return this.analysisService.getSecurityIssues(id);
    }
    async getOptimizations(id) {
        return this.analysisService.getOptimizations(id);
    }
    async getAiReview(id) {
        return this.analysisService.getAiReview(id);
    }
};
exports.AnalysisController = AnalysisController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Analyze smart contract',
        description: 'Performs comprehensive analysis including security audit, gas optimization, and AI code review'
    }),
    (0, swagger_1.ApiBody)({ type: analyze_contract_dto_1.AnalyzeContractDto }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Analysis completed successfully'
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [analyze_contract_dto_1.AnalyzeContractDto]),
    __metadata("design:returntype", Promise)
], AnalysisController.prototype, "analyzeContract", null);
__decorate([
    (0, common_1.Get)('history/:userId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get analysis history for a user' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User history retrieved' }),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AnalysisController.prototype, "getHistory", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get analysis result by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Analysis result retrieved' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Analysis not found' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden access to analysis' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AnalysisController.prototype, "getAnalysis", null);
__decorate([
    (0, common_1.Get)(':id/security'),
    (0, swagger_1.ApiOperation)({ summary: 'Get security issues for an analysis' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AnalysisController.prototype, "getSecurityIssues", null);
__decorate([
    (0, common_1.Get)(':id/optimizations'),
    (0, swagger_1.ApiOperation)({ summary: 'Get optimization suggestions for an analysis' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AnalysisController.prototype, "getOptimizations", null);
__decorate([
    (0, common_1.Get)(':id/ai-review'),
    (0, swagger_1.ApiOperation)({ summary: 'Get AI review comments for an analysis' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AnalysisController.prototype, "getAiReview", null);
exports.AnalysisController = AnalysisController = __decorate([
    (0, swagger_1.ApiTags)('analysis'),
    (0, common_1.Controller)('api/analysis'),
    __metadata("design:paramtypes", [analysis_service_1.AnalysisService])
], AnalysisController);
//# sourceMappingURL=analysis.controller.js.map