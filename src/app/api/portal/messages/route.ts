import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";

const SALT = process.env.PORTAL_SALT || "printec_portal_salt_secure_2026";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function verifyToken(customerId: string, token: string): boolean {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    const parts = decoded.split(":");
    const sigPart = parts[2] || "";
    const expectedSig = createHash("sha256")
      .update(`${customerId}-${SALT}`)
      .digest("hex")
      .substring(0, 16);
    return sigPart === expectedSig;
  } catch {
    return false;
  }
}

async function supabaseFetch(path: string, options: RequestInit = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      "Prefer": "return=representation",
      ...(options.headers || {}),
    },
  });
  return res;
}

// GET /api/portal/messages?order_id=...&customer_id=...&token=...
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get("order_id");
  const customerId = searchParams.get("customer_id");
  const token = searchParams.get("token");

  if (!orderId || !customerId || !token) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  if (!verifyToken(customerId, token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const res = await supabaseFetch(
    `order_messages?order_id=eq.${encodeURIComponent(orderId)}&tab=eq.customer&order=created_at.asc&select=*`
  );

  if (!res.ok) {
    const err = await res.text();
    console.error("Supabase error:", err);
    return NextResponse.json({ error: "Failed to load messages", detail: err }, { status: 500 });
  }

  const data = await res.json();
  return NextResponse.json({ messages: data || [] });
}

// POST /api/portal/messages
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { order_id, customer_id, token, content, sender_name } = body;

  if (!order_id || !customer_id || !token || !content?.trim()) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  if (!verifyToken(customer_id, token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = {
    order_id,
    tab: "customer",
    sender_name: sender_name || "Customer",
    sender_role: "Customer",
    sender_id: null,
    content: content.trim(),
    attachments: [],
  };

  const res = await supabaseFetch("order_messages", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("Supabase insert error:", err);
    return NextResponse.json({ error: "Failed to send message", detail: err }, { status: 500 });
  }

  const data = await res.json();
  return NextResponse.json({ message: Array.isArray(data) ? data[0] : data });
}
