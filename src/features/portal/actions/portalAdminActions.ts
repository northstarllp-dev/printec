"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { revokePortalToken } from "@/utils/portal-tokens";

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

/**
 * Revoke all active portal access tokens for a given customer or order.
 * This invalidates any magic links the customer has received via WhatsApp/Email.
 */
export async function revokePortalAccessAction(
  customerId?: string,
  orderId?: string
): Promise<{ revoked: number; message: string }> {
  if (!customerId && !orderId) {
    throw new Error("Either customerId or orderId is required");
  }

  const supabase = await getSupabase();

  // Build the query to find active (non-revoked, non-expired) tokens
  let query = supabase
    .from("portal_access_tokens")
    .select("jti")
    .is("revoked_at", null)
    .gt("expires_at", new Date().toISOString());

  if (customerId) {
    query = query.eq("customer_id", customerId);
  }
  if (orderId) {
    query = query.eq("order_id", orderId);
  }

  const { data: tokens, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch portal tokens: ${error.message}`);
  }

  if (!tokens || tokens.length === 0) {
    return { revoked: 0, message: "No active portal tokens found." };
  }

  // Revoke each token
  let revokedCount = 0;
  for (const { jti } of tokens) {
    try {
      await revokePortalToken(supabase, jti);
      revokedCount++;
    } catch (e: any) {
      console.error(`[revokePortalAccessAction] Failed to revoke token ${jti}:`, e.message);
    }
  }

  return {
    revoked: revokedCount,
    message: `Revoked ${revokedCount} active portal token${revokedCount !== 1 ? "s" : ""}. Customer link is now invalid.`,
  };
}
