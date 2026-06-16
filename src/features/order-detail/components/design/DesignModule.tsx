"use client";

import React, { useState } from "react";
import { FileText, ZoomIn, ZoomOut } from "lucide-react";
import { Order, DesignDetails } from "@/types";

interface DesignModuleProps {
  order: Order;
  isEmployee: boolean;
  updateDesignDetails: (orderId: string, details: Partial<DesignDetails>) => Promise<void>;
}

export const DesignModule: React.FC<DesignModuleProps> = ({
  order,
  isEmployee,
  updateDesignDetails,
}) => {
  const dd = order.designDetails || {
    proofUrl: "",
    status: "Draft",
  };

  const [zoomLevel, setZoomLevel] = useState(85);

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 15, 200));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 15, 50));
  const handleResetZoom = () => setZoomLevel(85);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
          Blueprint & Proof Mockup
        </h3>
        <span className="text-[10px] font-bold text-slate-400">STAGE 3</span>
      </div>

      <div className="border border-dashed border-slate-300 rounded-2xl p-5 flex flex-col items-center justify-center bg-slate-50 text-center space-y-3">
        <div className="p-3 bg-white border border-slate-150 rounded-full shadow-xs text-slate-400">
          <FileText size={22} />
        </div>
        <div>
          <span className="text-xs font-bold text-slate-800 block">
            Drag or select a design file to upload
          </span>
          <span className="text-[10px] text-slate-400 block mt-1">
            Accepts high resolution SVG, CAD blueprints, or PDF mockups
          </span>
        </div>
        <input
          type="text"
          placeholder="Paste design mockup proof url..."
          value={dd.proofUrl}
          onChange={(e) => updateDesignDetails(order.id, { proofUrl: e.target.value })}
          disabled={isEmployee && order.stageStatus?.includes("Pending")}
          className="w-full max-w-sm px-3 py-1.5 border border-slate-250 rounded-lg text-[11px] focus:outline-none"
        />
      </div>

      {dd.proofUrl && (
        <div className="border border-slate-200 bg-white rounded-2xl overflow-hidden p-4 space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Interactive Mockup Preview
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${
                dd.status === "Approved"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-255"
                  : dd.status === "Pending Approval"
                  ? "bg-amber-50 text-amber-600 border-amber-255"
                  : "bg-slate-55/60 text-slate-600 border-slate-200"
              }`}
            >
              {dd.status}
            </span>
          </div>

          <div className="relative border border-slate-150 rounded-xl bg-slate-900 flex items-center justify-center p-6 overflow-hidden min-h-[220px]">
            <img
              src={dd.proofUrl}
              alt="Design proof"
              className="max-h-[200px] object-contain transition-all duration-300"
              style={{ transform: `scale(${zoomLevel / 100})` }}
              onError={(e) => {
                e.currentTarget.src =
                  "https://images.unsplash.com/photo-1542744094-3a31f103e35f?w=400&auto=format&fit=crop";
              }}
            />

            {/* Floating Zoom controls */}
            <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-xs border border-slate-200 rounded-lg p-1.5 flex items-center space-x-1.5 shadow-xs">
              <button
                onClick={handleZoomOut}
                className="p-0.5 text-slate-500 hover:text-slate-800 rounded"
              >
                <ZoomOut size={12} />
              </button>
              <span
                onClick={handleResetZoom}
                className="text-[9px] font-black font-mono px-1 select-none cursor-pointer"
              >
                {zoomLevel}%
              </span>
              <button
                onClick={handleZoomIn}
                className="p-0.5 text-slate-500 hover:text-slate-800 rounded"
              >
                <ZoomIn size={12} />
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center pt-2">
            <span className="text-[10px] text-slate-400 font-mono">
              FILE: lobby_totem_concept.svg
            </span>

            {isEmployee ? (
              dd.status === "Draft" && (
                <button
                  type="button"
                  onClick={() => updateDesignDetails(order.id, { status: "Pending Approval" })}
                  className="px-3.5 py-1.5 bg-slate-950 text-white rounded-lg text-xs font-bold"
                >
                  Request Design Proof Sign-off
                </button>
              )
            ) : (
              dd.status !== "Approved" && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => updateDesignDetails(order.id, { status: "Draft" })}
                    className="px-3 py-1.5 border border-red-200 text-red-600 rounded-lg text-[11px] font-bold hover:bg-red-50"
                  >
                    Reject Proof
                  </button>
                  <button
                    onClick={() => updateDesignDetails(order.id, { status: "Approved" })}
                    className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-[11px] font-bold hover:bg-emerald-700"
                  >
                    Approve Design
                  </button>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
};
