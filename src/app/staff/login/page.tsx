import React from "react";
import { StaffLoginForm } from "./StaffLoginForm";
import { getEmployees } from "@/app/actions/employeeActions";

export default async function StaffLoginPage() {
  const employeesData = await getEmployees();
  
  const mappedEmployees = employeesData?.map(e => ({
    id: e.id,
    name: e.name,
    email: e.email || ""
  })) || [];

  return <StaffLoginForm employees={mappedEmployees} />;
}
