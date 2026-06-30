"use client";

import React, { useState, useEffect, useRef, useTransition } from "react";
import { createPortal } from "react-dom";
import { 
  Plus, Trash2, Search, Check, ChevronDown, Info, X,
  Sparkles, ShieldCheck, ClipboardList, IndianRupee, Loader2, AlertCircle, Package, Save
} from "lucide-react";
import { 
  upsertQuotation, 
  sendQuotationToCustomer
} from "@/features/quotations/actions/quotationActions";
import { createClient } from "@/utils/supabase/client";
import { updateOrderStageAction } from "@/features/orders/actions/orderActions";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface Product {
  id: string;
  product_id: string;
  name: string;
  category: string | null;
  pricing_type: string;
  is_active: boolean;
  price_per_sqft?: number | null;
  price_per_unit?: number | null;
  price_per_running_ft?: number | null;
  images?: string[];
}

interface SiteVisitItem {
  id: string;
  name: string;
  width?: number | null;
  height?: number | null;
  depth?: number | null;
  notes?: string | null;
}

interface LineItem {
  id: string;
  productId?: string;
  description: string;
  quantity: number;
  pricingType: "per_unit" | "per_sqft" | "per_running_ft";
  unit: string;
  unitPrice: number;
  totalSqFt: number;
  gstRate: number;
  notes?: string | null;
}

interface SignageSection {
  siteVisitItemId: string;
  itemLabel: string;
  lines: LineItem[];
  notes?: string;
}

interface Quotation {
  id?: string;
  quotation_id?: string;
  rejection_reason?: string;
  status: "Draft" | "Sent" | "Approved" | "Rejected" | "Pending Approval";
  signage_options?: SignageSection[];
  subtotal: number;
  discount: number;
  tax: number;
  grand_total: number;
  shipping?: number;
  amount_paid?: number;
  notes: string;
  terms: string;
  advance_paid?: boolean;
}

interface QuotationModuleProps {
  order: {
    id: string;
    orderId?: string;
    orderCode?: string;
    projectName: string;
    customerName?: string;
    customerId?: string;
    stage?: string;
    workflow_type?: "quote_first" | "design_first";
  };
  isEmployee: boolean;
  products: Product[];
  initialQuotation: Quotation | null;
  siteVisitItems?: SiteVisitItem[];
  currentUserRole?: string;
}

const GST_OPTIONS = [0, 5, 12, 18, 28];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function newItem(gstRate: number = 18): LineItem {
  return {
    id: crypto.randomUUID(),
    description: "",
    quantity: 1,
    pricingType: "per_unit",
    unit: "nos",
    unitPrice: 0,
    totalSqFt: 0,
    gstRate,
  };
}

function calcLineAmount(item: LineItem): number {
  if (item.pricingType === "per_sqft" || item.pricingType === "per_running_ft") {
    return item.quantity * item.totalSqFt * item.unitPrice;
  }
  return item.quantity * item.unitPrice;
}

function resolveInitialPricing(p: Product): { pricingType: "per_unit" | "per_sqft" | "per_running_ft"; price: number } {
  let pricingType: "per_unit" | "per_sqft" | "per_running_ft" = "per_unit";
  let price = 0;

  const ut = (p.pricing_type || "").toLowerCase().trim();

  if (ut === "per sq.ft" || ut === "per sqft" || ut === "sqft" || ut === "per_sqft") {
    pricingType = "per_sqft";
    price = p.price_per_sqft ?? 0;
  } else if (ut === "per running ft" || ut === "per running foot" || ut === "per rft" || ut === "rft" || ut === "per_running_ft") {
    pricingType = "per_running_ft";
    price = p.price_per_running_ft ?? 0;
  } else if (ut === "per unit" || ut === "per_unit" || ut === "unit" || ut === "nos") {
    pricingType = "per_unit";
    price = p.price_per_unit ?? 0;
  } else {
    if (p.price_per_sqft != null && p.price_per_sqft > 0) {
      pricingType = "per_sqft";
      price = p.price_per_sqft;
    } else if (p.price_per_running_ft != null && p.price_per_running_ft > 0) {
      pricingType = "per_running_ft";
      price = p.price_per_running_ft;
    } else if (p.price_per_unit != null && p.price_per_unit > 0) {
      pricingType = "per_unit";
      price = p.price_per_unit;
    } else {
      pricingType = "per_unit";
      price = 0;
    }
  }

  return { pricingType, price };
}

function getProductPriceForType(p: Product, type: "per_unit" | "per_sqft" | "per_running_ft"): number {
  if (type === "per_sqft") {
    return p.price_per_sqft ?? 0;
  }
  if (type === "per_running_ft") {
    return p.price_per_running_ft ?? 0;
  }
  return p.price_per_unit ?? 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// Product Search component
// ─────────────────────────────────────────────────────────────────────────────

function ProductSearch({
  value,
  products,
  onSelect,
  onChange,
  disabled,
}: {
  value: string;
  products: Product[];
  onSelect: (p: Product) => void;
  onChange: (val: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = query.trim()
    ? products.filter(
        (p) =>
          p.is_active &&
          (p.name.toLowerCase().includes(query.toLowerCase()) ||
            p.product_id.toLowerCase().includes(query.toLowerCase()) ||
            (p.category ?? "").toLowerCase().includes(query.toLowerCase()))
      )
    : [];

  return (
    <div ref={ref} style={{ position: "relative", width: "100%" }}>
      <div style={{ position: "relative" }}>
        <Search
          size={11}
          style={{
            position: "absolute",
            left: 8,
            top: "50%",
            transform: "translateY(-50%)",
            color: "#94a3b8",
            pointerEvents: "none",
          }}
        />
        <input
          type="text"
          value={query}
          disabled={disabled}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            setQuery(value);
            setOpen(true);
          }}
          placeholder="Item description or search..."
          className="w-full border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
          style={{ padding: "6px 8px 6px 24px", fontFamily: "inherit" }}
        />
      </div>

      {open && filtered.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            background: "white",
            border: "1px solid #e2e8f0",
            borderRadius: 8,
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            zIndex: 9999,
            maxHeight: 200,
            overflowY: "auto",
          }}
        >
          {filtered.map((p) => {
            const resolved = resolveInitialPricing(p);
            return (
              <button
                key={p.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onSelect(p);
                  setQuery(p.name);
                  setOpen(false);
                }}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "8px 12px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  borderBottom: "1px solid #f1f5f9",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#f8fafc";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "none";
                }}
              >
                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#0f172a" }}>{p.name}</span>
                  {p.category && (
                    <span style={{ fontSize: 9, color: "#94a3b8", marginLeft: 6 }}>{p.category}</span>
                  )}
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: "#0f172a", fontFamily: "monospace" }}>
                    ₹{resolved.price.toLocaleString("en-IN")}
                  </div>
                  <div style={{ fontSize: 9, color: "#64748b" }}>
                    per {resolved.pricingType === "per_sqft" ? "sqft" : resolved.pricingType === "per_running_ft" ? "rft" : "unit"}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export const QuotationModule: React.FC<QuotationModuleProps> = ({
  order,
  isEmployee,
  currentUserRole = "Customer",
  products,
  initialQuotation,
  siteVisitItems = [],
}) => {
  const [isPending, startTransition] = useTransition();
  const [saveMsg, setSaveMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [activeRowId, setActiveRowId] = useState<string | null>(null);
  const [sendingToCustomer, setSendingToCustomer] = useState(false);
  const [pushingToAdmin, setPushingToAdmin] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [selectedProductInfo, setSelectedProductInfo] = useState<Product | null>(null);
  const [pendingAction, setPendingAction] = useState<"admin" | "customer" | null>(null);

  const isPastQuotation = ![
    "Site Visit Pending",
    "Site Visit Scheduled",
    "Site Visit Completed",
    "Quotation In Progress",
    "Quotation Sent",
    "Quotation Negotiation",
    "Quotation Approved",
  ].includes(order.stage || "");

  const isDesignFirst = order.workflow_type === "design_first";
  const nextStageLabel = isDesignFirst ? "Production" : "Design";
  const nextStageValue = isDesignFirst ? "Production" : "Design In Progress";

  const [advanceReceived, setAdvanceReceived] = useState(
    isPastQuotation || (initialQuotation?.advance_paid ?? false)
  );
  const [measurementsVerified, setMeasurementsVerified] = useState(
    isPastQuotation
  );
  const [isMovingToDesign, setIsMovingToDesign] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    const channelName = `quotation-sync-${order.id}-${Date.now()}`;

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "quotations",
          filter: `order_id=eq.${order.id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
            const newQuote = payload.new as any;
            if (newQuote) {
              if (newQuote.quotation_id) setQuotationId(newQuote.quotation_id);
              if (newQuote.status) setStatus(newQuote.status);
              if (newQuote.notes !== undefined) setNotes(newQuote.notes ?? "");
              if (newQuote.terms !== undefined) setTerms(newQuote.terms ?? "");
              if (newQuote.shipping !== undefined) setShipping(Number(newQuote.shipping) || 0);
              if (newQuote.rejection_reason !== undefined) setRejectionReason(newQuote.rejection_reason ?? "");
              if (Array.isArray(newQuote.signage_options)) {
                setSections(newQuote.signage_options);
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [order.id]);

  // Core metadata states
  const [quotationId, setQuotationId] = useState(
    initialQuotation?.quotation_id ?? (order.orderCode ? order.orderCode.replace("ORD-", "Q") : `Q-${Math.floor(Math.random() * 1000)}`)
  );
  const [status, setStatus] = useState<"Draft" | "Sent" | "Approved" | "Rejected" | "Pending Approval">(
    initialQuotation?.status ?? "Draft"
  );
  const [rejectionReason, setRejectionReason] = useState(
    initialQuotation?.rejection_reason ?? ""
  );
  const [customerName, setCustomerName] = useState(
    order.customerName ?? ""
  );

  // Redesigned: multi-section structure without options A/B
  const [sections, setSections] = useState<SignageSection[]>(() => {
    const savedSections = initialQuotation?.signage_options || [];

    if (siteVisitItems && siteVisitItems.length > 0) {
      const mapped = siteVisitItems.map((item) => {
        const existing = savedSections.find((s) => s.siteVisitItemId === item.id);
        if (existing) {
          return {
            ...existing,
            itemLabel: item.name, // Keep latest name
          };
        }

        // Default empty row inside a section
        return {
          siteVisitItemId: item.id,
          itemLabel: item.name,
          lines: [
            {
              id: crypto.randomUUID(),
              description: "",
              quantity: 1,
              pricingType: "per_unit" as const,
              unit: "nos",
              unitPrice: 0,
              totalSqFt: (item.width && item.height) ? item.width * item.height : 0,
              gstRate: 18,
            },
          ],
          notes: item.notes || "",
        };
      });

      // Keep any saved sections that do not correspond to any site visit item ID (e.g. custom sections or fallback ones)
      const unmatched = savedSections.filter(
        (s) => !siteVisitItems.some((item) => item.id === s.siteVisitItemId)
      );

      return [...mapped, ...unmatched];
    }

    if (savedSections.length > 0) {
      return savedSections;
    }

    // Fallback: single empty section if absolutely nothing
    return [
      {
        siteVisitItemId: crypto.randomUUID(),
        itemLabel: "General Signage",
        lines: [newItem(18)],
        notes: "",
      },
    ];
  });

  // Recreated 2nd SS bottom section states
  const [discount, setDiscount] = useState<number>(
    initialQuotation?.discount ? Number(initialQuotation.discount) : 0
  );
  const [shipping, setShipping] = useState<number>(
    initialQuotation?.shipping ? Number(initialQuotation.shipping) : 0
  );

  
  const [taxPercent, setTaxPercent] = useState<number>(() => {
    if (initialQuotation) {
      const sub = Number(initialQuotation.subtotal) || 0;
      const tx = Number(initialQuotation.tax) || 0;
      if (sub > 0) {
        return Math.round((tx / sub) * 100);
      }
    }
    return 18; // default to 18%
  });

  const [showDiscountInput, setShowDiscountInput] = useState(discount > 0);
  const [showShippingInput, setShowShippingInput] = useState(shipping > 0);

  const [notes, setNotes] = useState(initialQuotation?.notes ?? "");
  const [terms, setTerms] = useState(
    initialQuotation?.terms ?? "Terms and conditions - late fees, payment methods, delivery schedule"
  );


  // Calculations
  const subtotal = sections.reduce((sum, sec) => {
    return sum + sec.lines.reduce((s, line) => s + calcLineAmount(line), 0);
  }, 0);

  const totalGst = sections.reduce((sum, sec) => {
    return sum + sec.lines.reduce((s, line) => s + (calcLineAmount(line) * ((line.gstRate || 0) / 100)), 0);
  }, 0);

  const tax = subtotal > 0 ? Math.round(totalGst * (1 - discount / subtotal) * 100) / 100 : 0;
  const grandTotal = Math.round((subtotal - discount + tax + shipping) * 100) / 100;

  // For staff (Employee), lock it if it's sent, approved, or pending approval.
  // For Admin, only lock it if it's Approved or Sent, but NOT when Pending Approval (Admin needs to edit/approve).
  // Note: currentUserRole gives us exact role.
  const isLocked = currentUserRole === "Admin" 
    ? (status === "Sent" || status === "Approved")
    : (status === "Sent" || status === "Approved" || status === "Pending Approval");
  const orderStage = order.stage || "";

  // ── Sync Global Tax to Line Items ──
  const syncGlobalTaxToLines = (newTaxRate: number) => {
    setSections(prev => 
      prev.map(sec => ({
        ...sec,
        lines: sec.lines.map(line => ({ ...line, gstRate: newTaxRate }))
      }))
    );
  };

  // ── Section Actions ──
  function updateSection(id: string, updater: (sec: SignageSection) => SignageSection) {
    setSections((prev) => prev.map((s) => (s.siteVisitItemId === id ? updater(s) : s)));
  }

  function removeSection(sectionId: string) {
    if (confirm("Are you sure you want to remove this entire signage section?")) {
      setSections((prev) => prev.filter((s) => s.siteVisitItemId !== sectionId));
    }
  }

  function addLine(sectionId: string) {
    updateSection(sectionId, (sec) => ({
      ...sec,
      lines: [...sec.lines, newItem(taxPercent)],
    }));
  }

  function removeLine(sectionId: string, lineId: string) {
    updateSection(sectionId, (sec) => {
      const remaining = sec.lines.filter((l) => l.id !== lineId);
      return {
        ...sec,
        lines: remaining.length > 0 ? remaining : [newItem(taxPercent)],
      };
    });
  }

  function updateLine(sectionId: string, lineId: string, patch: Partial<LineItem>) {
    updateSection(sectionId, (sec) => ({
      ...sec,
      lines: sec.lines.map((l) => (l.id === lineId ? { ...l, ...patch } : l)),
    }));
  }

  function selectProduct(sectionId: string, lineId: string, p: Product) {
    const resolved = resolveInitialPricing(p);
    const siteVisitItem = siteVisitItems.find((sv) => sv.id === sectionId);
    const defaultSqFt = (siteVisitItem?.width && siteVisitItem?.height) ? siteVisitItem.width * siteVisitItem.height : 1;

    updateLine(sectionId, lineId, {
      productId: p.id,
      description: p.name,
      pricingType: resolved.pricingType,
      unit: resolved.pricingType === "per_sqft" ? "sqft" : resolved.pricingType === "per_running_ft" ? "rft" : "nos",
      unitPrice: resolved.price,
      totalSqFt: resolved.pricingType === "per_sqft" ? defaultSqFt : 0,
    });
  }

  // ── Save/Send Actions ──
  function handleSave() {
    setSaveMsg(null);
    startTransition(async () => {
      try {
        await upsertQuotation(order.id, {
          quotation_id: quotationId || undefined,
          signage_options: sections,
          subtotal,
          discount,
          tax,
          grand_total: grandTotal,
          status,
          notes,
          terms,

          shipping,
        });
        setSaveMsg({ text: "Quotation saved ✓", ok: true });
        setTimeout(() => setSaveMsg(null), 3000);
      } catch (err: any) {
        setSaveMsg({ text: err.message || "Save failed", ok: false });
      }
    });
  }

  const handleSendToCustomer = async () => {
    setSendingToCustomer(true);
    try {
      const saved = await upsertQuotation(order.id, {
        quotation_id: quotationId || undefined,
        signage_options: sections,
        subtotal,
        discount,
        tax,
        grand_total: grandTotal,
        status: "Sent",
        notes,
        terms,

        shipping,
      });
      await sendQuotationToCustomer(saved.id, "Staff/Admin");
      setStatus("Sent");
      setSaveMsg({ text: "Quotation sent to customer successfully!", ok: true });
      setTimeout(() => setSaveMsg(null), 4000);
    } catch (err: any) {
      setSaveMsg({ text: err.message || "Send failed", ok: false });
    } finally {
      setSendingToCustomer(false);
    }
  };
  
  const handlePushToAdmin = async () => {
    setPushingToAdmin(true);
    try {
      await upsertQuotation(order.id, {
        quotation_id: quotationId || undefined,
        signage_options: sections,
        subtotal,
        discount,
        tax,
        grand_total: grandTotal,
        status: "Pending Approval",
        notes,
        terms,

        shipping,
      });
      setStatus("Pending Approval");
      setSaveMsg({ text: "Quotation submitted to Admin for approval!", ok: true });
      setTimeout(() => setSaveMsg(null), 4000);
    } catch (err: any) {
      setSaveMsg({ text: err.message || "Submission failed", ok: false });
    } finally {
      setPushingToAdmin(false);
    }
  };

  const handleRejectToDraft = async () => {
    startTransition(async () => {
      try {
        await upsertQuotation(order.id, {
          quotation_id: quotationId || undefined,
          signage_options: sections,
          subtotal,
          discount,
          tax,
          grand_total: grandTotal,
          status: "Draft",
          notes,
          terms,

          shipping,
        });
        setStatus("Draft");
        setSaveMsg({ text: "Quotation returned to Draft status.", ok: true });
        setTimeout(() => setSaveMsg(null), 4000);
      } catch (err: any) {
        setSaveMsg({ text: err.message || "Failed to return to draft", ok: false });
      }
    });
  };

  const handleMoveToNextStage = async () => {
    setIsMovingToDesign(true);
    try {
      const supabase = createClient();
      
      const { error: quoteErr } = await supabase
        .from("quotations")
        .update({
          advance_paid: true
        })
        .eq("order_id", order.id);

      if (quoteErr) throw new Error(quoteErr.message);

      await updateOrderStageAction(order.id, nextStageValue);

      setSaveMsg({ text: `Moved to ${nextStageLabel} phase successfully!`, ok: true });
      
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      console.error("Error moving to design:", err);
      setSaveMsg({ text: err.message || `Failed to move to ${nextStageLabel.toLowerCase()} phase`, ok: false });
      setTimeout(() => setSaveMsg(null), 4000);
    } finally {
      setIsMovingToDesign(false);
    }
  };

  const addCustomSection = () => {
    const label = prompt("Enter custom signage item name:");
    if (!label?.trim()) return;
    setSections((prev) => [
      ...prev,
      {
        siteVisitItemId: crypto.randomUUID(),
        itemLabel: label,
        lines: [newItem(taxPercent)],
        notes: "",
      },
    ]);
  };

  const inputCls = "border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500";

  return (
    <div className="space-y-6" style={{ fontFamily: "inherit" }}>
      {/* Header Row */}
      <div className="flex items-center justify-between bg-slate-50 p-4 border border-slate-200 rounded-2xl">
        <div className="flex flex-col gap-1.5">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <ClipboardList size={16} className="text-blue-600" />
            Quotation Builder
          </h3>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Quote No:</span>
            <input
              type="text"
              value={quotationId}
              readOnly={true}
              className="text-xs font-mono text-slate-700 bg-slate-100/50 border border-slate-200 cursor-not-allowed rounded px-2 py-1"
              style={{ width: "90px" }}
            />
          </div>
        </div>
        <div className="flex items-center gap-3">

          <span className={`text-[10px] px-2.5 py-1 rounded-full font-black uppercase border ${
            status === "Approved" ? "bg-emerald-50 border-emerald-200 text-emerald-700" :
            status === "Sent" ? "bg-blue-50 border-blue-200 text-blue-700" :
            status === "Rejected" ? "bg-rose-50 border-rose-200 text-rose-700" :
            "bg-slate-100 border-slate-200 text-slate-600"
          }`}>
            {status}
          </span>
        </div>
      </div>

      {status === "Pending Approval" && (
        <div className={`p-4 rounded-2xl border flex items-center gap-3 shadow-sm ${
          isEmployee 
            ? "bg-blue-50 border-blue-200 text-blue-800" 
            : "bg-amber-50 border-amber-200 text-amber-800"
        }`}>
          <Info size={16} className={isEmployee ? "text-blue-600" : "text-amber-600"} />
          <div className="text-xs font-semibold">
            {isEmployee 
              ? "Submitted for Approval: This quotation is pending review by Admin and is locked for editing."
              : "Pending Review: This quotation was submitted by staff. Please review the details, then approve and send it to the customer."}
          </div>
        </div>
      )}

      {status === "Rejected" && (
        <div className="p-4 rounded-2xl border flex items-center gap-3 shadow-sm bg-rose-50 border-rose-200 text-rose-800">
          <AlertCircle size={16} className="text-rose-600 shrink-0" />
          <div className="text-xs font-semibold">
            Quotation was rejected / declined by the customer.
            {rejectionReason && (
              <span className="block mt-1 text-rose-700 bg-white/50 px-2 py-1 rounded border border-rose-100">
                Reason: <span className="font-bold">"{rejectionReason}"</span>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Customer Info Card */}
      <div className="bg-white rounded-2xl px-5 py-4 border border-slate-200 flex justify-between items-start text-xs shadow-sm">
        <div className="space-y-1.5 flex-1 max-w-[60%]">
          <div className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Bill To</div>
          <input
            type="text"
            value={customerName}
            disabled={isLocked}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Customer Name..."
            className="w-full font-black text-slate-800 bg-transparent border-b border-dashed border-slate-200 focus:outline-none focus:border-blue-500 py-0.5"
          />
          <div className="text-slate-500 font-medium">{order.projectName}</div>
        </div>
        <div className="text-right">
          <div className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Date</div>
          <div className="font-mono text-slate-700 font-bold" suppressHydrationWarning>
            {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </div>
        </div>
      </div>



      {/* Signage Sections */}
      <div className="space-y-6">
        {sections.map((section, sIdx) => {
          const itemTotal = section.lines.reduce((s, line) => s + calcLineAmount(line) * (1 + (line.gstRate || 0) / 100), 0);
          // Check matching site visit measurements for details
          const svItem = siteVisitItems.find((sv) => sv.id === section.siteVisitItemId);

          return (
            <div key={section.siteVisitItemId} className="border border-slate-200 rounded-2xl bg-white shadow-sm overflow-visible">
              {/* Section Header */}
              <div className="bg-[#f8fafc] px-5 py-3.5 border-b border-slate-100 flex items-center justify-between rounded-t-2xl">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-black text-[#0f172a] uppercase tracking-wider">{section.itemLabel}</span>
                  {svItem && (svItem.width || svItem.height) && (
                    <span className="text-[10px] text-slate-400 font-bold uppercase">
                      Site Measurement: {svItem.width ?? "—"} × {svItem.height ?? "—"} ft
                      {svItem.depth ? ` · depth: ${svItem.depth} in` : ""}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-black uppercase">Total (incl. GST):</span>
                    <span className="text-sm font-black text-[#1e40af] font-mono">
                      ₹{itemTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  {!isLocked && (
                    <button
                      type="button"
                      onClick={() => removeSection(section.siteVisitItemId)}
                      className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                      title="Remove section"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>

              {/* Line Items Table Header */}
              <div
                className="grid gap-2 px-4 py-2.5 text-[10px] font-black text-[#64748b] uppercase tracking-wider bg-slate-50 border-b border-slate-100"
                style={{
                  gridTemplateColumns: "1fr 70px 105px 80px 105px 40px 90px 28px",
                }}
              >
                <div>Item Description</div>
                <div className="text-center">Qty</div>
                <div className="text-center">Unit Type</div>
                <div className="text-center">Measure</div>
                <div className="text-right">Rate (₹)</div>
                <div className="text-center">GST</div>
                <div className="text-right">Amount (₹)</div>
                <div />
              </div>

              {/* Lines */}
              <div className="divide-y divide-slate-100 overflow-visible">
                {section.lines.map((line) => {
                  const lineAmt = calcLineAmount(line) * (1 + (line.gstRate || 0) / 100);
                  const isSqft = line.pricingType === "per_sqft" || line.pricingType === "per_running_ft";

                  return (
                    <div key={line.id} className="flex flex-col hover:bg-slate-50 transition-colors">
                      <div
                        className="grid gap-2 px-4 py-3.5 items-center overflow-visible"
                        style={{
                          gridTemplateColumns: "1fr 70px 105px 80px 105px 40px 90px 28px",
                          position: "relative",
                          zIndex: activeRowId === line.id ? 50 : 1,
                        }}
                      onFocus={() => setActiveRowId(line.id)}
                      onBlur={(e) => {
                        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                          setActiveRowId(null);
                        }
                      }}
                    >
                      {/* Product Search / Description */}
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", width: "100%" }}>
                        <ProductSearch
                          value={line.description}
                          products={products}
                          disabled={isLocked}
                          onSelect={(p) => selectProduct(section.siteVisitItemId, line.id, p)}
                          onChange={(val) =>
                            updateLine(section.siteVisitItemId, line.id, {
                              description: val,
                              productId: undefined,
                            })
                          }
                        />
                        {line.productId && (
                          <button
                            type="button"
                            onClick={() => {
                              const prod = products.find((p) => p.id === line.productId);
                              if (prod) setSelectedProductInfo(prod);
                            }}
                            style={{
                              padding: "4px",
                              color: "#2563eb",
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              borderRadius: "4px",
                              flexShrink: 0
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#eff6ff"}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                            title="Product Details"
                          >
                            <Info size={14} style={{ strokeWidth: 2.5 }} />
                          </button>
                        )}
                      </div>

                      {/* Qty */}
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={line.quantity === 0 ? "" : line.quantity}
                        disabled={isLocked}
                        onFocus={(e) => e.target.select()}
                        onBlur={() => {
                          if (line.quantity <= 0) {
                            updateLine(section.siteVisitItemId, line.id, { quantity: 1 });
                          }
                        }}
                        onChange={(e) =>
                          updateLine(section.siteVisitItemId, line.id, {
                            quantity: Number(e.target.value) || 0,
                          })
                        }
                        className={`${inputCls} w-full py-1.5 text-center font-mono`}
                        placeholder="0"
                      />

                      {/* Unit Type Selector */}
                      <select
                        value={line.pricingType}
                        disabled={isLocked}
                        onChange={(e) => {
                          const newType = e.target.value as "per_unit" | "per_sqft" | "per_running_ft";
                          const patch: Partial<LineItem> = { pricingType: newType };
                          if (line.productId) {
                            const p = products.find((prod) => prod.id === line.productId);
                            if (p) {
                              patch.unitPrice = getProductPriceForType(p, newType);
                            }
                          }
                          updateLine(section.siteVisitItemId, line.id, patch);
                        }}
                        className={`${inputCls} w-full py-1.5 px-2 bg-white`}
                      >
                        <option value="per_unit">Per Unit</option>
                        <option value="per_sqft">Per Sq.Ft</option>
                        <option value="per_running_ft">Per Run.Ft</option>
                      </select>

                      {/* Measure (SqFt / Running Ft) */}
                      {isSqft ? (
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={line.totalSqFt === 0 ? "" : line.totalSqFt}
                          disabled={isLocked}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) =>
                            updateLine(section.siteVisitItemId, line.id, {
                              totalSqFt: parseFloat(e.target.value) || 0,
                            })
                          }
                          className={`${inputCls} w-full py-1.5 text-center font-mono`}
                          placeholder={line.pricingType === "per_sqft" ? "Sq.Ft" : "Run.Ft"}
                        />
                      ) : (
                        <div className="text-center text-[10px] text-slate-300 font-bold">—</div>
                      )}

                      {/* Rate */}
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">₹</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={line.unitPrice === 0 ? "" : line.unitPrice}
                          disabled={isLocked}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) =>
                            updateLine(section.siteVisitItemId, line.id, {
                              unitPrice: parseFloat(e.target.value) || 0,
                            })
                          }
                          className={`${inputCls} w-full pl-5 pr-2 py-1.5 text-right font-mono`}
                          placeholder="0.00"
                        />
                      </div>

                      {/* GST */}
                      <select
                        value={line.gstRate}
                        disabled={isLocked}
                        onChange={(e) =>
                          updateLine(section.siteVisitItemId, line.id, {
                            gstRate: Number(e.target.value),
                          })
                        }
                        className={`${inputCls} w-full py-1.5 text-center bg-white`}
                      >
                        {GST_OPTIONS.map((g) => (
                          <option key={g} value={g}>{g}%</option>
                        ))}
                      </select>

                      {/* Line Amount */}
                      <div className="text-right text-xs font-black font-mono text-slate-800 whitespace-nowrap">
                        ₹{lineAmt.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>

                      {/* Delete button */}
                      <button
                        type="button"
                        disabled={isLocked}
                        onClick={() => removeLine(section.siteVisitItemId, line.id)}
                        className="text-slate-300 hover:text-rose-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    {/* Note section */}
                    <div className="px-4 pb-3 flex flex-col gap-2">
                      {(line.notes !== undefined && line.notes !== null) ? (
                        <div className="relative">
                          <textarea
                            value={line.notes}
                            onChange={(e) => updateLine(section.siteVisitItemId, line.id, { notes: e.target.value })}
                            placeholder="Add item notes..."
                            disabled={isLocked}
                            className="w-full text-xs p-2 pr-8 border border-slate-200 rounded-lg outline-none focus:border-blue-500 min-h-[60px] text-slate-700 resize-y"
                          />
                          {!isLocked && (
                            <button
                              type="button"
                              onClick={() => updateLine(section.siteVisitItemId, line.id, { notes: undefined })}
                              className="absolute top-2 right-2 text-slate-400 hover:text-rose-500 bg-white rounded-md transition-colors"
                              title="Remove notes"
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      ) : (
                        !isLocked && (
                          <button
                            type="button"
                            onClick={() => updateLine(section.siteVisitItemId, line.id, { notes: "" })}
                            className="text-xs text-blue-600 font-semibold flex items-center gap-1 hover:text-blue-700 self-start"
                          >
                            <Plus size={12} /> Add Note
                          </button>
                        )
                      )}
                    </div>
                  </div>
                  );
                })}
              </div>

              {/* Add Line inside section */}
              {!isLocked && (
                <div className="border-t border-slate-100 p-3 bg-slate-50/50 rounded-b-2xl">
                  <button
                    type="button"
                    onClick={() => addLine(section.siteVisitItemId)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 border border-dashed border-slate-200 rounded-xl text-xs font-bold text-slate-500 hover:border-blue-400 hover:text-blue-600 transition-all bg-white shadow-sm"
                  >
                    <Plus size={13} /> Add Line Item
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Custom signage section button */}
      {!isLocked && (
        <button
          type="button"
          onClick={addCustomSection}
          className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-slate-300 rounded-2xl text-xs font-black text-slate-500 hover:border-blue-500 hover:text-blue-600 hover:bg-slate-50 transition-all"
        >
          <Plus size={14} /> Add Custom Signage Item
        </button>
      )}



      {/* Recreated 2nd SS bottom section layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        {/* Left Column: Notes, Included Services, Terms */}
        <div className="space-y-4">
          {/* Notes */}
          <div>
            <label className="block text-[10px] font-black text-[#0f172a] uppercase tracking-wider mb-1">Notes</label>
            <textarea
              value={notes}
              disabled={isLocked}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Internal notes or notes for customer..."
              className={`${inputCls} w-full px-3.5 py-2.5 resize-none bg-white font-medium`}
            />
          </div>



          {/* Terms & Conditions */}
          <div>
            <label className="block text-[10px] font-black text-[#0f172a] uppercase tracking-wider mb-1">Terms & Conditions</label>
            <textarea
              value={terms}
              disabled={isLocked}
              onChange={(e) => setTerms(e.target.value)}
              rows={3}
              placeholder="Terms and conditions - late fees, payment methods, delivery schedule"
              className={`${inputCls} w-full px-3.5 py-2.5 resize-none bg-white font-medium`}
            />
          </div>
        </div>

        {/* Right Column: Invoice summary details */}
        <div className="bg-[#f8fafc] border border-slate-200/80 rounded-3xl p-6 space-y-4 shadow-sm h-fit">
          {/* Subtotal */}
          <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-wider pb-3 border-b border-slate-200/50">
            <span>Subtotal</span>
            <span className="font-mono text-slate-800 text-sm">
              ₹{subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
          </div>

          {/* Tax Amount Display */}
          <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-wider pb-3 border-b border-slate-200/50">
            <span>Tax Amount (GST)</span>
            <span className="font-mono text-slate-800">
              ₹{tax.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
          </div>

          {/* Discount & Shipping Buttons / Inputs */}
          <div className="space-y-3.5 py-1.5">
            <div className="flex gap-4">
              {!showDiscountInput && (
                <button
                  type="button"
                  onClick={() => setShowDiscountInput(true)}
                  className="text-xs font-black text-[#1e40af] hover:text-[#173087] flex items-center gap-1 transition-colors"
                >
                  + Discount
                </button>
              )}
              {!showShippingInput && (
                <button
                  type="button"
                  onClick={() => setShowShippingInput(true)}
                  className="text-xs font-black text-[#1e40af] hover:text-[#173087] flex items-center gap-1 transition-colors"
                >
                  + Shipping
                </button>
              )}
            </div>

            {showDiscountInput && (
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-[#0f172a] uppercase tracking-wider">Discount (₹)</label>
                  <button
                    type="button"
                    onClick={() => {
                      setDiscount(0);
                      setShowDiscountInput(false);
                    }}
                    className="text-[10px] text-rose-500 hover:underline font-bold"
                  >
                    Remove
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-black">₹</span>
                  <input
                    type="number"
                    min="0"
                    value={discount === 0 ? "" : discount}
                    disabled={isLocked && isEmployee}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                    className={`${inputCls} w-full pl-7 pr-3 py-2 font-mono font-bold bg-white`}
                    placeholder="0.00"
                  />
                </div>
              </div>
            )}

            {showShippingInput && (
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-[#0f172a] uppercase tracking-wider">Shipping (₹)</label>
                  <button
                    type="button"
                    onClick={() => {
                      setShipping(0);
                      setShowShippingInput(false);
                    }}
                    className="text-[10px] text-rose-500 hover:underline font-bold"
                  >
                    Remove
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-black">₹</span>
                  <input
                    type="number"
                    min="0"
                    value={shipping === 0 ? "" : shipping}
                    disabled={isLocked}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setShipping(parseFloat(e.target.value) || 0)}
                    className={`${inputCls} w-full pl-7 pr-3 py-2 font-mono font-bold bg-white`}
                    placeholder="0.00"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Grand Total */}
          <div className="flex justify-between items-center py-4 border-t border-slate-200">
            <span className="font-black text-slate-900 text-sm uppercase tracking-wider">Total</span>
            <span className="font-black text-[#0f172a] text-xl font-mono">
              ₹{grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
          </div>

        </div>
      </div>

      {/* Checklist & Move to Next Stage Box */}
      {status === "Approved" && (
        <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Sparkles size={14} className="text-blue-600 animate-pulse" />
                Quotation Approved - Next Steps
              </h4>
              <p className="text-[11px] text-slate-500 font-bold">
                Please verify the checklist below to transition this order to the {nextStageLabel} phase.
              </p>
              
              {/* Checklist */}
              <div className="space-y-2 pt-2">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={advanceReceived}
                    disabled={isPastQuotation}
                    onChange={(e) => setAdvanceReceived(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer disabled:cursor-not-allowed"
                  />
                  <span className="text-xs font-bold text-slate-700">
                    Advance payment received
                  </span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={measurementsVerified}
                    disabled={isPastQuotation}
                    onChange={(e) => setMeasurementsVerified(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer disabled:cursor-not-allowed"
                  />
                  <span className="text-xs font-bold text-slate-700">
                    Site measurements and requirements verified
                  </span>
                </label>
              </div>
            </div>

            <div className="flex flex-col items-stretch md:items-end gap-3 justify-center">
              {isPastQuotation ? (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl px-4 py-3 flex items-center gap-2 text-xs font-bold shadow-sm">
                  <ShieldCheck size={16} className="text-emerald-600" />
                  <div>
                    <div className="font-black uppercase tracking-wider text-[10px]">Moved to {nextStageLabel}</div>
                    <div className="text-[10px] text-emerald-600 font-bold">Advance paid & verified</div>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={!advanceReceived || !measurementsVerified || isMovingToDesign}
                  onClick={handleMoveToNextStage}
                  className="py-2 px-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isMovingToDesign ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      Moving to {nextStageLabel}...
                    </>
                  ) : (
                    <>
                      <Sparkles size={13} />
                      Move to {nextStageLabel}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Save Msg Notification */}
      {saveMsg && (
        <div className={`p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm border ${
          saveMsg.ok ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-rose-50 border-rose-200 text-rose-700"
        }`}>
          {saveMsg.ok ? <Check size={14} /> : <AlertCircle size={14} />}
          {saveMsg.text}
        </div>
      )}

      {/* Action Buttons Row */}
      {(() => {
        const portalTarget = isMounted ? document.getElementById("modal-footer-portal") : null;
        
        const isEmployee = currentUserRole === "Employee";
        const isAdmin = currentUserRole === "Admin";
        
        const actionButtons = (
          <>
            {!isLocked ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isPending}
                  className="py-2 px-4 bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-sm"
                >
                  {isPending ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                  Save Draft
                </button>
                
                {isEmployee && (
                  <button
                    type="button"
                    onClick={() => setPendingAction("admin")}
                    disabled={isPending || sections.length === 0}
                    className="py-2 px-4 bg-[#22c55e] hover:bg-[#16a34a] text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Check size={14} /> Push to Admin
                  </button>
                )}
                
                {isAdmin && status === "Pending Approval" && (
                  <button
                    type="button"
                    onClick={handleRejectToDraft}
                    disabled={isPending}
                    className="py-2 px-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <AlertCircle size={14} /> Request Changes
                  </button>
                )}
                
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setPendingAction("customer")}
                    disabled={isPending || sections.length === 0}
                    className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Check size={14} /> Push to Customer
                  </button>
                )}
              </div>
            ) : (
              <div className="py-2 px-4 bg-slate-100 border border-slate-200 text-slate-500 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-sm">
                <Check size={14} /> Submitted & Locked
              </div>
            )}
          </>
        );

        if (portalTarget) {
          return createPortal(
            <div className="flex gap-2.5 items-center justify-end w-full">
              {actionButtons}
            </div>,
            portalTarget
          );
        }

        return null;
      })()}

      {selectedProductInfo && (
        <ProductInfoModal
          product={selectedProductInfo}
          onClose={() => setSelectedProductInfo(null)}
        />
      )}

      {pendingAction && (
        <QuotationConfirmModal
          actionType={pendingAction}
          subtotal={subtotal}
          discount={discount}
          tax={tax}
          grandTotal={grandTotal}
          totalItems={sections.reduce((acc, sec) => acc + sec.lines.length, 0)}
          sectionSummaries={sections.map((sec) => ({
            id: sec.siteVisitItemId,
            name: sec.itemLabel || "Custom Signage",
            linesCount: sec.lines.length,
            amount: sec.lines.reduce((s, line) => s + calcLineAmount(line), 0),
            lines: sec.lines.map(l => ({
              id: l.id,
              description: l.description || "Custom Item",
              amount: calcLineAmount(l)
            }))
          }))}
          onConfirm={() => {
            if (pendingAction === "admin") {
              handlePushToAdmin();
            } else if (pendingAction === "customer") {
              handleSendToCustomer();
            }
            setPendingAction(null);
          }}
          onClose={() => setPendingAction(null)}
        />
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Product Info Popup Modal Component
// ─────────────────────────────────────────────────────────────────────────────
function ProductInfoModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const images = product.images && product.images.length > 0 ? product.images : [];

  return (
    <div 
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        backdropFilter: "blur(4px)",
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      <div 
        style={{
          backgroundColor: "white",
          borderRadius: "24px",
          maxWidth: "500px",
          width: "100%",
          overflow: "hidden",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          border: "1px solid #f1f5f9",
          display: "flex",
          flexDirection: "column",
          maxHeight: "90vh",
        }}
      >
        {/* Header */}
        <div 
          style={{
            padding: "16px 24px",
            borderBottom: "1px solid #f1f5f9",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#f8fafc",
          }}
        >
          <div>
            <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 900, color: "#1e293b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {product.name}
            </h4>
            <span style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", marginTop: "2px", display: "block" }}>
              {product.product_id} • {product.category || "General"}
            </span>
          </div>
          <button 
            onClick={onClose} 
            style={{
              padding: "6px",
              backgroundColor: "transparent",
              border: "none",
              cursor: "pointer",
              borderRadius: "9999px",
              color: "#94a3b8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#e2e8f0"; e.currentTarget.style.color = "#475569"; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "#94a3b8"; }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div style={{ padding: "24px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Images Section */}
          {images.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div 
                style={{
                  aspectRatio: "16/9",
                  backgroundColor: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "16px",
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                }}
              >
                <img
                  src={images[activeImgIdx]}
                  alt={product.name}
                  style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }}
                  onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1542744094-3a31f103e35f?w=400&auto=format&fit=crop"; }}
                />
              </div>
              {images.length > 1 && (
                <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px" }}>
                  {images.map((img: string, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImgIdx(idx)}
                      style={{
                        width: "56px",
                        height: "56px",
                        borderRadius: "8px",
                        overflow: "hidden",
                        border: activeImgIdx === idx ? "2px solid #2563eb" : "2px solid #cbd5e1",
                        padding: 0,
                        backgroundColor: "transparent",
                        cursor: "pointer",
                        flexShrink: 0,
                        transition: "all 0.2s",
                      }}
                    >
                      <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div 
              style={{
                aspectRatio: "16/9",
                backgroundColor: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "16px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                color: "#cbd5e1",
                gap: "4px",
              }}
            >
              <Package size={32} style={{ strokeWidth: 1.5 }} />
              <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase" }}>No images uploaded</span>
            </div>
          )}

          {/* Pricing Info */}
          <div 
            style={{
              backgroundColor: "rgba(219, 234, 254, 0.3)",
              border: "1px solid #dbeafe",
              borderRadius: "16px",
              padding: "16px",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
            }}
          >
            <div>
              <span style={{ fontSize: "9px", color: "#94a3b8", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em", display: "block" }}>Pricing Type</span>
              <span style={{ fontSize: "12px", fontWeight: 800, color: "#334155", textTransform: "capitalize", display: "block", marginTop: "2px" }}>
                {product.pricing_type?.replace("_", " ")}
              </span>
            </div>
            <div>
              <span style={{ fontSize: "9px", color: "#94a3b8", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em", display: "block" }}>Standard Rate</span>
              <span style={{ fontSize: "12px", fontWeight: 900, color: "#1d4ed8", fontFamily: "monospace", display: "block", marginTop: "2px" }}>
                ₹{(product.price_per_unit || product.price_per_sqft || product.price_per_running_ft || 0).toLocaleString("en-IN")}
                <span style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 500, fontFamily: "sans-serif" }}>
                  /{product.pricing_type === "per_sqft" ? "sqft" : product.pricing_type === "per_running_ft" ? "rft" : "unit"}
                </span>
              </span>
            </div>
          </div>

          {/* Additional details */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <span style={{ fontSize: "9px", color: "#94a3b8", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em" }}>Product Description</span>
            <p style={{ margin: 0, fontSize: "12px", color: "#475569", lineHeight: 1.6, fontWeight: 500 }}>
              High-quality {product.name} suitable for premium indoor and outdoor signage applications. Manufactured with durable materials to ensure long-lasting visibility and brand representation.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div 
          style={{
            padding: "12px 24px",
            borderTop: "1px solid #f1f5f9",
            backgroundColor: "#f8fafc",
            display: "flex",
            justifyContent: "end",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "8px 16px",
              backgroundColor: "#1e293b",
              color: "white",
              border: "none",
              borderRadius: "12px",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
              transition: "background-color 0.2s",
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#0f172a"}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#1e293b"}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Quotation Confirm Modal Component
// ─────────────────────────────────────────────────────────────────────────────
function QuotationConfirmModal({
  actionType,
  subtotal,
  discount,
  tax,
  grandTotal,
  totalItems,
  sectionSummaries,
  onConfirm,
  onClose,
}: {
  actionType: "admin" | "customer";
  subtotal: number;
  discount: number;
  tax: number;
  grandTotal: number;
  totalItems: number;
  sectionSummaries: { 
    id: string; 
    name: string; 
    linesCount: number; 
    amount: number;
    lines: { id: string; description: string; amount: number; }[];
  }[];
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        backdropFilter: "blur(2px)",
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "16px",
          maxWidth: "400px",
          width: "100%",
          overflow: "hidden",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          border: "1px solid #f1f5f9",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", backgroundColor: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 800, color: "#0f172a", textTransform: "uppercase" }}>
              Confirm Quotation
            </h4>
            <span style={{ fontSize: "10px", color: "#64748b", fontWeight: 600 }}>
              {actionType === "admin" ? "Sending to Admin for Review" : "Sending to Customer for Approval"}
            </span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* Section Summaries Breakdown */}
          {sectionSummaries && sectionSummaries.length > 0 && (
            <div style={{ maxHeight: "160px", overflowY: "auto", borderBottom: "1px dashed #cbd5e1", paddingBottom: "12px", marginBottom: "4px", display: "flex", flexDirection: "column", gap: "10px" }}>
              {sectionSummaries.map((sec) => (
                <div key={sec.id} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontSize: "12px", color: "#334155", fontWeight: 700 }}>{sec.name}</span>
                      <span style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 600 }}>{sec.linesCount} line item{sec.linesCount !== 1 ? 's' : ''}</span>
                    </div>
                    <span style={{ fontSize: "12px", color: "#0f172a", fontWeight: 700 }}>
                      ₹{sec.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  {/* Detailed Lines */}
                  {sec.lines && sec.lines.length > 0 && (
                    <div style={{ paddingLeft: "8px", borderLeft: "2px solid #e2e8f0", display: "flex", flexDirection: "column", gap: "4px" }}>
                      {sec.lines.map(line => (
                        <div key={line.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: "11px", color: "#64748b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "220px" }}>
                            {line.description}
                          </span>
                          <span style={{ fontSize: "11px", color: "#475569", fontWeight: 600 }}>
                            ₹{line.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>Total Items</span>
            <span style={{ fontSize: "12px", color: "#0f172a", fontWeight: 800 }}>{totalItems}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>Subtotal</span>
            <span style={{ fontSize: "12px", color: "#0f172a", fontWeight: 800 }}>₹{subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
          </div>
          {discount > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>Discount</span>
              <span style={{ fontSize: "12px", color: "#16a34a", fontWeight: 800 }}>-₹{discount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>Tax (GST)</span>
            <span style={{ fontSize: "12px", color: "#0f172a", fontWeight: 800 }}>+₹{tax.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
          </div>
          <div style={{ borderTop: "1px dashed #cbd5e1", margin: "4px 0" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "14px", color: "#0f172a", fontWeight: 900 }}>Grand Total</span>
            <span style={{ fontSize: "16px", color: "#2563eb", fontWeight: 900 }}>₹{grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 20px", borderTop: "1px solid #f1f5f9", backgroundColor: "#f8fafc", display: "flex", justifyContent: "flex-end", gap: "8px" }}>
          <button
            onClick={onClose}
            style={{ padding: "8px 16px", backgroundColor: "white", color: "#475569", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f1f5f9"}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "white"}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{ padding: "8px 16px", backgroundColor: "#22c55e", color: "white", border: "none", borderRadius: "8px", fontSize: "12px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#16a34a"}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#22c55e"}
          >
            <Check size={14} /> Confirm & Proceed
          </button>
        </div>
      </div>
    </div>
  );
}
