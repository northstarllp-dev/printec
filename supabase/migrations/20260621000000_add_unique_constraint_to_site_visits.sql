-- Add unique constraint on order_id for site_visits table
-- This allows ON CONFLICT ("order_id") to be used in UPSERTs.
ALTER TABLE public.site_visits ADD CONSTRAINT site_visits_order_id_key UNIQUE (order_id);
