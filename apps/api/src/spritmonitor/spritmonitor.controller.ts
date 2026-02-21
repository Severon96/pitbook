import { Controller, Post, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SpritmonitorService } from './spritmonitor.service';

@ApiTags('Spritmonitor')
@Controller('spritmonitor')
export class SpritmonitorController {
  constructor(private readonly spritmonitorService: SpritmonitorService) {}

  @Post('sync/:vehicleId')
  @ApiOperation({ summary: 'Manually trigger sync for a vehicle' })
  async syncVehicle(@Param('vehicleId') vehicleId: string) {
    return this.spritmonitorService.syncVehicle(vehicleId);
  }

  @Post('sync-all')
  @ApiOperation({ summary: 'Sync all vehicles with Spritmonitor integration' })
  async syncAll() {
    return this.spritmonitorService.syncAllVehicles();
  }
}
