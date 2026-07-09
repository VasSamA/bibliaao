import { Module } from '@nestjs/common';
import { BibleService } from './bible.service';
import { BibleController } from './bible.controller';
import { BibleImportService } from './import/bible-import.service';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [BibleController],
  providers: [
    BibleService,
    {
      provide: BibleImportService,
      useFactory: (prisma: PrismaService) => new BibleImportService(prisma as any),
      inject: [PrismaService],
    },
  ],
  exports: [BibleService],
})
export class BibleModule {}
