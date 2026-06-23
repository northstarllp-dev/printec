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

/** Resolve a friendly order_id or uuid → actual DB uuid */
async function resolveOrderId(supabase: any, orderId: string): Promise<{ uuid: string; friendly: string; customerId?: string; customerName?: string; companyId?: string }> {
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidPattern.test(orderId)) {
    const { data: o } = await supabase.from("orders").select("id, order_id, customer_id, customer_name, company_id").eq("order_id", orderId).maybeSingle();
    if (o) return { uuid: o.id, friendly: o.order_id || o.id, customerId: o.customer_id, customerName: o.customer_name, companyId: o.company_id };
    return { uuid: orderId, friendly: orderId };
  } else {
    const { data: o } = await supabase.from("orders").select("order_id, customer_id, customer_name, company_id").eq("id", orderId).maybeSingle();
    return { uuid: orderId, friendly: o?.order_id || orderId, customerId: o?.customer_id, customerName: o?.customer_name, companyId: o?.company_id };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// READ
// ─────────────────────────────────────────────────────────────────────────────

export async function getQuotationByOrderId(orderId: string) {
  const supabase = await getSupabase();
  const { uuid } = await resolveOrderId(supabase, orderId);
  const { data, error } = await supabase.from("quotations").select("*").eq("order_id", uuid).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function getAllQuotations() {
  const supabase = await getSupabase();
  const { data, error } = await supabase.from("quotations").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

/** Get material preferences set by customer for an order */
export async function getQuotationMaterialPreferences(orderId: string) {
  const supabase = await getSupabase();
  const { uuid } = await resolveOrderId(supabase, orderId);
  const { data, error } = await supabase
    .from("quotation_material_preferences")
    .select("*")
    .eq("order_id", uuid)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return data || [];
}

/** Get site visit measurements for an order (signage items) */
export async function getSiteVisitMeasurementsForOrder(orderId: string) {
  const supabase = await getSupabase();
  const { uuid } = await resolveOrderId(supabase, orderId);
  // Find the site visit for this order
  const { data: sv } = await supabase.from("site_visits").select("id").eq("order_id", uuid).maybeSingle();
  if (!sv) return [];
  const { data, error } = await supabase.from("site_visit_measurements").select("*").eq("site_visit_id", sv.id).order("created_at", { ascending: true });
  if (error) return [];
  return data || [];
}

// ─────────────────────────────────────────────────────────────────────────────
// WRITE — Quotation Core
// ─────────────────────────────────────────────────────────────────────────────

export interface QuotationPayload {
  quotation_id?: string;
  items?: any[];
  signage_options?: any[];   // new multi-option structure
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
  advance_percent?: number;
  advance_amount?: number;
  shipping?: number;
  amount_paid?: number;
}

/** Upsert quotation — creates if not exists, updates if already there */
export async function upsertQuotation(orderId: string, payload: QuotationPayload) {
  const supabase = await getSupabase();
  const resolved = await resolveOrderId(supabase, orderId);

  if (!payload.customer_id) payload.customer_id = resolved.customerId;
  if (!payload.customer_name) payload.customer_name = resolved.customerName;

  const { data: existing } = await supabase.from("quotations").select("id, quotation_id").eq("order_id", resolved.uuid).maybeSingle();

  let result;
  if (existing) {
    const { data, error } = await supabase.from("quotations")
      .update({
        quotation_id: payload.quotation_id || existing.quotation_id,
        items: payload.items ?? [],
        signage_options: payload.signage_options ?? [],
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
        advance_percent: payload.advance_percent ?? 25,
        advance_amount: payload.advance_amount ?? 0,
        shipping: payload.shipping ?? 0,
        amount_paid: payload.amount_paid ?? 0,
      })
      .eq("id", existing.id)
      .select().single();
    if (error) throw new Error(error.message);
    result = data;
  } else {
    const quotation_id = payload.quotation_id || (await generateQuotationId(supabase));
    const { data, error } = await supabase.from("quotations").insert({
      quotation_id,
      order_id: resolved.uuid,
      company_id: resolved.companyId ?? null,
      customer_id: payload.customer_id ?? null,
      customer_name: payload.customer_name ?? null,
      items: payload.items ?? [],
      signage_options: payload.signage_options ?? [],
      subtotal: payload.subtotal,
      discount: payload.discount,
      tax: payload.tax,
      grand_total: payload.grand_total,
      status: payload.status || "Draft",
      notes: payload.notes ?? null,
      terms: payload.terms ?? null,
      valid_until: payload.valid_until ?? null,
      advance_percent: payload.advance_percent ?? 25,
      advance_amount: payload.advance_amount ?? 0,
      shipping: payload.shipping ?? 0,
      amount_paid: payload.amount_paid ?? 0,
    }).select().single();
    if (error) throw new Error(error.message);
    result = data;
  }

  revalidatePath(`/admin/orders/${resolved.friendly}`);
  revalidatePath(`/staff/orders/${resolved.friendly}`);
  revalidatePath("/admin/orders");
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// WRITE — Quotation Status Actions (Admin)
// ─────────────────────────────────────────────────────────────────────────────

/** Admin approves quotation — marks it approved, moves order stage to Quotation Sent */
export async function sendQuotationToCustomer(quotationId: string, adminName: string) {
  const supabase = await getSupabase();
  const { data: qt, error: qErr } = await supabase.from("quotations").select("order_id, quotation_id").eq("id", quotationId).single();
  if (qErr || !qt) throw new Error("Quotation not found");

  const { error } = await supabase.from("quotations").update({
    status: "Sent",
    admin_approved_at: new Date().toISOString(),
    admin_approved_by: adminName,
  }).eq("id", quotationId);
  if (error) throw new Error(error.message);

  await supabase.from("orders").update({ stage: "Quotation Sent" }).eq("id", qt.order_id);
  await supabase.from("order_messages").insert({
    order_id: qt.order_id,
    tab: "timeline",
    sender_name: "System",
    sender_role: "System",
    content: `Quotation ${qt.quotation_id} has been approved by ${adminName} and sent to the customer.`,
  });

  revalidatePath("/admin/orders");
}

/** Admin sets advance percent & amount */
export async function setQuotationAdvance(quotationId: string, advancePercent: number, grandTotal: number) {
  const supabase = await getSupabase();
  const advanceAmount = Math.round((advancePercent / 100) * grandTotal * 100) / 100;
  const { error } = await supabase.from("quotations").update({
    advance_percent: advancePercent,
    advance_amount: advanceAmount,
  }).eq("id", quotationId);
  if (error) throw new Error(error.message);
  return advanceAmount;
}

/** Generate advance invoice on the order */
export async function generateAdvanceInvoice(orderId: string, invoiceDetails: {
  invoiceNumber: string;
  advancePercent: number;
  advanceAmount: number;
  projectValue: number;
  dueDate: string;
  paymentLink?: string;
}) {
  const supabase = await getSupabase();
  const { uuid, friendly } = await resolveOrderId(supabase, orderId);

  const { error } = await supabase.from("orders").update({
    advance_invoice_details: {
      ...invoiceDetails,
      generatedAt: new Date().toISOString(),
      status: "Pending",
    },
  }).eq("id", uuid);
  if (error) throw new Error(error.message);

  await supabase.from("order_messages").insert({
    order_id: uuid,
    tab: "timeline",
    sender_name: "System",
    sender_role: "System",
    content: `Advance invoice ${invoiceDetails.invoiceNumber} generated for ₹${invoiceDetails.advanceAmount.toLocaleString("en-IN")} (${invoiceDetails.advancePercent}%). Due: ${invoiceDetails.dueDate}.`,
  });

  revalidatePath(`/admin/orders/${friendly}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// WRITE — Material Preferences (Customer / Staff save)
// ─────────────────────────────────────────────────────────────────────────────
export interface MaterialPreferenceItem {
  signage_item_id: string;
  signage_item_label: string;
  preferences: Record<string, string>;
}

export async function saveQuotationMaterialPreferences(
  orderId: string,
  preferences: MaterialPreferenceItem[]
) {
  const supabase = await getSupabase();
  const { uuid } = await resolveOrderId(supabase, orderId);

  for (const pref of preferences) {
    await supabase.from("quotation_material_preferences").upsert({
      order_id: uuid,
      signage_item_id: pref.signage_item_id,
      signage_item_label: pref.signage_item_label,
      preferences: pref.preferences || {},
    }, { onConflict: "order_id,signage_item_id" });
  }

  // Notify via timeline
  await supabase.from("order_messages").insert({
    order_id: uuid,
    tab: "timeline",
    sender_name: "System",
    sender_role: "System",
    content: "Customer has updated their material preferences.",
  });
}
// ─────────────────────────────────────────────────────────────────────────────
// WRITE — Customer Actions
// ─────────────────────────────────────────────────────────────────────────────

/** Customer approves quotation → stage = Quotation Approved */
export async function customerApproveQuotation(orderId: string, customerName: string) {
  const supabase = await getSupabase();
  const { uuid, friendly } = await resolveOrderId(supabase, orderId);

  await supabase.from("quotations").update({ status: "Approved", customer_response: "Yes" }).eq("order_id", uuid);
  await supabase.from("orders").update({ stage: "Quotation Approved" }).eq("id", uuid);
  await supabase.from("order_messages").insert({
    order_id: uuid,
    tab: "timeline",
    sender_name: "System",
    sender_role: "System",
    content: `${customerName} has approved the quotation. Order is ready for advance payment.`,
  });

  revalidatePath(`/admin/orders/${friendly}`);
}

/** Customer requests revision → stage = Quotation Negotiation */
export async function customerRequestRevision(orderId: string, customerName: string, notes: string) {
  const supabase = await getSupabase();
  const { uuid, friendly } = await resolveOrderId(supabase, orderId);

  await supabase.from("quotations").update({ status: "Rejected", customer_response: "Revision" }).eq("order_id", uuid);
  await supabase.from("orders").update({ stage: "Quotation Negotiation" }).eq("id", uuid);
  await supabase.from("order_messages").insert({
    order_id: uuid,
    tab: "customer",
    sender_name: customerName,
    sender_role: "Customer",
    content: `Revision Requested: ${notes}`,
  });

  revalidatePath(`/admin/orders/${friendly}`);
}

/** Customer submits payment → payment_history updated, check if advance paid → stage = Design In Progress */
export async function customerMarkPaymentMade(
  orderId: string,
  paymentDetails: {
    method: string;
    amount: number;
    reference?: string;
    note?: string;
  }
) {
  const supabase = await getSupabase();
  const { uuid, friendly } = await resolveOrderId(supabase, orderId);

  // Get current payment_history
  const { data: order } = await supabase.from("orders").select("payment_history, advance_invoice_details").eq("id", uuid).maybeSingle();
  const history = Array.isArray(order?.payment_history) ? order.payment_history : [];
  const newEntry = {
    ...paymentDetails,
    paidAt: new Date().toISOString(),
    status: "Pending Verification",
  };
  const updatedHistory = [...history, newEntry];

  await supabase.from("orders").update({ payment_history: updatedHistory }).eq("id", uuid);
  // Mark quotation advance pending verification
  await supabase.from("quotations").update({ payment_status: "Partially Paid" }).eq("order_id", uuid);

  await supabase.from("order_messages").insert({
    order_id: uuid,
    tab: "timeline",
    sender_name: "System",
    sender_role: "System",
    content: `Customer submitted payment of ₹${paymentDetails.amount.toLocaleString("en-IN")} via ${paymentDetails.method}. Awaiting admin verification.`,
  });

  revalidatePath(`/admin/orders/${friendly}`);
}

/** Admin confirms advance received → stage = Design In Progress */
export async function adminConfirmAdvanceReceived(orderId: string, adminName: string) {
  const supabase = await getSupabase();
  const { uuid, friendly } = await resolveOrderId(supabase, orderId);

  // Fetch current payment_history
  const { data: order } = await supabase.from("orders").select("payment_history").eq("id", uuid).maybeSingle();
  const history = Array.isArray(order?.payment_history) ? order.payment_history : [];
  const updatedHistory = history.map((p: any) => ({
    ...p,
    status: "Verified",
  }));

  await supabase.from("orders").update({ 
    stage: "Design In Progress",
    payment_history: updatedHistory
  }).eq("id", uuid);

  await supabase.from("quotations").update({
    payment_status: "Paid",
    advance_paid: true,
    advance_paid_at: new Date().toISOString(),
  }).eq("order_id", uuid);

  await supabase.from("order_messages").insert({
    order_id: uuid,
    tab: "timeline",
    sender_name: "System",
    sender_role: "System",
    content: `Advance payment verified and confirmed by ${adminName}. Order moved to Design In Progress.`,
  });

  revalidatePath(`/admin/orders/${friendly}`);
  revalidatePath("/admin/orders");
  revalidatePath(`/staff/orders/${friendly}`);
}

/** Verify single payment item in payment history */
export async function adminVerifySinglePayment(orderId: string, refId: string, adminName: string) {
  const supabase = await getSupabase();
  const { uuid, friendly } = await resolveOrderId(supabase, orderId);

  // Fetch current payment_history
  const { data: order } = await supabase.from("orders").select("payment_history, deposit_paid").eq("id", uuid).maybeSingle();
  const history = Array.isArray(order?.payment_history) ? order.payment_history : [];
  
  let targetAmount = 0;
  const updatedHistory = history.map((p: any) => {
    if (p.reference === refId || p.paidAt === refId) {
      targetAmount = Number(p.amount) || 0;
      return {
        ...p,
        status: "Verified"
      };
    }
    return p;
  });

  const newDeposit = (order?.deposit_paid || 0) + targetAmount;

  await supabase.from("orders").update({ 
    payment_history: updatedHistory,
    deposit_paid: newDeposit
  }).eq("id", uuid);

  await supabase.from("order_messages").insert({
    order_id: uuid,
    tab: "timeline",
    sender_name: "System",
    sender_role: "System",
    content: `Payment receipt reference ${refId} verified by ${adminName}. Deposit paid updated to ₹${newDeposit.toLocaleString("en-IN")}.`,
  });

  revalidatePath(`/admin/orders/${friendly}`);
  revalidatePath("/admin/orders");
  revalidatePath(`/staff/orders/${friendly}`);
}
