-- Add workflow_type to orders table
-- 'quote_first' = Site Visit → Quote → Design → Production → Installation (default, existing behavior)
-- 'design_first' = Site Visit → Design → Quote → Production → Installation
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS workflow_type TEXT NOT NULL DEFAULT 'quote_first'
    CHECK (workflow_type IN ('quote_first', 'design_first'));
