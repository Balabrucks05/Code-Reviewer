import { IsString, IsArray, IsOptional, ValidateNested, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ContractSourceDto {
    @ApiProperty({
        description: 'Filename of the contract',
        example: 'MyToken.sol'
    })
    @IsString()
    filename: string;

    @ApiProperty({
        description: 'Solidity source code content',
        example: 'pragma solidity ^0.8.0; contract MyToken { ... }'
    })
    @IsString()
    content: string;
}

export class AnalysisOptionsDto {
    @ApiPropertyOptional({ description: 'Enable security vulnerability scanning', default: true })
    @IsOptional()
    @IsBoolean()
    enableSecurityAudit?: boolean = true;

    @ApiPropertyOptional({ description: 'Enable gas optimization analysis', default: true })
    @IsOptional()
    @IsBoolean()
    enableGasOptimization?: boolean = true;

    @ApiPropertyOptional({ description: 'Enable AI-powered code review', default: true })
    @IsOptional()
    @IsBoolean()
    enableAiReview?: boolean = true;

    @ApiPropertyOptional({ description: 'Solidity compiler version', default: '0.8.20' })
    @IsOptional()
    @IsString()
    compilerVersion?: string = '0.8.20';
}

export class AnalyzeContractDto {
    @ApiProperty({
        type: [ContractSourceDto],
        description: 'Array of contract source files to analyze'
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ContractSourceDto)
    contracts: ContractSourceDto[];

    @ApiPropertyOptional({ type: AnalysisOptionsDto })
    @IsOptional()
    @ValidateNested()
    @Type(() => AnalysisOptionsDto)
    options?: AnalysisOptionsDto;
}
