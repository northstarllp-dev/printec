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
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

export async function getOrders() {
  const supabase = await getSupabase();
  const { data, error } = await supabase.from("orders").select("*").order("date_created", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

export async function createOrder(formData: any) {
  const supabase = await getSupabase();
  const { data, error } = await supabase.from("orders").insert([formData]).select();
  if (error) throw new Error(error.message);
  revalidatePath("/admin/orders");
  revalidatePath("/staff/orders");
  return data;
}

export async function updateOrder(id: string, updates: any) {
  const supabase = await getSupabase();
  const { data, error } = await supabase.from("orders").update(updates).eq("id", id).select();
  if (error) throw new Error(error.message);
  revalidatePath("/admin/orders");
  revalidatePath("/staff/orders");
  return data;
}

export async function deleteOrder(id: string) {
  const supabase = await getSupabase();
  const { error } = await supabase.from("orders").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/orders");
  revalidatePath("/staff/orders");
}
