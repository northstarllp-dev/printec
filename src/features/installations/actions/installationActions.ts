"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { updateOrderStageAction } from "@/features/orders/actions/orderActions";

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

export async function getInstallationByOrderId(orderId: string) {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("installations")
    .select("*")
    .eq("order_id", orderId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // Row not found, create one
      const { data: newRow, error: insertError } = await supabase
        .from("installations")
        .insert({ order_id: orderId })
        .select()
        .single();
      
      if (insertError) throw insertError;
      return newRow;
    }
    throw error;
  }
  return data;
}

export async function updateInstallationDetails(orderId: string, details: any) {
  const supabase = await getSupabase();
  
  // First ensure record exists
  await getInstallationByOrderId(orderId);

  const { error } = await supabase
    .from("installations")
    .update(details)
    .eq("order_id", orderId);

  if (error) throw error;
  return { success: true };
}

export async function markInstallationCompleted(orderId: string, checklist: any[], photos: any[], notes: string) {
  const supabase = await getSupabase();
  
  // Update the installations table
  const { error } = await supabase
    .from("installations")
    .update({
      status: "Completed",
      checklist,
      photos,
      notes
    })
    .eq("order_id", orderId);

  if (error) throw error;
  
  // Update the order stage to "Completed"
  await updateOrderStageAction(orderId, "Completed");
  
  return { success: true };
}

export async function requestInstallationLocationAction(orderId: string) {
  const supabase = await getSupabase();
  
  // Get current installation_details
  const { data: order, error: fetchError } = await supabase.from("orders").select("installation_details, order_id").eq("id", orderId).single();
  if (fetchError) throw new Error(fetchError.message);
  
  const updatedDetails = {
    ...(order.installation_details || {}),
    gmapRequested: true
  };
  
  const { error } = await supabase.from("orders").update({ installation_details: updatedDetails }).eq("id", orderId);
  if (error) throw new Error(error.message);

  // Activity Log
  await supabase.from("order_activity").insert({
    order_id: order.order_id || orderId,
    activity_type: "internal",
    actor_name: "Installation Team",
    actor_role: "Installation",
    content: `Requested exact Google Map location from the customer.`,
    metadata: { action: "request_location" }
  });

  return { success: true };
}

export async function provideInstallationLocationAction(orderId: string, mapLink: string) {
  const supabase = await getSupabase();
  
  // Get current installation_details
  const { data: order, error: fetchError } = await supabase.from("orders").select("installation_details, order_id").eq("id", orderId).single();
  if (fetchError) throw new Error(fetchError.message);
  
  const updatedDetails = {
    ...(order.installation_details || {}),
    gmapLink: mapLink,
    gmapRequested: false // Clear the request flag
  };
  
  const { error } = await supabase.from("orders").update({ installation_details: updatedDetails }).eq("id", orderId);
  if (error) throw new Error(error.message);

  // Activity Log
  await supabase.from("order_activity").insert({
    order_id: order.order_id || orderId,
    activity_type: "internal",
    actor_name: "Customer",
    actor_role: "Customer",
    content: `Customer provided the exact Google Map location for installation.`,
    metadata: { action: "provide_location" }
  });

  return { success: true };
}
