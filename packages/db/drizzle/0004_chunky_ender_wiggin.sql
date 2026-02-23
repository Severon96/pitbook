DROP TABLE "fuel_logs" CASCADE;--> statement-breakpoint
ALTER TABLE "vehicles" DROP COLUMN IF EXISTS "spritmonitor_last_sync";