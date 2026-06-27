import React from "react";
import LoadingLines from "@/components/ui/loading-lines";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
      <LoadingLines />
    </div>
  );
}
