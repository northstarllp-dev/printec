-- =========================================================================
-- Dynamic MAX+1 ID Generation Triggers
-- =========================================================================
-- This script replaces the existing sequence-based generation with triggers 
-- that calculate the next ID dynamically based on the current MAX value in the table.
-- This ensures that if the last row is deleted, the next insert reuses the ID.
-- =========================================================================

-- 1. ENQUIRIES (Format: ENQ001)
CREATE OR REPLACE FUNCTION generate_enquiry_id()
RETURNS TRIGGER AS $$
DECLARE
    max_id integer;
BEGIN
    -- Extract the numeric part of the current max enquire_id (e.g., 'ENQ024' -> 24)
    SELECT COALESCE(MAX(NULLIF(regexp_replace(enquire_id, '\D', '', 'g'), '')::integer), 0)
    INTO max_id
    FROM enquiries;

    -- Set the new enquire_id to max_id + 1, padded to 3 digits
    NEW.enquire_id := 'ENQ' || LPAD((max_id + 1)::text, 3, '0');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

ALTER TABLE enquiries ALTER COLUMN enquire_id DROP DEFAULT;

DROP TRIGGER IF EXISTS trigger_generate_enquiry_id ON enquiries;
CREATE TRIGGER trigger_generate_enquiry_id
BEFORE INSERT ON enquiries
FOR EACH ROW
EXECUTE FUNCTION generate_enquiry_id();


-- 2. CUSTOMERS (Format: A001)
CREATE OR REPLACE FUNCTION generate_customer_id()
RETURNS TRIGGER AS $$
DECLARE
    max_id integer;
BEGIN
    -- Extract numeric part
    SELECT COALESCE(MAX(NULLIF(regexp_replace(customer_id, '\D', '', 'g'), '')::integer), 0)
    INTO max_id
    FROM customers;

    NEW.customer_id := 'A' || LPAD((max_id + 1)::text, 3, '0');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

ALTER TABLE customers ALTER COLUMN customer_id DROP DEFAULT;

DROP TRIGGER IF EXISTS trigger_generate_customer_id ON customers;
CREATE TRIGGER trigger_generate_customer_id
BEFORE INSERT ON customers
FOR EACH ROW
EXECUTE FUNCTION generate_customer_id();


-- 3. ORDERS (Format: A012-001 where A012 is the customer_id)
CREATE OR REPLACE FUNCTION generate_order_id()
RETURNS TRIGGER AS $$
DECLARE
    cust_id text;
    max_id integer;
BEGIN
    -- Get the friendly customer_id (e.g., A012) for this order using the UUID
    SELECT customer_id INTO cust_id FROM customers WHERE id = NEW.customer_id;
    
    -- Find max order number for this specific customer
    -- Extracts the number after the hyphen (e.g., A012-003 -> 3)
    SELECT COALESCE(MAX(NULLIF(regexp_replace(split_part(order_id, '-', 2), '\D', '', 'g'), '')::integer), 0)
    INTO max_id
    FROM orders
    WHERE customer_id = NEW.customer_id;

    NEW.order_id := cust_id || '-' || LPAD((max_id + 1)::text, 3, '0');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

ALTER TABLE orders ALTER COLUMN order_id DROP DEFAULT;

DROP TRIGGER IF EXISTS trigger_generate_order_id ON orders;
CREATE TRIGGER trigger_generate_order_id
BEFORE INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION generate_order_id();


-- 4. PRODUCTS (Format: PRD001)
CREATE OR REPLACE FUNCTION generate_product_id()
RETURNS TRIGGER AS $$
DECLARE
    max_id integer;
BEGIN
    SELECT COALESCE(MAX(NULLIF(regexp_replace(product_id, '\D', '', 'g'), '')::integer), 0)
    INTO max_id
    FROM products;

    NEW.product_id := 'PRD' || LPAD((max_id + 1)::text, 3, '0');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Only uncomment if you have a product_id column in products table
-- ALTER TABLE products ALTER COLUMN product_id DROP DEFAULT;
-- DROP TRIGGER IF EXISTS trigger_generate_product_id ON products;
-- CREATE TRIGGER trigger_generate_product_id
-- BEFORE INSERT ON products
-- FOR EACH ROW
-- EXECUTE FUNCTION generate_product_id();


-- 5. QUOTATIONS (Format: QT-001)
CREATE OR REPLACE FUNCTION generate_quotation_id()
RETURNS TRIGGER AS $$
DECLARE
    max_id integer;
BEGIN
    SELECT COALESCE(MAX(NULLIF(regexp_replace(quotation_id, '\D', '', 'g'), '')::integer), 0)
    INTO max_id
    FROM quotations;

    NEW.quotation_id := 'QT-' || LPAD((max_id + 1)::text, 3, '0');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Only uncomment if you have a quotation_id column
-- ALTER TABLE quotations ALTER COLUMN quotation_id DROP DEFAULT;
-- DROP TRIGGER IF EXISTS trigger_generate_quotation_id ON quotations;
-- CREATE TRIGGER trigger_generate_quotation_id
-- BEFORE INSERT ON quotations
-- FOR EACH ROW
-- EXECUTE FUNCTION generate_quotation_id();
