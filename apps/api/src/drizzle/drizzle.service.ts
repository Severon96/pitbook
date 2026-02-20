import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@pitbook/db';

@Injectable()
export class DrizzleService implements OnModuleInit, OnModuleDestroy {
  private client: postgres.Sql;
  public db: any; // Use any to avoid complex type inference issues with drizzle-orm in monorepo

  constructor(private config: ConfigService) {}

  async onModuleInit() {
    const connectionString = this.config.get<string>('DATABASE_URL')!;
    this.client = postgres(connectionString);
    this.db = drizzle(this.client, { schema });
  }

  async onModuleDestroy() {
    await this.client.end();
  }
}
