"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { OrderWorksheetModal } from "@/app/components/OrderWorksheetModal";
import { useDashboard } from "@/context/DashboardContext";

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { orders, selectedOrderForWorksheet, setSelectedOrderForWorksheet } = useDashboard();

  const order = orders.find(o => o.id === id);

  useEffect(() => {
    if (order) {
      setSelectedOrderForWorksheet(order);
    }
    return () => {
      setSelectedOrderForWorksheet(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.id]);



  if (!order) {
    return (
      <div className="flex-1 w-full flex flex-col h-full items-center justify-center p-8 min-h-[50vh]">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <span className="text-sm text-slate-500">Loading order {id}...</span>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full flex flex-col h-full">
      <OrderWorksheetModal 
        isOpen={true} 
        onClose={() => {
          setSelectedOrderForWorksheet(null);
          router.push("/staff/orders");
        }} 
        order={order} 
      />
    </div>
  );
}
