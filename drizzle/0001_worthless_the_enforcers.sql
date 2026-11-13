CREATE TABLE "chapter_page" (
	"id" text PRIMARY KEY NOT NULL,
	"chapter_id" text NOT NULL,
	"page_number" integer NOT NULL,
	"image_url" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "chapter_page" ADD CONSTRAINT "chapter_page_chapter_id_chapter_id_fk" FOREIGN KEY ("chapter_id") REFERENCES "public"."chapter"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "chapter_page_chapter_id_idx" ON "chapter_page" USING btree ("chapter_id");--> statement-breakpoint
CREATE UNIQUE INDEX "chapter_page_unique" ON "chapter_page" USING btree ("chapter_id","page_number");