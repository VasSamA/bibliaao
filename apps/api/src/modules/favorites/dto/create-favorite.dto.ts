import { IsOptional, IsString } from 'class-validator';

export class CreateFavoriteDto {
  @IsOptional() @IsString() verseId?: string;
  @IsString() reference: string;
  @IsOptional() @IsString() colorTag?: string;
}
