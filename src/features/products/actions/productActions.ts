"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );
}

export type Product = {
  id: string;
  product_id: string;
  company_id?: string;
  name: string;
  description?: string | null;
  category?: string | null;
  pricing_type?: string | null;
  // New pricing fields
  price_per_sqft?: number | null;
  price_per_unit?: number | null;
  price_per_running_ft?: number | null;
  images?: string[];
  is_active: boolean;
  created_at?: string;
};

export type CreateProductPayload = {
  product_id: string;
  name: string;
  description?: string;
  category?: string;
  pricing_type?: string | null;
  // New
  price_per_sqft?: number | null;
  price_per_unit?: number | null;
  price_per_running_ft?: number | null;
  images?: string[];
  is_active?: boolean;
};

export async function getProducts(): Promise<Product[]> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return (data || []).map((p: any) => ({
    ...p,
    images: Array.isArray(p.images) ? p.images : [],
  }));
}

export async function getActiveProducts(): Promise<Product[]> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return (data || []).map((p: any) => ({
    ...p,
    images: Array.isArray(p.images) ? p.images : [],
  }));
}

export async function createProduct(formData: CreateProductPayload) {
  const supabase = await getSupabase();
  const payload = {
    company_id: "11111111-1111-1111-1111-111111111111",
    is_active: true,
    ...formData,
    images: formData.images ?? [],
  };
  const { data, error } = await supabase
    .from("products")
    .insert([payload])
    .select();
  if (error) throw new Error(error.message);
  revalidatePath("/admin/products");
  return data;
}

export async function updateProduct(
  id: string,
  updates: Partial<CreateProductPayload>
) {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("products")
    .update(updates)
    .eq("id", id)
    .select();
  if (error) throw new Error(error.message);
  revalidatePath("/admin/products");
  return data;
}

export async function deleteProduct(id: string) {
  const supabase = await getSupabase();
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/products");
}
