import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { DrizzleModule } from './drizzle/drizzle.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { CostEntriesModule } from './cost-entries/cost-entries.module';
import { SpritmonitorModule } from './spritmonitor/spritmonitor.module';
import { ReportsModule } from './reports/reports.module';
import * as path from 'path';

// Find project root (where node_modules is)
const findProjectRoot = (startPath: string): string => {
  let currentPath = startPath;
  while (currentPath !== path.parse(currentPath).root) {
    if (require('fs').existsSync(path.join(currentPath, 'package.json'))) {
      const pkg = require(path.join(currentPath, 'package.json'));
      if (pkg.workspaces) {
        return currentPath;
      }
    }
    currentPath = path.dirname(currentPath);
  }
  return startPath;
};

const projectRoot = findProjectRoot(__dirname);

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: path.join(projectRoot, '.env'),
    }),
    ScheduleModule.forRoot(),
    DrizzleModule,
    VehiclesModule,
    CostEntriesModule,
    SpritmonitorModule,
    ReportsModule,
  ],
})
export class AppModule {}
