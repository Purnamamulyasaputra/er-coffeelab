ALTER TABLE "employees" DROP CONSTRAINT "employees_email_unique";--> statement-breakpoint
ALTER TABLE "employees" ALTER COLUMN "password_hash" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "store_tables" ADD COLUMN "reservation_name" varchar(100);--> statement-breakpoint
ALTER TABLE "store_tables" ADD COLUMN "reservation_note" text;--> statement-breakpoint
ALTER TABLE "admins" DROP COLUMN "employee_id";--> statement-breakpoint
ALTER TABLE "employees" DROP COLUMN "pin_hash";