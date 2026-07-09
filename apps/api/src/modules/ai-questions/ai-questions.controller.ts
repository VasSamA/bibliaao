import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AiQuestionsService } from './ai-questions.service';
import { AskQuestionDto } from './dto/ask-question.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('pergunte-a-biblia')
@Controller('pergunte-a-biblia')
export class AiQuestionsController {
  constructor(private readonly aiQuestionsService: AiQuestionsService) {}

  @Public()
  @Post()
  ask(@CurrentUser() user: { id: string } | undefined, @Body() dto: AskQuestionDto) {
    return this.aiQuestionsService.ask(user?.id, dto);
  }

  @Get('historico')
  myHistory(@CurrentUser() user: { id: string }) {
    return this.aiQuestionsService.myHistory(user.id);
  }
}
