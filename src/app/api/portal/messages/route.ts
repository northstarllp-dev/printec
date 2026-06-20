import { NextRequest, NextResponse } from "next/server";
import { verifyPortalToken } from "@/utils/portal-tokens";
import { checkRateLimit } from "@/utils/rate-limiter";
import { cookies } from "next/headers";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function supabaseFetch(path: string, options: RequestInit = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      Prefer: "return=representation",
      ...(options.headers || {}),
    },
  });
  return res;
}

// Extract token from query or session cookie
function getTokenFromRequest(req: NextRequest): string | null {
  // 1. Check query param
  const { searchParams } = new URL(req.url);
  const tokenFromQuery = searchParams.get("token");
  if (tokenFromQuery) return tokenFromQuery;

  // 2. Check session cookie
  const sessionCookie = req.cookies.get("portal_session")?.value;
  if (sessionCookie) {
    try {
      const session = JSON.parse(sessionCookie);
      if (session.jti && session.exp && session.exp > Math.floor(Date.now() / 1000)) {
        return session.jti; // Return jti for revocation check; actual verification below
      }
    } catch { /* ignore parsing errors */ }
  }

  return null;
}

// Verify either query token or session
async function verifyTokenFromRequest(req: NextRequest): Promise<{ payload: any; source: "query" | "cookie" } | null> {
  // 1. Try query token first
  const { searchParams } = new URL(req.url);
  const tokenFromQuery = searchParams.get("token");
  if (tokenFromQuery) {
    const payload = verifyPortalToken(tokenFromQuery);
    if (payload) return { payload, source: "query" };
  }

  // 2. Try session cookie
  const sessionCookie = req.cookies.get("portal_session")?.value;
  if (sessionCookie) {
    try {
      const session = JSON.parse(sessionCookie);
      if (session.jti && session.exp && session.exp > Math.floor(Date.now() / 1000)) {
        // Session cookie contains pre-verified payload data
        return { payload: session, source: "cookie" };
      }
    } catch { /* ignore */ }
  }

  return null;
}

// GET /api/portal/messages?order_id=...&token=...
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get("order_id");

  if (!orderId) {
    return NextResponse.json({ error: "Missing order_id" }, { status: 400 });
  }

  // Try query token first, then session cookie
  const { searchParams: urlSearchParams } = new URL(req.url);
  const tokenFromQuery = urlSearchParams.get("token");
  let payload: any = null;

  if (tokenFromQuery) {
    payload = verifyPortalToken(tokenFromQuery);
    if (payload) {
      // Rate limit on the token itself
      const rate = checkRateLimit(`msg-get-${tokenFromQuery.slice(0, 16)}`);
      if (!rate.allowed) {
        return NextResponse.json({ error: "Too many requests" }, { status: 429 });
      }
    }
  }

  // Fallback: check session cookie
  if (!payload) {
    const sessionCookie = req.cookies.get("portal_session")?.value;
    if (sessionCookie) {
      try {
        const session = JSON.parse(sessionCookie);
        if (session.jti && session.exp && session.exp > Math.floor(Date.now() / 1000)) {
          payload = session;
        }
      } catch { /* ignore */ }
    }
  }

  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Optional: verify the order_id matches the token payload
  if (payload.orderId && payload.orderId !== "") {
    if (orderId !== payload.orderId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const res = await supabaseFetch(
    `order_messages?order_id=eq.${encodeURIComponent(orderId)}&tab=eq.customer&order=created_at.asc&select=*`
  );

  if (!res.ok) {
    const err = await res.text();
    console.error("Supabase error:", err);
    return NextResponse.json(
      { error: "Failed to load messages", detail: err },
      { status: 500 }
    );
  }

  const data = await res.json();
  return NextResponse.json({ messages: data || [] });
}

// POST /api/portal/messages
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { order_id, content, sender_name } = body;

  // Try query token from body, then check session cookie
  let token = body.token;
  let payload加密: any = null;

  if (token) {
    payload加密 = verifyPortalToken(token);
    if (payload加密) {
      const rate = checkRateLimit(`msg-post-${token.slice(0, 16)}`);
      if (!rate.allowed) {
        return NextResponse.json({ error: "Too many requests" }, { status: 429 });
      }
    }
  }

  // Fallback: check session cookie
  if (!payload加密) {
    const sessionCookie = req.cookies.get("portal_session")?.value;
    if (sessionCookie) {
      try {
        const session = JSON.parse(sessionCookie);
        if (session.jti && session.exp && session.exp > Math.floor(Date.now() / 1000)) {
          payload加密 = session;
        }
      } catch { /* ignore */ }
    }
  }

  if (!payload加密) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!order_id || !content?.trim()) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  // Optional: order_id must match the token payload
  if (payload加密.orderId && payload加密.orderId !== "") {
    if (order_id !== payload加密.orderId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const payloadData = {
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
    body: JSON.stringify(payloadData),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("Supabase insert error:", err);
    return NextResponse.json(
      { error: "Failed to send message", detail: err },
      { status: 500 }
    );
  }

  const data = await res.json();
  return NextResponse.json({
    message: Array.isArray(data) ? data[0] : data,
  });
}
