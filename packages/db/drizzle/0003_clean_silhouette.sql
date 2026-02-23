CREATE TYPE "public"."vehicle_todo_status" AS ENUM('OPEN', 'DONE');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vehicle_todo_parts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"todo_id" uuid NOT NULL,
	"name" text NOT NULL,
	"link" text,
	"price" numeric(10, 2),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vehicle_todos" (
	"id" uuid PRIMARY KEY NOT NULL,
	"vehicle_id" uuid NOT NULL,
	"title" text NOT NULL,
	"status" "vehicle_todo_status" DEFAULT 'OPEN' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "vehicle_todo_parts" ADD CONSTRAINT "vehicle_todo_parts_todo_id_vehicle_todos_id_fk" FOREIGN KEY ("todo_id") REFERENCES "public"."vehicle_todos"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "vehicle_todos" ADD CONSTRAINT "vehicle_todos_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "vehicle_todos_vehicle_id_idx" ON "vehicle_todos" USING btree ("vehicle_id");