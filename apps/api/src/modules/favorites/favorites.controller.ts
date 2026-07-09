import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FavoritesService } from './favorites.service';
import { CreateFavoriteDto } from './dto/create-favorite.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('favoritos')
@Controller('favoritos')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  findMine(@CurrentUser() user: { id: string }) {
    return this.favoritesService.findMine(user.id);
  }

  @Post()
  add(@CurrentUser() user: { id: string }, @Body() dto: CreateFavoriteDto) {
    return this.favoritesService.add(user.id, dto);
  }

  @Delete(':reference')
  remove(@CurrentUser() user: { id: string }, @Param('reference') reference: string) {
    return this.favoritesService.remove(user.id, reference);
  }
}
