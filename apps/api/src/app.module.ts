import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { DrizzleModule } from './drizzle/drizzle.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { CostEntriesModule } from './cost-entries/cost-entries.module';
import { SpritmonitorModule } from './spritmonitor/spritmonitor.module';
import { ReportsModule } from './reports/reports.module';
import * as path from 'path';
import * as fs from 'fs';

// Find project root by looking for workspaces in package.json
const findProjectRoot = (startPath: string): string => {
  let currentPath = startPath;
  while (currentPath !== path.parse(currentPath).root) {
    const packageJsonPath = path.join(currentPath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      if (pkg.workspaces) {
        return currentPath;
      }
    }
    currentPath = path.dirname(currentPath);
  }
  return startPath;
};

const projectRoot = findProjectRoot(__dirname);
const envPath = path.join(projectRoot, '.env');

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: envPath,
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
