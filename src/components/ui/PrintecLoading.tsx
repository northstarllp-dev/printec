import React from "react";
import { Loader2 } from "lucide-react";

interface PrintecLoadingProps {
  fullScreen?: boolean;
}

export function PrintecLoading({ fullScreen = false }: PrintecLoadingProps) {
  const containerClasses = fullScreen 
    ? "fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm"
    : "flex flex-col items-center justify-center p-8 w-full h-full min-h-[300px]";

  return (
    <div className={containerClasses}>
      <div className="flex flex-col items-center gap-4 animate-in fade-in duration-300">
        <div className="relative flex items-center justify-center">
          <div className="absolute w-16 h-16 border-4 border-slate-100 rounded-full"></div>
          <div className="absolute w-16 h-16 border-4 border-[#818CF8] rounded-full border-t-transparent animate-spin"></div>
          <Loader2 className="w-8 h-8 text-[#818CF8] animate-pulse" />
        </div>
        <div className="flex flex-col items-center">
          <span className="text-xl font-bold tracking-widest text-slate-800 uppercase">
            Printec
          </span>
          <span className="text-xs font-medium text-slate-500 tracking-wider">
            Loading...
          </span>
        </div>
      </div>
    </div>
  );
}
