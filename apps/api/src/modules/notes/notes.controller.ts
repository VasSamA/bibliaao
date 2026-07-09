import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { NotesService } from './notes.service';
import { UpsertNoteDto } from './dto/upsert-note.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('notas')
@Controller('notas')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Get()
  findMine(@CurrentUser() user: { id: string }) {
    return this.notesService.findMine(user.id);
  }

  @Post()
  create(@CurrentUser() user: { id: string }, @Body() dto: UpsertNoteDto) {
    return this.notesService.create(user.id, dto);
  }

  @Patch(':id')
  update(@CurrentUser() user: { id: string }, @Param('id') id: string, @Body('content') content: string) {
    return this.notesService.update(user.id, id, content);
  }

  @Delete(':id')
  remove(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.notesService.remove(user.id, id);
  }
}
