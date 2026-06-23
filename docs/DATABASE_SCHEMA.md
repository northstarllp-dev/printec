# Printec Database Schema

> **Last Updated:** 2026-06-20
> **Platform:** Supabase (PostgreSQL 17)
> **Total Tables:** 8 (public) + 24 (auth) + 8 (storage) + 10 (realtime) + 1 (vault)

---

## Table of Contents

1. [Schema Overview](#schema-overview)
2. [Entity Relationship Diagram](#entity-relationship-diagram)
3. [Public Schema — Business Tables](#public-schema--business-tables)
   - [companies](#1-companies)
   - [users](#2-users)
   - [customers](#3-customers)
   - [orders](#4-orders)
   - [enquiries](#5-enquiries)
   - [order_messages](#6-order_messages)
   - [portal_access_tokens](#7-portal_access_tokens)
   - [order_files](#8-order_files)
   - [audit_logs](#9-audit_logs)
4. [Auth Schema](#auth-schema)
5. [Storage & Realtime Schemas](#storage--realtime-schemas)
6. [Database Functions](#database-functions)
7. [Sequences](#sequences)
8. [Migrations](#migrations)
9. [Row Level Security](#row-level-security)
10. [Extensions](#extensions)
11. [Key Design Decisions](#key-design-decisions)

---

## Schema Overview

| Schema | Purpose | Table Count | Data Rows |
|--------|---------|-------------|-----------|
| `public` | Application business data | 8 | ~100+ |
| `auth` | Supabase Auth (users, sessions, MFA, OAuth, SSO) | 24 | ~130+ |
| `storage` | Supabase Storage (buckets, objects, multipart uploads) | 8 | System |
| `realtime` | Supabase Realtime (daily-partitioned messages, subscriptions) | 10 | Variable |
| `vault` | Encrypted secrets storage | 1 | 0 |
| `extensions` | Extension statistics (pg_stat_statements) | 2 | System |
| `supabase_migrations` | Migration tracking | 1 | 5 |

---

## Entity Relationship Diagram

```
┌──────────────┐
│  companies   │ (1 row: "Printec Main")
│  id (UUID)   │
└──────┬───────┘
       │
       ├──────────────────────────────────────────────────────┐
       │                                                      │
       ▼                                                      ▼
┌──────────────┐                                     ┌──────────────┐
│    users     │ (3 rows)                             │  customers   │ (5 rows)
│  id (UUID)   │                                     │  id (UUID)   │
│  company_id──┤                                     │  company_id──┤
│  role        │                                     │  customer_id │ ← "A010"–"A014"
│  staff_role  │                                     │  name        │
└──────┬───────┘                                     │  phone       │
       │                                             └──────┬───────┘
       │ (no FK — linked                              │
       │  by convention)                              │
       │                                              │
       │                                              ├──────────────────────┐
       │                                              │                      │
       ▼                                              ▼                      ▼
┌──────────────────┐                          ┌──────────────┐      ┌──────────────┐
│  auth.users      │ (5 rows)                 │    orders    │      │  enquiries   │
│  id (UUID) ──────┼──────────┐               │  id (UUID)   │      │  id (UUID)   │
└──────────────────┘          │               │  order_id ◄──┼──────┤  order_id    │
                              │               │  customer_id─┤      │  customer_id─┤
                              │               │  company_id──┤      │  enquire_id  │ ← "ENQ007"–"ENQ013"
                              │               │  stage       │      │  status      │
                              │               │  *_details   │      │  source      │
                              │               │  assigned_*  │      └──────┬───────┘
                              │               │  version_hist│             │
                              │               │  chat_history│             │
                              │               └──────┬───────┘             │
                              │                      │                     │
                              │                      ├─────────────────────┤
                              │                      │                     │
                              ▼                      ▼                     ▼
                       ┌──────────────────────────────────────────────────────┐
                       │                    audit_logs (27 rows)              │
                       │  id (UUID), actor, action_type, description          │
                       │  order_id → orders, customer_id → customers          │
                       │  company_id → companies                              │
                       └──────────────────────────────────────────────────────┘

┌──────────────────┐          ┌──────────────────────────┐
│  order_messages  │          │  portal_access_tokens    │
│  id (UUID)       │          │  id (UUID)               │
│  order_id (TEXT) │          │  jti (UNIQUE)            │
│  tab             │          │  customer_id (TEXT)      │
│  sender_id ──────┼──→ auth.users.id                   │
│  content         │          │  order_id (TEXT)         │
│  attachments     │          │  expires_at              │
└──────────────────┘          │  revoked_at              │
                              └──────────────────────────┘

┌──────────────────┐
│   order_files    │ (0 rows — empty)
│  id (UUID)       │
│  order_id (TEXT) │
│  file_path       │
│  uploaded_by     │
└──────────────────┘
```

---

## Public Schema — Business Tables

### 1. companies

Multi-tenant root. Every entity belongs to a company. Currently a single-tenant setup.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | `uuid` | NO | `gen_random_uuid()` | Primary key |
| `name` | `text` | NO | — | Company display name |
| `created_at` | `timestamptz` | YES | `now()` | |

**Current Data (1 row):**

| id | name | created_at |
|----|------|------------|
| `11111111-1111-1111-1111-111111111111` | Printec Main | 2026-06-14 |

**Referenced by:** `users`, `customers`, `enquiries`, `orders`, `audit_logs` (all via `company_id` FK)

**RLS Policy:** `Enable all access for authenticated users` — USING/WITH CHECK both `true`

---

### 2. users

Staff/employee accounts. Maps to `auth.users` by convention (id is shared). Note: there is no FK constraint between `public.users.id` and `auth.users.id` — the only cross-schema FK is `order_messages.sender_id → auth.users.id`.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | `uuid` | NO | — | Primary key (shared with auth.users) |
| `company_id` | `uuid` | YES | — | FK → `companies.id` |
| `name` | `text` | NO | — | Display name |
| `role` | `text` | NO | — | `admin` or `staff` |
| `phone` | `text` | NO | — | Contact phone |
| `email` | `text` | YES | — | Contact email |
| `staff_role` | `text` | YES | — | `Designer`, `Marketer`, or null (for admin) |

**Current Data (3 rows):**

| id | name | role | staff_role | email |
|----|------|------|------------|-------|
| `e5db65a4-...` | Admin | `admin` | null | admin@printec.com |
| `e9730e5e-...` | Vikram Malhotra | `staff` | `Marketer` | vikrammalhotra@printec.co.in |
| `60c40772-...` | Priyanka Sen | `staff` | `Designer` | priyankasen@printec.co.in |

**RLS Policy:** `Enable all access for authenticated users` — USING/WITH CHECK both `true`

---

### 3. customers

End clients who place orders. Created during enquiry conversion. Has an auto-generated human-friendly `customer_id` via sequence.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | `uuid` | NO | `gen_random_uuid()` | Primary key |
| `company_id` | `uuid` | YES | — | FK → `companies.id` |
| `customer_id` | `text` | NO | `'A' \|\| lpad(nextval('customer_code_seq')::text, 3, '0')` | UNIQUE. Auto: `A010`–`A014` |
| `name` | `text` | NO | — | Customer/company name |
| `phone` | `text` | NO | — | Primary phone |
| `whatsapp` | `text` | NO | — | WhatsApp number |
| `email` | `text` | NO | — | Email address |
| `city` | `text` | YES | — | null in current data |
| `billing_address` | `text` | YES | — | Default: `"Address Details Pending Intake"` |
| `shipping_address` | `text` | YES | — | Installation address |
| `status` | `text` | YES | `'Active'` | |

**Current Data (5 rows):**

| customer_id | name | phone | shipping_address |
|-------------|------|-------|-----------------|
| `A010` | ff21 | +91 99944 00311 | E-City |
| `A011` | Northstar LLP | +91 97903 77717 | E-City |
| `A012` | Northstar LLP | +91 81899 99998 | E-City |
| `A013` | Prasad | +91 98455 87836 | Banaswadi |
| `A014` | sathya | +91 90950 11464 | Installation Address Pending Survey |

> **Note:** Customer `A012` (Northstar LLP) has multiple entries with different phone numbers. The customer UUID `2f736d50-...` is re-used for 3 enquiries and 3 orders.

**Referenced by:** `orders.customer_id`, `enquiries.customer_id`, `audit_logs.customer_id` (all UUID FK)

**RLS Policy:** `Enable all access for authenticated users` — USING/WITH CHECK both `true`

---

### 4. orders

The central business entity. Tracks a signage project through a multi-stage pipeline. Uses JSONB columns for stage-specific details, keeping the schema flexible without requiring dozens of nullable columns.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | `uuid` | NO | `gen_random_uuid()` | Primary key |
| `order_id` | `text` | NO | — | UNIQUE. Auto-generated: `{customer_id}-{NNN}` via trigger |
| `company_id` | `uuid` | YES | — | FK → `companies.id` |
| `customer_id` | `uuid` | NO | — | FK → `customers.id` |
| `customer_name` | `text` | YES | — | Denormalized for quick display |
| `project_name` | `text` | NO | — | e.g. "Sign board for ff21" |
| `stage` | `text` | NO | — | Pipeline stage (see below) |
| `health` | `text` | YES | `'Active'` | `Active` / `Lost` / `Completed` |
| `lost_reason` | `text` | YES | — | Reason if health = Lost |
| `stage_status` | `text` | YES | `'Normal'` | Stage health indicator |
| `dimensions` | `text` | YES | — | Overall dimensions notes |
| `notes` | `text` | YES | — | General notes |
| `stage_admin_notes` | `text` | YES | — | Admin-only notes per stage |
| `image_mockup` | `text` | YES | — | URL/path to mockup image |
| `budget` | `numeric` | YES | `0` | Budget amount |
| `deposit_paid` | `numeric` | YES | `0` | Deposit received |
| `date_created` | `timestamptz` | YES | `now()` | Order creation timestamp |

#### Assignment Arrays

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `assigned_employees` | `uuid[]` | `'{}'` | General assignees |
| `assigned_designers` | `uuid[]` | `'{}'` | Designer assignees |
| `assigned_marketers` | `uuid[]` | `'{}'` | Marketer assignees |

#### JSONB Stage Details

| Column | Type | Default | Purpose |
|--------|------|---------|---------|
| `quote_details` | `jsonb` | — | Quotation: items[], subtotal, tax, discount, grandTotal |
| `design_details` | `jsonb` | — | Design stage artefacts |
| `production_details` | `jsonb` | — | Production tracking |
| `installation_details` | `jsonb` | — | Installation tracking |

#### Activity Tracking

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `version_history` | `jsonb` | `'[]'` | Stage progression log: `[{version, date, notes}]` |
| `chat_history` | `jsonb` | `'[]'` | Inline activity feed: `[{id, time, sender, message}]` |

#### Pipeline Stages (observed values)

```
Site Visit Pending → Site Visit Scheduled → Site Visit Completed
→ Quotation In Progress → Quotation Sent → Quotation Negotiation
→ Quotation Approved → Design In Progress
```


#### quote_details Structure

```jsonc
{
  "status": "Approved",   // optional
  "tax": 1176,
  "items": [{
    "id": "843610b3-...",
    "gstRate": 12,
    "quantity": 1,
    "totalSqFt": 98,
    "unitPrice": 9800,
    "costPerSqFt": 100,
    "description": "Acrylic sheet"
  }],
  "discount": 100,
  "subtotal": 9800,
  "grandTotal": 10876
}
```

#### version_history Structure

```jsonc
[
  {
    "version": "v4.0",
    "date": "17/6/2026",
    "notes": "Admin approved stage progression from \"Quotation Approved\" to \"Design In Progress\"."
  }
  // ... more entries, oldest first
]
```

#### chat_history Structure

```jsonc
[
  {
    "id": "1",                    // or "1781626079270" (timestamp), or "sys-1781688031390"
    "time": "Just now",           // or "02:50 pm", "11:15 AM"
    "sender": "System",           // or "Admin", staff name
    "message": "Order created successfully from Enquiry.",
    "verified": true              // optional, on portal links
  }
  // ... more entries
]
```

**Current Data (7 rows):**

| order_id | project_name | customer_name | stage | health |
|----------|-------------|---------------|-------|--------|
| `A010-001` | Sign board for ff21 | ff21 | Design In Progress | Active |
| `A011-001` | Sign board for Northstar LLP | Northstar LLP | Quotation Sent | Active |
| `A012-001` | New Project for Northstar LLP | Northstar LLP | Quotation Approved | Active |
| `A012-002` | New Project for hari | Northstar LLP | Site Visit Pending | Active |
| `A012-003` | ACP neon sign for Hari factories | Northstar LLP | Site Visit Pending | Active |
| `A013-001` | New Project for Prasad | Prasad | Site Visit Pending | Active |
| `A014-001` | New Project for sathya | sathya | Site Visit Pending | Active |

**Referenced by:** `enquiries.order_id`, `audit_logs.order_id` (UUID FK); `order_messages.order_id`, `order_files.order_id`, `portal_access_tokens.order_id` (TEXT, not FK)

**RLS Policies:**
- `Enable all access for authenticated users` — USING/WITH CHECK both `true` for authenticated
- `Enable update access for anon users` — USING/WITH CHECK both `true` for anonymous (⚠️ security concern)

**Trigger:** `generate_order_id_field()` — auto-generates `order_id` on insert

---

### 5. enquiries

Incoming leads. Created from contact forms, WhatsApp, phone calls. When converted, a Customer and Order are created and linked.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | `uuid` | NO | `gen_random_uuid()` | Primary key |
| `enquire_id` | `text` | NO | `'ENQ' \|\| lpad(nextval('enquiry_code_seq')::text, 3, '0')` | UNIQUE. Auto: `ENQ007`–`ENQ013` |
| `company_id` | `uuid` | YES | — | FK → `companies.id` |
| `customer_id` | `uuid` | YES | — | FK → `customers.id` (populated on conversion) |
| `order_id` | `uuid` | YES | — | FK → `orders.id` (populated on conversion) |
| `lead_name` | `text` | NO | — | Contact person name |
| `phone` | `text` | NO | — | |
| `whatsapp` | `text` | NO | — | |
| `email` | `text` | NO | — | |
| `source` | `text` | NO | — | `WhatsApp` / `Phone Call` |
| `primary_communication_mode` | `text` | YES | `'MAIL'` | `WHATSAPP` / `MAIL` |
| `status` | `text` | YES | `'Pending'` | `Pending` / `Converted` |
| `notes` | `text` | YES | — | Free-text notes |
| `location` | `text` | YES | — | Customer location |
| `date_received` | `timestamptz` | YES | `now()` | When enquiry came in |

**Current Data (7 rows):**

All 7 enquiries have `status = "Converted"`, meaning they've all been linked to customers and orders.

| enquire_id | lead_name | source | customer_id (UUID) | order_id (UUID) |
|-----------|-----------|--------|-------------------|-----------------|
| `ENQ007` | ff21 | WhatsApp | `c412b17e-...` | `948843ad-...` |
| `ENQ008` | Northstar LLP | WhatsApp | `faff1932-...` | `c0764095-...` |
| `ENQ009` | Northstar LLP | WhatsApp | `2f736d50-...` | `1c0987fb-...` |
| `ENQ010` | Prasad | WhatsApp | `115b46b8-...` | `57a12b92-...` |
| `ENQ011` | hari | Phone Call | `2f736d50-...` | `6a40defe-...` |
| `ENQ012` | hari | WhatsApp | `2f736d50-...` | `9a0b75d3-...` |
| `ENQ013` | sathya | WhatsApp | `39a659d4-...` | `a1b87d99-...` |

**RLS Policy:** `Enable all access for authenticated users` — USING/WITH CHECK both `true`

---

### 6. order_messages

Structured chat/messaging system for orders. Messages are scoped to a `tab` within an order. This table complements the inline `chat_history` JSONB on orders — `chat_history` is the legacy activity feed, while `order_messages` is the newer structured chat.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | `uuid` | NO | `gen_random_uuid()` | Primary key |
| `order_id` | `text` | NO | — | e.g. `A010-001` (TEXT, not UUID FK) |
| `tab` | `text` | NO | — | CHECK: `internal` / `customer` / `timeline` |
| `sender_name` | `text` | NO | — | Display name |
| `sender_role` | `text` | NO | — | `Admin` / `Staff` / `System` / `Customer` |
| `sender_id` | `uuid` | YES | — | FK → `auth.users.id` (only cross-schema FK) |
| `content` | `text` | NO | `''` | Message body |
| `attachments` | `jsonb` | YES | `'[]'` | File attachments array |
| `is_read` | `boolean` | YES | `false` | Read receipt |
| `edited` | `boolean` | YES | `false` | Edit tracking |
| `created_at` | `timestamptz` | YES | `now()` | |

**Tabs:**
- `internal` — Staff-only discussion
- `customer` — Customer-facing chat (portal)
- `timeline` — System events and automated messages

**Current Data:** 42 rows, all currently in the `timeline` tab

**RLS Policy:** `Allow all access to authenticated users on order_messages` — USING/WITH CHECK both `true`

---

### 7. portal_access_tokens

JWT-based access tokens for the customer portal. Tokens are issued per customer per order with 30-day expiry and revocation support.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | `uuid` | NO | `gen_random_uuid()` | Primary key |
| `jti` | `text` | NO | — | UNIQUE. JWT ID for token identification |
| `customer_id` | `text` | NO | — | e.g. `A012` (TEXT, not UUID FK) |
| `order_id` | `text` | YES | — | e.g. `A012-003` (TEXT, not UUID FK) |
| `expires_at` | `timestamptz` | NO | — | 30 days from issue |
| `issued_at` | `timestamptz` | YES | `now()` | |
| `revoked_at` | `timestamptz` | YES | — | null = active; set when revoked |
| `created_by` | `text` | YES | `'system'` | `system` / `api` / `enquiry_conversion` |
| `metadata` | `jsonb` | YES | `'{}'` | Extensible metadata |

**Current Data:** 12 rows across customers A012 and A014

**Token Scopes (observed in JWTs):**
- `read_order` — View order details
- `schedule_visit` — Schedule site visits
- `approve_quote` — Approve quotations
- `approve_design` — Approve designs
- `chat` — Access chat
- `pay` — Make payments

**RLS Policy:** `Admin staff read access` — USING/WITH CHECK both `true` for authenticated

---

### 8. order_files

File storage metadata for orders. Maps order-scoped files to their storage paths. Currently empty — the app stores files directly but hasn't yet populated this metadata table.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | `uuid` | NO | `gen_random_uuid()` | Primary key |
| `order_id` | `text` | NO | — | e.g. `A010-001` (TEXT, not UUID FK) |
| `category` | `text` | NO | — | File category |
| `file_name` | `text` | NO | — | Original filename |
| `file_path` | `text` | NO | — | Storage path/bucket reference |
| `mime_type` | `text` | YES | — | |
| `file_size` | `bigint` | YES | — | Bytes |
| `uploaded_by` | `uuid` | YES | — | User who uploaded |
| `created_at` | `timestamptz` | YES | `now()` | |

**Current Data:** 0 rows (empty)

**RLS Policies:**
- `Allow all access to authenticated users on order_files` — USING/WITH CHECK both `true`
- `Allow insert access to anon users on order_files` — WITH CHECK `true` (⚠️ security concern)

---

### 9. audit_logs

Activity log capturing all significant actions in the system.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | `uuid` | NO | `gen_random_uuid()` | Primary key |
| `company_id` | `uuid` | YES | — | FK → `companies.id` |
| `actor` | `text` | NO | — | Who performed the action (e.g. `Admin`) |
| `action_type` | `text` | NO | — | e.g. `Order Created`, `Stage Changed`, `Customer Created` |
| `order_id` | `uuid` | YES | — | FK → `orders.id` |
| `customer_id` | `uuid` | YES | — | FK → `customers.id` |
| `description` | `text` | NO | — | Human-readable event description |
| `metadata` | `jsonb` | YES | `'{}'` | Extensible payload |
| `created_at` | `timestamptz` | YES | `now()` | |

**Current Data:** 27 rows

**Example entries:**
- `"Order \"New Project for sathya\" (A014-001) created and linked to Enquiry \"ENQ013\" for Customer \"sathya\"."`
- `"Customer profile \"sathya\" (39a659d4-...) created via Enquiry conversion."`
- `"Order stage advanced from \"Quotation In Progress\" to \"Quotation Sent\"."`

**RLS Policy:** `Enable all access for authenticated users` — USING/WITH CHECK both `true`

---

## Auth Schema

Supabase's built-in authentication schema. 24 tables managing users, sessions, identities, MFA, OAuth, SSO, and WebAuthn.

### Key Tables

| Table | Rows | Purpose |
|-------|------|---------|
| `auth.users` | 5 | Core user accounts (emails, passwords, metadata) |
| `auth.identities` | 5 | OAuth/external provider identities per user |
| `auth.sessions` | 4 | Active user sessions (JWT session management) |
| `auth.refresh_tokens` | 17 | JWT refresh token store |
| `auth.schema_migrations` | 76 | Auth subsystem migration history |
| `auth.mfa_factors` | 0 | MFA factors (TOTP, WebAuthn, phone) |
| `auth.mfa_challenges` | 0 | Active MFA challenges |
| `auth.mfa_amr_claims` | 4 | Authentication method references per session |
| `auth.flow_state` | 0 | OAuth/SSO login flow state |
| `auth.sso_providers` | 0 | SSO identity providers |
| `auth.sso_domains` | 0 | SSO email domain mappings |
| `auth.saml_providers` | 0 | SAML provider configurations |
| `auth.saml_relay_states` | 0 | SAML relay state tracking |
| `auth.one_time_tokens` | 0 | Email confirmation, password reset, etc. |
| `auth.oauth_clients` | 0 | OAuth client registrations |
| `auth.oauth_authorizations` | 0 | OAuth authorization grants |
| `auth.oauth_consents` | 0 | OAuth consent records |
| `auth.oauth_client_states` | 0 | OAuth client-side state |
| `auth.custom_oauth_providers` | 0 | Custom OAuth/OIDC providers |
| `auth.webauthn_credentials` | 0 | WebAuthn credential store |
| `auth.webauthn_challenges` | 0 | Active WebAuthn challenges |
| `auth.audit_log_entries` | 0 | Auth audit trail (separate from public.audit_logs) |
| `auth.instances` | 0 | Multi-site instance management |

### auth.users Key Columns

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | Shared with `public.users.id` by convention |
| `email` | `varchar` | |
| `phone` | `text` UNIQUE | |
| `encrypted_password` | `varchar` | |
| `raw_app_meta_data` | `jsonb` | App-level metadata (roles, etc.) |
| `raw_user_meta_data` | `jsonb` | User-provided metadata |
| `is_super_admin` | `boolean` | |
| `is_sso_user` | `boolean` | |
| `is_anonymous` | `boolean` | |
| `banned_until` | `timestamptz` | |
| `deleted_at` | `timestamptz` | Soft delete |
| `last_sign_in_at` | `timestamptz` | |

---

## Storage & Realtime Schemas

### Storage

Standard Supabase Storage schema for file/bucket management:

| Table | Purpose |
|-------|---------|
| `storage.buckets` | Storage bucket definitions |
| `storage.objects` | Stored file metadata |
| `storage.s3_multipart_uploads` | Multipart upload tracking |
| `storage.s3_multipart_uploads_parts` | Individual multipart parts |
| `storage.migrations` | Storage migration history |
| `storage.buckets_analytics` | Analytics on bucket usage |
| `storage.buckets_vectors` | Vector embeddings on stored files |
| `storage.vector_indexes` | Vector index metadata |

### Realtime

Supabase Realtime with daily-partitioned message tables:

| Table | Purpose |
|-------|---------|
| `realtime.messages` | Active realtime messages |
| `realtime.messages_YYYY_MM_DD` | Daily partitions (7 days: 06/16–06/22) |
| `realtime.subscription` | Realtime channel subscriptions |
| `realtime.schema_migrations` | Realtime migration history |

---

## Database Functions

### generate_order_id_field()

**Trigger function** that runs `BEFORE INSERT` on `orders` to auto-generate the human-friendly `order_id`.

```sql
DECLARE
  cust_id_text text;
  seq_num int;
BEGIN
  -- Get the customer's friendly customer_id (e.g. A010) using their UUID
  SELECT customer_id INTO cust_id_text FROM public.customers WHERE id = NEW.customer_id;

  -- Fallback if customer not found
  IF cust_id_text IS NULL THEN
    cust_id_text := 'A000';
  END IF;

  -- Find the next sequence number for this customer's orders
  SELECT COALESCE(MAX(SUBSTRING(order_id FROM '-([0-9]+)$')::integer), 0) + 1
  INTO seq_num
  FROM public.orders
  WHERE customer_id = NEW.customer_id;

  -- Construct order_id (e.g. A010-001)
  NEW.order_id := cust_id_text || '-' || lpad(seq_num::text, 3, '0');

  RETURN NEW;
END;
```

**Example output:** Customer `A010` → first order = `A010-001`, second = `A010-002`, etc.

---

## Sequences

| Sequence | Schema | Purpose | Current Range |
|----------|--------|---------|---------------|
| `customer_code_seq` | `public` | Auto-generates `customer_id` (`A###`) | A010–A014 |
| `enquiry_code_seq` | `public` | Auto-generates `enquire_id` (`ENQ###`) | ENQ007–ENQ013 |

---

## Migrations

5 applied migrations in chronological order:

| Version | Name | Purpose |
|---------|------|---------|
| `20260614171409` | `add_friendly_ids` | Added auto-generated `customer_id` and `enquire_id` sequences |
| `20260614172447` | `add_enquiry_relationships` | Added `customer_id` and `order_id` FKs to enquiries |
| `20260614174026` | `add_order_health_columns` | Added `health`, `lost_reason`, `stage_admin_notes` to orders |
| `20260614175258` | `setup_site_visit_policies_and_mock_data` | Site visit RLS, seed data setup |
| `20260619165516` | `create_portal_access_tokens` | Created `portal_access_tokens` table for JWT-based portal auth |

---

## Row Level Security

### Current State

**All 8 public tables have RLS enabled.** However, the policies are primarily permissive:

| Table | Policy | Target | Permissions |
|-------|--------|--------|-------------|
| `companies` | Enable all access for authenticated users | authenticated | ALL — USING true, WITH CHECK true |
| `users` | Enable all access for authenticated users | authenticated | ALL — USING true, WITH CHECK true |
| `customers` | Enable all access for authenticated users | authenticated | ALL — USING true, WITH CHECK true |
| `orders` | Enable all access for authenticated users | authenticated | ALL — USING true, WITH CHECK true |
| `orders` | Enable update access for anon users | anon | UPDATE — USING true, WITH CHECK true ⚠️ |
| `enquiries` | Enable all access for authenticated users | authenticated | ALL — USING true, WITH CHECK true |
| `audit_logs` | Enable all access for authenticated users | authenticated | ALL — USING true, WITH CHECK true |
| `order_messages` | Allow all access to authenticated users on order_messages | authenticated | ALL — USING true, WITH CHECK true |
| `order_files` | Allow all access to authenticated users on order_files | authenticated | ALL — USING true, WITH CHECK true |
| `order_files` | Allow insert access to anon users on order_files | anon | INSERT — WITH CHECK true ⚠️ |
| `portal_access_tokens` | Admin staff read access | authenticated | ALL — USING true, WITH CHECK true |

### ⚠️ Security Advisories

From Supabase security advisor:

1. **Leaked password protection is disabled** — Enable to check passwords against HaveIBeenPwned.org
2. **Anonymous UPDATE on `orders`** — Anyone without authentication can update any order
3. **Anonymous INSERT on `order_files`** — Anyone can insert file records
4. **Function search_path** — `generate_order_id_field()` has a mutable search_path
5. **All policies use `USING (true)`** — Effectively no row-level filtering; any authenticated user can access all rows

---

## Extensions

### Installed (enabled):

| Extension | Schema | Version | Purpose |
|-----------|--------|---------|---------|
| `pgcrypto` | `extensions` | 1.3 | Cryptographic functions |
| `plpgsql` | `pg_catalog` | 1.0 | PL/pgSQL procedural language |
| `uuid-ossp` | `extensions` | 1.1 | UUID generation |
| `pg_stat_statements` | `extensions` | 1.11 | SQL statement execution statistics |
| `supabase_vault` | `vault` | 0.3.1 | Encrypted secrets storage |

### Available (not enabled):

74 additional extensions available including: `postgis`, `pgjwt`, `pg_cron`, `pg_net`, `pg_graphql`, `vector`, `pg_partman`, `pgtap`, `http`, `wrappers`, `pgaudit`, `pgmq`, and many others.

---

## Key Design Decisions

### 1. Hybrid JSONB + Relational Model
The `orders` table uses JSONB for stage-specific details (`site_visit_details`, `quote_details`, etc.) rather than separate tables. This allows each stage to evolve its schema without migrations, at the cost of queryability within those JSONB fields.

### 2. Dual Chat System
There are two chat implementations:
- **Inline `chat_history` JSONB** on orders — legacy activity feed with timestamps
- **`order_messages` table** — newer structured chat with tabs (internal/customer/timeline) and read receipts

### 3. UUID + Human-Friendly IDs
All primary keys are UUIDs (security, no enumeration), but user-facing IDs use auto-generated friendly codes:
- Customers: `A010`, `A011`, ...
- Enquiries: `ENQ007`, `ENQ008`, ...
- Orders: `A010-001` (customer prefix + sequence)

### 4. Text-Based Order References
Tables like `order_messages`, `order_files`, and `portal_access_tokens` reference orders by the text `order_id` (e.g. `A010-001`) rather than the UUID FK. This is a deliberate choice for human readability but means no referential integrity at the database level for these relationships.

### 5. Single-Tenant Foundation
The schema is designed for multi-tenancy (`company_id` on all major tables) but currently operates as single-tenant with the hardcoded `11111111-...` company UUID.

### 6. Portal Token Architecture
Customer portal access uses JWT tokens stored in `portal_access_tokens` with:
- 30-day validity
- Revocation support (`revoked_at`)
- Scope-based permissions embedded in the JWT payload
- Multiple tokens per customer-order pair (new tokens don't invalidate old ones unless explicitly revoked)