CREATE TABLE "table_sessions" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"branch_id" bigint NOT NULL,
	"table_id" bigint NOT NULL,
	"session_date" date DEFAULT now() NOT NULL,
	"guest_count" integer DEFAULT 1,
	"opened_by" bigint,
	"closed_by" bigint,
	"status" varchar(20) DEFAULT 'OPEN',
	"payment_method" varchar(50),
	"subtotal" bigint DEFAULT 0,
	"tax_amount" bigint DEFAULT 0,
	"total_amount" bigint DEFAULT 0,
	"notes" text,
	"opened_at" timestamp with time zone DEFAULT now(),
	"closed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "branches" DROP CONSTRAINT "branches_pos_key_unique";--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "table_session_id" bigint;--> statement-breakpoint
ALTER TABLE "store_tables" ADD COLUMN "current_session_id" bigint;--> statement-breakpoint
ALTER TABLE "table_sessions" ADD CONSTRAINT "table_sessions_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "table_sessions" ADD CONSTRAINT "table_sessions_table_id_store_tables_id_fk" FOREIGN KEY ("table_id") REFERENCES "public"."store_tables"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_table_sessions_branch" ON "table_sessions" USING btree ("branch_id","status");--> statement-breakpoint
CREATE INDEX "idx_table_sessions_table" ON "table_sessions" USING btree ("table_id","status");--> statement-breakpoint
ALTER TABLE "branches" DROP COLUMN "pos_key";