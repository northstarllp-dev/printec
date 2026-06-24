-- Remove urgent and deadline_status columns from public.orders table
ALTER TABLE public.orders DROP COLUMN IF EXISTS deadline_status;
ALTER TABLE public.orders DROP COLUMN IF EXISTS urgent;
