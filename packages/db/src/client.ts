import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

config({ path: '../../.env' });

const connectionString = process.env.DATABASE_URL!;

export const queryClient = postgres(connectionString);
export const db = drizzle(queryClient, { schema });

export type DrizzleDB = typeof db;
