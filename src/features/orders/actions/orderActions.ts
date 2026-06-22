"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createAuditLogAction } from "@/features/audit/actions/auditActions";
import { mapSiteVisitFromDb, mapSiteVisitToDb } from "./siteVisitMapper";

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
  const { data, error } = await supabase.from("orders").select(`
    *,
    site_visits(
      *,
      site_visit_measurements(*)
    )
  `).order("date_created", { ascending: false });
  if (error) throw new Error(error.message);
  
  return data.map(order => {
    const sv = order.site_visits && order.site_visits.length > 0 ? order.site_visits[0] : null;
    return {
      ...order,
      siteVisitDetails: mapSiteVisitFromDb(sv)
    };
  });
}

export async function getOrderById(id: string) {
  const supabase = await getSupabase();
  
  // First try by UUID (id column)
  let { data, error } = await supabase.from("orders").select(`
    *,
    site_visits(
      *,
      site_visit_measurements(*)
    )
  `).eq("id", id).maybeSingle();
  
  // If not found, try by friendly order_id column
  if ((error || !data) && id) {
    const { data: dataByOrderId, error: errorByOrderId } = await supabase
      .from("orders")
      .select(`
        *,
        site_visits(
          *,
          site_visit_measurements(*)
        )
      `)
      .eq("order_id", id)
      .maybeSingle();
    
    if (!errorByOrderId && dataByOrderId) {
      data = dataByOrderId;
    }
  }
  
  if (!data) return null;

  const sv = data.site_visits && data.site_visits.length > 0 ? data.site_visits[0] : null;
  return {
    ...data,
    siteVisitDetails: mapSiteVisitFromDb(sv)
  };
}

export async function createOrder(formData: any) {
  const supabase = await getSupabase();
  
  // Set defaults for history
  const orderWithDefaults = {
    company_id: "11111111-1111-1111-1111-111111111111",
    ...formData,
    health: formData.health || "Active",
    version_history: [
      { version: "v1.0", date: new Date().toLocaleDateString(), notes: "Order initialized." }
    ],
    chat_history: [
      { id: "1", sender: "System", time: "Just now", message: "Order created successfully." }
    ]
  };

  const { data, error } = await supabase.from("orders").insert([orderWithDefaults]).select();
  if (error) throw new Error(error.message);
  
  const createdOrder = data[0];
  await createAuditLogAction(
    "Admin",
    "Order Created",
    createdOrder.id,
    createdOrder.customer_id || null,
    `Order "${createdOrder.project_name}" (${createdOrder.id}) created manually.`
  );

  // Sync to order_messages timeline
  await supabase.from("order_messages").insert({
    order_id: createdOrder.order_id || createdOrder.id,
    tab: "timeline",
    sender_name: "System",
    sender_role: "System",
    content: "Order created successfully."
  });

  revalidatePath("/admin/orders");
  revalidatePath("/staff/orders");
  return data;
}

// Helper to resolve either UUID id or friendly order_id to an actual UUID id
async function resolveOrderUuid(supabase: any, idOrOrderId: string): Promise<string> {
  // If it already looks like a UUID, use it directly
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidPattern.test(idOrOrderId)) return idOrOrderId;

  // Otherwise, look it up by friendly order_id
  const { data, error } = await supabase
    .from("orders")
    .select("id")
    .eq("order_id", idOrOrderId)
    .maybeSingle();

  if (error || !data) {
    throw new Error(`Could not resolve order ID: ${idOrOrderId}`);
  }
  return data.id;
}

export async function updateOrder(id: string, updates: any) {
  const supabase = await getSupabase();
  // Resolve UUID in case a friendly order_id was passed
  const orderUuid = await resolveOrderUuid(supabase, id);

  const { data, error } = await supabase.from("orders").update(updates).eq("id", orderUuid).select();
  if (error) throw new Error(error.message);
  if (data && data.length > 0) {
    const orderIdFriendly = data[0].order_id || id;
    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderIdFriendly}`);
    revalidatePath("/staff/orders");
    revalidatePath(`/staff/orders/${orderIdFriendly}`);
  }
  return data;
}

export async function deleteOrder(id: string) {
  const supabase = await getSupabase();
  const { data: o } = await supabase.from("orders").select("order_id").eq("id", id).single();
  const { error } = await supabase.from("orders").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/orders");
  revalidatePath("/staff/orders");
  revalidatePath("/admin/orders");
  revalidatePath("/staff/orders");
  if (o) {
    revalidatePath(`/admin/orders/${o.order_id}`);
    revalidatePath(`/staff/orders/${o.order_id}`);
  }
}

export async function updateSiteVisitDetailsAction(orderId: string, details: any) {
  const supabase = await getSupabase();
  const orderUuid = await resolveOrderUuid(supabase, orderId);

  // 1. Get company ID
  const { data: order } = await supabase.from("orders").select("company_id").eq("id", orderUuid).single();
  const companyId = order?.company_id || "11111111-1111-1111-1111-111111111111";

  // 2. Map payload to DB schema
  const dbPayload = mapSiteVisitToDb(orderUuid, companyId, details);

  // 3. Upsert into site_visits
  const { data: siteVisit, error: svError } = await supabase
    .from("site_visits")
    .upsert(dbPayload, { onConflict: "order_id" })
    .select()
    .single();

  if (svError) throw new Error(svError.message);

  // 4. Update measurements if provided
  if (details.locations && Array.isArray(details.locations)) {
    // We could delete old measurements and insert new, or upsert.
    // Simplest is delete all for this site_visit_id and insert new ones.
    await supabase.from("site_visit_measurements").delete().eq("site_visit_id", siteVisit.id);

    if (details.locations.length > 0) {
      const locationsPayload = details.locations.map((loc: any) => ({
        site_visit_id: siteVisit.id,
        name: loc.name || "Unknown",
        width: loc.width,
        height: loc.height,
        depth: loc.depth,
        ground_clearance: loc.groundClearance,
        notes: loc.notes,
        photos: loc.photos || []
      }));
      const { error: locError } = await supabase.from("site_visit_measurements").insert(locationsPayload);
      if (locError) console.error("Failed to insert measurements:", locError.message);
    }
  }

  // To revalidate, we can reuse updateOrder on just the updated_at or something, but we just trigger revalidate directly.
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/staff/orders");
  revalidatePath(`/staff/orders/${orderId}`);

  return { success: true };
}



export async function updateDesignDetailsAction(orderId: string, details: any) {
  const supabase = await getSupabase();
  const { data: current, error: fetchError } = await supabase.from("orders").select("design_details").eq("id", orderId).single();
  if (fetchError) throw new Error(fetchError.message);
  
  const updatedDetails = {
    ...(current?.design_details || {}),
    ...details
  };
  
  return await updateOrder(orderId, { design_details: updatedDetails });
}

export async function updateProductionDetailsAction(orderId: string, details: any) {
  const supabase = await getSupabase();
  const { data: current, error: fetchError } = await supabase.from("orders").select("production_details").eq("id", orderId).single();
  if (fetchError) throw new Error(fetchError.message);
  
  const updatedDetails = {
    ...(current?.production_details || {}),
    ...details
  };
  
  return await updateOrder(orderId, { production_details: updatedDetails });
}

export async function updateInstallationDetailsAction(orderId: string, details: any) {
  const supabase = await getSupabase();
  const { data: current, error: fetchError } = await supabase.from("orders").select("installation_details").eq("id", orderId).single();
  if (fetchError) throw new Error(fetchError.message);
  
  const updatedDetails = {
    ...(current?.installation_details || {}),
    ...details
  };
  
  return await updateOrder(orderId, { installation_details: updatedDetails });
}

export async function requestStageAdvancementAction(orderId: string) {
  const supabase = await getSupabase();
  const { data: current, error: fetchError } = await supabase.from("orders").select("stage").eq("id", orderId).single();
  if (fetchError) throw new Error(fetchError.message);

  let nextStatus = "Normal";
  const stage = current.stage;
  
  if (stage === "Site Visit Pending" || stage === "Site Visit Scheduled" || stage === "Site Visit Completed") {
    nextStatus = "Pending Admin Approval: Quote Stage";
  } else if (stage === "Quotation In Progress" || stage === "Quotation Sent" || stage === "Quotation Negotiation") {
    nextStatus = "Pending Admin Approval: Quote Approval";
  } else if (stage === "Quotation Approved" || stage === "Design In Progress") {
    nextStatus = "Pending Admin Approval: Design Approval";
  } else if (stage === "Design Approved" || stage === "Production") {
    nextStatus = "Pending Admin Approval: Production Ready";
  } else if (stage === "Ready For Installation" || stage === "Installation Scheduled") {
    nextStatus = "Pending Admin Approval: Job Done";
  }
  
  return await updateOrder(orderId, { stage_status: nextStatus, stage_admin_notes: "" });
}

export async function adminApproveStageAction(orderId: string) {
  const supabase = await getSupabase();
  const { data: o, error: fetchError } = await supabase
    .from("orders")
    .select("stage, version_history, chat_history, customer_id, order_id")
    .eq("id", orderId)
    .single();
  if (fetchError) throw new Error(fetchError.message);

  const nextStageMap: Record<string, string> = {
    "Site Visit Pending":    "Site Visit Scheduled",
    "Site Visit Scheduled":  "Site Visit Completed",
    "Site Visit Completed":  "Quotation In Progress",
    "Quotation In Progress": "Quotation Sent",
    "Quotation Sent":        "Quotation Negotiation",
    "Quotation Negotiation": "Quotation Approved",
    "Quotation Approved":    "Design In Progress",
    "Design In Progress":    "Design Approved",
    "Design Approved":       "Production",
    "Production":            "Ready For Installation",
    "Ready For Installation":"Installation Scheduled",
    "Installation Scheduled":"Completed",
    "Completed":             "Closed",
  };

  const nextStage = nextStageMap[o.stage] || o.stage;
  const logMsg = `Admin approved stage progression from "${o.stage}" to "${nextStage}".`;

  const updatedHistory = [...(o.version_history || [])];
  const lastVersion = o.version_history?.[0]?.version || "v1.0";
  const vNum = (parseFloat(lastVersion.replace("v", "")) + 0.5).toFixed(1);
  
  updatedHistory.unshift({
    version: `v${vNum}`,
    date: new Date().toLocaleDateString(),
    notes: logMsg
  });

  const updatedChat = [
    ...(o.chat_history || []),
    {
      id: Date.now().toString(),
      sender: "System",
      time: "Just now",
      message: logMsg
    }
  ];

  const result = await updateOrder(orderId, {
    stage: nextStage,
    stage_status: "Normal",
    stage_admin_notes: "",
    version_history: updatedHistory,
    chat_history: updatedChat
  });

  await supabase.from("order_messages").insert({
    order_id: o.order_id || orderId,
    tab: "timeline",
    sender_name: "System",
    sender_role: "System",
    content: logMsg
  });

  await createAuditLogAction(
    "Admin",
    "Stage Changed",
    orderId,
    o.customer_id || null,
    `Order stage advanced from "${o.stage}" to "${nextStage}".`
  );

  return result;
}

export async function adminRejectStageAction(orderId: string, notes: string) {
  const supabase = await getSupabase();
  const { data: o, error: fetchError } = await supabase
    .from("orders")
    .select("chat_history, order_id")
    .eq("id", orderId)
    .single();
  if (fetchError) throw new Error(fetchError.message);

  const logMsg = `Admin sent back stage progression request: ${notes}`;
  const updatedChat = [
    ...(o.chat_history || []),
    {
      id: Date.now().toString(),
      sender: "System",
      time: "Just now",
      message: logMsg
    }
  ];

  const result = await updateOrder(orderId, {
    stage_status: "Normal",
    stage_admin_notes: notes,
    chat_history: updatedChat
  });

  await supabase.from("order_messages").insert({
    order_id: o.order_id || orderId,
    tab: "timeline",
    sender_name: "System",
    sender_role: "System",
    content: logMsg
  });

  return result;
}

export async function updateOrderStageAction(id: string, stage: string) {
  const supabase = await getSupabase();
  const { data: o, error: fetchError } = await supabase
    .from("orders")
    .select("stage, version_history, customer_id, order_id")
    .eq("id", id)
    .single();
  if (fetchError) throw new Error(fetchError.message);

  const updatedHistory = [...(o.version_history || [])];
  const isChanged = stage !== o.stage;
  if (isChanged) {
    const lastVersion = o.version_history?.[0]?.version || "v1.0";
    const vNum = (parseFloat(lastVersion.replace("v", "")) + 0.5).toFixed(1);
    updatedHistory.unshift({
      version: `v${vNum}`,
      date: new Date().toLocaleDateString(),
      notes: `Project status shifted from ${o.stage} to ${stage}.`
    });
  }

  const result = await updateOrder(id, {
    stage,
    version_history: updatedHistory
  });

  if (isChanged) {
    await supabase.from("order_messages").insert({
      order_id: o.order_id || id,
      tab: "timeline",
      sender_name: "System",
      sender_role: "System",
      content: `Order stage manual change from "${o.stage}" to "${stage}".`
    });

    await createAuditLogAction(
      "Admin",
      "Stage Changed",
      id,
      o.customer_id || null,
      `Order stage manual change from "${o.stage}" to "${stage}".`
    );
  }

  return result;
}

export async function addChatMessageAction(orderId: string, sender: string, message: string) {
  const supabase = await getSupabase();
  const { data: o, error: fetchError } = await supabase
    .from("orders")
    .select("chat_history, order_id")
    .eq("id", orderId)
    .single();
  if (fetchError) throw new Error(fetchError.message);

  const updatedChat = [
    ...(o.chat_history || []),
    {
      id: Date.now().toString(),
      sender,
      time: "Just now",
      message
    }
  ];

  const isSystem = sender === "System";
  await supabase.from("order_messages").insert({
    order_id: o.order_id || orderId,
    tab: isSystem ? "timeline" : "internal",
    sender_name: sender,
    sender_role: isSystem ? "System" : sender === "Admin" ? "Admin" : "Employee",
    content: message
  });

  return await updateOrder(orderId, { chat_history: updatedChat });
}

export async function assignEmployeesToOrderAction(orderId: string, employees: string[]) {
  return await updateOrder(orderId, { assigned_employees: employees });
}

export async function fetchEmployeeStats() {
  const supabase = await getSupabase();
  
  const { data: staff, error: staffError } = await supabase.from("users").select("id, name, email, staff_role").eq("role", "staff");
  if (staffError) throw new Error(staffError.message);

  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select("id, project_name, assigned_employees, assigned_designers, assigned_marketers, stage")
    .neq("stage", "Completed")
    .neq("stage", "Closed");
  if (ordersError) throw new Error(ordersError.message);

  const stats = (staff || []).map(emp => {
    const myOrders = (orders || []).filter(o => 
      o.assigned_employees?.includes(emp.id) ||
      o.assigned_designers?.includes(emp.id) ||
      o.assigned_marketers?.includes(emp.id)
    );
    return {
      id: emp.id,
      name: emp.name,
      staff_role: emp.staff_role,
      activeJobs: myOrders.length,
      jobTitles: myOrders.map(o => o.project_name)
    };
  });
  
  return stats;
}

export async function assignTeamToOrder(orderId: string, assignments: { siteVisitor: string, designer: string, marketer: string }) {
  const supabase = await getSupabase();

  // Resolve UUID in case a friendly order_id was passed
  const orderUuid = await resolveOrderUuid(supabase, orderId);

  const updates: any = {};
  if (assignments.siteVisitor) updates.assigned_employees = [assignments.siteVisitor];
  if (assignments.designer) updates.assigned_designers = [assignments.designer];
  if (assignments.marketer) updates.assigned_marketers = [assignments.marketer];

  const { data: o } = await supabase.from("orders").select("order_id").eq("id", orderUuid).single();

  const msg = `Assigned team. Site Visitor: ${assignments.siteVisitor || 'None'}, Designer: ${assignments.designer || 'None'}, Marketer: ${assignments.marketer || 'None'}`;

  await supabase.from("order_messages").insert({
    order_id: o?.order_id || orderId,
    tab: "timeline",
    sender_name: "System",
    sender_role: "System",
    content: msg
  });

  await createAuditLogAction(
    "Admin",
    "Team Assigned",
    orderUuid,
    null,
    msg
  );

  return await updateOrder(orderUuid, updates);
}

export async function updateOrderHealthAction(orderId: string, health: string, lostReason?: string) {
  const supabase = await getSupabase();
  const { data: o, error: fetchError } = await supabase
    .from("orders")
    .select("health, lost_reason, customer_id, chat_history, order_id")
    .eq("id", orderId)
    .single();
  if (fetchError) throw new Error(fetchError.message);

  const updatedChat = [
    ...(o.chat_history || []),
    {
      id: Date.now().toString(),
      sender: "System",
      time: "Just now",
      message: `Order health status updated to "${health}"${lostReason ? ` with reason: "${lostReason}"` : ""}.`
    }
  ];

  const result = await updateOrder(orderId, {
    health,
    lost_reason: lostReason || null,
    chat_history: updatedChat
  });

  await supabase.from("order_messages").insert({
    order_id: o.order_id || orderId,
    tab: "timeline",
    sender_name: "System",
    sender_role: "System",
    content: `Order health status updated to "${health}"${lostReason ? ` with reason: "${lostReason}"` : ""}.`
  });

  await createAuditLogAction(
    "Admin",
    "Health Changed",
    orderId,
    o.customer_id || null,
    `Order health updated to "${health}"${lostReason ? ` (Reason: ${lostReason})` : ""}.`
  );

  return result;
}

export async function reopenOrderAction(orderId: string) {
  const supabase = await getSupabase();
  const { data: o, error: fetchError } = await supabase
    .from("orders")
    .select("health, customer_id, chat_history, order_id")
    .eq("id", orderId)
    .single();
  if (fetchError) throw new Error(fetchError.message);

  const updatedChat = [
    ...(o.chat_history || []),
    {
      id: Date.now().toString(),
      sender: "System",
      time: "Just now",
      message: `Order reopened. Health status set to "Active".`
    }
  ];

  const result = await updateOrder(orderId, {
    health: "Active",
    lost_reason: null,
    chat_history: updatedChat
  });

  await supabase.from("order_messages").insert({
    order_id: o.order_id || orderId,
    tab: "timeline",
    sender_name: "System",
    sender_role: "System",
    content: `Order reopened. Health status set to "Active".`
  });

  await createAuditLogAction(
    "Admin",
    "Order Reopened",
    orderId,
    o.customer_id || null,
    `Order reopened and set to "Active".`
  );

  return result;
}

export async function scheduleSiteVisitAction(orderId: string, scheduleData: any) {
  const supabase = await getSupabase();
  
  // 1. Get current order (including chat history and site visit details)
  const { data: order, error: fetchError } = await supabase
    .from("orders")
    .select("site_visit_details, chat_history, order_id, customer_id, customer_name")
    .eq("id", orderId)
    .single();
    
  if (fetchError || !order) {
    throw new Error(fetchError?.message || "Order not found");
  }

  // 2. Build the updated site_visit_details
  const updatedSiteVisit = {
    ...(order.site_visit_details || {}),
    ...scheduleData,
    completed: false, // Scheduling state
    reviewStatus: "Pending" // Reset/set review status to pending
  };

  // 3. Construct system notification message in chat history
  const date = scheduleData.auditDate || scheduleData.preferredDate;
  const time = scheduleData.auditTime || scheduleData.preferredTime;
  const systemMsg = {
    id: `sys-${Date.now()}`,
    sender: "System",
    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    message: `📅 Site visit scheduled for ${date} at ${time} by client.`
  };
  
  const updatedChat = [...(order.chat_history || []), systemMsg];

  // 4. Update order stage, site_visit_details, and chat_history
  const { data: updatedOrder, error: updateError } = await supabase
    .from("orders")
    .update({
      stage: "Site Visit Pending", // Keep it pending until staff approves
      site_visit_details: updatedSiteVisit,
      chat_history: updatedChat
    })
    .eq("id", orderId)
    .select()
    .single();

  if (updateError) {
    throw new Error(updateError.message);
  }

  await supabase.from("order_messages").insert({
    order_id: order.order_id || orderId,
    tab: "timeline",
    sender_name: "System",
    sender_role: "System",
    content: `📅 Site visit scheduled for ${date} at ${time} by client.`
  });

  // 5. Log audit
  const address = scheduleData.customerAddress;
  await createAuditLogAction(
    "Client",
    "Site Visit Scheduled",
    orderId,
    order.customer_id,
    `Site visit scheduled for ${date} at ${time} (Address: ${address}).`
  );

  // 6. Revalidate cache
  revalidatePath("/admin/orders");
  revalidatePath("/staff/orders");
  revalidatePath(`/admin/orders/${order.order_id || orderId}`);
  revalidatePath(`/staff/orders/${order.order_id || orderId}`);
  
  return {
    success: true,
    order: updatedOrder
  };
}

export async function approveSiteVisitAction(orderId: string) {
  const supabase = await getSupabase();
  
  const { data: order, error: fetchError } = await supabase
    .from("orders")
    .select("site_visit_details, chat_history, order_id, customer_id")
    .eq("id", orderId)
    .single();
    
  if (fetchError || !order) {
    throw new Error(fetchError?.message || "Order not found");
  }

  const updatedSiteVisit = {
    ...(order.site_visit_details || {}),
    reviewStatus: "Approved"
  };

  const logMsg = `Site visit time approved by assigned staff.`;
  const systemMsg = {
    id: `sys-${Date.now()}`,
    sender: "System",
    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    message: logMsg
  };
  
  const updatedChat = [...(order.chat_history || []), systemMsg];

  const { data: updatedOrder, error: updateError } = await supabase
    .from("orders")
    .update({
      stage: "Site Visit Scheduled",
      site_visit_details: updatedSiteVisit,
      chat_history: updatedChat
    })
    .eq("id", orderId)
    .select()
    .single();

  if (updateError) throw new Error(updateError.message);

  await supabase.from("order_messages").insert({
    order_id: order.order_id || orderId,
    tab: "timeline",
    sender_name: "System",
    sender_role: "System",
    content: logMsg
  });

  await createAuditLogAction(
    "Staff",
    "Site Visit Approved",
    orderId,
    order.customer_id,
    logMsg
  );

  revalidatePath("/admin/orders");
  revalidatePath("/staff/orders");
  revalidatePath(`/staff/site-visit`);
  revalidatePath(`/admin/orders/${order.order_id || orderId}`);
  revalidatePath(`/staff/orders/${order.order_id || orderId}`);
  
  return { success: true, order: updatedOrder };
}

