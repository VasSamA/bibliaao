import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpsertReadingPlanDto {
  @IsString() title: string;
  @IsString() slug: string;
  @IsString() description: string;
  @IsInt() @Min(1) durationDays: number;
  @IsOptional() @IsString() coverImageUrl?: string;
  @IsOptional()
  @IsIn(['RASCUNHO', 'PENDENTE_APROVACAO', 'PUBLICADO', 'ARQUIVADO', 'REJEITADO'])
  status?: string;
}
