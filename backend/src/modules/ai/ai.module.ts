import { Module } from '@nestjs/common';
import { AiReviewService } from './services/ai-review.service';
import { LlmProviderService } from './services/llm-provider.service';

@Module({
    providers: [
        AiReviewService,
        LlmProviderService,
    ],
    exports: [AiReviewService],
})
export class AiModule { }
