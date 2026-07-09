import { IsArray, IsIn, IsOptional, IsString } from 'class-validator';

export class UpsertStudyDto {
  @IsString() title: string;
  @IsString() slug: string;
  @IsString() summary: string;
  @IsString() content: string;
  @IsOptional() @IsString() coverImageUrl?: string;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsArray() tags?: string[];
  @IsOptional() @IsString() relatedBookSlug?: string;
  @IsOptional()
  @IsIn(['RASCUNHO', 'PENDENTE_APROVACAO', 'PUBLICADO', 'ARQUIVADO', 'REJEITADO'])
  status?: string;
}
