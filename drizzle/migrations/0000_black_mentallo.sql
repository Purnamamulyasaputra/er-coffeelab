CREATE TABLE "admins" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"email" varchar(150) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"role" varchar(50) DEFAULT 'SUPERADMIN',
	"status" varchar(20) DEFAULT 'ACTIVE',
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "admins_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "banners" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"title" varchar(200) NOT NULL,
	"image_url" varchar(500) NOT NULL,
	"link_destination" varchar(500),
	"placement" varchar(30) DEFAULT 'HOME',
	"sort_order" integer DEFAULT 0,
	"status" varchar(20) DEFAULT 'ACTIVE',
	"start_date" timestamp with time zone,
	"end_date" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "branch_admins" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"branch_id" bigint NOT NULL,
	"admin_id" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "branch_option_stock" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"branch_id" bigint NOT NULL,
	"option_id" bigint NOT NULL,
	"stock_status" varchar(20) DEFAULT 'AVAILABLE',
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "branch_product_stock" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"branch_id" bigint NOT NULL,
	"product_id" bigint NOT NULL,
	"stock_status" varchar(20) DEFAULT 'AVAILABLE',
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "branches" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"name" varchar(150) NOT NULL,
	"address" text NOT NULL,
	"latitude" numeric(10, 7) NOT NULL,
	"longitude" numeric(10, 7) NOT NULL,
	"phone" varchar(20),
	"image_url" varchar(500),
	"operating_hours" varchar(255),
	"status" varchar(20) DEFAULT 'OPEN',
	"pickup_enabled" boolean DEFAULT true,
	"delivery_enabled" boolean DEFAULT true,
	"dinein_enabled" boolean DEFAULT false,
	"delivery_radius_km" numeric(5, 2) DEFAULT '5.00',
	"tax_rate" numeric(5, 2) DEFAULT '0.00',
	"service_charge_pct" numeric(5, 2) DEFAULT '0.00',
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"image_url" varchar(500),
	"status" varchar(20) DEFAULT 'ACTIVE',
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "cart_item_options" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"cart_item_id" bigint NOT NULL,
	"option_id" bigint NOT NULL,
	"additional_price" bigint DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "cart_items" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"cart_id" bigint NOT NULL,
	"product_id" bigint NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_price" bigint NOT NULL,
	"notes" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "carts" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"customer_id" bigint NOT NULL,
	"branch_id" bigint,
	"order_mode" varchar(20),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "cash_movements" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"shift_id" bigint NOT NULL,
	"employee_id" bigint NOT NULL,
	"type" varchar(20) NOT NULL,
	"amount" bigint NOT NULL,
	"reason" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"icon_url" varchar(500),
	"sort_order" integer DEFAULT 0,
	"status" varchar(20) DEFAULT 'ACTIVE'
);
--> statement-breakpoint
CREATE TABLE "customer_addresses" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"customer_id" bigint NOT NULL,
	"label" varchar(50) NOT NULL,
	"address" text NOT NULL,
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"notes" varchar(255),
	"is_default" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "customer_favorites" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"customer_id" bigint NOT NULL,
	"product_id" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"email" varchar(150),
	"phone" varchar(20) NOT NULL,
	"password_hash" varchar(255),
	"avatar_url" varchar(500),
	"auth_provider" varchar(20) DEFAULT 'PHONE',
	"status" varchar(20) DEFAULT 'ACTIVE',
	"loyalty_tier_id" bigint,
	"total_points" bigint DEFAULT 0,
	"lifetime_spend" bigint DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "customers_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
CREATE TABLE "daily_checkins" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"customer_id" bigint NOT NULL,
	"day_sequence" integer NOT NULL,
	"points_awarded" bigint NOT NULL,
	"checkin_date" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "discounts" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"discount_type" varchar(20) NOT NULL,
	"discount_value" bigint NOT NULL,
	"max_discount" bigint,
	"apply_to" varchar(20) DEFAULT 'ORDER',
	"requires_pin" boolean DEFAULT false,
	"status" varchar(20) DEFAULT 'ACTIVE',
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "employee_attendances" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"employee_id" bigint NOT NULL,
	"branch_id" bigint NOT NULL,
	"clock_in" timestamp with time zone NOT NULL,
	"clock_out" timestamp with time zone,
	"total_hours" numeric(5, 2),
	"notes" varchar(255),
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "employees" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"branch_id" bigint NOT NULL,
	"name" varchar(100) NOT NULL,
	"phone" varchar(20),
	"email" varchar(150),
	"pin_hash" varchar(255) NOT NULL,
	"role" varchar(50) DEFAULT 'BARISTA',
	"hourly_rate" bigint DEFAULT 0,
	"avatar_url" varchar(500),
	"status" varchar(20) DEFAULT 'ACTIVE',
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ingredient_stock" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"branch_id" bigint NOT NULL,
	"ingredient_id" bigint NOT NULL,
	"current_stock" numeric(10, 3) DEFAULT '0' NOT NULL,
	"unit" varchar(20) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ingredients" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"sku" varchar(50),
	"unit" varchar(20) NOT NULL,
	"cost_per_unit" bigint DEFAULT 0,
	"min_stock_alert" numeric(10, 2) DEFAULT '0',
	"category" varchar(50),
	"status" varchar(20) DEFAULT 'ACTIVE',
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "loyalty_tiers" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	"min_spend" bigint NOT NULL,
	"point_multiplier" numeric(3, 1) DEFAULT '1.0',
	"benefits" text,
	"sort_order" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "loyalty_transactions" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"customer_id" bigint NOT NULL,
	"order_id" bigint,
	"type" varchar(20) NOT NULL,
	"points" bigint NOT NULL,
	"balance_after" bigint NOT NULL,
	"description" varchar(255),
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "merchandise" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"image_url" varchar(500),
	"price" bigint NOT NULL,
	"personalizable" boolean DEFAULT false,
	"badge" varchar(30),
	"status" varchar(20) DEFAULT 'ACTIVE',
	"sort_order" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "notification_logs" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"template_id" bigint,
	"invoice_code" varchar(50),
	"recipient" varchar(150) NOT NULL,
	"channel" varchar(20) NOT NULL,
	"request_payload" text,
	"response_payload" text,
	"status" varchar(20),
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notification_templates" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"event_trigger" varchar(50) NOT NULL,
	"channel" varchar(20) NOT NULL,
	"message_content" text NOT NULL,
	"is_active" boolean DEFAULT true,
	CONSTRAINT "notification_templates_event_trigger_unique" UNIQUE("event_trigger")
);
--> statement-breakpoint
CREATE TABLE "order_item_options" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"order_item_id" bigint NOT NULL,
	"option_id" bigint,
	"option_group_name" varchar(100) NOT NULL,
	"option_name" varchar(100) NOT NULL,
	"additional_price" bigint DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"order_id" bigint NOT NULL,
	"product_id" bigint,
	"product_name" varchar(200) NOT NULL,
	"unit_price" bigint NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"subtotal" bigint NOT NULL,
	"discount_amount" bigint DEFAULT 0,
	"notes" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "order_status_logs" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"order_id" bigint NOT NULL,
	"status" varchar(30) NOT NULL,
	"actor_type" varchar(20),
	"actor_id" bigint,
	"notes" varchar(255),
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"invoice_code" varchar(50) NOT NULL,
	"receipt_number" varchar(50),
	"customer_id" bigint,
	"branch_id" bigint NOT NULL,
	"order_mode" varchar(20) NOT NULL,
	"order_source" varchar(20) DEFAULT 'APP',
	"status" varchar(30) DEFAULT 'PENDING',
	"subtotal" bigint NOT NULL,
	"discount_amount" bigint DEFAULT 0,
	"discount_id" bigint,
	"tax_amount" bigint DEFAULT 0,
	"service_charge" bigint DEFAULT 0,
	"delivery_fee" bigint DEFAULT 0,
	"bag_fee" bigint DEFAULT 0,
	"total_amount" bigint NOT NULL,
	"points_earned" bigint DEFAULT 0,
	"voucher_id" bigint,
	"payment_method_code" varchar(50),
	"payment_reference" varchar(255),
	"delivery_address_id" bigint,
	"table_id" bigint,
	"table_number" varchar(10),
	"shift_id" bigint,
	"employee_id" bigint,
	"is_pos" boolean DEFAULT false,
	"scheduled_at" timestamp with time zone,
	"cancel_reason" text,
	"paid_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "orders_invoice_code_unique" UNIQUE("invoice_code")
);
--> statement-breakpoint
CREATE TABLE "payment_instructions" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"payment_method_id" bigint NOT NULL,
	"title" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "payment_logs" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"invoice_code" varchar(50) NOT NULL,
	"endpoint" varchar(255),
	"type" varchar(50),
	"request_payload" text,
	"response_payload" text,
	"http_status" integer,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "payment_methods" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	"logo_url" varchar(500),
	"type" varchar(50) NOT NULL,
	"provider" varchar(50) NOT NULL,
	"admin_fee_flat" bigint DEFAULT 0,
	"admin_fee_pct" numeric(5, 2) DEFAULT '0.00',
	"is_active" boolean DEFAULT true,
	"is_redirect" boolean DEFAULT false,
	"sort_order" integer DEFAULT 0,
	CONSTRAINT "payment_methods_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "product_customization_groups" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"product_id" bigint NOT NULL,
	"name" varchar(100) NOT NULL,
	"selection_type" varchar(20) DEFAULT 'SINGLE',
	"max_selections" integer DEFAULT 1,
	"is_required" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "product_customization_options" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"group_id" bigint NOT NULL,
	"name" varchar(100) NOT NULL,
	"additional_price" bigint DEFAULT 0,
	"status" varchar(20) DEFAULT 'AVAILABLE',
	"sort_order" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "product_recipes" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"product_id" bigint NOT NULL,
	"ingredient_id" bigint NOT NULL,
	"quantity_used" numeric(10, 3) NOT NULL,
	"unit" varchar(20) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"category_id" bigint NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"image_url" varchar(500),
	"sku" varchar(50),
	"base_price" bigint NOT NULL,
	"cost_price" bigint DEFAULT 0,
	"sweetness_level" integer DEFAULT 0,
	"creaminess_level" integer DEFAULT 0,
	"badge" varchar(30),
	"temp_options" varchar(20) DEFAULT 'BOTH',
	"points_earned" integer DEFAULT 0,
	"is_pos_only" boolean DEFAULT false,
	"status" varchar(20) DEFAULT 'ACTIVE',
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "purchase_order_items" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"purchase_order_id" bigint NOT NULL,
	"ingredient_id" bigint NOT NULL,
	"quantity_ordered" numeric(10, 3) NOT NULL,
	"quantity_received" numeric(10, 3) DEFAULT '0',
	"unit" varchar(20) NOT NULL,
	"unit_price" bigint NOT NULL,
	"subtotal" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "purchase_orders" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"po_number" varchar(50) NOT NULL,
	"branch_id" bigint NOT NULL,
	"supplier_id" bigint NOT NULL,
	"status" varchar(20) DEFAULT 'DRAFT',
	"total_amount" bigint DEFAULT 0,
	"notes" text,
	"ordered_by" bigint,
	"approved_by" bigint,
	"received_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "purchase_orders_po_number_unique" UNIQUE("po_number")
);
--> statement-breakpoint
CREATE TABLE "refunds" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"order_id" bigint NOT NULL,
	"shift_id" bigint,
	"refund_type" varchar(20) NOT NULL,
	"refund_amount" bigint NOT NULL,
	"reason" varchar(255) NOT NULL,
	"refund_method" varchar(50),
	"approved_by" bigint,
	"employee_id" bigint,
	"status" varchar(20) DEFAULT 'PENDING',
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "shifts" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"branch_id" bigint NOT NULL,
	"employee_id" bigint NOT NULL,
	"opened_at" timestamp with time zone DEFAULT now() NOT NULL,
	"closed_at" timestamp with time zone,
	"opening_cash" bigint DEFAULT 0 NOT NULL,
	"expected_cash" bigint DEFAULT 0,
	"actual_cash" bigint,
	"cash_difference" bigint,
	"total_sales" bigint DEFAULT 0,
	"total_orders" integer DEFAULT 0,
	"total_refunds" bigint DEFAULT 0,
	"notes" text,
	"status" varchar(20) DEFAULT 'OPEN',
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "static_pages" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"slug" varchar(100) NOT NULL,
	"title" varchar(200) NOT NULL,
	"content" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "static_pages_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "stock_movements" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"branch_id" bigint NOT NULL,
	"ingredient_id" bigint NOT NULL,
	"type" varchar(30) NOT NULL,
	"quantity" numeric(10, 3) NOT NULL,
	"unit" varchar(20) NOT NULL,
	"stock_before" numeric(10, 3),
	"stock_after" numeric(10, 3),
	"reference_type" varchar(30),
	"reference_id" bigint,
	"notes" varchar(255),
	"employee_id" bigint,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "stock_opname_items" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"stock_opname_id" bigint NOT NULL,
	"ingredient_id" bigint NOT NULL,
	"system_stock" numeric(10, 3) NOT NULL,
	"actual_stock" numeric(10, 3) NOT NULL,
	"difference" numeric(10, 3) NOT NULL,
	"unit" varchar(20) NOT NULL,
	"notes" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "stock_opnames" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"branch_id" bigint NOT NULL,
	"employee_id" bigint NOT NULL,
	"status" varchar(20) DEFAULT 'IN_PROGRESS',
	"notes" text,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "store_tables" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"branch_id" bigint NOT NULL,
	"table_number" varchar(20) NOT NULL,
	"section" varchar(50),
	"capacity" integer DEFAULT 4,
	"pos_x" integer DEFAULT 0,
	"pos_y" integer DEFAULT 0,
	"status" varchar(20) DEFAULT 'AVAILABLE',
	"current_order_id" bigint,
	"occupied_since" timestamp with time zone,
	"sort_order" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"contact_person" varchar(100),
	"phone" varchar(20),
	"email" varchar(150),
	"address" text,
	"notes" text,
	"status" varchar(20) DEFAULT 'ACTIVE',
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tax_configs" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"branch_id" bigint NOT NULL,
	"tax_name" varchar(50) NOT NULL,
	"tax_rate" numeric(5, 2) NOT NULL,
	"is_inclusive" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "voucher_redemptions" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"voucher_id" bigint NOT NULL,
	"customer_id" bigint NOT NULL,
	"order_id" bigint NOT NULL,
	"discount_applied" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "vouchers" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"campaign_id" bigint,
	"code" varchar(50) NOT NULL,
	"discount_type" varchar(20) NOT NULL,
	"discount_value" bigint NOT NULL,
	"max_discount" bigint,
	"min_transaction" bigint DEFAULT 0,
	"usage_quota" integer,
	"used_count" integer DEFAULT 0,
	"target_audience" varchar(30) DEFAULT 'ALL',
	"target_tier" varchar(30),
	"status" varchar(20) DEFAULT 'ACTIVE',
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "vouchers_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "branch_admins" ADD CONSTRAINT "branch_admins_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "branch_admins" ADD CONSTRAINT "branch_admins_admin_id_admins_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "branch_option_stock" ADD CONSTRAINT "branch_option_stock_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "branch_option_stock" ADD CONSTRAINT "branch_option_stock_option_id_product_customization_options_id_fk" FOREIGN KEY ("option_id") REFERENCES "public"."product_customization_options"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "branch_product_stock" ADD CONSTRAINT "branch_product_stock_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "branch_product_stock" ADD CONSTRAINT "branch_product_stock_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_item_options" ADD CONSTRAINT "cart_item_options_cart_item_id_cart_items_id_fk" FOREIGN KEY ("cart_item_id") REFERENCES "public"."cart_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_item_options" ADD CONSTRAINT "cart_item_options_option_id_product_customization_options_id_fk" FOREIGN KEY ("option_id") REFERENCES "public"."product_customization_options"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cart_id_carts_id_fk" FOREIGN KEY ("cart_id") REFERENCES "public"."carts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "carts" ADD CONSTRAINT "carts_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "carts" ADD CONSTRAINT "carts_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_movements" ADD CONSTRAINT "cash_movements_shift_id_shifts_id_fk" FOREIGN KEY ("shift_id") REFERENCES "public"."shifts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_movements" ADD CONSTRAINT "cash_movements_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_addresses" ADD CONSTRAINT "customer_addresses_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_favorites" ADD CONSTRAINT "customer_favorites_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_favorites" ADD CONSTRAINT "customer_favorites_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_loyalty_tier_id_loyalty_tiers_id_fk" FOREIGN KEY ("loyalty_tier_id") REFERENCES "public"."loyalty_tiers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_checkins" ADD CONSTRAINT "daily_checkins_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_attendances" ADD CONSTRAINT "employee_attendances_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_attendances" ADD CONSTRAINT "employee_attendances_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ingredient_stock" ADD CONSTRAINT "ingredient_stock_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ingredient_stock" ADD CONSTRAINT "ingredient_stock_ingredient_id_ingredients_id_fk" FOREIGN KEY ("ingredient_id") REFERENCES "public"."ingredients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loyalty_transactions" ADD CONSTRAINT "loyalty_transactions_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loyalty_transactions" ADD CONSTRAINT "loyalty_transactions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_template_id_notification_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."notification_templates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_item_options" ADD CONSTRAINT "order_item_options_order_item_id_order_items_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_item_options" ADD CONSTRAINT "order_item_options_option_id_product_customization_options_id_fk" FOREIGN KEY ("option_id") REFERENCES "public"."product_customization_options"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_status_logs" ADD CONSTRAINT "order_status_logs_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_delivery_address_id_customer_addresses_id_fk" FOREIGN KEY ("delivery_address_id") REFERENCES "public"."customer_addresses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_instructions" ADD CONSTRAINT "payment_instructions_payment_method_id_payment_methods_id_fk" FOREIGN KEY ("payment_method_id") REFERENCES "public"."payment_methods"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_customization_groups" ADD CONSTRAINT "product_customization_groups_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_customization_options" ADD CONSTRAINT "product_customization_options_group_id_product_customization_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."product_customization_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_recipes" ADD CONSTRAINT "product_recipes_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_recipes" ADD CONSTRAINT "product_recipes_ingredient_id_ingredients_id_fk" FOREIGN KEY ("ingredient_id") REFERENCES "public"."ingredients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_purchase_order_id_purchase_orders_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_ingredient_id_ingredients_id_fk" FOREIGN KEY ("ingredient_id") REFERENCES "public"."ingredients"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_ordered_by_employees_id_fk" FOREIGN KEY ("ordered_by") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_approved_by_admins_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."admins"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_shift_id_shifts_id_fk" FOREIGN KEY ("shift_id") REFERENCES "public"."shifts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_approved_by_admins_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."admins"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_ingredient_id_ingredients_id_fk" FOREIGN KEY ("ingredient_id") REFERENCES "public"."ingredients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_opname_items" ADD CONSTRAINT "stock_opname_items_stock_opname_id_stock_opnames_id_fk" FOREIGN KEY ("stock_opname_id") REFERENCES "public"."stock_opnames"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_opname_items" ADD CONSTRAINT "stock_opname_items_ingredient_id_ingredients_id_fk" FOREIGN KEY ("ingredient_id") REFERENCES "public"."ingredients"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_opnames" ADD CONSTRAINT "stock_opnames_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_opnames" ADD CONSTRAINT "stock_opnames_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_tables" ADD CONSTRAINT "store_tables_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_configs" ADD CONSTRAINT "tax_configs_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voucher_redemptions" ADD CONSTRAINT "voucher_redemptions_voucher_id_vouchers_id_fk" FOREIGN KEY ("voucher_id") REFERENCES "public"."vouchers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voucher_redemptions" ADD CONSTRAINT "voucher_redemptions_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voucher_redemptions" ADD CONSTRAINT "voucher_redemptions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vouchers" ADD CONSTRAINT "vouchers_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_admins_role_status" ON "admins" USING btree ("role","status");--> statement-breakpoint
CREATE UNIQUE INDEX "unq_branch_admins" ON "branch_admins" USING btree ("branch_id","admin_id");--> statement-breakpoint
CREATE INDEX "idx_branch_admins_admin" ON "branch_admins" USING btree ("admin_id");--> statement-breakpoint
CREATE INDEX "idx_branch_admins_branch" ON "branch_admins" USING btree ("branch_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unq_bos" ON "branch_option_stock" USING btree ("branch_id","option_id");--> statement-breakpoint
CREATE INDEX "idx_branch_option_stock_branch" ON "branch_option_stock" USING btree ("branch_id","stock_status");--> statement-breakpoint
CREATE UNIQUE INDEX "unq_bps" ON "branch_product_stock" USING btree ("branch_id","product_id");--> statement-breakpoint
CREATE INDEX "idx_branch_product_stock_branch" ON "branch_product_stock" USING btree ("branch_id","stock_status");--> statement-breakpoint
CREATE INDEX "idx_cart_item_options_item" ON "cart_item_options" USING btree ("cart_item_id");--> statement-breakpoint
CREATE INDEX "idx_cart_items_cart" ON "cart_items" USING btree ("cart_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unq_carts" ON "carts" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_cash_movements_shift" ON "cash_movements" USING btree ("shift_id");--> statement-breakpoint
CREATE INDEX "idx_customer_addresses_customer" ON "customer_addresses" USING btree ("customer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unq_cust_favs" ON "customer_favorites" USING btree ("customer_id","product_id");--> statement-breakpoint
CREATE INDEX "idx_customers_email" ON "customers" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_customers_tier" ON "customers" USING btree ("loyalty_tier_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unq_daily_checkins" ON "daily_checkins" USING btree ("customer_id","checkin_date");--> statement-breakpoint
CREATE INDEX "idx_employee_attendances_emp" ON "employee_attendances" USING btree ("employee_id","clock_in");--> statement-breakpoint
CREATE INDEX "idx_employee_attendances_branch" ON "employee_attendances" USING btree ("branch_id","clock_in");--> statement-breakpoint
CREATE INDEX "idx_employees_branch" ON "employees" USING btree ("branch_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "unq_is" ON "ingredient_stock" USING btree ("branch_id","ingredient_id");--> statement-breakpoint
CREATE INDEX "idx_ingredient_stock_branch" ON "ingredient_stock" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "idx_ingredient_stock_ingredient" ON "ingredient_stock" USING btree ("ingredient_id");--> statement-breakpoint
CREATE INDEX "idx_ingredient_stock_low" ON "ingredient_stock" USING btree ("branch_id","current_stock");--> statement-breakpoint
CREATE INDEX "idx_loyalty_tx_customer" ON "loyalty_transactions" USING btree ("customer_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_notification_logs_template" ON "notification_logs" USING btree ("template_id");--> statement-breakpoint
CREATE INDEX "idx_notification_logs_invoice" ON "notification_logs" USING btree ("invoice_code");--> statement-breakpoint
CREATE INDEX "idx_notification_logs_created_at" ON "notification_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_order_item_options_item" ON "order_item_options" USING btree ("order_item_id");--> statement-breakpoint
CREATE INDEX "idx_order_items_order" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_order_status_logs_order" ON "order_status_logs" USING btree ("order_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_orders_customer" ON "orders" USING btree ("customer_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_orders_branch" ON "orders" USING btree ("branch_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_orders_invoice" ON "orders" USING btree ("invoice_code");--> statement-breakpoint
CREATE INDEX "idx_orders_created_at" ON "orders" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_payment_instructions_method" ON "payment_instructions" USING btree ("payment_method_id","sort_order");--> statement-breakpoint
CREATE INDEX "idx_payment_logs_invoice" ON "payment_logs" USING btree ("invoice_code");--> statement-breakpoint
CREATE INDEX "idx_payment_logs_created_at" ON "payment_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_pcg_product" ON "product_customization_groups" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_pco_group" ON "product_customization_options" USING btree ("group_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unq_pr" ON "product_recipes" USING btree ("product_id","ingredient_id");--> statement-breakpoint
CREATE INDEX "idx_product_recipes_product" ON "product_recipes" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_product_recipes_ingredient" ON "product_recipes" USING btree ("ingredient_id");--> statement-breakpoint
CREATE INDEX "idx_products_category" ON "products" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "idx_products_sku" ON "products" USING btree ("sku");--> statement-breakpoint
CREATE INDEX "idx_products_status_sort" ON "products" USING btree ("status","sort_order");--> statement-breakpoint
CREATE INDEX "idx_products_badge" ON "products" USING btree ("badge");--> statement-breakpoint
CREATE INDEX "idx_purchase_order_items_po" ON "purchase_order_items" USING btree ("purchase_order_id");--> statement-breakpoint
CREATE INDEX "idx_purchase_orders_branch" ON "purchase_orders" USING btree ("branch_id","status");--> statement-breakpoint
CREATE INDEX "idx_purchase_orders_supplier" ON "purchase_orders" USING btree ("supplier_id");--> statement-breakpoint
CREATE INDEX "idx_refunds_order" ON "refunds" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_shifts_branch_status" ON "shifts" USING btree ("branch_id","status");--> statement-breakpoint
CREATE INDEX "idx_shifts_branch_opened" ON "shifts" USING btree ("branch_id","opened_at");--> statement-breakpoint
CREATE INDEX "idx_stock_movements_branch_ing" ON "stock_movements" USING btree ("branch_id","ingredient_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_stock_movements_type" ON "stock_movements" USING btree ("type","created_at");--> statement-breakpoint
CREATE INDEX "idx_stock_opname_items_opname" ON "stock_opname_items" USING btree ("stock_opname_id");--> statement-breakpoint
CREATE INDEX "idx_stock_opnames_branch" ON "stock_opnames" USING btree ("branch_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "unq_st" ON "store_tables" USING btree ("branch_id","table_number");--> statement-breakpoint
CREATE INDEX "idx_store_tables_branch_status" ON "store_tables" USING btree ("branch_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "unq_tax_configs" ON "tax_configs" USING btree ("branch_id","tax_name");--> statement-breakpoint
CREATE INDEX "idx_voucher_redemptions_customer" ON "voucher_redemptions" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_voucher_redemptions_voucher" ON "voucher_redemptions" USING btree ("voucher_id");--> statement-breakpoint
CREATE INDEX "idx_voucher_redemptions_order" ON "voucher_redemptions" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_vouchers_campaign" ON "vouchers" USING btree ("campaign_id");