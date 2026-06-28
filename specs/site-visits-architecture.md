# Site Visit Architecture & Database Schema

This document outlines the database schema, data flow, and architecture of the Site Visit workflow in Printec. The site visit process involves collecting environmental data, scheduling details, and precise measurements for multiple sign locations at a given site.

## Database Tables

The architecture revolves around a one-to-many relationship between two core tables: `site_visits` and `site_visit_measurements`.

### 1. `site_visits` (Parent Table)
Acts as the central entity for a particular site visit process tied to an `Order`.

**Core Relationships:**
- `id` (UUID): Primary key.
- `order_id` (UUID): Foreign key mapping to the `orders` table.
- `company_id` (UUID): Foreign key mapping to the tenant/company.

**Scheduling & Logistics:**
- `preferred_date`, `preferred_time`: Customer-requested scheduling preferences.
- `audit_date`, `audit_time`: The mutually agreed and officially scheduled date/time.
- `customer_address`, `gps_location`, `customer_contact`: Logistics info populated from the customer portal or staff.

**Field Execution & Tracking:**
- `checked_in`, `check_in_time`, `check_in_gps`, `check_in_timer_start`: Metrics captured when a field agent physically arrives.
- `visit_started`, `visit_start_timestamp`, `start_gps_location`, `elapsed_duration`: Telemetry for auditing time spent on-site.

**Global Site Environment Data:**
- *Electrical*: `power_available`, `distance_to_power_source`, `electrical_notes`, `electrical_photos` (JSONB).
- *Structural*: `surface_condition`, `obstacles` (JSONB), `wall_type`, `mounting_method`, `structural_notes`.

**Business Intelligence & Sales:**
- `customer_budget`, `expected_timeline`, `customer_preferences`, `competitor_references`, `suggested_product_type`, `additional_observations`.
- `photo_categories` (JSONB): Global site photos categorized into `front`, `installationArea`, `powerSource`, `measurementReference`, etc.

**Workflow Management:**
- `review_status`, `review_notes`: Tracks the approval pipeline (e.g., waiting for Admin review).
- `completed`: Boolean flag marking the end of the site visit.
- `audit_trail` (JSONB): Logs status changes.

---

### 2. `site_visit_measurements` (Child Table)
This table was introduced to support **multiple sign locations** during a single site visit.

- `id` (UUID): Primary Key.
- `site_visit_id` (UUID): Foreign key linking back to `site_visits`.
- `name` (Text): Identifier for the location (e.g., "Main Fascia", "Lobby Wall").
- `width`, `height`, `depth`, `ground_clearance` (Numeric): The precise dimensions needed for that specific location.
- `notes` (Text): Specific instructions or observations for this single location.
- `photos` (JSONB): Image URLs specifically demonstrating this exact measurement point.

---

## 🚨 Deprecated & Redundant Columns
Prior to the introduction of the `site_visit_measurements` table, the system assumed one location per site visit. As a result, several columns in the `site_visits` table are now **redundant legacy fields** and should not be used in modern UI components:

- **Legacy Dimensions:** `width`, `height`, `depth`, `installation_height`.
- **Legacy Site Info:** `existing_signage`, `complexity`, `notes`.
- **Legacy Photos:** `photos`, `legacy_photo_categories`.
- **Duplicated Scheduling Data:** `visit_date`, `visit_time`, `site_address`, `site_type`, `contact_person`, `contact_number`, `special_instructions`. (These overlap with the newer scheduling and BI fields like `audit_date`, `customer_address`, etc.).

---

## Code Architecture and Workflow

### Data Mapping (`siteVisitMapper.ts`)
The application abstracts the database schema away from the frontend using `mapSiteVisitFromDb` and `mapSiteVisitToDb`. 
- When pulling data, the `locations` array is populated by mapping over the joined `site_visit_measurements` data.
- The frontend (`SiteVisitModule.tsx`) operates purely on this unified `SiteVisitDetails` TypeScript interface.

### The Save Operation (`updateSiteVisitDetailsAction`)
When a Staff or Admin saves the Site Visit form:
1. **Upsert Global Data:** The `site_visits` record is upserted using `order_id` as the conflict target.
2. **Bulk Replace Locations:** Instead of running complex diffing algorithms to figure out which locations were added, edited, or removed, the action **deletes all existing rows** in `site_visit_measurements` for that `site_visit_id`.
3. **Bulk Insert:** It then inserts the freshly submitted `locations` array as new rows. This guarantees the DB perfectly mirrors the frontend state cleanly and safely.

### The Review Workflow
1. **Pending Approval:** Once the field agent hits "Submit for Approval", the order's stage is advanced, and `reviewStatus` becomes `Pending`.
2. **Admin Control:** The `AdminControlModule` surfaces the submitted data to an Admin.
3. **Approval/Rejection:** The Admin can trigger `adminApproveStageAction` (which finalizes the visit and moves the order to Quoting) or `adminRejectStageAction` (which writes to `review_notes` and bounces it back to the agent to fix missing dimensions or unclear photos).
