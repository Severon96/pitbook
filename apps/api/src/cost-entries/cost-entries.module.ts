import { Module } from '@nestjs/common';
import { CostEntriesController } from './cost-entries.controller';
import { CostEntriesService } from './cost-entries.service';

@Module({
  controllers: [CostEntriesController],
  providers: [CostEntriesService],
  exports: [CostEntriesService],
})
export class CostEntriesModule {}
