import { IsOptional, IsString } from 'class-validator';

export class UpsertNoteDto {
  @IsOptional() @IsString() verseId?: string;
  @IsString() reference: string;
  @IsString() content: string;
}
