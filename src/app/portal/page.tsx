import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import {
  verifyPortalToken,
  isTokenRevoked,
} from "@/utils/portal-tokens";
import { checkRateLimit } from "@/utils/rate-limiter";
import { PortalClient } from "./PortalClient";
import React from "react";

export const dynamic = "force-dynamic";

export default async function PortalPage({
  searchParams,
}: {
  searchParams: Promise<{ customer_id?: string; token?: string; order_id?: string }>;
}) {
  const params = await searchParams;
  const tokenParam = params.token;

  if (!tokenParam) {
    return (
      <PortalError
        title="Invalid Magic Link"
        message="The magic link you clicked is incomplete or has expired. Please ask Printec Admin to send it again."
      />
    );
  }

  // ── Rate limiting ──
  const clientIp = "anonymous"; // In production, use request IP from headers
  const rate = checkRateLimit(`portal-page-${clientIp}`);
  if (!rate.allowed) {
    return (
      <PortalError
        title="Too Many Requests"
        message="Please wait a few minutes and try again."
      />
    );
  }

  // ── Verify HMAC + expiry ──
  const payload = verifyPortalToken(tokenParam);
  if (!payload) {
    return (
      <PortalError
        title="Invalid or Expired Link"
        message="This secure portal link is invalid or has expired. Please request a new link from Printec."
      />
    );
  }

  // ── DB Revocation check ──
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  let isRevoked: boolean;
  try {
    isRevoked = await isTokenRevoked(supabase, payload.jti);
  } catch {
    isRevoked = true; // treat DB errors as revoked for safety
  }

  if (isRevoked) {
    return (
      <PortalError
        title="Access Revoked"
        message="This portal link has been revoked. Please contact Printec support for a new link."
      />
    );
  }

  // ── Fetch data from Supabase ──
  const { data: customerData, error: customerError } = await supabase
    .from("customers")
    .select("*")
    .eq("customer_id", payload.customerId)
    .single();

  if (customerError || !customerData) {
    return (
      <PortalError
        title="Customer Not Found"
        message={`Could not locate a customer profile for ID ${payload.customerId}.`}
      />
    );
  }

  // Fetch all orders for this customer
  const { data: ordersData, error: ordersError } = await supabase
    .from("orders")
    .select("*")
    .eq("customer_id", customerData.id)
    .order("date_created", { ascending: false });

  if (ordersError) {
    return (
      <PortalError
        title="Database Error"
        message="Unable to load order details. Please try again later."
      />
    );
  }

  // If orderId is provided, perform an explicit IDOR verification check:
  // ensure the requested order_id belongs to the validated customer_id.
  if (payload.orderId) {
    const hasOrder = ordersData.some((o) => o.order_id === payload.orderId);
    if (!hasOrder) {
      return (
        <PortalError
          title="Access Denied"
          message="You do not have permission to view the requested order details."
        />
      );
    }
  }

  // ── Map to camelCase for frontend ──
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
    customerId: customerData.customer_id || customerData.id,
  };

  const orders = ordersData.map((o: any) => ({
    id: o.id,
    projectName: o.project_name,
    customerId: o.customer_id,
    customerName: o.customer_name,
    stage: o.stage,
    budget: Number(o.budget || 0),
    depositPaid: Number(o.deposit_paid || 0),
    dimensions: o.dimensions,
    notes: o.notes,
    urgent: Boolean(o.urgent),
    assignedEmployees: o.assigned_employees || [],
    assignedDesigners: o.assigned_designers || [],
    assignedMarketers: o.assigned_marketers || [],
    dateCreated: o.date_created,
    deadlineStatus: o.deadline_status,
    imageMockup: o.image_mockup,
    versionHistory: o.version_history || [],
    chatHistory: o.chat_history || [],
    siteVisitDetails: o.site_visit_details,
    quoteDetails: o.quote_details,
    designDetails: o.design_details,
    productionDetails: o.production_details,
    installationDetails: o.installation_details,
    stageStatus: o.stage_status,
    stageAdminNotes: o.stage_admin_notes,
    orderCode: o.order_id || o.id,
    orderId: o.order_id || o.id,
  }));

  return (
    <PortalClient
      customer={customer}
      orders={orders}
      initialActiveOrderId={payload.orderId || null}
      token={tokenParam}
    />
  );
}

function PortalError({ title, message }: { title: string; message: string }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8f9ff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        fontFamily: "var(--font-sans), sans-serif",
      }}
    >
      <div
        style={{
          background: "white",
          border: "1px solid #c3c6d0",
          borderRadius: 16,
          padding: "40px 32px",
          maxWidth: 480,
          width: "100%",
          textAlign: "center",
          boxShadow: "0 8px 24px rgba(0, 0, 0, 0.08)",
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            background: "#FFF1F2",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
            color: "#EF4444",
          }}
        >
          <svg
            width="24"
            height="24"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h1 style={{ fontSize: 20, fontWeight: 900, color: "#0b1c30", margin: "0 0 12px" }}>
          {title}
        </h1>
        <p style={{ fontSize: 13, color: "#43474f", lineHeight: 1.6, margin: 0 }}>
          {message}
        </p>
        <div style={{ marginTop: 32 }}>
          <p style={{ fontSize: 12, color: "#737780", margin: 0, fontWeight: 700 }}>
            PRINTEC Signage Solutions
          </p>
        </div>
      </div>
    </div>
  );
}
