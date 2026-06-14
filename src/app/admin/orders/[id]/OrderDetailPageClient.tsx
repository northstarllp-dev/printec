"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { OrderWorksheetModal } from "@/app/components/OrderWorksheetModal";
import { Order, Customer, Employee } from "@/types";

interface OrderDetailPageClientProps {
  order: Order;
  customers: Customer[];
  employees: Employee[];
  role: "Admin" | "Employee";
  currentEmployee: Employee | null;
}

export function OrderDetailPageClient({ order, customers, employees, role, currentEmployee }: OrderDetailPageClientProps) {
  const router = useRouter();

  return (
    <div className="flex-1 w-full flex flex-col h-full">
      <OrderWorksheetModal 
        isOpen={true} 
        onClose={() => {
          router.push(role === "Admin" ? "/admin/orders" : "/staff/orders");
        }} 
        order={order}
        customers={customers}
        employees={employees}
        currentUserRole={role}
        currentEmployee={currentEmployee}
      />
    </div>
  );
}
