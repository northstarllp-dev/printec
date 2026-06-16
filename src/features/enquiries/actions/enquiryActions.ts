"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createHash } from "crypto";
import { createAuditLogAction } from "@/features/audit/actions/auditActions";

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
  const { data, error } = await supabase
    .from("enquiries")
    .select(`
      *,
      customers:customer_id(customer_id),
      orders:order_id(order_id)
    `)
    .order("date_received", { ascending: false });
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

export async function convertEnquiryToOrderAction(enquiryId: string, projectName: string, budget: number) {
  const supabase = await getSupabase();
  
  // 1. Fetch enquiry
  const { data: enq, error: fetchErr } = await supabase
    .from("enquiries")
    .select("*")
    .eq("id", enquiryId)
    .single();
    
  if (fetchErr || !enq) {
    throw new Error(fetchErr?.message || "Enquiry not found");
  }

  // 2. Check if customer already exists using phone, whatsapp, email
  const { data: existingCust, error: custErr } = await supabase
    .from("customers")
    .select("*")
    .or(`phone.eq.${enq.phone},whatsapp.eq.${enq.whatsapp},email.eq.${enq.email}`)
    .limit(1);
    
  let customerId: string;
  let friendlyCustomerId: string;
  let customerName: string;
  let customerPhone = enq.phone;
  let customerEmail = enq.email;
  let isNewCustomer = false;

  if (existingCust && existingCust.length > 0) {
    customerId = existingCust[0].id;
    customerName = existingCust[0].name;
    friendlyCustomerId = existingCust[0].customer_id;
  } else {
    // 3. Customer does not exist -> Create new customer record
    const { data: newCust, error: insertCustErr } = await supabase
      .from("customers")
      .insert([{
        company_id: "11111111-1111-1111-1111-111111111111",
        name: enq.lead_name,
        phone: enq.phone,
        whatsapp: enq.whatsapp,
        email: enq.email,
        billing_address: "Address Details Pending Intake",
        shipping_address: enq.location || "Installation Address Pending Survey"
      }])
      .select();
      
    if (insertCustErr || !newCust || newCust.length === 0) {
      throw new Error(insertCustErr?.message || "Failed to create new customer");
    }
    
    customerId = newCust[0].id;
    customerName = newCust[0].name;
    friendlyCustomerId = newCust[0].customer_id;
    isNewCustomer = true;
    
    // Log customer creation audit
    await createAuditLogAction(
      "Admin",
      "Customer Created",
      null,
      customerId,
      `Customer profile "${customerName}" (${customerId}) created via Enquiry conversion.`
    );
  }

  // 4. Create new order
  const { data: newOrder, error: insertOrderErr } = await supabase
    .from("orders")
    .insert([{
      company_id: "11111111-1111-1111-1111-111111111111",
      project_name: projectName,
      customer_id: customerId,
      customer_name: customerName,
      stage: "Site Visit Pending",
      health: "Active",
      budget: budget,
      deposit_paid: 0,
      version_history: [
        { version: "v1.0", date: new Date().toLocaleDateString(), notes: "Order initialized via Enquiry conversion." }
      ],
      chat_history: [
        { id: "1", sender: "System", time: "Just now", message: "Order created successfully from Enquiry." }
      ]
    }])
    .select();

  if (insertOrderErr || !newOrder || newOrder.length === 0) {
    throw new Error(insertOrderErr?.message || "Failed to create order");
  }

  const orderId = newOrder[0].id;
  const friendlyOrderId = newOrder[0].order_id;

  // 5. Update enquiry record
  const { error: updateEnqErr } = await supabase
    .from("enquiries")
    .update({
      status: "Converted",
      customer_id: customerId,
      order_id: orderId
    })
    .eq("id", enquiryId);

  if (updateEnqErr) {
    console.error("Failed to update enquiry status:", updateEnqErr.message);
  }

  // 6. Generate secure magic customer portal access token using friendly ID
  const salt = process.env.PORTAL_SALT || "printec_portal_salt_secure_2026";
  const signature = createHash("sha256")
    .update(`${friendlyCustomerId}-${salt}`)
    .digest("hex")
    .substring(0, 16);
    
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const tokenPayload = Buffer.from(`${friendlyCustomerId}:${friendlyOrderId}:${signature}`).toString("base64url");
  const portalLink = `${baseUrl}/portal?token=${tokenPayload}`;

  // 7. Trigger customer notification workflow (Simulated send)
  const notificationMsg = `WhatsApp & Email notification sent to client. Order ID: ${friendlyOrderId}. Portal Link: ${portalLink}`;
  console.log(`[Notification System] ${notificationMsg}`);

  // Append system message to chat log with portal info
  const systemChatMsg = {
    id: Date.now().toString(),
    sender: "System",
    time: "Just now",
    message: `Secure portal link generated for client. Order ID: ${friendlyOrderId}. Portal Link: ${portalLink}`,
    verified: true
  };

  const updatedChat = [...(newOrder[0].chat_history || []), systemChatMsg];
  await supabase
    .from("orders")
    .update({ chat_history: updatedChat })
    .eq("id", orderId);

  // 8. Log order creation audit
  await createAuditLogAction(
    "Admin",
    "Order Created",
    orderId,
    customerId,
    `Order "${projectName}" (${friendlyOrderId}) created and linked to Enquiry "${enq.enquire_id || enquiryId}" for Customer "${customerName}".`
  );

  // 9. Revalidate cache
  revalidatePath("/admin/enquire");
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${friendlyOrderId}`);
  revalidatePath("/staff/orders");
  revalidatePath(`/staff/orders/${friendlyOrderId}`);
  
  return {
    success: true,
    customerId: friendlyCustomerId,
    orderId: friendlyOrderId,
    portalLink
  };
}
