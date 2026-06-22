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

export async function getProducts() {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return data;
}

export async function createProduct(formData: {
  product_id: string;
  name: string;
  description?: string;
  category?: string;
  pricing_type: "per_unit" | "per_sqft";
  unit_price: number;
  unit: string;
  is_active?: boolean;
}) {
  const supabase = await getSupabase();
  const payload = {
    company_id: "11111111-1111-1111-1111-111111111111",
    is_active: true,
    ...formData,
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
  updates: Partial<{
    name: string;
    description: string;
    category: string;
    pricing_type: "per_unit" | "per_sqft";
    unit_price: number;
    unit: string;
    is_active: boolean;
  }>
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
