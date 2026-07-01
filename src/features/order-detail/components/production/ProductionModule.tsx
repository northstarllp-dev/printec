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
    procurementOfMaterials: false,
    acpAndAcrylicCutting: false,
    lightingAndWiring: false,
    qualityCheck: false,
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
          {/* Procurement Check */}
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center">
              <CheckSquare
                size={16}
                className={`mr-3 ${pd.procurementOfMaterials ? "text-emerald-600" : "text-slate-300"}`}
              />
              <span className="text-xs font-bold text-slate-800">
                1. Procurement of Materials
              </span>
            </div>
            <input
              type="checkbox"
              checked={pd.procurementOfMaterials || false}
              onChange={() => updateProductionDetails(order.id, { procurementOfMaterials: !pd.procurementOfMaterials })}
              disabled={isReadOnly || (isEmployee && order.stageStatus?.includes("Pending"))}
              className="w-4.5 h-4.5 rounded text-emerald-600 cursor-pointer"
            />
          </div>

          {/* Cutting Check */}
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center">
              <CheckSquare
                size={16}
                className={`mr-3 ${pd.acpAndAcrylicCutting ? "text-emerald-600" : "text-slate-300"}`}
              />
              <span className="text-xs font-bold text-slate-800">
                2. ACP & Acrylic Cutting
              </span>
            </div>
            <input
              type="checkbox"
              checked={pd.acpAndAcrylicCutting || false}
              onChange={() => updateProductionDetails(order.id, { acpAndAcrylicCutting: !pd.acpAndAcrylicCutting })}
              disabled={isReadOnly || (isEmployee && order.stageStatus?.includes("Pending"))}
              className="w-4.5 h-4.5 rounded text-emerald-600 cursor-pointer"
            />
          </div>

          {/* Lighting & Wiring Check */}
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center">
              <CheckSquare
                size={16}
                className={`mr-3 ${pd.lightingAndWiring ? "text-emerald-600" : "text-slate-300"}`}
              />
              <span className="text-xs font-bold text-slate-800">
                3. Lighting & Wiring
              </span>
            </div>
            <input
              type="checkbox"
              checked={pd.lightingAndWiring || false}
              onChange={() =>
                updateProductionDetails(order.id, { lightingAndWiring: !pd.lightingAndWiring })
              }
              disabled={isReadOnly || (isEmployee && order.stageStatus?.includes("Pending"))}
              className="w-4.5 h-4.5 rounded text-emerald-600 cursor-pointer"
            />
          </div>

          {/* Quality Check Check */}
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center">
              <CheckSquare
                size={16}
                className={`mr-3 ${pd.qualityCheck ? "text-emerald-600" : "text-slate-300"}`}
              />
              <span className="text-xs font-bold text-slate-800">
                4. Quality Check
              </span>
            </div>
            <input
              type="checkbox"
              checked={pd.qualityCheck || false}
              onChange={() => updateProductionDetails(order.id, { qualityCheck: !pd.qualityCheck })}
              disabled={isReadOnly || (isEmployee && order.stageStatus?.includes("Pending"))}
              className="w-4.5 h-4.5 rounded text-emerald-600 cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
