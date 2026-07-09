import { Module } from '@nestjs/common';
import { AiQuestionsService } from './ai-questions.service';
import { AiQuestionsController } from './ai-questions.controller';

@Module({
  controllers: [AiQuestionsController],
  providers: [AiQuestionsService],
})
export class AiQuestionsModule {}
