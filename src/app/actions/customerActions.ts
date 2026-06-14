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

export async function getCustomers() {
  const supabase = await getSupabase();
  const { data, error } = await supabase.from("customers").select("*").order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return data;
}

export async function createCustomer(formData: any) {
  const supabase = await getSupabase();
  const { data, error } = await supabase.from("customers").insert([formData]).select();
  if (error) throw new Error(error.message);
  revalidatePath("/admin/customers");
  return data;
}

export async function updateCustomer(id: string, updates: any) {
  const supabase = await getSupabase();
  const { data, error } = await supabase.from("customers").update(updates).eq("id", id).select();
  if (error) throw new Error(error.message);
  revalidatePath("/admin/customers");
  return data;
}

export async function deleteCustomer(id: string) {
  const supabase = await getSupabase();
  const { error } = await supabase.from("customers").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/customers");
}
