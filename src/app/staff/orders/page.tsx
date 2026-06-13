"use client";

import { useState } from "react";
import { OrdersManagementDashboard } from "@/app/components/OrdersManagementDashboard";
import { OrderModal } from "@/app/components/Modals";

export default function OrdersPage() {
  const [isAddOrderOpen, setIsAddOrderOpen] = useState(false);

  return (
    <>
      <OrdersManagementDashboard onOpenAddOrder={() => setIsAddOrderOpen(true)} />
      {isAddOrderOpen && (
        <OrderModal
          isOpen={isAddOrderOpen}
          onClose={() => setIsAddOrderOpen(false)}
        />
      )}
    </>
  );
}
