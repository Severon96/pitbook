import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { SpritmonitorService } from './spritmonitor.service';

@ApiTags('Spritmonitor')
@Controller('spritmonitor')
export class SpritmonitorController {
  constructor(private readonly spritmonitorService: SpritmonitorService) {}

  @Get('stats/:vehicleId')
  @ApiOperation({ summary: 'Get current average fuel consumption for a linked vehicle' })
  getStats(@Param('vehicleId') vehicleId: string) {
    return this.spritmonitorService.getStats(vehicleId);
  }

  @Get('vehicles')
  @ApiOperation({ summary: 'List vehicles from a Spritmonitor account' })
  @ApiQuery({ name: 'apiKey', required: true })
  getVehicles(@Query('apiKey') apiKey: string) {
    return this.spritmonitorService.getVehicles(apiKey);
  }
}
