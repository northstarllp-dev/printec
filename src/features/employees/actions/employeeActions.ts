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

export async function getEmployees() {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("users")
    .select("*, order_assignments(id)")
    .eq("role", "staff");
  if (error) throw new Error(error.message);
  
  return data.map(user => ({
    ...user,
    employeeId: user.employee_id,
    jobsAssigned: user.order_assignments ? user.order_assignments.length : 0
  }));
}

export async function createEmployee(employeeData: any) {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("users")
    .insert([
      {
        company_id: "11111111-1111-1111-1111-111111111111",
        ...employeeData,
        role: "staff",
      },
    ])
    .select();
  if (error) throw new Error(error.message);
  revalidatePath("/admin/employees");
  return data;
}

export async function updateEmployee(id: string, updates: any) {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", id)
    .select();
  if (error) throw new Error(error.message);
  revalidatePath("/admin/employees");
  return data;
}

export async function deleteEmployee(id: string) {
  const supabase = await getSupabase();
  const { error } = await supabase.from("users").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/employees");
}
