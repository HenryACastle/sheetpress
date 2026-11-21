ALTER TABLE "reports" ADD COLUMN "custom_domain" text;--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "domain_verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "domain_claimed_at" timestamp;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_custom_domain_unique" UNIQUE("custom_domain");