ALTER TABLE "employees" ALTER COLUMN "pin_hash" SET DEFAULT '0000';--> statement-breakpoint
ALTER TABLE "admins" ADD COLUMN "employee_id" bigint;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "password_hash" varchar(255);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "xendit_payment_id" varchar(255);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "xendit_payment_method_id" varchar(255);--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_email_unique" UNIQUE("email");