-- Drop all foreign key constraints before altering column types
-- (PostgreSQL internally drops+recreates FKs when changing referenced column types,
-- which fails if the referencing column still has the old type)
ALTER TABLE "cost_entries" DROP CONSTRAINT IF EXISTS "cost_entries_vehicle_id_vehicles_id_fk";--> statement-breakpoint
ALTER TABLE "cost_entries" DROP CONSTRAINT IF EXISTS "cost_entries_season_id_seasons_id_fk";--> statement-breakpoint
ALTER TABLE "cost_entry_items" DROP CONSTRAINT IF EXISTS "cost_entry_items_cost_entry_id_cost_entries_id_fk";--> statement-breakpoint
ALTER TABLE "fuel_logs" DROP CONSTRAINT IF EXISTS "fuel_logs_vehicle_id_vehicles_id_fk";--> statement-breakpoint
ALTER TABLE "seasons" DROP CONSTRAINT IF EXISTS "seasons_vehicle_id_vehicles_id_fk";--> statement-breakpoint
ALTER TABLE "service_records" DROP CONSTRAINT IF EXISTS "service_records_vehicle_id_vehicles_id_fk";--> statement-breakpoint
ALTER TABLE "service_records" DROP CONSTRAINT IF EXISTS "service_records_cost_entry_id_cost_entries_id_fk";--> statement-breakpoint
-- Alter primary key columns to uuid
ALTER TABLE "vehicles" ALTER COLUMN "id" SET DATA TYPE uuid USING "id"::uuid;--> statement-breakpoint
ALTER TABLE "seasons" ALTER COLUMN "id" SET DATA TYPE uuid USING "id"::uuid;--> statement-breakpoint
ALTER TABLE "cost_entries" ALTER COLUMN "id" SET DATA TYPE uuid USING "id"::uuid;--> statement-breakpoint
ALTER TABLE "cost_entry_items" ALTER COLUMN "id" SET DATA TYPE uuid USING "id"::uuid;--> statement-breakpoint
ALTER TABLE "fuel_logs" ALTER COLUMN "id" SET DATA TYPE uuid USING "id"::uuid;--> statement-breakpoint
ALTER TABLE "service_records" ALTER COLUMN "id" SET DATA TYPE uuid USING "id"::uuid;--> statement-breakpoint
-- Alter foreign key columns to uuid
ALTER TABLE "cost_entries" ALTER COLUMN "vehicle_id" SET DATA TYPE uuid USING "vehicle_id"::uuid;--> statement-breakpoint
ALTER TABLE "cost_entries" ALTER COLUMN "season_id" SET DATA TYPE uuid USING "season_id"::uuid;--> statement-breakpoint
ALTER TABLE "cost_entry_items" ALTER COLUMN "cost_entry_id" SET DATA TYPE uuid USING "cost_entry_id"::uuid;--> statement-breakpoint
ALTER TABLE "fuel_logs" ALTER COLUMN "vehicle_id" SET DATA TYPE uuid USING "vehicle_id"::uuid;--> statement-breakpoint
ALTER TABLE "seasons" ALTER COLUMN "vehicle_id" SET DATA TYPE uuid USING "vehicle_id"::uuid;--> statement-breakpoint
ALTER TABLE "service_records" ALTER COLUMN "vehicle_id" SET DATA TYPE uuid USING "vehicle_id"::uuid;--> statement-breakpoint
ALTER TABLE "service_records" ALTER COLUMN "cost_entry_id" SET DATA TYPE uuid USING "cost_entry_id"::uuid;--> statement-breakpoint
-- Re-add foreign key constraints now that all columns are uuid
ALTER TABLE "cost_entries" ADD CONSTRAINT "cost_entries_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cost_entries" ADD CONSTRAINT "cost_entries_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cost_entry_items" ADD CONSTRAINT "cost_entry_items_cost_entry_id_cost_entries_id_fk" FOREIGN KEY ("cost_entry_id") REFERENCES "public"."cost_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fuel_logs" ADD CONSTRAINT "fuel_logs_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seasons" ADD CONSTRAINT "seasons_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_records" ADD CONSTRAINT "service_records_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_records" ADD CONSTRAINT "service_records_cost_entry_id_cost_entries_id_fk" FOREIGN KEY ("cost_entry_id") REFERENCES "public"."cost_entries"("id") ON DELETE set null ON UPDATE no action;
