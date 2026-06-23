"use client";

import React, { useState, useTransition } from "react";
import { IndianRupee, FileText, Send, Check, Loader2, Calendar, AlertCircle, Printer, X } from "lucide-react";
import { generateAdvanceInvoice, adminConfirmAdvanceReceived } from "@/features/quotations/actions/quotationActions";

interface AdvanceInvoicePanelProps {
  order: {
    id: string;
    orderId?: string;
    projectName: string;
    customerName?: string;
    stage?: string;
    advanceInvoiceDetails?: any;
    paymentHistory?: any[];
  };
  quotation: {
    id?: string;
    grand_total: number;
    advance_percent?: number;
    advance_amount?: number;
    payment_status?: string;
    advance_paid?: boolean;
  } | null;
}

export function AdvanceInvoicePanel({ order, quotation }: AdvanceInvoicePanelProps) {
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [advancePercent, setAdvancePercent] = useState<number>(quotation?.advance_percent ?? 25);
  const [customPercent, setCustomPercent] = useState("");
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split("T")[0];
  });
  const [showPrintView, setShowPrintView] = useState(false);
  const [confirmingPayment, setConfirmingPayment] = useState(false);

  const grandTotal = quotation?.grand_total ?? 0;
  const effectivePercent = customPercent ? parseFloat(customPercent) || 0 : advancePercent;
  const advanceAmount = Math.round((effectivePercent / 100) * grandTotal * 100) / 100;
  const balanceAmount = grandTotal - advanceAmount;

  const invoiceNumber = order.advanceInvoiceDetails?.invoiceNumber
    || `INV-ADV-${(order.orderId || order.id).slice(-6).toUpperCase()}-${Date.now().toString().slice(-4)}`;

  const isInvoiceGenerated = !!order.advanceInvoiceDetails?.generatedAt;
  const advancePaid = quotation?.advance_paid || order.advanceInvoiceDetails?.status === "Paid";

  const handleGenerate = () => {
    if (!grandTotal) { setMsg({ text: "No quotation amount found.", ok: false }); return; }
    startTransition(async () => {
      try {
        await generateAdvanceInvoice(order.id, {
          invoiceNumber,
          advancePercent: effectivePercent,
          advanceAmount,
          projectValue: grandTotal,
          dueDate,
          paymentLink: "",
        });
        setMsg({ text: "Advance invoice generated successfully.", ok: true });
        setTimeout(() => setMsg(null), 4000);
      } catch (err: any) {
        setMsg({ text: err.message || "Failed to generate invoice.", ok: false });
      }
    });
  };

  const handleConfirmPayment = () => {
    setConfirmingPayment(false);
    startTransition(async () => {
      try {
        await adminConfirmAdvanceReceived(order.id, "Admin");
        setMsg({ text: "Advance payment confirmed. Order moved to Design In Progress.", ok: true });
        setTimeout(() => setMsg(null), 5000);
      } catch (err: any) {
        setMsg({ text: err.message || "Failed to confirm payment.", ok: false });
      }
    });
  };

  // Print Preview Modal
  if (showPrintView) {
    return (
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "flex-start", justifyContent: "center", zIndex: 200, overflowY: "auto", padding: "40px 20px" }}>
        <div style={{ background: "white", width: "100%", maxWidth: 680, borderRadius: 16, overflow: "hidden", boxShadow: "0 24px 48px rgba(0,0,0,0.2)" }}>
          {/* Print Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", background: "#0f172a" }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: "white" }}>Advance Invoice Preview</span>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => window.print()} style={{ padding: "6px 14px", background: "#1e40af", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, color: "white", cursor: "pointer" }}>
                🖨️ Print
              </button>
              <button onClick={() => setShowPrintView(false)} style={{ padding: "6px 10px", background: "#334155", border: "none", borderRadius: 8, fontSize: 12, color: "white", cursor: "pointer" }}>
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Invoice Body */}
          <div style={{ padding: "40px 48px" }}>
            {/* Company Header */}
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 32 }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 900, color: "#0f172a", letterSpacing: "-0.02em" }}>PRINTEC</div>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>Signage & Branding Solutions</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#1e40af" }}>ADVANCE INVOICE</div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>#{invoiceNumber}</div>
              </div>
            </div>

            {/* Bill To */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 28 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", marginBottom: 6 }}>Bill To</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>{order.customerName || "—"}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", marginBottom: 6 }}>Project</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{order.projectName}</div>
                <div style={{ fontSize: 11, color: "#64748b" }}>Due: {new Date(dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</div>
              </div>
            </div>

            {/* Table */}
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 24, fontSize: 12 }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  {["Description", "Amount (₹)"].map(h => (
                    <th key={h} style={{ padding: "10px 12px", textAlign: h === "Amount (₹)" ? "right" : "left", fontSize: 10, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", border: "1px solid #e2e8f0" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: "12px", border: "1px solid #e2e8f0", fontWeight: 600 }}>Total Project Value</td>
                  <td style={{ padding: "12px", border: "1px solid #e2e8f0", textAlign: "right", fontWeight: 700 }}>₹{grandTotal.toLocaleString("en-IN")}</td>
                </tr>
                <tr style={{ background: "#eff6ff" }}>
                  <td style={{ padding: "12px", border: "1px solid #e2e8f0", fontWeight: 800, color: "#1e40af" }}>Advance Due ({effectivePercent}%)</td>
                  <td style={{ padding: "12px", border: "1px solid #e2e8f0", textAlign: "right", fontWeight: 900, color: "#1e40af", fontSize: 14 }}>₹{advanceAmount.toLocaleString("en-IN")}</td>
                </tr>
                <tr>
                  <td style={{ padding: "12px", border: "1px solid #e2e8f0", color: "#64748b" }}>Balance Due on Completion</td>
                  <td style={{ padding: "12px", border: "1px solid #e2e8f0", textAlign: "right", color: "#64748b" }}>₹{balanceAmount.toLocaleString("en-IN")}</td>
                </tr>
              </tbody>
            </table>

            {/* Payment Instructions */}
            <div style={{ padding: "16px", background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>Payment Instructions</div>
              <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1.7 }}>
                UPI: printec@upi<br />
                Bank: HDFC Bank · A/C: 12345678901 · IFSC: HDFC0001234<br />
                Please mention invoice number in payment reference.
              </div>
            </div>

            <div style={{ marginTop: 24, fontSize: 10, color: "#94a3b8", textAlign: "center" }}>
              This is a computer-generated invoice · Printec Signage Solutions
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <FileText size={17} style={{ color: "#1e40af" }} />
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>Advance Invoice</div>
          <div style={{ fontSize: 11, color: "#64748b" }}>Generate and track advance payment from customer</div>
        </div>
        {advancePaid && (
          <span style={{ marginLeft: "auto", padding: "4px 12px", background: "#dcfce7", color: "#16a34a", borderRadius: 20, fontSize: 11, fontWeight: 800, border: "1px solid #bbf7d0" }}>
            ✅ Paid
          </span>
        )}
      </div>

      {/* Project value summary */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        {[
          { label: "Project Value", value: grandTotal, highlight: false },
          { label: `Advance (${effectivePercent}%)`, value: advanceAmount, highlight: true },
          { label: "Balance Due", value: balanceAmount, highlight: false },
        ].map(row => (
          <div key={row.label} style={{ padding: "12px", background: row.highlight ? "#1e40af" : "#f8fafc", borderRadius: 10, border: `1px solid ${row.highlight ? "#1e40af" : "#e2e8f0"}`, textAlign: "center" }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: row.highlight ? "rgba(255,255,255,0.7)" : "#94a3b8", marginBottom: 4 }}>{row.label}</div>
            <div style={{ fontSize: 15, fontWeight: 900, color: row.highlight ? "white" : "#0f172a" }}>₹{row.value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</div>
          </div>
        ))}
      </div>

      {/* Settings */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Advance Percentage</label>
          <div style={{ display: "flex", gap: 6 }}>
            {[25, 50, 75, 100].map(p => (
              <button key={p} type="button" onClick={() => { setAdvancePercent(p); setCustomPercent(""); }}
                style={{ flex: 1, padding: "7px 4px", border: `1.5px solid ${advancePercent === p && !customPercent ? "#1e40af" : "#e2e8f0"}`, borderRadius: 8, background: advancePercent === p && !customPercent ? "#eff6ff" : "white", fontSize: 12, fontWeight: 700, color: advancePercent === p && !customPercent ? "#1e40af" : "#374151", cursor: "pointer" }}>
                {p}%
              </button>
            ))}
          </div>
          <input
            type="number" min={1} max={100} placeholder="Custom %"
            value={customPercent} onChange={e => setCustomPercent(e.target.value)}
            style={{ marginTop: 6, width: "100%", padding: "7px 10px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
          />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Due Date</label>
          <input
            type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
            style={{ width: "100%", padding: "7px 10px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
          />
        </div>
      </div>

      {/* Payment History */}
      {(order.paymentHistory || []).length > 0 && (
        <div style={{ background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0", overflow: "hidden" }}>
          <div style={{ padding: "10px 14px", borderBottom: "1px solid #e2e8f0", fontSize: 11, fontWeight: 800, color: "#0f172a" }}>Payment Submissions from Customer</div>
          {(order.paymentHistory || []).map((p: any, idx: number) => (
            <div key={idx} style={{ padding: "10px 14px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>₹{p.amount?.toLocaleString("en-IN")} via {p.method}</div>
                {p.reference && <div style={{ fontSize: 10, color: "#64748b" }}>Ref: {p.reference}</div>}
                <div style={{ fontSize: 10, color: "#94a3b8" }}>{new Date(p.paidAt).toLocaleString("en-IN")}</div>
              </div>
              <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: p.status === "Paid" ? "#dcfce7" : "#fffbeb", color: p.status === "Paid" ? "#16a34a" : "#b45309" }}>
                {p.status || "Pending Verification"}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Feedback */}
      {msg && (
        <div style={{ padding: "8px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, background: msg.ok ? "#dcfce7" : "#fef2f2", color: msg.ok ? "#16a34a" : "#dc2626", display: "flex", alignItems: "center", gap: 6 }}>
          {msg.ok ? <Check size={13} /> : <AlertCircle size={13} />} {msg.text}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => setShowPrintView(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 12, fontWeight: 700, color: "#374151", cursor: "pointer" }}>
          <Printer size={13} /> Preview Invoice
        </button>
        <button onClick={handleGenerate} disabled={isPending || grandTotal === 0} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px 14px", background: "#1e40af", border: "none", borderRadius: 10, fontSize: 12, fontWeight: 800, color: "white", cursor: "pointer", opacity: grandTotal === 0 ? 0.5 : 1 }}>
          {isPending ? <Loader2 size={13} style={{ animation: "prt-spin 1s linear infinite" }} /> : <FileText size={13} />}
          {isInvoiceGenerated ? "Regenerate Invoice" : "Generate Invoice"}
        </button>
        {!advancePaid && isInvoiceGenerated && (
          confirmingPayment
            ? (
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => setConfirmingPayment(false)} style={{ padding: "9px 12px", background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 12, fontWeight: 600, color: "#64748b", cursor: "pointer" }}>Cancel</button>
                <button onClick={handleConfirmPayment} disabled={isPending} style={{ padding: "9px 14px", background: "#16a34a", border: "none", borderRadius: 10, fontSize: 12, fontWeight: 800, color: "white", cursor: "pointer" }}>
                  {isPending ? <Loader2 size={13} style={{ animation: "prt-spin 1s linear infinite" }} /> : "✓ Confirm"}
                </button>
              </div>
            )
            : (
              <button onClick={() => setConfirmingPayment(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", background: "#16a34a", border: "none", borderRadius: 10, fontSize: 12, fontWeight: 800, color: "white", cursor: "pointer" }}>
                <Check size={13} /> Confirm Payment Received
              </button>
            )
        )}
      </div>
    </div>
  );
}
