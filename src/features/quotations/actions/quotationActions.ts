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
        getAll() { return cookieStore.getAll(); },
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

/** Generate next QT-NNN id by looking at existing quotation_ids */
async function generateQuotationId(supabase: any): Promise<string> {
  const { data } = await supabase
    .from("quotations")
    .select("quotation_id")
    .order("created_at", { ascending: false });

  let maxNum = 0;
  for (const row of data || []) {
    const match = row.quotation_id?.match(/^QT-(\d+)$/);
    if (match) maxNum = Math.max(maxNum, parseInt(match[1], 10));
  }
  return `QT-${String(maxNum + 1).padStart(3, "0")}`;
}

export async function getQuotationByOrderId(orderId: string) {
  const supabase = await getSupabase();

  // Resolve friendly order_id → uuid if needed
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  let resolvedId = orderId;
  if (!uuidPattern.test(orderId)) {
    const { data: o } = await supabase
      .from("orders")
      .select("id")
      .eq("order_id", orderId)
      .maybeSingle();
    if (o) resolvedId = o.id;
  }

  const { data, error } = await supabase
    .from("quotations")
    .select("*")
    .eq("order_id", resolvedId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export interface QuotationPayload {
  quotation_id?: string;
  items: any[];
  subtotal: number;
  discount: number;
  tax: number;
  grand_total: number;
  status?: string;
  notes?: string;
  terms?: string;
  valid_until?: string | null;
  customer_id?: string;
  customer_name?: string;
}

/** Upsert quotation — creates if not exists, updates if already there */
export async function upsertQuotation(orderId: string, payload: QuotationPayload) {
  const supabase = await getSupabase();

  // Resolve uuid
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  let resolvedOrderId = orderId;
  let friendlyOrderId = orderId;

  if (!uuidPattern.test(orderId)) {
    const { data: o } = await supabase
      .from("orders")
      .select("id, order_id, customer_id, customer_name, company_id")
      .eq("order_id", orderId)
      .maybeSingle();
    if (o) {
      resolvedOrderId = o.id;
      friendlyOrderId = o.order_id || o.id;
    }
  } else {
    const { data: o } = await supabase
      .from("orders")
      .select("order_id, customer_id, customer_name, company_id")
      .eq("id", orderId)
      .maybeSingle();
    if (o) {
      friendlyOrderId = o.order_id || orderId;
      if (!payload.customer_id) payload.customer_id = o.customer_id;
      if (!payload.customer_name) payload.customer_name = o.customer_name;
    }
  }

  // Check if quotation already exists
  const { data: existing } = await supabase
    .from("quotations")
    .select("id, quotation_id")
    .eq("order_id", resolvedOrderId)
    .maybeSingle();

  let result;
  if (existing) {
    // Update
    const { data, error } = await supabase
      .from("quotations")
      .update({
        quotation_id: payload.quotation_id || existing.quotation_id,
        items: payload.items,
        subtotal: payload.subtotal,
        discount: payload.discount,
        tax: payload.tax,
        grand_total: payload.grand_total,
        status: payload.status || "Draft",
        notes: payload.notes ?? null,
        terms: payload.terms ?? null,
        valid_until: payload.valid_until ?? null,
        customer_id: payload.customer_id ?? null,
        customer_name: payload.customer_name ?? null,
      })
      .eq("id", existing.id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    result = data;
  } else {
    // Insert with auto-generated quotation_id if not provided
    const quotation_id = payload.quotation_id || (await generateQuotationId(supabase));

    const { data: order } = await supabase
      .from("orders")
      .select("company_id, customer_id, customer_name")
      .eq("id", resolvedOrderId)
      .maybeSingle();

    const { data, error } = await supabase
      .from("quotations")
      .insert({
        quotation_id,
        order_id: resolvedOrderId,
        company_id: order?.company_id ?? null,
        customer_id: payload.customer_id ?? order?.customer_id ?? null,
        customer_name: payload.customer_name ?? order?.customer_name ?? null,
        items: payload.items,
        subtotal: payload.subtotal,
        discount: payload.discount,
        tax: payload.tax,
        grand_total: payload.grand_total,
        status: payload.status || "Draft",
        notes: payload.notes ?? null,
        terms: payload.terms ?? null,
        valid_until: payload.valid_until ?? null,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    result = data;
  }

  revalidatePath(`/admin/orders/${friendlyOrderId}`);
  revalidatePath(`/staff/orders/${friendlyOrderId}`);
  revalidatePath("/admin/orders");

  return result;
}

export async function getAllQuotations() {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("quotations")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}
