"use client";

import React from "react";
import { Order, InstallationDetails } from "@/types";

interface InstallationModuleProps {
  order: Order;
  isEmployee: boolean;
  isReadOnly?: boolean;
  updateInstallationDetails: (orderId: string, details: Partial<InstallationDetails>) => Promise<void>;
}

export const InstallationModule: React.FC<InstallationModuleProps> = ({
  order,
  isEmployee,
  isReadOnly = false,
  updateInstallationDetails,
}) => {
  const inst = order.installationDetails || {
    photoUrl: "",
    customerSignature: "",
    paymentCode: "",
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
          Field Installation Sign-off
        </h3>
        <span className="text-[10px] font-bold text-slate-400">STAGE 5</span>
      </div>

      <div>
        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
          Installed Signage Proof Photo URL
        </label>
        <input
          type="text"
          value={inst.photoUrl}
          onChange={(e) => updateInstallationDetails(order.id, { photoUrl: e.target.value })}
          placeholder="Paste link to installation completion photo..."
          disabled={isReadOnly || (isEmployee && order.stageStatus?.includes("Pending"))}
          className="w-full px-3 py-2 border border-slate-250 rounded-xl text-xs font-semibold text-slate-700 bg-white focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Client Signature
          </label>
          <input
            type="text"
            value={inst.customerSignature}
            onChange={(e) =>
              updateInstallationDetails(order.id, { customerSignature: e.target.value })
            }
            placeholder="Type customer name to sign..."
            disabled={isReadOnly || (isEmployee && order.stageStatus?.includes("Pending"))}
            className="w-full px-3 py-2 border border-slate-250 rounded-xl text-xs font-semibold text-slate-700 bg-white focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Validation Code
          </label>
          <input
            type="text"
            value={inst.paymentCode}
            onChange={(e) =>
              updateInstallationDetails(order.id, { paymentCode: e.target.value })
            }
            placeholder="e.g. 9938"
            disabled={isReadOnly || (isEmployee && order.stageStatus?.includes("Pending"))}
            className="w-full px-3 py-2 border border-slate-250 rounded-xl text-xs font-semibold text-slate-700 bg-white focus:outline-none"
          />
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center text-xs font-medium text-slate-500">
          <span className="block font-bold text-slate-700 mb-1">Client Sign-Off Box</span>
          <div className="h-24 bg-white border border-slate-150 rounded-lg flex items-center justify-center font-serif text-slate-400 italic">
            {inst.customerSignature
              ? inst.customerSignature
              : "Drawing canvas placeholder (Type signature name above)"}
          </div>
        </div>
      </div>
    </div>
  );
};
