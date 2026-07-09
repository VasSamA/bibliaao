import { IsIn, IsOptional, IsString } from 'class-validator';

export class UpsertCourseDto {
  @IsString() title: string;
  @IsString() slug: string;
  @IsString() description: string;
  @IsOptional() @IsIn(['iniciante', 'intermedio', 'avancado']) level?: string;
  @IsOptional() @IsString() coverImageUrl?: string;
}
