import { createHash } from "crypto";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { OrderDetailClient } from "./OrderDetailClient";
import React from "react";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ customer_id?: string; token?: string }>;
}) {
  const { orderId } = await params;
  const { customer_id, token } = await searchParams;

  if (!customer_id || !token) {
    return (
      <PortalError
        title="Invalid Access"
        message="This order detail link is missing authentication. Please access the portal from your original welcome link."
      />
    );
  }

  // Verify token
  const salt = process.env.PORTAL_SALT || "printec_portal_salt_secure_2026";
  const expectedToken = createHash("sha256")
    .update(`${customer_id}-${salt}`)
    .digest("hex");

  if (token !== expectedToken) {
    return (
      <PortalError
        title="Access Denied"
        message="This secure portal link is invalid. Please request a new link from Printec."
      />
    );
  }

  // Fetch data from Supabase
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // Fetch customer first
  const { data: customerData, error: customerError } = await supabase
    .from("customers")
    .select("*")
    .eq("customer_id", customer_id)
    .single();

  if (customerError || !customerData) {
    return (
      <PortalError
        title="Customer Not Found"
        message={`Could not locate customer profile for ID ${customer_id}.`}
      />
    );
  }

  // Fetch this specific order, ensuring it belongs to the customer
  const { data: orderData, error: orderError } = await supabase
    .from("orders")
    .select("*")
    .eq("order_id", orderId)
    .single();

  if (orderError || !orderData) {
    return (
      <PortalError
        title="Order Not Found"
        message={`Could not locate order with ID ${orderId}.`}
      />
    );
  }

  if (orderData.customer_id !== customerData.id) {
    return (
      <PortalError
        title="Access Denied"
        message="You do not have permission to view this order."
      />
    );
  }

  // Map to camelCase
  const customer = {
    id: customerData.id,
    name: customerData.name,
    phone: customerData.phone,
    whatsapp: customerData.whatsapp,
    email: customerData.email,
    city: customerData.city,
    billingAddress: customerData.billing_address,
    shippingAddress: customerData.shipping_address,
    status: customerData.status,
    customerCode: customerData.customer_id || customerData.id,
    customerId: customerData.customer_id || customerData.id
  };

  const order = {
    id: orderData.id,
    projectName: orderData.project_name,
    customerId: orderData.customer_id,
    customerName: orderData.customer_name,
    stage: orderData.stage,
    budget: Number(orderData.budget || 0),
    depositPaid: Number(orderData.deposit_paid || 0),
    dimensions: orderData.dimensions,
    notes: orderData.notes,
    urgent: Boolean(orderData.urgent),
    assignedEmployees: orderData.assigned_employees || [],
    assignedDesigners: orderData.assigned_designers || [],
    assignedMarketers: orderData.assigned_marketers || [],
    dateCreated: orderData.date_created,
    deadlineStatus: orderData.deadline_status,
    imageMockup: orderData.image_mockup,
    versionHistory: orderData.version_history || [],
    chatHistory: orderData.chat_history || [],
    siteVisitDetails: orderData.site_visit_details,
    quoteDetails: orderData.quote_details,
    designDetails: orderData.design_details,
    productionDetails: orderData.production_details,
    installationDetails: orderData.installation_details,
    stageStatus: orderData.stage_status,
    stageAdminNotes: orderData.stage_admin_notes,
    orderCode: orderData.order_id || orderData.id,
    orderId: orderData.order_id || orderData.id
  };

  return (
    <OrderDetailClient
      customer={customer}
      order={order}
      token={token}
    />
  );
}

function PortalError({ title, message }: { title: string; message: string }) {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#f8f9ff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
      fontFamily: "var(--font-sans), sans-serif"
    }}>
      <div style={{
        background: "white",
        border: "1px solid #c3c6d0",
        borderRadius: 16,
        padding: "40px 32px",
        maxWidth: 480,
        width: "100%",
        textAlign: "center",
        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.08)"
      }}>
        <div style={{
          width: 56,
          height: 56,
          background: "#FFF1F2",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 24px",
          color: "#EF4444"
        }}>
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 style={{ fontSize: 20, fontWeight: 900, color: "#0b1c30", margin: "0 0 12px" }}>{title}</h1>
        <p style={{ fontSize: 13, color: "#43474f", lineHeight: 1.6, margin: 0 }}>{message}</p>
        <div style={{ marginTop: 32 }}>
          <p style={{ fontSize: 12, color: "#737780", margin: 0, fontWeight: 700 }}>PRINTEC Signage Solutions</p>
        </div>
      </div>
    </div>
  );
}
