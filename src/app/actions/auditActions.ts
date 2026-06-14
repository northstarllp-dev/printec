"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

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

export async function createAuditLogAction(
  actor: string,
  actionType: string,
  orderId: string | null,
  customerId: string | null,
  description: string,
  metadata: any = {}
) {
  const supabase = await getSupabase();
  const { data, error } = await supabase.from("audit_logs").insert([{
    company_id: "11111111-1111-1111-1111-111111111111",
    actor,
    action_type: actionType,
    order_id: orderId,
    customer_id: customerId,
    description,
    metadata
  }]).select();
  
  if (error) {
    console.error("Failed to insert audit log:", error.message);
  }
  return data;
}
