CREATE TYPE "public"."CostCategory" AS ENUM('FUEL', 'SERVICE', 'REPAIR', 'INSURANCE', 'TAX', 'PARTS', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."CostSource" AS ENUM('MANUAL', 'SPRITMONITOR');--> statement-breakpoint
CREATE TYPE "public"."SeasonStatus" AS ENUM('ACTIVE', 'CLOSED');--> statement-breakpoint
CREATE TYPE "public"."VehicleType" AS ENUM('DAILY', 'SEASONAL');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cost_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"vehicle_id" text NOT NULL,
	"season_id" text,
	"category" "CostCategory" NOT NULL,
	"title" text NOT NULL,
	"date" timestamp with time zone NOT NULL,
	"total_amount" numeric(10, 2) NOT NULL,
	"notes" text,
	"receipt_url" text,
	"source" "CostSource" DEFAULT 'MANUAL' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cost_entry_items" (
	"id" text PRIMARY KEY NOT NULL,
	"cost_entry_id" text NOT NULL,
	"description" text NOT NULL,
	"quantity" numeric(10, 3) NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"amount" numeric(10, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "fuel_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"vehicle_id" text NOT NULL,
	"spritmonitor_id" text,
	"date" timestamp with time zone NOT NULL,
	"liters" numeric(8, 3) NOT NULL,
	"price_per_liter" numeric(6, 4) NOT NULL,
	"total_cost" numeric(10, 2) NOT NULL,
	"mileage" integer NOT NULL,
	"full_tank" boolean DEFAULT true NOT NULL,
	"notes" text,
	"last_synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "fuel_logs_vehicle_id_spritmonitor_id_key" UNIQUE("vehicle_id","spritmonitor_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "seasons" (
	"id" text PRIMARY KEY NOT NULL,
	"vehicle_id" text NOT NULL,
	"name" text NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone,
	"status" "SeasonStatus" DEFAULT 'ACTIVE' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "service_records" (
	"id" text PRIMARY KEY NOT NULL,
	"vehicle_id" text NOT NULL,
	"cost_entry_id" text,
	"service_type" text NOT NULL,
	"mileage_at_service" integer NOT NULL,
	"next_service_date" timestamp with time zone,
	"next_service_mileage" integer,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "service_records_cost_entry_id_key" UNIQUE("cost_entry_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vehicles" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"brand" text NOT NULL,
	"model" text NOT NULL,
	"year" integer NOT NULL,
	"type" "VehicleType" NOT NULL,
	"license_plate" text,
	"vin" text,
	"image_url" text,
	"notes" text,
	"spritmonitor_vehicle_id" text,
	"spritmonitor_api_key" text,
	"spritmonitor_last_sync" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cost_entries" ADD CONSTRAINT "cost_entries_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cost_entries" ADD CONSTRAINT "cost_entries_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cost_entry_items" ADD CONSTRAINT "cost_entry_items_cost_entry_id_cost_entries_id_fk" FOREIGN KEY ("cost_entry_id") REFERENCES "public"."cost_entries"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "fuel_logs" ADD CONSTRAINT "fuel_logs_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "seasons" ADD CONSTRAINT "seasons_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "service_records" ADD CONSTRAINT "service_records_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "service_records" ADD CONSTRAINT "service_records_cost_entry_id_cost_entries_id_fk" FOREIGN KEY ("cost_entry_id") REFERENCES "public"."cost_entries"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cost_entries_vehicle_id_idx" ON "cost_entries" USING btree ("vehicle_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cost_entries_season_id_idx" ON "cost_entries" USING btree ("season_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cost_entries_date_idx" ON "cost_entries" USING btree ("date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "fuel_logs_vehicle_id_date_idx" ON "fuel_logs" USING btree ("vehicle_id","date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "service_records_vehicle_id_idx" ON "service_records" USING btree ("vehicle_id");