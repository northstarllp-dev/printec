import React from "react";
import { redirect } from "next/navigation";
import { EmployeeProfileView } from "@/app/components/EmployeeProfileView";
import { getCurrentUser } from "@/app/actions/authActions";

export default async function StaffProfilePage() {
  const profile = await getCurrentUser();

  if (!profile || profile.role !== "staff") {
    redirect("/staff/login");
  }

  const mappedEmployee = {
    id: profile.id,
    name: profile.name,
    role: profile.staff_role || "Field Agent",
    phone: profile.phone || "",
    email: profile.email || "",
    status: profile.status || "Active",
    rating: Number(profile.rating) || 5.0,
    workload: Number(profile.workload) || 0
  };

  return <EmployeeProfileView currentEmployee={mappedEmployee} />;
}
