CREATE TABLE "examples" (
	"id" serial PRIMARY KEY NOT NULL,
	"operation_id" integer,
	"description" text,
	"code" text
);
--> statement-breakpoint
CREATE TABLE "field_info" (
	"id" serial PRIMARY KEY NOT NULL,
	"operation_id" integer,
	"field_type" text,
	"name" text,
	"type" text,
	"description" text,
	"doc_url" text
);
--> statement-breakpoint
CREATE TABLE "graphql_operations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text,
	"category" text,
	"operation_type" text,
	"version" text,
	"description" text,
	"access_scopes" text
);
--> statement-breakpoint
ALTER TABLE "examples" ADD CONSTRAINT "examples_operation_id_graphql_operations_id_fk" FOREIGN KEY ("operation_id") REFERENCES "public"."graphql_operations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_info" ADD CONSTRAINT "field_info_operation_id_graphql_operations_id_fk" FOREIGN KEY ("operation_id") REFERENCES "public"."graphql_operations"("id") ON DELETE no action ON UPDATE no action;