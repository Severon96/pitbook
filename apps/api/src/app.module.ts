import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { DrizzleModule } from './drizzle/drizzle.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { CostEntriesModule } from './cost-entries/cost-entries.module';
import { SpritmonitorModule } from './spritmonitor/spritmonitor.module';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    DrizzleModule,
    VehiclesModule,
    CostEntriesModule,
    SpritmonitorModule,
    ReportsModule,
  ],
})
export class AppModule {}
