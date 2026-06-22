"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { OrderWorksheetModal } from "@/features/order-detail/components/OrderWorksheetModal";
import { Order, Customer, Employee } from "@/types";

interface Product {
  id: string;
  product_id: string;
  name: string;
  category: string | null;
  pricing_type: "per_unit" | "per_sqft";
  unit_price: number;
  unit: string;
  is_active: boolean;
}

interface OrderDetailPageClientProps {
  order: Order;
  customers: Customer[];
  employees: Employee[];
  allOrders: any[];
  role: "Admin" | "Employee";
  currentEmployee: Employee | null;
  products?: Product[];
  initialQuotation?: any;
}

export function OrderDetailPageClient({
  order,
  customers,
  employees,
  allOrders,
  role,
  currentEmployee,
  products = [],
  initialQuotation = null,
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
        products={products}
        initialQuotation={initialQuotation}
      />
    </div>
  );
}
