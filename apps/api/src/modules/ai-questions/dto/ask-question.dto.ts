import { IsString, MaxLength, MinLength } from 'class-validator';

export class AskQuestionDto {
  @IsString()
  @MinLength(5, { message: 'Escreva a sua pergunta com mais detalhe.' })
  @MaxLength(1000)
  question: string;
}
