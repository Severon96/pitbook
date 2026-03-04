import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as path from 'path';
import * as schema from '@pitbook/db';

@Injectable()
export class DrizzleService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DrizzleService.name);
  private client: postgres.Sql;
  public db: any; // Use any to avoid complex type inference issues with drizzle-orm in monorepo

  constructor(private config: ConfigService) {}

  async onModuleInit() {
    const connectionString = this.config.get<string>('DATABASE_URL')!;
    this.client = postgres(connectionString, { max: 1 });
    this.db = drizzle(this.client, { schema });

    const migrationsFolder = path.resolve(__dirname, '../../../../packages/db/drizzle');
    this.logger.log(`Running migrations from ${migrationsFolder}`);
    await migrate(this.db, { migrationsFolder });
    this.logger.log('Migrations complete');
  }

  async onModuleDestroy() {
    await this.client.end();
  }
}
