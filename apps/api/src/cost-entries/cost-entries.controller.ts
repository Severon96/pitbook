import { Controller, Get, Post, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { CostEntriesService } from './cost-entries.service';
import { CreateCostEntryDto } from './dto/create-cost-entry.dto';

@ApiTags('Cost Entries')
@Controller('cost-entries')
export class CostEntriesController {
  constructor(private readonly costEntriesService: CostEntriesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all cost entries for a vehicle' })
  @ApiQuery({ name: 'vehicleId', required: true })
  @ApiQuery({ name: 'seasonId', required: false })
  async findAll(
    @Query('vehicleId') vehicleId: string,
    @Query('seasonId') seasonId?: string,
  ) {
    return this.costEntriesService.findAll(vehicleId, seasonId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single cost entry by ID' })
  async findOne(@Param('id') id: string) {
    return this.costEntriesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new cost entry' })
  async create(@Body() createCostEntryDto: CreateCostEntryDto) {
    return this.costEntriesService.create(createCostEntryDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a cost entry' })
  async remove(@Param('id') id: string) {
    return this.costEntriesService.remove(id);
  }
}
