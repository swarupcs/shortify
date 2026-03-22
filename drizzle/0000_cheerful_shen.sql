DO $$ BEGIN
  CREATE TYPE "public"."user_role" AS ENUM('user', 'admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "users" (
  "id" varchar(255) PRIMARY KEY NOT NULL,
  "name" varchar(255),
  "email" varchar(255) NOT NULL UNIQUE,
  "emailVerified" timestamp,
  "image" text,
  "password" text,
  "role" "user_role" DEFAULT 'user' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "accounts" (
  "user_id" varchar(255) NOT NULL,
  "type" varchar(255) NOT NULL,
  "provider" varchar(255) NOT NULL,
  "provider_account_id" varchar(255) NOT NULL,
  "refresh_token" text,
  "access_token" text,
  "expires_at" integer,
  "token_type" varchar(255),
  "scope" varchar(255),
  "id_token" text,
  "session_state" varchar(255),
  CONSTRAINT "accounts_provider_provider_account_id_pk" PRIMARY KEY("provider","provider_account_id")
);

CREATE TABLE IF NOT EXISTS "sessions" (
  "session_token" varchar(255) PRIMARY KEY NOT NULL,
  "user_id" varchar(255) NOT NULL,
  "expires" timestamp NOT NULL
);

CREATE TABLE IF NOT EXISTS "verification_token" (
  "identifier" varchar(255) NOT NULL,
  "token" varchar(255) NOT NULL,
  CONSTRAINT "verification_token_identifier_token_pk" PRIMARY KEY("identifier","token"),
  "expires" timestamp NOT NULL
);

CREATE TABLE IF NOT EXISTS "urls" (
  "id" serial PRIMARY KEY NOT NULL,
  "original_url" varchar(2000) NOT NULL,
  "short_code" varchar(10) NOT NULL UNIQUE,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "clicks" integer DEFAULT 0 NOT NULL,
  "user_id" varchar(255),
  "flagged" boolean DEFAULT false NOT NULL,
  "flag_reason" text,
  "expires_at" timestamp,
  "password_hash" text
);

CREATE TABLE IF NOT EXISTS "click_events" (
  "id" serial PRIMARY KEY NOT NULL,
  "url_id" integer NOT NULL,
  "clicked_at" timestamp DEFAULT now() NOT NULL,
  "country" varchar(2),
  "referrer" varchar(255)
);

CREATE TABLE IF NOT EXISTS "counters" (
  "key" varchar(255) PRIMARY KEY NOT NULL,
  "value" integer DEFAULT 0 NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "bio_pages" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" varchar(255) NOT NULL UNIQUE,
  "handle" varchar(50) NOT NULL UNIQUE,
  "profile_name" varchar(100) DEFAULT '' NOT NULL,
  "profile_bio" varchar(300) DEFAULT '' NOT NULL,
  "theme" varchar(30) DEFAULT 'violet' NOT NULL,
  "links" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

DO $$ BEGIN
  ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "urls" ADD CONSTRAINT "urls_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "click_events" ADD CONSTRAINT "click_events_url_id_urls_id_fk"
    FOREIGN KEY ("url_id") REFERENCES "urls"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "bio_pages" ADD CONSTRAINT "bio_pages_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;

ALTER TABLE "urls" ADD COLUMN IF NOT EXISTS "expires_at" timestamp;
ALTER TABLE "urls" ADD COLUMN IF NOT EXISTS "password_hash" text;