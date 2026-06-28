import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/features/auth/actions/authActions";
import { ProductionLayoutClient } from "./ProductionLayoutClient";

export default async function ProductionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentUser();

  // Enforce server-side security checks (allow Admins or Production Staff)
  if (!profile || (profile.role !== "admin" && (profile.role !== "staff" || profile.staff_role !== "Production"))) {
    redirect("/production/login");
  }

  const mappedProfile = {
    id: profile.id,
    name: profile.name,
    email: profile.email || "",
    role: profile.role,
    staff_role: profile.staff_role || "Production"
  };

  return (
    <ProductionLayoutClient profile={mappedProfile}>
      {children}
    </ProductionLayoutClient>
  );
}
