-- Migration: Centralize Order Observability
-- Renames order_messages → order_activity, renames columns, adds metadata column,
-- drops legacy history columns from orders table, drops audit_logs table,
-- and adds performance indexes.

-- 1. Rename table
ALTER TABLE public.order_messages RENAME TO order_activity;

-- 2. Rename columns for clarity
ALTER TABLE public.order_activity RENAME COLUMN tab TO activity_type;
ALTER TABLE public.order_activity RENAME COLUMN sender_name TO actor_name;
ALTER TABLE public.order_activity RENAME COLUMN sender_role TO actor_role;
ALTER TABLE public.order_activity RENAME COLUMN sender_id TO actor_id;

-- 3. Add metadata column for analytics
ALTER TABLE public.order_activity ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- 4. Performance indexes (essential for large tables)
-- Covers 99% of queries: "get all activity for order X, sorted by time"
CREATE INDEX IF NOT EXISTS idx_order_activity_lookup
  ON public.order_activity(order_id, created_at DESC);

-- Covers analytics queries: "get all timeline events" or "get all internal messages"
CREATE INDEX IF NOT EXISTS idx_order_activity_type
  ON public.order_activity(activity_type);

-- 5. Drop legacy JSONB history columns from orders table
ALTER TABLE public.orders
  DROP COLUMN IF EXISTS chat_history,
  DROP COLUMN IF EXISTS version_history;

-- 6. Drop the audit_logs table entirely
DROP TABLE IF EXISTS public.audit_logs;
