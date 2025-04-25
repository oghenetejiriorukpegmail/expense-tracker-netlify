-- Create enums for background task types and status
CREATE TYPE "public"."task_type" AS ENUM('batch_upload', 'expense_export', 'receipt_ocr');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('pending', 'processing', 'completed', 'failed');--> statement-breakpoint

-- Create background_tasks table
CREATE TABLE "background_tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" "task_type" NOT NULL,
	"status" "task_status" NOT NULL DEFAULT 'pending',
	"result" text,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);--> statement-breakpoint

-- Add foreign key constraint
ALTER TABLE "background_tasks" ADD CONSTRAINT "background_tasks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;