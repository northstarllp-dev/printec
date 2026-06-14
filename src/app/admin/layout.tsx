import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/app/actions/authActions";
import { AdminLayoutClient } from "./AdminLayoutClient";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentUser();

  // Enforce server-side security checks
  if (!profile || profile.role !== "admin") {
    redirect("/admin/login");
  }

  const mappedProfile = {
    id: profile.id,
    name: profile.name,
    email: profile.email || "",
    role: profile.role
  };

  return (
    <AdminLayoutClient profile={mappedProfile}>
      {children}
    </AdminLayoutClient>
  );
}
