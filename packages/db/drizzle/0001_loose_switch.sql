ALTER TABLE "cost_entries" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "cost_entries" ALTER COLUMN "vehicle_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "cost_entries" ALTER COLUMN "season_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "cost_entry_items" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "cost_entry_items" ALTER COLUMN "cost_entry_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "fuel_logs" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "fuel_logs" ALTER COLUMN "vehicle_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "seasons" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "seasons" ALTER COLUMN "vehicle_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "service_records" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "service_records" ALTER COLUMN "vehicle_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "service_records" ALTER COLUMN "cost_entry_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "vehicles" ALTER COLUMN "id" SET DATA TYPE uuid;