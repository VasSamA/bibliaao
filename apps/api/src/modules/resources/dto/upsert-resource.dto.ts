import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ResourceType } from '@prisma/client';

export class UpsertResourceDto {
  @IsString() title: string;
  @IsOptional() @IsString() description?: string;
  @IsEnum(ResourceType) type: ResourceType;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsString() audience?: string;
  @IsString() fileUrl: string;
  @IsOptional() @IsString() mimeType?: string;
  @IsOptional() @IsString() thumbnailUrl?: string;
}
