"use client";

import React, { useState } from "react";
import { Order, QuoteDetails, QuoteItem } from "@/types";
import { Plus, Trash2 } from "lucide-react";

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
  // Initialize quote details with default items if not present
  const initialItems = (order.quoteDetails?.items || []).map(item => ({
    ...item,
    costPerSqFt: item.costPerSqFt || 0,
    totalSqFt: item.totalSqFt || 0
  }));
  const qd: QuoteDetails = order.quoteDetails ? {
    ...order.quoteDetails,
    items: initialItems
  } : {
    items: [],
    discount: 0,
    subtotal: 0,
    tax: 0,
    grandTotal: 0,
  };

  // Helper to recalculate totals and update unitPrice based on costPerSqFt and totalSqFt
  const recalculateTotals = (items: QuoteItem[], discount: number): Pick<QuoteDetails, "subtotal" | "tax" | "grandTotal"> => {
    const updatedItems = items.map(item => ({
      ...item,
      unitPrice: item.costPerSqFt * item.totalSqFt
    }));
    const subtotal = updatedItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const tax = updatedItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice * (item.gstRate / 100)), 0);
    const grandTotal = (subtotal - discount) + tax;
    
    return {
      subtotal: Math.round(subtotal),
      tax: Math.round(tax),
      grandTotal: Math.round(grandTotal),
    };
  };

  const addItem = () => {
    const newItem: QuoteItem = {
      id: crypto.randomUUID(),
      description: "",
      quantity: 1,
      costPerSqFt: 0,
      totalSqFt: 0,
      unitPrice: 0,
      gstRate: 18,
    };
    const newItems = [...qd.items, newItem];
    const totals = recalculateTotals(newItems, qd.discount);
    updateQuoteDetails(order.id, { items: newItems, ...totals });
  };

  const removeItem = (itemId: string) => {
    const newItems = qd.items.filter(item => item.id !== itemId);
    const totals = recalculateTotals(newItems, qd.discount);
    updateQuoteDetails(order.id, { items: newItems, ...totals });
  };

  const updateItem = (itemId: string, field: keyof QuoteItem, value: string | number) => {
    const newItems = qd.items.map(item => {
      if (item.id === itemId) {
        const parsedValue = (field === "description" ? value : Number(value)) as any;
        const updatedItem = { ...item, [field]: parsedValue };
        // Recalculate unitPrice whenever costPerSqFt or totalSqFt changes
        updatedItem.unitPrice = updatedItem.costPerSqFt * updatedItem.totalSqFt;
        return updatedItem;
      }
      return item;
    });
    const totals = recalculateTotals(newItems, qd.discount);
    updateQuoteDetails(order.id, { items: newItems, ...totals });
  };

  const updateDiscount = (value: number) => {
    const totals = recalculateTotals(qd.items, value);
    updateQuoteDetails(order.id, { discount: value, ...totals });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
          Invoice Quotation Specifications
        </h3>
        <span className="text-[10px] font-bold text-slate-400">STAGE 2</span>
      </div>

      {/* Line Items Table */}
      <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
        {/* Table Header */}
        <div className="bg-slate-50 border-b border-slate-200 grid grid-cols-16 gap-2 px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          <div className="col-span-4">Description</div>
          <div className="col-span-2 text-center">Qty</div>
          <div className="col-span-2 text-center">Cost/Sq Ft</div>
          <div className="col-span-2 text-center">Total Sq Ft</div>
          <div className="col-span-2 text-center">Unit Price</div>
          <div className="col-span-2 text-center">GST %</div>
          <div className="col-span-1 text-center">Amount</div>
          <div className="col-span-1"></div>
        </div>

        {/* Items Body */}
        <div className="divide-y divide-slate-100">
          {qd.items.map((item) => {
            // Make sure unitPrice is calculated
            const calculatedUnitPrice = item.costPerSqFt * item.totalSqFt;
            const lineTotal = item.quantity * calculatedUnitPrice;
            
            return (
              <div key={item.id} className="grid grid-cols-16 gap-2 px-3 py-3 items-center">
                <div className="col-span-4">
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => updateItem(item.id, "description", e.target.value)}
                    placeholder="Enter item description"
                    disabled={isEmployee && order.stageStatus?.includes("Pending")}
                    className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(item.id, "quantity", e.target.value)}
                    disabled={isEmployee && order.stageStatus?.includes("Pending")}
                    className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-mono text-center text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="col-span-2">
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.costPerSqFt}
                      onChange={(e) => updateItem(item.id, "costPerSqFt", e.target.value)}
                      disabled={isEmployee && order.stageStatus?.includes("Pending")}
                      className="w-full border border-slate-200 rounded-lg px-6 py-1.5 text-xs font-mono text-right text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.totalSqFt}
                    onChange={(e) => updateItem(item.id, "totalSqFt", e.target.value)}
                    disabled={isEmployee && order.stageStatus?.includes("Pending")}
                    className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-mono text-center text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="col-span-2">
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">₹</span>
                    <input
                      type="number"
                      min="0"
                      value={calculatedUnitPrice}
                      readOnly
                      className="w-full border border-slate-100 rounded-lg px-6 py-1.5 text-xs font-mono text-right text-slate-500 bg-slate-50 focus:outline-none"
                    />
                  </div>
                </div>
                <div className="col-span-2">
                  <select
                    value={item.gstRate}
                    onChange={(e) => updateItem(item.id, "gstRate", e.target.value)}
                    disabled={isEmployee && order.stageStatus?.includes("Pending")}
                    className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-mono text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value={0}>0%</option>
                    <option value={5}>5%</option>
                    <option value={12}>12%</option>
                    <option value={18}>18%</option>
                    <option value={28}>28%</option>
                  </select>
                </div>
                <div className="col-span-1 text-right">
                  <span className="text-xs font-bold font-mono text-slate-800">
                    ₹{lineTotal.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="col-span-1 text-center">
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    disabled={isEmployee && order.stageStatus?.includes("Pending")}
                    className="text-slate-400 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Item Button */}
        <div className="border-t border-slate-200 p-3">
          <button
            type="button"
            onClick={addItem}
            disabled={isEmployee && order.stageStatus?.includes("Pending")}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-dashed border-slate-300 rounded-lg text-xs font-semibold text-slate-500 hover:border-blue-500 hover:text-blue-600 transition-colors"
          >
            <Plus size={14} />
            Add Item
          </button>
        </div>
      </div>

      {/* Totals Section */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Customer Discount (₹)
            </label>
            <div className="relative">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">₹</span>
              <input
                type="number"
                min="0"
                value={qd.discount}
                onChange={(e) => updateDiscount(Number(e.target.value) || 0)}
                disabled={isEmployee && order.stageStatus?.includes("Pending")}
                className="w-full border border-slate-250 rounded-xl px-6 py-2 text-xs font-bold font-mono text-slate-700 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200/80 space-y-2 text-xs font-semibold text-slate-600">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span className="font-mono text-slate-800">
              ₹{qd.subtotal?.toLocaleString("en-IN") || 0}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Total GST:</span>
            <span className="font-mono text-slate-800">
              ₹{qd.tax?.toLocaleString("en-IN") || 0}
            </span>
          </div>
          {qd.discount > 0 && (
            <div className="flex justify-between text-rose-600">
              <span>Less Discount:</span>
              <span className="font-mono">- ₹{qd.discount?.toLocaleString("en-IN") || 0}</span>
            </div>
          )}
          <div className="flex justify-between text-sm font-bold text-slate-900 pt-1 border-t border-dashed border-slate-200">
            <span>Grand Total:</span>
            <span className="font-mono text-emerald-700">
              ₹{qd.grandTotal?.toLocaleString("en-IN") || 0}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
