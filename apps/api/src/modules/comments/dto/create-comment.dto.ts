import { IsOptional, IsString } from 'class-validator';

export class CreateCommentDto {
  @IsString() content: string;
  @IsOptional() @IsString() parentId?: string;
  @IsOptional() @IsString() studyId?: string;
  @IsOptional() @IsString() articleId?: string;
  @IsOptional() @IsString() devotionalId?: string;
}
