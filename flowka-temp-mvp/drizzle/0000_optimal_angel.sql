CREATE TYPE "public"."order_status" AS ENUM('NEW', 'CONFIRMED', 'SENT_TO_NAZDAR', 'DELIVERING', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"external_item_id" varchar(40) NOT NULL,
	"product_name" text NOT NULL,
	"product_image" text,
	"product_category" varchar(16) NOT NULL,
	"unit_price" integer NOT NULL,
	"quantity" integer NOT NULL,
	"line_total" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "items_math_check" CHECK ("order_items"."quantity" BETWEEN 1 AND 99 AND "order_items"."unit_price" >= 0 AND "order_items"."line_total" = "order_items"."unit_price" * "order_items"."quantity"),
	CONSTRAINT "items_category_check" CHECK ("order_items"."product_category" IN ('flowers','toys'))
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_number" varchar(24) NOT NULL,
	"request_id" uuid NOT NULL,
	"request_hash" text NOT NULL,
	"receipt_token" text NOT NULL,
	"status" "order_status" DEFAULT 'NEW' NOT NULL,
	"customer_name" varchar(120) NOT NULL,
	"customer_phone" varchar(16) NOT NULL,
	"recipient_name" varchar(120) NOT NULL,
	"recipient_phone" varchar(16) NOT NULL,
	"recipient_is_customer" boolean NOT NULL,
	"city" varchar(32) DEFAULT 'Astana' NOT NULL,
	"address" varchar(300) NOT NULL,
	"apartment" varchar(80),
	"entrance" varchar(40),
	"floor" varchar(40),
	"intercom" varchar(80),
	"delivery_date" date NOT NULL,
	"delivery_time" varchar(5) NOT NULL,
	"card_text" text,
	"customer_comment" text,
	"courier_comment" text,
	"subtotal" integer NOT NULL,
	"delivery_price" integer NOT NULL,
	"total" integer NOT NULL,
	"nazdar_order_number" varchar(120),
	"sent_to_nazdar_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_public_number_unique" UNIQUE("public_number"),
	CONSTRAINT "orders_request_id_unique" UNIQUE("request_id"),
	CONSTRAINT "orders_receipt_token_unique" UNIQUE("receipt_token"),
	CONSTRAINT "orders_totals_check" CHECK ("orders"."subtotal" >= 0 AND "orders"."delivery_price" >= 0 AND "orders"."total" = "orders"."subtotal" + "orders"."delivery_price")
);
--> statement-breakpoint
CREATE TABLE "rate_limits" (
	"key" text PRIMARY KEY NOT NULL,
	"count" integer NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "order_items_order_idx" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "orders_created_idx" ON "orders" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "orders_status_idx" ON "orders" USING btree ("status");