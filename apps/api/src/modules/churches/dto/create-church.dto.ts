import { IsEmail, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateChurchDto {
  @IsString() name: string;
  @IsOptional() @IsString() denomination?: string;
  @IsOptional() @IsString() pastorName?: string;
  @IsString() address: string;
  @IsString() city: string;
  @IsString() province: string;
  @IsOptional() @IsNumber() latitude?: number;
  @IsOptional() @IsNumber() longitude?: number;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() website?: string;
  @IsOptional() @IsString() description?: string;
}
