import { IsDateString, IsOptional, IsString } from 'class-validator';

export class UpsertDevotionalDto {
  @IsString() title: string;
  @IsString() slug: string;
  @IsDateString() date: string;
  @IsString() verseReference: string;
  @IsString() verseText: string;
  @IsString() reflection: string;
  @IsOptional() @IsString() prayer?: string;
  @IsOptional() @IsString() application?: string;
  @IsOptional() @IsString() coverImageUrl?: string;
}
