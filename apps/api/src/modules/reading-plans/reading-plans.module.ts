import { Module } from '@nestjs/common';
import { ReadingPlansService } from './reading-plans.service';
import { ReadingPlansController } from './reading-plans.controller';

@Module({
  controllers: [ReadingPlansController],
  providers: [ReadingPlansService],
})
export class ReadingPlansModule {}
