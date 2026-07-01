-- 1. Create productions table
CREATE TABLE IF NOT EXISTS productions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    "procurementOfMaterials" BOOLEAN DEFAULT false,
    "acpAndAcrylicCutting" BOOLEAN DEFAULT false,
    "lightingAndWiring" BOOLEAN DEFAULT false,
    "qualityCheck" BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create installations table (if not exists, maybe it was created manually)
CREATE TABLE IF NOT EXISTS installations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    "scheduledDate" TEXT,
    "scheduledTime" TEXT,
    "photoUrl" TEXT,
    "customerSignature" TEXT,
    "paymentCode" TEXT,
    "gmapLink" TEXT,
    "gmapRequested" BOOLEAN DEFAULT false,
    "afterPhotos" JSONB DEFAULT '[]'::jsonb,
    "checklist" JSONB DEFAULT '[]'::jsonb,
    "notes" TEXT,
    "status" TEXT DEFAULT 'Pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Migrate data from orders to productions
INSERT INTO productions (
    order_id, 
    "procurementOfMaterials", 
    "acpAndAcrylicCutting", 
    "lightingAndWiring", 
    "qualityCheck"
)
SELECT 
    id AS order_id,
    COALESCE((production_details->>'procurementOfMaterials')::boolean, false),
    COALESCE((production_details->>'acpAndAcrylicCutting')::boolean, false),
    COALESCE((production_details->>'lightingAndWiring')::boolean, false),
    COALESCE((production_details->>'qualityCheck')::boolean, false)
FROM orders
WHERE production_details IS NOT NULL
ON CONFLICT DO NOTHING;

-- 4. Migrate data from orders to installations
-- Assuming unique order_id constraint on installations if they already existed, but we didn't add it. Let's do it safely.
INSERT INTO installations (
    order_id,
    "scheduledDate",
    "scheduledTime",
    "photoUrl",
    "customerSignature",
    "paymentCode",
    "gmapLink",
    "gmapRequested",
    "afterPhotos",
    "checklist",
    "notes"
)
SELECT 
    id AS order_id,
    installation_details->>'scheduledDate',
    installation_details->>'scheduledTime',
    installation_details->>'photoUrl',
    installation_details->>'customerSignature',
    installation_details->>'paymentCode',
    installation_details->>'gmapLink',
    COALESCE((installation_details->>'gmapRequested')::boolean, false),
    COALESCE(installation_details->'afterPhotos', '[]'::jsonb),
    COALESCE(installation_details->'checklist', '[]'::jsonb),
    installation_details->>'notes'
FROM orders
WHERE installation_details IS NOT NULL
ON CONFLICT DO NOTHING;

-- 5. Drop the JSONB columns from orders
ALTER TABLE orders DROP COLUMN IF EXISTS production_details;
ALTER TABLE orders DROP COLUMN IF EXISTS installation_details;
