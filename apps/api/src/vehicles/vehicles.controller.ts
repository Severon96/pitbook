import {
  Controller, Get, Post, Put, Delete,
  Param, Body, HttpCode, HttpStatus, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { VehicleOwnershipGuard } from '../auth/guards/vehicle-ownership.guard';

@ApiTags('vehicles')
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Get()
  @ApiOperation({ summary: 'List all vehicles' })
  findAll(@CurrentUser() user: any) {
    return this.vehiclesService.findAll(user.id, user.role);
  }

  @Get(':id')
  @UseGuards(VehicleOwnershipGuard)
  @ApiOperation({ summary: 'Get a vehicle by ID' })
  findOne(@Param('id') id: string) {
    return this.vehiclesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new vehicle' })
  create(@Body() dto: CreateVehicleDto, @CurrentUser() user: any) {
    return this.vehiclesService.create(dto, user.id);
  }

  @Put(':id')
  @UseGuards(VehicleOwnershipGuard)
  @ApiOperation({ summary: 'Update a vehicle' })
  update(@Param('id') id: string, @Body() dto: UpdateVehicleDto) {
    return this.vehiclesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(VehicleOwnershipGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a vehicle' })
  remove(@Param('id') id: string) {
    return this.vehiclesService.remove(id);
  }

  @Get(':id/summary')
  @UseGuards(VehicleOwnershipGuard)
  @ApiOperation({ summary: 'Get vehicle cost summary' })
  getSummary(@Param('id') id: string) {
    return this.vehiclesService.getSummary(id);
  }
}
