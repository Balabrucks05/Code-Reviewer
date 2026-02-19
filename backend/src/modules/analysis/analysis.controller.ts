import { Controller, Post, Body, Get, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AnalysisService } from './services/analysis.service';
import { AnalyzeContractDto } from './dto/analyze-contract.dto';

@ApiTags('analysis')
@Controller('api/analysis')
export class AnalysisController {
    constructor(private readonly analysisService: AnalysisService) { }

    @Post()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Analyze smart contract',
        description: 'Performs comprehensive analysis including security audit, gas optimization, and AI code review'
    })
    @ApiBody({ type: AnalyzeContractDto })
    @ApiResponse({
        status: 200,
        description: 'Analysis completed successfully'
    })
    async analyzeContract(@Body() dto: AnalyzeContractDto) {
        return this.analysisService.analyze(dto);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get analysis result by ID' })
    @ApiResponse({ status: 200, description: 'Analysis result retrieved' })
    @ApiResponse({ status: 404, description: 'Analysis not found' })
    async getAnalysis(@Param('id') id: string) {
        return this.analysisService.getAnalysisById(id);
    }

    @Get(':id/security')
    @ApiOperation({ summary: 'Get security issues for an analysis' })
    async getSecurityIssues(@Param('id') id: string) {
        return this.analysisService.getSecurityIssues(id);
    }

    @Get(':id/optimizations')
    @ApiOperation({ summary: 'Get optimization suggestions for an analysis' })
    async getOptimizations(@Param('id') id: string) {
        return this.analysisService.getOptimizations(id);
    }

    @Get(':id/ai-review')
    @ApiOperation({ summary: 'Get AI review comments for an analysis' })
    async getAiReview(@Param('id') id: string) {
        return this.analysisService.getAiReview(id);
    }
}
