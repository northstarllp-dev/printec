"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, CheckSquare, FileText, MapPin, 
  AlertOctagon, Check, Image as ImageIcon, Sparkles, Loader2, Save
} from "lucide-react";
import { updateProductionDetailsAction } from "@/features/orders/actions/orderActions";

interface LocationMeasurement {
  id: string;
  name: string;
  width: string;
  height: string;
  depth: string;
  ground_clearance?: string;
  notes?: string;
  photos?: string[];
}

interface QuoteItem {
  id: string;
  description: string;
  quantity: number;
  unit?: string;
  unitPrice: number;
  costPerSqFt?: number;
  totalSqFt?: number;
  gstRate: number;
  pricingType?: "per_unit" | "per_sqft";
}

interface ProductionOrderDetailClientProps {
  order: any;
  customers: any[];
  employees: any[];
  products: any[];
  quotation: any;
}

export function ProductionOrderDetailClient({
  order: initialOrder,
  customers,
  employees,
  products,
  quotation
}: ProductionOrderDetailClientProps) {
  const router = useRouter();
  const [order, setOrder] = useState(initialOrder);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const client = customers.find(c => c.id === order.customerId);

  // Fallbacks for sub-objects
  const pd = order.productionDetails || {
    printing: false,
    cutting: false,
    fabrication: false,
    assembly: false
  };

  const svDetails = order.siteVisitDetails || {};
  const locations: LocationMeasurement[] = svDetails.locations || [];
  
  const dd = order.designDetails || { proofUrl: "", status: "Draft" };
  const mockImage = order.imageMockup || dd.proofUrl;

  const handleCheckboxChange = async (key: "printing" | "cutting" | "fabrication" | "assembly") => {
    setSaving(true);
    setAlert(null);

    const updatedPd = {
      ...pd,
      [key]: !pd[key]
    };

    // Optimistically update local state
    setOrder((prev: any) => ({
      ...prev,
      productionDetails: updatedPd
    }));

    try {
      await updateProductionDetailsAction(order.id, updatedPd);
      setAlert({ message: "Fabrication milestone updated successfully.", type: "success" });
    } catch (err: any) {
      console.error(err);
      // Revert local state
      setOrder((prev: any) => ({
        ...prev,
        productionDetails: pd
      }));
      setAlert({ message: err.message || "Failed to update milestone.", type: "error" });
    } finally {
      setSaving(false);
      setTimeout(() => setAlert(null), 3000);
    }
  };

  const quoteItems: QuoteItem[] = quotation?.items || [];

  return (
    <div className="p-8 bg-slate-50/50 min-h-screen">
      {/* Top Navigation */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.push("/production/orders")}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-600 text-xs font-bold shadow-xs hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft size={14} /> Back to Queue
        </button>
        <span className="text-slate-300">/</span>
        <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">{order.orderCode}</span>
      </div>

      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {order.projectName}
            </h1>

          </div>
          <p className="text-xs text-slate-500 font-semibold">
            Status: <span className="text-blue-600 font-bold">{order.stage}</span>
          </p>
        </div>

        {alert && (
          <div className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
            alert.type === "success" 
              ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
              : "bg-rose-50 text-rose-700 border-rose-200"
          }`}>
            {alert.message}
          </div>
        )}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* LEFT COLUMN: Stage Outputs & Details (2/3 width) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* SITE VISIT DETAILS */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <MapPin size={18} className="text-indigo-600" />
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                Site Visit Dimensions
              </h2>
            </div>

            {locations.length > 0 ? (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                        <th className="py-2.5 px-4">Location / Name</th>
                        <th className="py-2.5 px-4">Width</th>
                        <th className="py-2.5 px-4">Height</th>
                        <th className="py-2.5 px-4">Depth</th>
                        <th className="py-2.5 px-4">Ground Clearance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {locations.map((loc, idx) => (
                        <tr key={loc.id || idx}>
                          <td className="py-3 px-4 font-bold text-slate-800">{loc.name}</td>
                          <td className="py-3 px-4 font-medium text-slate-600">{loc.width || "—"}</td>
                          <td className="py-3 px-4 font-medium text-slate-600">{loc.height || "—"}</td>
                          <td className="py-3 px-4 font-medium text-slate-600">{loc.depth || "—"}</td>
                          <td className="py-3 px-4 font-medium text-slate-600">{loc.ground_clearance || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {locations.some(l => l.notes) && (
                  <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">Location Notes</h3>
                    <div className="space-y-2">
                      {locations.map((loc, idx) => loc.notes ? (
                        <p key={idx} className="text-xs text-slate-600 leading-normal">
                          <strong className="text-slate-700">{loc.name}:</strong> {loc.notes}
                        </p>
                      ) : null)}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-400 font-semibold">
                No site visit locations or measurements specified. Default dimensions: {order.dimensions || "TBD"}
              </div>
            )}
          </div>

          {/* QUOTATION DETAILS */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-amber-600" />
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                  Approved Quotation Details
                </h2>
              </div>
              {quotation?.quotation_id && (
                <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-200/80">
                  ID: {quotation.quotation_id}
                </span>
              )}
            </div>

            {quoteItems.length > 0 ? (
              <div className="space-y-5">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                        <th className="py-2.5 px-4">Item Description</th>
                        <th className="py-2.5 px-4 text-center">Qty</th>
                        <th className="py-2.5 px-4">Unit</th>
                        <th className="py-2.5 px-4 text-right">Rate</th>
                        <th className="py-2.5 px-4 text-right">GST %</th>
                        <th className="py-2.5 px-4 text-right">Total Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {quoteItems.map((item, idx) => {
                        const rate = item.pricingType === "per_sqft" ? (item.costPerSqFt || item.unitPrice) : item.unitPrice;
                        const qty = item.pricingType === "per_sqft" ? (item.quantity * (item.totalSqFt || 1)) : item.quantity;
                        const sub = qty * rate;
                        const tax = sub * (item.gstRate / 100);
                        const final = sub + tax;

                        return (
                          <tr key={item.id || idx}>
                            <td className="py-3 px-4 font-bold text-slate-800">{item.description}</td>
                            <td className="py-3 px-4 text-center font-semibold text-slate-700">{item.quantity}</td>
                            <td className="py-3 px-4 text-slate-500 font-medium">{item.unit || "nos"}</td>
                            <td className="py-3 px-4 text-right text-slate-700 font-medium">₹{rate.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                            <td className="py-3 px-4 text-right text-slate-500 font-medium">{item.gstRate}%</td>
                            <td className="py-3 px-4 text-right font-bold text-slate-900">₹{final.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-start gap-4 pt-4 border-t border-slate-100">
                  <div className="text-xs text-slate-500 space-y-1">
                    {quotation.notes && <p><strong>Notes:</strong> {quotation.notes}</p>}
                    {quotation.terms && <p><strong>Terms:</strong> {quotation.terms}</p>}
                  </div>
                  <div className="w-full md:w-64 bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-1.5 self-end text-xs">
                    <div className="flex justify-between font-medium text-slate-500">
                      <span>Subtotal:</span>
                      <span>₹{(quotation.subtotal || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                    </div>
                    {Number(quotation.discount) > 0 && (
                      <div className="flex justify-between font-medium text-slate-500">
                        <span>Discount:</span>
                        <span>- ₹{Number(quotation.discount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-medium text-slate-500">
                      <span>Tax (GST):</span>
                      <span>₹{(quotation.tax || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between font-black text-slate-900 text-sm pt-2 border-t border-slate-200">
                      <span>Grand Total:</span>
                      <span>₹{(quotation.grand_total || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-400 font-semibold">
                No detailed quotation entries found for this order. Project Budget: ₹{order.budget?.toLocaleString("en-IN")}
              </div>
            )}
          </div>

          {/* DESIGN PROOF DETAILS */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <ImageIcon size={18} className="text-purple-600" />
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                Approved Design Proof
              </h2>
            </div>

            {mockImage ? (
              <div className="space-y-4">
                <div className="relative rounded-xl border border-slate-200 overflow-hidden bg-slate-100 flex items-center justify-center min-h-[300px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={mockImage}
                    alt="Design Proof Layout"
                    className="max-h-[500px] object-contain rounded-xl"
                  />
                </div>
                {dd.notes && (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                    <h3 className="font-bold text-slate-500 uppercase mb-1">Designer Notes</h3>
                    <p className="text-slate-600 leading-relaxed">{dd.notes}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-400 font-semibold flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-200 rounded-xl">
                <ImageIcon size={24} className="text-slate-300" />
                <span>No design proof image files uploaded.</span>
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: Interactive Fabrication Checklist & Customer Info (1/3 width) */}
        <div className="space-y-8">
          
          {/* WORKSHOP PRODUCTION QUEUE CHECKLIST */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm sticky top-6">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <CheckSquare size={18} className="text-blue-600" />
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                Workshop Production
              </h2>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed mb-5">
              Check off fabrication milestones as ACP structures and lettering progress.
            </p>

            <div className="space-y-3.5">
              {[
                { key: "printing", label: "1. Print Plotted Layout & Backing", desc: "Vinyl printing, plotter alignment, ACP pre-checks" },
                { key: "cutting", label: "2. CNC Router Precision Cutting", desc: "ACP plotting, CNC cutting, edge profile checking" },
                { key: "fabrication", label: "3. Frame Welding & Support", desc: "ACP support framework, structural welding, ACP binding" },
                { key: "assembly", label: "4. Letters Mounting & wiring test", desc: "Acrylic letter mounting, LED illumination testing" },
              ].map(step => {
                const isChecked = !!pd[step.key as keyof typeof pd];
                return (
                  <div 
                    key={step.key}
                    onClick={() => !saving && handleCheckboxChange(step.key as any)}
                    className={`p-4 border rounded-xl flex items-start gap-3 cursor-pointer select-none transition-all duration-200 ${
                      isChecked 
                        ? "bg-emerald-50/50 border-emerald-200 text-emerald-950" 
                        : "bg-white border-slate-200 hover:border-slate-300 text-slate-800"
                    }`}
                  >
                    <div className="mt-0.5">
                      <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                        isChecked 
                          ? "bg-emerald-600 border-emerald-600 text-white" 
                          : "border-slate-300 bg-white"
                      }`}>
                        {isChecked && <Check size={12} strokeWidth={3} />}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-bold leading-none mb-1">{step.label}</div>
                      <div className="text-[10px] text-slate-500 font-semibold">{step.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {saving && (
              <div className="flex items-center justify-center gap-2 text-xs text-slate-400 font-bold mt-4">
                <Loader2 size={12} className="animate-spin text-blue-600" />
                <span>Updating database...</span>
              </div>
            )}
          </div>

          {/* CUSTOMER DETAIL CARD */}
          {client && (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
                <Sparkles size={18} className="text-rose-600" />
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                  Client Contact
                </h2>
              </div>
              <div className="space-y-3.5 text-xs">
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Client Name</div>
                  <div className="font-bold text-slate-800">{client.name}</div>
                </div>
                {client.phone && (
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Phone</div>
                    <div className="font-semibold text-slate-700">📞 {client.phone}</div>
                  </div>
                )}
                {client.email && (
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Email Address</div>
                    <div className="font-semibold text-slate-700">{client.email}</div>
                  </div>
                )}
                {client.shippingAddress && (
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Installation Site Address</div>
                    <div className="font-medium text-slate-600 leading-relaxed">{client.shippingAddress}</div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
