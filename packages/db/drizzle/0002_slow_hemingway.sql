CREATE TYPE "public"."AuthProvider" AS ENUM('LOCAL', 'OIDC');--> statement-breakpoint
CREATE TYPE "public"."UserRole" AS ENUM('ADMIN', 'USER');--> statement-breakpoint
CREATE TYPE "public"."VehicleShareRole" AS ENUM('OWNER', 'EDITOR', 'VIEWER');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "oauth_sessions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"state" text NOT NULL,
	"nonce" text NOT NULL,
	"redirect_uri" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "oauth_sessions_state_unique" UNIQUE("state")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"username" text NOT NULL,
	"password_hash" text,
	"role" "UserRole" DEFAULT 'USER' NOT NULL,
	"auth_provider" "AuthProvider" DEFAULT 'LOCAL' NOT NULL,
	"oidc_sub" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_oidc_sub_unique" UNIQUE("oidc_sub")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vehicle_shares" (
	"id" uuid PRIMARY KEY NOT NULL,
	"vehicle_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "VehicleShareRole" NOT NULL,
	"granted_by_id" uuid NOT NULL,
	"granted_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vehicle_shares_vehicle_user_unique" UNIQUE("vehicle_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "user_id" uuid;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "vehicle_shares" ADD CONSTRAINT "vehicle_shares_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "vehicle_shares" ADD CONSTRAINT "vehicle_shares_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "vehicle_shares" ADD CONSTRAINT "vehicle_shares_granted_by_id_users_id_fk" FOREIGN KEY ("granted_by_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "oauth_sessions_state_idx" ON "oauth_sessions" USING btree ("state");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "oauth_sessions_expires_at_idx" ON "oauth_sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_oidc_sub_idx" ON "users" USING btree ("oidc_sub");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "vehicle_shares_vehicle_id_idx" ON "vehicle_shares" USING btree ("vehicle_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "vehicle_shares_user_id_idx" ON "vehicle_shares" USING btree ("user_id");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
