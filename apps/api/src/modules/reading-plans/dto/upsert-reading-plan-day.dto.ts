import { IsArray, IsOptional, IsString } from 'class-validator';

export class UpsertReadingPlanDayDto {
  @IsOptional() @IsString() title?: string;
  @IsArray() @IsString({ each: true }) references: string[];
  @IsOptional() @IsString() note?: string;
}
