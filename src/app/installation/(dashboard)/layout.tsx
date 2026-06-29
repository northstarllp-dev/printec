import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/features/auth/actions/authActions";
import { InstallationLayoutClient } from "./InstallationLayoutClient";

export default async function InstallationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentUser();

  // Enforce server-side security checks (allow Admins or Installation Staff)
  if (!profile || (profile.role !== "admin" && (profile.role !== "staff" || profile.staff_role !== "Installation"))) {
    redirect("/installation/login");
  }

  const mappedProfile = {
    id: profile.id,
    name: profile.name,
    email: profile.email || "",
    role: profile.role,
    staff_role: profile.staff_role || "Installation"
  };

  return (
    <InstallationLayoutClient profile={mappedProfile}>
      {children}
    </InstallationLayoutClient>
  );
}
