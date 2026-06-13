"use client";

import { useState } from "react";
import { OrdersManagementDashboard } from "@/app/components/OrdersManagementDashboard";
import { OrderModal } from "@/app/components/Modals";
import { OrderWorksheetModal } from "@/app/components/OrderWorksheetModal";
import { useDashboard } from "@/context/DashboardContext";

export default function OrdersPage() {
  const [isAddOrderOpen, setIsAddOrderOpen] = useState(false);
  const { selectedOrderForWorksheet } = useDashboard();

  if (selectedOrderForWorksheet) {
    return (
      <div className="flex-1 w-full flex flex-col h-full">
        <OrderWorksheetModal 
          isOpen={true} 
          onClose={() => {}} 
          order={selectedOrderForWorksheet} 
        />
      </div>
    );
  }

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
