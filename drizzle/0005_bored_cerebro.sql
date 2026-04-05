CREATE TABLE IF NOT EXISTS "bio_page_views" (
	"id" serial PRIMARY KEY NOT NULL,
	"bio_page_id" integer NOT NULL,
	"viewed_at" timestamp DEFAULT now() NOT NULL,
	"country" varchar(2)
);
--> statement-breakpoint
ALTER TABLE "click_events" ADD COLUMN IF NOT EXISTS "device" varchar(20);--> statement-breakpoint
ALTER TABLE "click_events" ADD COLUMN IF NOT EXISTS "browser" varchar(50);--> statement-breakpoint
ALTER TABLE "urls" ADD COLUMN IF NOT EXISTS "deleted_at" timestamp;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bio_page_views" ADD CONSTRAINT "bio_page_views_bio_page_id_bio_pages_id_fk" FOREIGN KEY ("bio_page_id") REFERENCES "public"."bio_pages"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;