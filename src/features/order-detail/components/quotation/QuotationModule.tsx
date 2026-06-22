"use client";

import React, { useState, useEffect, useRef, useTransition } from "react";
import { Plus, Trash2, Search, Check, ChevronDown } from "lucide-react";
import { upsertQuotation } from "@/features/quotations/actions/quotationActions";

type PricingType = "per_unit" | "per_sqft";

interface Product {
  id: string;
  product_id: string;
  name: string;
  category: string | null;
  pricing_type: PricingType;
  unit_price: number;
  unit: string;
  is_active: boolean;
}

interface LineItem {
  id: string;
  productId?: string;
  description: string;
  quantity: number;
  pricingType: PricingType;
  unit: string;
  unitPrice: number;
  totalSqFt: number;
  gstRate: number;
}

interface Quotation {
  id?: string;
  quotation_id?: string;
  customer_name?: string;
  status: "Draft" | "Sent" | "Approved" | "Rejected";
  items: LineItem[];
  subtotal: number;
  discount: number;
  tax: number;
  grand_total: number;
  notes: string;
  terms: string;
  valid_until: string;
}

interface QuotationModuleProps {
  order: {
    id: string;
    orderId?: string;
    projectName: string;
    customerName?: string;
    customerId?: string;
  };
  isEmployee: boolean;
  products: Product[];
  initialQuotation: Quotation | null;
}

const GST_OPTIONS = [0, 5, 12, 18, 28];

function newItem(): LineItem {
  return {
    id: crypto.randomUUID(),
    description: "",
    quantity: 1,
    pricingType: "per_unit",
    unit: "nos",
    unitPrice: 0,
    totalSqFt: 0,
    gstRate: 18,
  };
}

function calcLineAmount(item: LineItem): number {
  if (item.pricingType === "per_sqft") {
    return item.quantity * item.totalSqFt * item.unitPrice;
  }
  return item.quantity * item.unitPrice;
}

function recalcTotals(items: LineItem[], discount: number) {
  const subtotal = items.reduce((s, i) => s + calcLineAmount(i), 0);
  const tax = items.reduce((s, i) => {
    const base = calcLineAmount(i);
    return s + base * (i.gstRate / 100);
  }, 0);
  const grand_total = subtotal - discount + tax;
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    grand_total: Math.round(grand_total * 100) / 100,
  };
}

// ── Product Search Dropdown ──────────────────────────────────────────────────

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

  useEffect(() => { setQuery(value); }, [value]);

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
    <div ref={ref} style={{ position: "relative", flex: 1 }}>
      <div style={{ position: "relative" }}>
        <Search
          size={11}
          style={{
            position: "absolute", left: 8, top: "50%",
            transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none",
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
          onFocus={() => { if (query) setOpen(true); }}
          placeholder="Type to search products…"
          className="w-full border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          style={{ padding: "6px 8px 6px 24px", fontFamily: "inherit" }}
        />
      </div>

      {open && filtered.length > 0 && (
        <div
          style={{
            position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
            background: "white", border: "1px solid #e2e8f0", borderRadius: 8,
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 200,
            maxHeight: 220, overflowY: "auto",
          }}
        >
          {filtered.map((p) => (
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
                width: "100%", textAlign: "left", padding: "8px 12px",
                background: "none", border: "none", cursor: "pointer",
                borderBottom: "1px solid #f1f5f9", display: "flex",
                alignItems: "center", justifyContent: "space-between", gap: 8,
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#f8fafc"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "none"; }}
            >
              <div>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>{p.name}</span>
                {p.category && (
                  <span style={{ fontSize: 10, color: "#94a3b8", marginLeft: 6 }}>{p.category}</span>
                )}
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#0f172a", fontFamily: "monospace" }}>
                  ₹{Number(p.unit_price).toLocaleString("en-IN")}
                </div>
                <div style={{ fontSize: 10, color: "#64748b" }}>per {p.unit}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export const QuotationModule: React.FC<QuotationModuleProps> = ({
  order,
  isEmployee,
  products,
  initialQuotation,
}) => {
  const [isPending, startTransition] = useTransition();
  const [saveMsg, setSaveMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [activeRowId, setActiveRowId] = useState<string | null>(null);

  const [quotation, setQuotation] = useState<Quotation>(() =>
    initialQuotation
      ? {
          ...initialQuotation,
          quotation_id: initialQuotation.quotation_id || "",
          customer_name: initialQuotation.customer_name || order.customerName || "",
          items: (initialQuotation.items || []).map((i: any) => ({
            id: i.id || crypto.randomUUID(),
            productId: i.productId,
            description: i.description || "",
            quantity: Number(i.quantity) || 1,
            pricingType: i.pricingType || "per_unit",
            unit: i.unit || "nos",
            unitPrice: Number(i.unitPrice) || 0,
            totalSqFt: Number(i.totalSqFt) || 0,
            gstRate: Number(i.gstRate) ?? 18,
          })),
        }
      : {
          quotation_id: "",
          customer_name: order.customerName || "",
          status: "Draft",
          items: [newItem()],
          subtotal: 0,
          discount: 0,
          tax: 0,
          grand_total: 0,
          notes: "",
          terms: "",
          valid_until: "",
        }
  );

  // ── Item helpers ─────────────────────────────────────────────────────────

  function updateItems(updater: (prev: LineItem[]) => LineItem[]) {
    setQuotation((q) => {
      const items = updater(q.items);
      const totals = recalcTotals(items, q.discount);
      return { ...q, items, ...totals };
    });
  }

  function addItem() {
    updateItems((items) => [...items, newItem()]);
  }

  function removeItem(id: string) {
    updateItems((items) => items.filter((i) => i.id !== id));
  }

  function updateItem(id: string, patch: Partial<LineItem>) {
    updateItems((items) =>
      items.map((i) => (i.id === id ? { ...i, ...patch } : i))
    );
  }

  function selectProduct(itemId: string, p: Product) {
    updateItem(itemId, {
      productId: p.id,
      description: p.name,
      pricingType: p.pricing_type,
      unit: p.unit,
      unitPrice: Number(p.unit_price),
      totalSqFt: p.pricing_type === "per_sqft" ? 1 : 0,
    });
  }

  function updateDiscount(val: number) {
    setQuotation((q) => {
      const totals = recalcTotals(q.items, val);
      return { ...q, discount: val, ...totals };
    });
  }

  // ── Save ─────────────────────────────────────────────────────────────────

  function handleSave() {
    startTransition(async () => {
      try {
        await upsertQuotation(order.id, {
          quotation_id: quotation.quotation_id || undefined,
          items: quotation.items,
          subtotal: quotation.subtotal,
          discount: quotation.discount,
          tax: quotation.tax,
          grand_total: quotation.grand_total,
          status: quotation.status,
          notes: quotation.notes || undefined,
          terms: quotation.terms || undefined,
          valid_until: quotation.valid_until || null,
          customer_id: order.customerId,
          customer_name: quotation.customer_name || order.customerName,
        });
        setSaveMsg({ text: "Quotation saved ✓", ok: true });
      } catch (err: any) {
        setSaveMsg({ text: err.message || "Save failed", ok: false });
      } finally {
        setTimeout(() => setSaveMsg(null), 3000);
      }
    });
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const inputCls = "border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500";

  return (
    <div className="space-y-5">
      {/* Header Row */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            Product Quotation
          </h3>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Quote No:</span>
            <input
              type="text"
              value={quotation.quotation_id || ""}
              disabled={isEmployee}
              onChange={(e) => setQuotation(q => ({ ...q, quotation_id: e.target.value }))}
              placeholder="e.g. QT-001"
              className="border-b border-dashed border-slate-300 text-xs font-mono text-slate-600 focus:outline-none focus:border-blue-500 bg-transparent px-1 py-0.5"
              style={{ width: "120px" }}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Status selector */}
          <div style={{ position: "relative" }}>
            <select
              value={quotation.status}
              onChange={(e) =>
                setQuotation((q) => ({ ...q, status: e.target.value as any }))
              }
              className={`${inputCls} pl-3 pr-7 py-1.5 appearance-none cursor-pointer`}
              style={{ fontFamily: "inherit" }}
            >
              {["Draft", "Sent", "Approved", "Rejected"].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <ChevronDown size={11} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }} />
          </div>

          {/* Valid Until */}
          <input
            type="date"
            value={quotation.valid_until || ""}
            onChange={(e) => setQuotation((q) => ({ ...q, valid_until: e.target.value }))}
            className={`${inputCls} px-2 py-1.5`}
            style={{ fontFamily: "inherit" }}
            title="Valid Until"
          />
          <span className="text-[10px] text-slate-400 font-bold">STAGE 2</span>
        </div>
      </div>

      {/* Customer strip */}
      <div className="bg-slate-50 rounded-xl px-4 py-3 border border-slate-200 flex justify-between items-start text-xs">
        <div className="space-y-1.5 flex-1 max-w-[60%]">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bill To</div>
          <input
            type="text"
            value={quotation.customer_name || ""}
            disabled={isEmployee}
            onChange={(e) => setQuotation(q => ({ ...q, customer_name: e.target.value }))}
            placeholder="Biller Name..."
            className="w-full font-bold text-slate-800 bg-transparent border-b border-dashed border-slate-300 focus:outline-none focus:border-blue-500 py-0.5"
            style={{ fontFamily: "inherit" }}
          />
          <div className="text-slate-500">{order.projectName}</div>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Date</div>
          <div className="font-mono text-slate-700">{new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</div>
        </div>
      </div>

      {/* Line Items Table */}
      <div className="border border-slate-200 rounded-2xl bg-white relative z-10">
        {/* Table Header */}
        <div
          className="grid gap-2 px-3 py-2 text-[10px] font-bold text-white uppercase tracking-wider"
          style={{
            gridTemplateColumns: "2fr 60px 80px 70px 60px 60px 28px",
            background: "#0f172a",
            borderTopLeftRadius: "15px",
            borderTopRightRadius: "15px",
          }}
        >
          <div>Item / Description</div>
          <div className="text-center">Qty</div>
          <div className="text-center">Rate (₹)</div>
          <div className="text-center">Sq Ft</div>
          <div className="text-center">GST %</div>
          <div className="text-right">Amount</div>
          <div />
        </div>

        {/* Items */}
        <div className="divide-y divide-slate-100">
          {quotation.items.map((item, idx) => {
            const amount = calcLineAmount(item);
            const isPerSqft = item.pricingType === "per_sqft";

            return (
              <div
                key={item.id}
                className="grid gap-2 px-3 py-2.5 items-center"
                style={{ 
                  gridTemplateColumns: "2fr 60px 80px 70px 60px 60px 28px",
                  position: "relative",
                  zIndex: activeRowId === item.id ? 50 : 1
                }}
                onFocus={() => setActiveRowId(item.id)}
                onBlur={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                    setActiveRowId(null);
                  }
                }}
              >
                {/* Description + product search */}
                <ProductSearch
                  value={item.description}
                  products={products}
                  disabled={isEmployee}
                  onSelect={(p) => selectProduct(item.id, p)}
                  onChange={(val) => updateItem(item.id, { description: val, productId: undefined })}
                />

                {/* Qty */}
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={item.quantity === 0 ? "" : item.quantity}
                  disabled={isEmployee}
                  onChange={(e) => updateItem(item.id, { quantity: e.target.value === "" ? 0 : Math.max(0, Number(e.target.value)) })}
                  className={`${inputCls} w-full px-2 py-1.5 text-center font-mono`}
                  style={{ fontFamily: "monospace" }}
                  placeholder="0"
                />

                {/* Rate */}
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unitPrice === 0 ? "" : item.unitPrice}
                    disabled={isEmployee}
                    onChange={(e) => updateItem(item.id, { unitPrice: e.target.value === "" ? 0 : Math.max(0, Number(e.target.value)) })}
                    className={`${inputCls} w-full pl-5 pr-2 py-1.5 text-right font-mono`}
                    style={{ fontFamily: "monospace" }}
                    placeholder="0.00"
                  />
                </div>

                {/* Sq Ft — only relevant for per_sqft */}
                {isPerSqft ? (
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.totalSqFt === 0 ? "" : item.totalSqFt}
                    disabled={isEmployee}
                    onChange={(e) => updateItem(item.id, { totalSqFt: e.target.value === "" ? 0 : Math.max(0, Number(e.target.value)) })}
                    className={`${inputCls} w-full px-2 py-1.5 text-center font-mono`}
                    style={{ fontFamily: "monospace" }}
                    placeholder="0"
                  />
                ) : (
                  <div className="text-center text-[10px] text-slate-300">—</div>
                )}

                {/* GST % */}
                <select
                  value={item.gstRate}
                  disabled={isEmployee}
                  onChange={(e) => updateItem(item.id, { gstRate: Number(e.target.value) })}
                  className={`${inputCls} w-full px-1 py-1.5 text-center`}
                  style={{ fontFamily: "inherit" }}
                >
                  {GST_OPTIONS.map((g) => (
                    <option key={g} value={g}>{g}%</option>
                  ))}
                </select>

                {/* Amount */}
                <div className="text-right text-xs font-bold font-mono text-slate-800 whitespace-nowrap">
                  ₹{amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>

                {/* Delete */}
                <button
                  type="button"
                  disabled={isEmployee || quotation.items.length <= 1}
                  onClick={() => removeItem(item.id)}
                  className="text-slate-300 hover:text-rose-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })}
        </div>

        {/* Add Item */}
        {!isEmployee && (
          <div className="border-t border-slate-200 p-3">
            <button
              type="button"
              onClick={addItem}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-dashed border-slate-300 rounded-lg text-xs font-semibold text-slate-500 hover:border-blue-500 hover:text-blue-600 transition-colors"
            >
              <Plus size={13} /> Add Line Item
            </button>
          </div>
        )}
      </div>

      {/* Bottom: Notes + Totals */}
      <div className="grid grid-cols-2 gap-5">
        {/* Notes & Terms */}
        <div className="space-y-3">
          <div>
            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Notes</label>
            <textarea
              value={quotation.notes || ""}
              disabled={isEmployee}
              onChange={(e) => setQuotation((q) => ({ ...q, notes: e.target.value }))}
              rows={3}
              placeholder="Any relevant notes for the customer…"
              className={`${inputCls} w-full px-3 py-2 resize-none`}
              style={{ fontFamily: "inherit" }}
            />
          </div>
          <div>
            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Terms & Conditions</label>
            <textarea
              value={quotation.terms || ""}
              disabled={isEmployee}
              onChange={(e) => setQuotation((q) => ({ ...q, terms: e.target.value }))}
              rows={3}
              placeholder="Payment terms, delivery schedule, late fees…"
              className={`${inputCls} w-full px-3 py-2 resize-none`}
              style={{ fontFamily: "inherit" }}
            />
          </div>
        </div>

        {/* Totals */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-3">
          {/* Discount */}
          <div>
            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Discount (₹)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">₹</span>
              <input
                type="number"
                min="0"
                value={quotation.discount}
                disabled={isEmployee}
                onChange={(e) => updateDiscount(Number(e.target.value) || 0)}
                className={`${inputCls} w-full pl-7 pr-3 py-2 font-mono font-bold`}
                style={{ fontFamily: "monospace" }}
              />
            </div>
          </div>

          {/* Summary lines */}
          <div className="pt-3 border-t border-slate-200/80 space-y-2 text-xs font-semibold text-slate-600">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-mono text-slate-800">₹{quotation.subtotal.toLocaleString("en-IN")}</span>
            </div>
            {quotation.discount > 0 && (
              <div className="flex justify-between text-rose-600">
                <span>Less Discount</span>
                <span className="font-mono">− ₹{quotation.discount.toLocaleString("en-IN")}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Total GST</span>
              <span className="font-mono text-slate-800">₹{quotation.tax.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-dashed border-slate-200">
              <span>Grand Total</span>
              <span className="font-mono text-emerald-700">₹{quotation.grand_total.toLocaleString("en-IN")}</span>
            </div>
          </div>

          {/* Save button */}
          {!isEmployee && (
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-white transition-all"
              style={{
                background: isPending ? "#94a3b8" : "#0f172a",
                cursor: isPending ? "not-allowed" : "pointer",
              }}
            >
              {isPending ? (
                "Saving…"
              ) : saveMsg ? (
                <><Check size={13} /> {saveMsg.text}</>
              ) : (
                "Save Quotation"
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
