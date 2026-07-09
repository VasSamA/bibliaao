import { IsIn, IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() bio?: string;
  @IsOptional() @IsString() church?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsIn(['light', 'dark']) preferredTheme?: string;
  @IsOptional() preferredFontSize?: number;
}
