CREATE TABLE public.site_visits (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
    company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
    
    -- Stage 1: Pending & Details
    customer_address text,
    landmark text,
    preferred_date text,
    preferred_time text,
    gps_location text,
    customer_contact text,

    -- Stage 2: Scheduling & Booking
    site_personnel text,
    audit_date text,
    audit_time text,
    available_slots jsonb,

    -- Stage 3: In Progress Check-In
    checked_in boolean DEFAULT false,
    check_in_time text,
    check_in_gps text,
    check_in_timer_start text,
    elapsed_duration text,

    -- Staff execution details
    visit_started boolean DEFAULT false,
    visit_start_timestamp text,
    start_gps_location text,
    start_device_info text,
    
    distance_to_power_source numeric,
    distance_to_power_source_unit text,
    electrical_notes text,
    audio_note_url text,
    surface_condition text,
    obstacles jsonb,
    customer_budget numeric,
    expected_timeline text,
    customer_preferences text,
    competitor_references text,
    suggested_product_type text,
    additional_observations text,

    -- New Visit Information Section
    visit_date text,
    visit_time text,
    site_address text,
    site_type text,
    contact_person text,
    contact_number text,
    special_instructions text,

    -- Electrical Assessment
    power_available boolean DEFAULT false,
    electrical_photos jsonb,

    -- Structural Assessment
    wall_type text,
    mounting_method text,
    structural_notes text,

    -- Internal Notes (Admin only)
    internal_notes jsonb,

    -- Photo Categories
    photo_categories jsonb,

    -- Legacy Fields for backward compatibility
    width numeric,
    height numeric,
    depth numeric,
    installation_height numeric,
    power_available_legacy text,
    existing_signage text,
    complexity text,
    photos jsonb,
    legacy_photo_categories jsonb,
    notes text,
    customer_notes jsonb,

    -- Review & Statuses
    review_status text,
    review_notes text,
    audit_trail jsonb,
    completed boolean DEFAULT false,

    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.site_visit_measurements (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    site_visit_id uuid REFERENCES public.site_visits(id) ON DELETE CASCADE,
    name text NOT NULL,
    width numeric,
    height numeric,
    depth numeric,
    ground_clearance numeric,
    notes text,
    photos jsonb,
    
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.site_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_visit_measurements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for authenticated users" ON public.site_visits FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for authenticated users" ON public.site_visit_measurements FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Migrate Data from orders.site_visit_details
INSERT INTO public.site_visits (
    order_id, company_id, customer_address, landmark, preferred_date, preferred_time, gps_location, customer_contact,
    site_personnel, audit_date, audit_time, available_slots, checked_in, check_in_time, check_in_gps, check_in_timer_start, elapsed_duration,
    visit_started, visit_start_timestamp, start_gps_location, start_device_info, distance_to_power_source, distance_to_power_source_unit,
    electrical_notes, audio_note_url, surface_condition, obstacles, customer_budget, expected_timeline, customer_preferences, competitor_references,
    suggested_product_type, additional_observations, visit_date, visit_time, site_address, site_type, contact_person, contact_number,
    special_instructions, power_available, electrical_photos, wall_type, mounting_method, structural_notes, internal_notes, photo_categories,
    width, height, depth, installation_height, power_available_legacy, existing_signage, complexity, photos, legacy_photo_categories,
    notes, customer_notes, review_status, review_notes, audit_trail, completed
)
SELECT 
    id AS order_id,
    company_id,
    site_visit_details->>'customerAddress',
    site_visit_details->>'landmark',
    site_visit_details->>'preferredDate',
    site_visit_details->>'preferredTime',
    site_visit_details->>'gpsLocation',
    site_visit_details->>'customerContact',
    site_visit_details->>'sitePersonnel',
    site_visit_details->>'auditDate',
    site_visit_details->>'auditTime',
    site_visit_details->'availableSlots',
    (site_visit_details->>'checkedIn')::boolean,
    site_visit_details->>'checkInTime',
    site_visit_details->>'checkInGps',
    site_visit_details->>'checkInTimerStart',
    site_visit_details->>'elapsedDuration',
    (site_visit_details->>'visitStarted')::boolean,
    site_visit_details->>'visitStartTimestamp',
    site_visit_details->>'startGpsLocation',
    site_visit_details->>'startDeviceInfo',
    (site_visit_details->>'distanceToPowerSource')::numeric,
    site_visit_details->>'distanceToPowerSourceUnit',
    site_visit_details->>'electricalNotes',
    site_visit_details->>'audioNoteUrl',
    site_visit_details->>'surfaceCondition',
    site_visit_details->'obstacles',
    (site_visit_details->>'customerBudget')::numeric,
    site_visit_details->>'expectedTimeline',
    site_visit_details->>'customerPreferences',
    site_visit_details->>'competitorReferences',
    site_visit_details->>'suggestedProductType',
    site_visit_details->>'additionalObservations',
    site_visit_details->>'visitDate',
    site_visit_details->>'visitTime',
    site_visit_details->>'siteAddress',
    site_visit_details->>'siteType',
    site_visit_details->>'contactPerson',
    site_visit_details->>'contactNumber',
    site_visit_details->>'specialInstructions',
    (site_visit_details->>'powerAvailable')::boolean,
    site_visit_details->'electricalPhotos',
    site_visit_details->>'wallType',
    site_visit_details->>'mountingMethod',
    site_visit_details->>'structuralNotes',
    site_visit_details->'internalNotes',
    site_visit_details->'photoCategories',
    (site_visit_details->>'width')::numeric,
    (site_visit_details->>'height')::numeric,
    (site_visit_details->>'depth')::numeric,
    (site_visit_details->>'installationHeight')::numeric,
    site_visit_details->>'powerAvailableLegacy',
    site_visit_details->>'existingSignage',
    site_visit_details->>'complexity',
    site_visit_details->'photos',
    site_visit_details->'legacyPhotoCategories',
    site_visit_details->>'notes',
    site_visit_details->'customerNotes',
    site_visit_details->>'reviewStatus',
    site_visit_details->>'reviewNotes',
    site_visit_details->'auditTrail',
    COALESCE((site_visit_details->>'completed')::boolean, false)
FROM public.orders
WHERE site_visit_details IS NOT NULL;

-- Migrate Locations
WITH expanded_locations AS (
    SELECT 
        o.id AS order_id,
        jsonb_array_elements(o.site_visit_details->'locations') AS loc
    FROM public.orders o
    WHERE o.site_visit_details->'locations' IS NOT NULL AND jsonb_typeof(o.site_visit_details->'locations') = 'array'
)
INSERT INTO public.site_visit_measurements (
    site_visit_id, name, width, height, depth, ground_clearance, notes, photos
)
SELECT 
    sv.id,
    el.loc->>'name',
    (el.loc->>'width')::numeric,
    (el.loc->>'height')::numeric,
    (el.loc->>'depth')::numeric,
    (el.loc->>'groundClearance')::numeric,
    el.loc->>'notes',
    el.loc->'photos'
FROM expanded_locations el
JOIN public.site_visits sv ON sv.order_id = el.order_id;

-- Drop the column from orders
ALTER TABLE public.orders DROP COLUMN site_visit_details;
