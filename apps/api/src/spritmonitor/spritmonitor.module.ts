import { Module } from '@nestjs/common';
import { SpritmonitorController } from './spritmonitor.controller';
import { SpritmonitorService } from './spritmonitor.service';

@Module({
  controllers: [SpritmonitorController],
  providers: [SpritmonitorService],
  exports: [SpritmonitorService],
})
export class SpritmonitorModule {}
