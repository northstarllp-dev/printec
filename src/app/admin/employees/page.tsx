import React from "react";
import { EmployeesViewNew } from "@/app/components/EmployeesViewNew";
import { getEmployees } from "@/app/actions/employeeActions";

export default async function EmployeesPage() {
  const employeesData = await getEmployees();
  
  const mappedEmployees = employeesData?.map(e => ({
    id: e.id,
    name: e.name,
    role: e.staff_role || "",
    phone: e.phone || "",
    email: e.email || "",
    status: e.status || "Active",
    rating: Number(e.rating) || 5.0,
    workload: Number(e.workload) || 0
  })) || [];

  return <EmployeesViewNew initialEmployees={mappedEmployees} />;
}
