import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { StorageService } from './storage.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('storage')
@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Roles(
    UserRole.EDITOR_CONTEUDO,
    UserRole.LIDER,
    UserRole.PASTOR,
    UserRole.MODERADOR,
    UserRole.ADMINISTRADOR,
    UserRole.SUPER_ADMINISTRADOR,
  )
  @Post('url-upload')
  async getUploadUrl(@Body() body: { category: string; fileName: string; mimeType: string }) {
    const allowed = StorageService.ALLOWED_MIME_TYPES[body.category];
    if (allowed && !allowed.includes(body.mimeType)) {
      throw new BadRequestException(`Tipo de ficheiro não permitido para a categoria "${body.category}".`);
    }
    return this.storageService.getUploadUrl(body.category, body.fileName, body.mimeType);
  }
}
