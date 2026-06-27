# Secure Supabase Storage Architecture

This document defines the production-grade architecture for managing and securing assets (such as product photos, order mockups, and message attachments) in Supabase Storage. It is designed to prevent unauthorized downloads, data leaks, and storage-abuse/orphaned-file issues.

---

## 1. Core Security Model

### Private Buckets by Default
All buckets (e.g., `product-images`, `order-attachments`) must be configured as **Private** in the Supabase Dashboard. 
* A private bucket denies all anonymous/unauthenticated HTTP access by default.
* Files inside a private bucket cannot be accessed via static public URLs (`.getPublicUrl()`).

### Relative Storage Path Storage
Always store the **relative file path** (e.g., `products/17282381283_abcd.png`) in the database rather than the absolute URL (e.g., `https://[project-id].supabase.co/storage/v1/object/public/product-images/...`).
* **Why:** Storing absolute URLs exposes the storage layout and public endpoints directly in database queries. Relative paths keep the database clean and decouple it from CDN domains, project transitions, or bucket-visibility changes.

---

## 2. Access Control (Authorization & RLS)

Access to objects in Supabase Storage is regulated by Row Level Security (RLS) policies on the `storage.objects` table.

```
                  ┌───────────────────────┐
                  │   Supabase Storage    │
                  │   (Private Bucket)    │
                  └───────────┬───────────┘
                              │
             ┌────────────────┴────────────────┐
             ▼                                 ▼
   [ Authenticated Admins ]           [ Anonymous Customers ]
             │                                 │
     (Browser Session JWT)             (Dynamic Token / Hash)
             │                                 │
             ▼                                 ▼
   Direct SDK Requests                  Next.js Server Side
  (Enforced by Storage RLS)          (Generates Short Signed URL)
             │                                 │
             ▼                                 ▼
       Allow Read/Write                 15-Min Expiring URL
```

### RLS Policies for Storage (`storage.objects`)

To ensure that only logged-in employees/admins can upload or delete photos, the following Postgres RLS policies must be applied:

```sql
-- 1. Enable RLS on Storage Objects table (usually enabled by default in Supabase)
alter table storage.objects enable row level security;

-- 2. Allow Authenticated Users to Upload (INSERT)
create policy "Allow company employees to upload images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'product-images' AND
  (select auth.role()) = 'authenticated'
);

-- 3. Allow Authenticated Users to Delete (DELETE)
create policy "Allow company employees to delete images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'product-images' AND
  (select auth.role()) = 'authenticated'
);

-- 4. Allow Authenticated Users to Update (UPDATE) - Required if doing upsert
create policy "Allow company employees to update images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'product-images' AND
  (select auth.role()) = 'authenticated'
);
```

---

## 3. Image Rendering & Delivery Architecture

Because the bucket is private, image delivery must use **Short-Lived Signed URLs**. 

### Scenario A: Admin Portal (Logged-in Admins)
Since the admin is logged in, we can fetch images by calling `.createSignedUrl` directly in Server Actions or Client Components:

```typescript
const { data, error } = await supabase.storage
  .from('product-images')
  .createSignedUrl(relativePath, 900); // URL expires in 15 minutes (900 seconds)

const secureUrl = data?.signedUrl;
```

### Scenario B: Customer Guest Portal (Unauthenticated Links)
If a guest customer accesses a quotation portal (e.g., `/portal/quote/[id]`) via an unauthenticated link:
1. **Never** allow public SELECT permissions on the `product-images` bucket.
2. The page must render as a **Next.js Server Component** or call a **Server Action** to fetch the page data.
3. The server retrieves the product details and relative image paths from the database.
4. Using an authorized server-side Supabase client, the server generates a **Signed URL** with a short expiration time (e.g., 5 to 15 minutes).
5. The server passes these temporary URLs to the HTML response.
6. The client renders the image using a standard `<img>` tag without knowing the underlying storage keys or having long-term access.

### Preventing Cache Poisoning & Leaks
To ensure that CDN proxies or browsers do not cache these signed URLs (which would keep the images viewable after the signed token expires):
* Make sure your Next.js API or Server Component sends appropriate Cache-Control headers when returning pages containing signed URLs:
  ```http
  Cache-Control: private, no-cache, no-store, must-revalidate
  ```
* Do not configure CDN-level edge caching for signed storage URLs.

---

## 4. Handling Orphans & Storage Bloat

If an admin uploads 5 photos but cancels the form, or deletes the product completely, the images in the bucket become orphaned. 

### Implementation Rules:
1. **Draft/Session Tracking (Client State):** Maintain an array of `uploadedImagesThisSession` and `imagesToDeleteOnSave` in UI components (like `ProductFormModal.tsx`).
   - If the user cancels: Clean up all `uploadedImagesThisSession`.
   - If the user deletes a photo: Delete it from Storage immediately if it's new, or queue it for deletion upon saving if it's pre-existing.
2. **Database Cascade Deletions (Server Side):** When a product is deleted from the `products` table, always delete the associated files from storage inside the database mutation / Server Action:
   ```typescript
   export async function deleteProduct(id: string) {
     const supabase = await getSupabase();
     
     // 1. Fetch paths from db
     const { data: product } = await supabase
       .from("products")
       .select("images")
       .eq("id", id)
       .single();

     // 2. Delete row from db
     await supabase.from("products").delete().eq("id", id);
     
     // 3. Delete files from storage
     if (product?.images?.length) {
       await deleteImagesFromStorage(product.images);
     }
   }
   ```
3. **Storage Cleanup Cron (Optional / Maintenance):** Periodically run a database cron or serverless script that cross-references the files in the `product-images` bucket with the `images` columns in the `products` table, deleting any files that are not referenced in the database.
