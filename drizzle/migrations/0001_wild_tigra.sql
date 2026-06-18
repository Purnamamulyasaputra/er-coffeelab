ALTER TABLE "branches" ADD COLUMN "pos_key" varchar(50);--> statement-breakpoint
ALTER TABLE "branches" ADD CONSTRAINT "branches_pos_key_unique" UNIQUE("pos_key");