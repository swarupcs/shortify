CREATE TABLE "rate_limits" (
	"key" varchar(255) NOT NULL,
	"window_start" timestamp NOT NULL,
	"count" integer DEFAULT 1 NOT NULL
);
