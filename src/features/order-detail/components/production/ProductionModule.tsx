"use client";

import React from "react";
import { AlertOctagon, CheckSquare } from "lucide-react";
import { Order, ProductionDetails } from "@/types";

interface ProductionModuleProps {
  order: Order;
  isEmployee: boolean;
  isReadOnly?: boolean;
  updateProductionDetails: (orderId: string, details: Partial<ProductionDetails>) => Promise<void>;
}

export const ProductionModule: React.FC<ProductionModuleProps> = ({
  order,
  isEmployee,
  isReadOnly = false,
  updateProductionDetails,
}) => {
  const pd = order.productionDetails || {
    printing: false,
    cutting: false,
    fabrication: false,
    assembly: false,
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
          Workshop Production Queue
        </h3>
        <span className="text-[10px] font-bold text-slate-400">STAGE 4</span>
      </div>

      <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-4">

        <p className="text-xs text-slate-500 leading-normal">
          Check off critical milestones in the signage assembly pipeline. Fabricators must confirm
          structural tests before shipping.
        </p>

        <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden bg-white shadow-xs">
          {/* Print Sheet check */}
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center">
              <CheckSquare
                size={16}
                className={`mr-3 ${pd.printing ? "text-emerald-600" : "text-slate-300"}`}
              />
              <span className="text-xs font-bold text-slate-800">
                1. Print Plotted Sheet Layout & Backing
              </span>
            </div>
            <input
              type="checkbox"
              checked={pd.printing || false}
              onChange={() => updateProductionDetails(order.id, { printing: !pd.printing })}
              disabled={isReadOnly || (isEmployee && order.stageStatus?.includes("Pending"))}
              className="w-4.5 h-4.5 rounded text-emerald-600 cursor-pointer"
            />
          </div>

          {/* Cutting Check */}
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center">
              <CheckSquare
                size={16}
                className={`mr-3 ${pd.cutting ? "text-emerald-600" : "text-slate-300"}`}
              />
              <span className="text-xs font-bold text-slate-800">
                2. CNC Router Precision Plotted Cutting & Edges
              </span>
            </div>
            <input
              type="checkbox"
              checked={pd.cutting || false}
              onChange={() => updateProductionDetails(order.id, { cutting: !pd.cutting })}
              disabled={isReadOnly || (isEmployee && order.stageStatus?.includes("Pending"))}
              className="w-4.5 h-4.5 rounded text-emerald-600 cursor-pointer"
            />
          </div>

          {/* Fabrication Check */}
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center">
              <CheckSquare
                size={16}
                className={`mr-3 ${pd.fabrication ? "text-emerald-600" : "text-slate-300"}`}
              />
              <span className="text-xs font-bold text-slate-800">
                3. Metal frame welding & ACP backing support
              </span>
            </div>
            <input
              type="checkbox"
              checked={pd.fabrication || false}
              onChange={() =>
                updateProductionDetails(order.id, { fabrication: !pd.fabrication })
              }
              disabled={isReadOnly || (isEmployee && order.stageStatus?.includes("Pending"))}
              className="w-4.5 h-4.5 rounded text-emerald-600 cursor-pointer"
            />
          </div>

          {/* Assembly Check */}
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center">
              <CheckSquare
                size={16}
                className={`mr-3 ${pd.assembly ? "text-emerald-600" : "text-slate-300"}`}
              />
              <span className="text-xs font-bold text-slate-800">
                4. Acrylic Letters Mounting & LED internal wiring test
              </span>
            </div>
            <input
              type="checkbox"
              checked={pd.assembly || false}
              onChange={() => updateProductionDetails(order.id, { assembly: !pd.assembly })}
              disabled={isReadOnly || (isEmployee && order.stageStatus?.includes("Pending"))}
              className="w-4.5 h-4.5 rounded text-emerald-600 cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
