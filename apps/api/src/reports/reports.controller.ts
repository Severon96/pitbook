import { Controller, Get, Param, Query, Header } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ReportsService } from './reports.service';

@ApiTags('Reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('vehicle/:vehicleId')
  @ApiOperation({ summary: 'Get cost report for a vehicle' })
  @ApiQuery({ name: 'seasonId', required: false })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  async getVehicleReport(
    @Param('vehicleId') vehicleId: string,
    @Query('seasonId') seasonId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.reportsService.generateReport({
      vehicleId,
      seasonId,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
    });
  }

  @Get('vehicle/:vehicleId/csv')
  @ApiOperation({ summary: 'Export cost report as CSV' })
  @ApiQuery({ name: 'seasonId', required: false })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="cost-report.csv"')
  async exportCsv(
    @Param('vehicleId') vehicleId: string,
    @Query('seasonId') seasonId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.reportsService.generateCsvData({
      vehicleId,
      seasonId,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
    });
  }
}
