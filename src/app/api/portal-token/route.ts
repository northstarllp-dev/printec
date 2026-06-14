import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const customerId = searchParams.get("customer_id");

  if (!customerId) {
    return NextResponse.json(
      { error: "customer_id is required" },
      { status: 400 }
    );
  }

  const salt = process.env.PORTAL_SALT || "printec_portal_salt_secure_2026";
  const token = createHash("sha256")
    .update(`${customerId}-${salt}`)
    .digest("hex");

  // Get base URL / origin dynamically from request
  const origin = request.nextUrl.origin;
  const url = `${origin}/portal?customer_id=${customerId}&token=${token}`;

  return NextResponse.json({ token, url });
}
