CREATE TABLE "bio_page_views" (
	"id" serial PRIMARY KEY NOT NULL,
	"bio_page_id" integer NOT NULL,
	"viewed_at" timestamp DEFAULT now() NOT NULL,
	"country" varchar(2)
);
--> statement-breakpoint
ALTER TABLE "click_events" ADD COLUMN "device" varchar(20);--> statement-breakpoint
ALTER TABLE "click_events" ADD COLUMN "browser" varchar(50);--> statement-breakpoint
ALTER TABLE "urls" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "bio_page_views" ADD CONSTRAINT "bio_page_views_bio_page_id_bio_pages_id_fk" FOREIGN KEY ("bio_page_id") REFERENCES "public"."bio_pages"("id") ON DELETE cascade ON UPDATE no action;