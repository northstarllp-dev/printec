-- ============================================================
-- Migration: Create product_categories table
-- Purpose: Support dynamic custom categories per company
-- ============================================================

CREATE TABLE IF NOT EXISTS public.product_categories (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id  uuid        REFERENCES public.companies(id) ON DELETE CASCADE,
    name        text        NOT NULL,
    created_at  timestamptz DEFAULT now(),
    CONSTRAINT product_categories_name_company_key UNIQUE (company_id, name)
);

-- Indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_product_categories_company
    ON public.product_categories (company_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

-- Enable all access for authenticated users
CREATE POLICY "Enable all access for authenticated users" 
    ON public.product_categories 
    FOR ALL 
    TO authenticated 
    USING (true) 
    WITH CHECK (true);

-- Seed initial categories for the default company
INSERT INTO public.product_categories (company_id, name) VALUES
('11111111-1111-1111-1111-111111111111', 'ACP Sheets'),
('11111111-1111-1111-1111-111111111111', 'Acrylic Sheets'),
('11111111-1111-1111-1111-111111111111', 'SS Letters'),
('11111111-1111-1111-1111-111111111111', 'LED Signage'),
('11111111-1111-1111-1111-111111111111', 'Flex Banner'),
('11111111-1111-1111-1111-111111111111', 'Other')
ON CONFLICT DO NOTHING;
