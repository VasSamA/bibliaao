import { IsArray, IsOptional, IsString } from 'class-validator';

export class UpsertArticleDto {
  @IsString() title: string;
  @IsString() slug: string;
  @IsString() excerpt: string;
  @IsString() content: string;
  @IsOptional() @IsString() coverImageUrl?: string;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsArray() tags?: string[];
}
