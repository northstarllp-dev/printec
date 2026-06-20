-- ============================================================
-- Migration: Create portal_access_tokens table
-- Purpose: Store issued portal tokens for revocation tracking
--          and audit trail of customer magic links
-- ============================================================

CREATE TABLE IF NOT EXISTS public.portal_access_tokens (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    jti         text        NOT NULL UNIQUE,
    customer_id text        NOT NULL,
    order_id    text,
    issued_at   timestamptz DEFAULT now(),
    expires_at  timestamptz NOT NULL,
    revoked_at  timestamptz,
    created_by  text        DEFAULT 'system',
    metadata    jsonb       DEFAULT '{}'
);

-- Indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_portal_tokens_customer
    ON public.portal_access_tokens (customer_id);

CREATE INDEX IF NOT EXISTS idx_portal_tokens_order
    ON public.portal_access_tokens (order_id);

CREATE INDEX IF NOT EXISTS idx_portal_tokens_revoked
    ON public.portal_access_tokens (revoked_at)
    WHERE revoked_at IS NULL;

-- Row-Level Security (RLS) Policies
ALTER TABLE public.portal_access_tokens ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read (for admin checks)
CREATE POLICY "Allow authenticated read for portal tokens"
    ON public.portal_access_tokens
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow authenticated users to insert (for token generation)
CREATE POLICY "Allow authenticated insert for portal tokens"
    ON public.portal_access_tokens
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Allow authenticated users to update (for revocation)
CREATE POLICY "Allow authenticated update for portal tokens"
    ON public.portal_access_tokens
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);
