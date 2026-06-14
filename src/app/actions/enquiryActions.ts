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

export async function getEnquiries() {
  const supabase = await getSupabase();
  const { data, error } = await supabase.from("enquiries").select("*").order("date_received", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

export async function createEnquiry(formData: any) {
  const supabase = await getSupabase();
  const { data, error } = await supabase.from("enquiries").insert([formData]).select();
  if (error) throw new Error(error.message);
  revalidatePath("/admin/enquire");
  return data;
}

export async function updateEnquiry(id: string, updates: any) {
  const supabase = await getSupabase();
  const { data, error } = await supabase.from("enquiries").update(updates).eq("id", id).select();
  if (error) throw new Error(error.message);
  revalidatePath("/admin/enquire");
  return data;
}
