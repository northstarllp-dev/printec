# Site Visit Workflow Detailed Specification

This document maps the complete UI flow, button actions, and corresponding database changes for the **Site Visit** phase in the Printec Order Management System. It details every step from the moment an order enters the `Site Visit Pending` stage until it transitions into `Quotation In Progress`.

## Overview of Database Tables Involved
1. **`orders`**: Tracks `stage` (e.g., "Site Visit Scheduled") and `stage_status` (used for workflow locks like "Pending Admin Approval").
2. **`site_visits`**: Stores the visit metadata (date, time, address, GPS, structural/electrical assessments, photo URLs, and internal notes).
3. **`site_visit_measurements`**: Stores individual signage items measured at the site (width, height, ground clearance, notes).
4. **`order_activity`**: The timeline table that logs all major transitions and actions for the order history.

---

## Phase 1: Customer Scheduling
**Context**: A new order is created, defaulting to `stage: "Site Visit Pending"`.

### UI Flow (Customer Portal - `OrderDetailClient.tsx`)
- **Condition**: Order stage is "Site Visit Pending" and no valid `auditDate` exists in `siteVisitDetails`.
- **UI Elements**: 
  - Date Picker (Horizontal scroll of upcoming business days).
  - Time Slots (e.g., "10:00 AM", "11:30 AM").
  - "Location" text input and a simulated Map for GPS coordinates.
  - **Button**: `Confirm Site Visit` (Emerald color, bottom of form).

### Action & Database Updates
- **User Action**: Customer clicks **"Confirm Site Visit"**.
- **Function Triggered**: `scheduleSiteVisitAction(orderId, scheduleData)`
- **DB Updates**:
  1. **`orders` Table**: 
     - Updates `stage` ➔ `"Site Visit Scheduled"`.
  2. **`site_visits` Table**: 
     - Upserts record (by `order_id` conflict) with `audit_date`, `audit_time`, `customer_address`, `gps_location`.
     - Sets `completed` ➔ `false`.
     - Sets `review_status` ➔ `"Pending"`.
  3. **`order_activity` Table**:
     - Inserts: `activity_type: "timeline", actor_role: "System", content: "📅 Site visit scheduled for [date] at [time] by client."`

---

## Phase 2: Staff Verification & Manual Scheduling
**Context**: The visit is scheduled by the customer, but the assigned staff member needs to verify and approve the chosen time.

### UI Flow (Staff Dashboard - `SiteVisitModule.tsx`)
- **Condition**: Staff opens the Order details. The "Scheduled Site Visit" card is visible.
- **UI Elements**:
  - Card displays Date, Time, Address, GPS map link.
  - **Button**: **"Approve Date & Time"** (Emerald color with CheckCircle icon). *Visible only if `reviewStatus` is "Pending".*
  - **Button**: **"Schedule by yourself"**. *Visible if no visit is scheduled yet.*

### Action & Database Updates
- **User Action**: Staff clicks **"Approve Date & Time"**.
- **Function Triggered**: `approveSiteVisitAction(orderId)`
- **DB Updates**:
  1. **`site_visits` Table**:
     - Updates `review_status` ➔ `"Staff Approved"`.
  2. **`orders` Table**:
     - Updates `stage_status` ➔ `"Pending Admin Approval: Site Visit Schedule"`. (This locks the workflow and notifies Admin).
  3. **`order_activity` Table**:
     - Inserts: `"Site visit time approved by assigned staff. Pending Admin Approval."`

*(Note: If staff clicks "Schedule by yourself", it opens `ScheduleVisitModal` and triggers `scheduleSiteVisitAction`, bypassing the customer entirely with the exact same DB updates as Phase 1).*

---

## Phase 3: Admin Review of Schedule
**Context**: Admin must approve the staff-verified schedule.

### UI Flow (Admin Dashboard - `AdminControlModule.tsx`)
- **Condition**: `order.stageStatus` is `"Pending Admin Approval: Site Visit Schedule"`.
- **UI Elements**:
  - Yellow Alert Box: "Pending Stage Approval".
  - **Button**: **"Approve Stage"** (Emerald).
  - **Button**: **"Request Changes"** (Amber).

### Action & Database Updates
- **User Action**: Admin clicks **"Approve Stage"**.
- **Function Triggered**: `adminApproveStageAction(orderId)`
- **DB Updates**:
  1. **`orders` Table**:
     - Updates `stage` ➔ `"Site Visit Completed"`.
     - Updates `stage_status` ➔ `"Normal"`.
     - Updates `stage_admin_notes` ➔ `""`.
  2. **`order_activity` Table**:
     - Inserts: `"Admin approved stage progression from 'Site Visit Scheduled' to 'Site Visit Completed'."`

- **Alternative User Action**: Admin clicks **"Request Changes"**, types a reason, and submits.
- **Function Triggered**: `adminRejectStageAction(orderId, notes)`
- **DB Updates**:
  1. **`orders` Table**:
     - Updates `stage_status` ➔ `"Normal"`.
     - Updates `stage_admin_notes` ➔ `notes`. (Stage remains unchanged).
  2. **`order_activity` Table**:
     - Inserts: `"Admin sent back stage progression request: [notes]"`

---

## Phase 4: Staff Executes the Physical Audit & Data Entry
**Context**: The staff member goes to the physical site and uses the app to record measurements and conditions.

### UI Flow (Staff Dashboard - `SiteVisitModule.tsx`)
- **UI Elements**:
  - **Measurement Details (Tabs)**: "New Item" button to add locations. Inputs for Width, Height, Depth, Ground Clearance.
  - **Site Photos**: `SitePhotoUploader` component. Files are uploaded directly to Supabase Storage bucket (`site-visit-photos`).
  - **Electrical Assessment**: Radio buttons (Yes/No Power), Distance inputs, Notes textarea.
  - **Structural Assessment**: Wall type dropdown, checkboxes, Notes textarea.

### Action & Database Updates
- **User Action**: Staff types into inputs or uploads photos.
- **Function Triggered**: `updateSiteVisitDetailsAction(orderId, details)` *(called dynamically as fields change)*.
- **DB Updates**:
  1. **`site_visits` Table**:
     - Upserts fields: `power_available`, `distance_to_power`, `electrical_notes`, `wall_type`, `photo_categories` (JSON of uploaded photo URLs).
  2. **`site_visit_measurements` Table**:
     - **Behavior**: Deletes all existing rows for this `site_visit_id`. Inserts new rows for every item in the `details.locations` array (capturing `name`, `width`, `height`, `depth`, `ground_clearance`, `notes`, `photos`).

### Workflow Advancement
- **User Action**: Staff clicks **"Submit/Request Stage Advancement"** (usually provided by the parent wrapper layout).
- **Function Triggered**: `requestStageAdvancementAction(orderId)`
- **DB Updates**:
  1. **`orders` Table**:
     - Updates `stage_status` ➔ `"Pending Admin Approval: Site Visit Completed"`.

---

## Phase 5: Admin Final Approval & Internal Notes
**Context**: The site visit is physically done. Admin reviews the data before moving the order to Quotation.

### UI Flow (Admin Dashboard - `AdminControlModule.tsx`)
- **UI Elements**:
  - Admin sees the site data collected by staff.
  - **Internal Administrative Settings panel (Dark mode UI)**:
    - Textareas for: "Customer Preferences / Demands", "Internal Budgeting Notes", "Suggested Signage Board Style".
    - **Button**: **"Save Notes"**.
  - Yellow Alert Box: "Pending Stage Approval".
    - **Button**: **"Approve Stage"**.

### Action & Database Updates
- **User Action**: Admin types internal notes and clicks **"Save Notes"**.
- **Function Triggered**: `updateSiteVisitDetailsAction(orderId, details)`
- **DB Updates**:
  1. **`site_visits` Table**:
     - Upserts `internal_notes` JSON field (merging `customerPreferences`, `budgetNotes`, `suggestedProductType`).

- **User Action**: Admin clicks **"Approve Stage"**.
- **Function Triggered**: `adminApproveStageAction(orderId)`
- **DB Updates**:
  1. **`orders` Table**:
     - Updates `stage` ➔ `"Quotation In Progress"`.
     - Updates `stage_status` ➔ `"Normal"`.
  2. **`order_activity` Table**:
     - Inserts: `"Admin approved stage progression from 'Site Visit Completed' to 'Quotation In Progress'."`

---

## Phase 6: Customer Portal Reflection
- **During Review Phase**: When the order is in `Site Visit Completed` but `stage_status` is pending admin approval, the Customer Portal UI renders an Amber Alert: *"Site Survey Completed — Under Verification. Measurement data is being reviewed by our engineering team."*
- **Post Approval**: Once the Admin approves and the stage becomes `"Quotation In Progress"`, the Customer Portal's progress bar advances. The top navigational tabs unlock the "Quotation" tab, transitioning the customer to the next phase of their journey.
