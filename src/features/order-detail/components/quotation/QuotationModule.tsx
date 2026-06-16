"use client";

import React from "react";
import { Order, QuoteDetails } from "@/types";

interface QuotationModuleProps {
  order: Order;
  isEmployee: boolean;
  updateQuoteDetails: (orderId: string, details: Partial<QuoteDetails>) => Promise<void>;
}

export const QuotationModule: React.FC<QuotationModuleProps> = ({
  order,
  isEmployee,
  updateQuoteDetails,
}) => {
  const qd = order.quoteDetails || {
    signageType: "ACP Panels",
    width: 120,
    height: 60,
    depth: 5,
    material: "Brushed Aluminium (3mm)",
    mounting: "Standoff Fixings (Satin Chrome)",
    baseACPPrice: 0,
    hardwarePrice: 0,
    polishingPrice: 0,
    discount: 0,
    subtotal: 0,
    tax: 0,
    grandTotal: 0,
  };

  const handlePriceChange = (field: keyof QuoteDetails, value: number) => {
    const updated = { ...qd, [field]: value };
    const subtotal =
      (updated.baseACPPrice || 0) +
      (updated.hardwarePrice || 0) +
      (updated.polishingPrice || 0) -
      (updated.discount || 0);
    const tax = Math.round(subtotal * 0.18);
    const grandTotal = subtotal + tax;

    updateQuoteDetails(order.id, {
      [field]: value,
      subtotal,
      tax,
      grandTotal,
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
          Invoice Quotation Specifications
        </h3>
        <span className="text-[10px] font-bold text-slate-400">STAGE 2</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Signage Board Type
          </label>
          <select
            value={qd.signageType}
            onChange={(e) => updateQuoteDetails(order.id, { signageType: e.target.value as any })}
            disabled={isEmployee && order.stageStatus?.includes("Pending")}
            className="w-full px-3 py-2 border border-slate-250 rounded-xl text-xs font-semibold text-slate-700 bg-white focus:outline-none"
          >
            <option value="ACP Panels">ACP Panels Signage</option>
            <option value="LED Letters">LED Letters Signage</option>
            <option value="Vinyl Graphics">Vinyl Graphics Branding</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Primary Material Spec
          </label>
          <input
            type="text"
            value={qd.material}
            onChange={(e) => updateQuoteDetails(order.id, { material: e.target.value })}
            placeholder="e.g. Brushed Aluminium (3mm)"
            disabled={isEmployee && order.stageStatus?.includes("Pending")}
            className="w-full px-3 py-2 border border-slate-250 rounded-xl text-xs font-semibold text-slate-700 bg-white focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
          Mounting Support
        </label>
        <select
          value={qd.mounting}
          onChange={(e) => updateQuoteDetails(order.id, { mounting: e.target.value })}
          disabled={isEmployee && order.stageStatus?.includes("Pending")}
          className="w-full px-3 py-2 border border-slate-250 rounded-xl text-xs font-semibold text-slate-700 bg-white focus:outline-none"
        >
          <option value="Standoff Fixings (Satin Chrome)">Standoff Fixings (Satin Chrome)</option>
          <option value="Direct Wall Silicon Mounted">Direct Wall Silicon Mounted</option>
          <option value="Hanging Steel Wire Tensioners">Hanging Steel Wire Tensioners</option>
        </select>
      </div>

      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-4">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-tight">
          Financial Quotation Calculator (INR)
        </h4>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Base Fabrication (₹)
            </label>
            <input
              type="number"
              value={qd.baseACPPrice || ""}
              onChange={(e) => handlePriceChange("baseACPPrice", parseFloat(e.target.value) || 0)}
              placeholder="Base Price"
              disabled={isEmployee && order.stageStatus?.includes("Pending")}
              className="w-full px-3 py-2 border border-slate-250 rounded-xl text-xs font-bold font-mono text-slate-700 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Hardware & Acrylic (₹)
            </label>
            <input
              type="number"
              value={qd.hardwarePrice || ""}
              onChange={(e) => handlePriceChange("hardwarePrice", parseFloat(e.target.value) || 0)}
              placeholder="Hardware Cost"
              disabled={isEmployee && order.stageStatus?.includes("Pending")}
              className="w-full px-3 py-2 border border-slate-250 rounded-xl text-xs font-bold font-mono text-slate-700 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Polishing & Finishing (₹)
            </label>
            <input
              type="number"
              value={qd.polishingPrice || ""}
              onChange={(e) => handlePriceChange("polishingPrice", parseFloat(e.target.value) || 0)}
              placeholder="Polishing Cost"
              disabled={isEmployee && order.stageStatus?.includes("Pending")}
              className="w-full px-3 py-2 border border-slate-250 rounded-xl text-xs font-bold font-mono text-slate-700 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Customer Discount (₹)
            </label>
            <input
              type="number"
              value={qd.discount || ""}
              onChange={(e) => handlePriceChange("discount", parseFloat(e.target.value) || 0)}
              placeholder="Discount Value"
              disabled={isEmployee && order.stageStatus?.includes("Pending")}
              className="w-full px-3 py-2 border border-slate-250 rounded-xl text-xs font-bold font-mono text-slate-700 focus:outline-none"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200/80 space-y-2 text-xs font-semibold text-slate-600">
          <div className="flex justify-between">
            <span>Subtotal Price:</span>
            <span className="font-mono text-slate-800">
              ₹{qd.subtotal?.toLocaleString("en-IN") || 0}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Tax (18% GST):</span>
            <span className="font-mono text-slate-800">
              ₹{qd.tax?.toLocaleString("en-IN") || 0}
            </span>
          </div>
          <div className="flex justify-between text-sm font-bold text-slate-900 pt-1 border-t border-dashed border-slate-200">
            <span>Grand Total Price:</span>
            <span className="font-mono text-emerald-700">
              ₹{qd.grandTotal?.toLocaleString("en-IN") || 0}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
