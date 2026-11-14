CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"subtitle" text DEFAULT '' NOT NULL,
	"protected_by_password" boolean DEFAULT false NOT NULL,
	"payload" jsonb NOT NULL,
	"sheet_count" integer DEFAULT 0 NOT NULL,
	"row_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "reports_slug_unique" UNIQUE("slug")
);
