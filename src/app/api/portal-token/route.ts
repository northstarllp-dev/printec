import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const customerId = searchParams.get("customer_id");
  const orderId = searchParams.get("order_id");

  if (!customerId) {
    return NextResponse.json(
      { error: "customer_id is required" },
      { status: 400 }
    );
  }

  const salt = process.env.PORTAL_SALT || "printec_portal_salt_secure_2026";
  const signature = createHash("sha256")
    .update(`${customerId}-${salt}`)
    .digest("hex")
    .substring(0, 16);

  // Get base URL / origin dynamically from request
  const origin = request.nextUrl.origin;
  const tokenPayload = Buffer.from(`${customerId}:${orderId || ""}:${signature}`).toString("base64url");
  let url = `${origin}/portal?token=${tokenPayload}`;

  return NextResponse.json({ token: tokenPayload, url });
}

