"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { OrderWorksheetModal } from "@/features/order-detail/components/OrderWorksheetModal";
import { Order, Customer, Employee } from "@/types";

interface OrderDetailPageClientProps {
  order: Order;
  customers: Customer[];
  employees: Employee[];
  allOrders: any[];
  role: "Admin" | "Employee";
  currentEmployee: Employee | null;
}

export function OrderDetailPageClient({
  order,
  customers,
  employees,
  allOrders,
  role,
  currentEmployee,
}: OrderDetailPageClientProps) {
  const router = useRouter();

  return (
    <div className="flex-1 w-full flex flex-col h-full min-h-0">
      <OrderWorksheetModal
        isOpen={true}
        onClose={() => {
          router.push(role === "Admin" ? "/admin/orders" : "/staff/orders");
        }}
        order={order}
        customers={customers}
        employees={employees}
        allOrders={allOrders}
        currentUserRole={role}
        currentEmployee={currentEmployee}
      />
    </div>
  );
}
