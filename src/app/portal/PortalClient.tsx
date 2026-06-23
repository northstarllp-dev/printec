"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Printer, MapPin, FileText, CheckSquare, CheckCircle2,
  MessageSquare, Send, ZoomIn, ZoomOut, Check, X,
  AlertCircle, CreditCard, Calendar,
  Ruler, Activity, ChevronRight, Phone, Mail, Clock, ClipboardList,
  Building2, User2, Star, ArrowRight,
  Package, Wrench, Palette, FileCheck, BarChart3, ChevronDown,
  RefreshCw, AlertTriangle, Loader2, Maximize2, Minimize2, CheckCheck
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { scheduleSiteVisitAction } from "@/features/orders/actions/orderActions";

interface Customer {
  id: string;
  name: string;
  phone: string;
  whatsapp: string;
  email: string;
  city?: string;
  billingAddress: string;
  shippingAddress: string;
  status?: string;
  customerCode?: string;
  customerId?: string;
}

interface Order {
  id: string;
  projectName: string;
  customerId: string;
  customerName?: string;
  stage: string;
  budget: number;
  depositPaid: number;
  dimensions: string;
  notes: string;
  urgent: boolean;
  assignedEmployees: string[];
  assignedDesigners?: string[];
  assignedMarketers?: string[];
  dateCreated: string;
  deadlineStatus: string;
  imageMockup: string;
  versionHistory: any[];
  chatHistory: any[];
  siteVisitDetails?: any;
  quoteDetails?: any;
  designDetails?: any;
  productionDetails?: any;
  installationDetails?: any;
  stageStatus?: string;
  stageAdminNotes?: string;
  orderCode?: string;
  orderId?: string;
  // New quotation workflow fields
  advanceInvoiceDetails?: any;
  paymentHistory?: any[];
  siteVisitItems?: Array<{ id: string; name: string; width?: number | null; height?: number | null; depth?: number | null; notes?: string | null }>;
  materialPreferences?: any[];
}

interface PortalClientProps {
  customer: Customer;
  orders: Order[];
  initialActiveOrderId: string | null;
  token: string;
}

// Map stage to step index (0-based, 6 steps total)
const STEPS = [
  { key: "enquiry",      label: "Enquiries",    icon: FileText },
  { key: "site_visit",   label: "Site Visit",   icon: MapPin },
  { key: "quotation",    label: "Quotations",   icon: BarChart3 },
  { key: "design",       label: "Design",       icon: Palette },
  { key: "production",   label: "Production",   icon: Package },
  { key: "installation", label: "Installation", icon: Wrench },
];

function getStepIndex(stage: string): number {
  const s = (stage || "").toLowerCase();
  if (s.includes("site visit")) return 1;
  if (s.includes("quotation")) return 2;
  if (s.includes("design")) return 3;
  if (s.includes("production") || s.includes("fabricat") || s.includes("ready")) return 4;
  if (s.includes("installation") || s.includes("completed") || s.includes("closed")) return 5;
  return 0;
}

export function PortalClient({ customer, orders: initialOrders, initialActiveOrderId, token }: PortalClientProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);

  // Step 4: Establish session cookie on first load (avoids keeping token in URL)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/portal/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        if (mounted && !res.ok) {
          const err = await res.json().catch(() => ({}));
          console.warn("[Portal] Session cookie setup failed:", err.error || res.status);
        }
      } catch (e) {
        console.warn("[Portal] Session cookie setup error:", e);
      }
    })();
    return () => { mounted = false; };
  }, [token]);
  const [activeOrderId, setActiveOrderId] = useState<string>(
    initialActiveOrderId || (initialOrders.length > 0 ? initialOrders[0].id : "")
  );

  // Site Visit scheduling states
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [siteAddress, setSiteAddress] = useState(customer.shippingAddress || "");
  const [gpsCoords, setGpsCoords] = useState("12.9716° N, 77.5946° E");
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [schedulingLoading, setSchedulingLoading] = useState(false);
  const [mapsSearching, setMapsSearching] = useState(false);

  // Quote / design states
  const [quoteFeedback, setQuoteFeedback] = useState("");
  const [designFeedback, setDesignFeedback] = useState("");
  const [showQuoteDeclineInput, setShowQuoteDeclineInput] = useState(false);
  const [showDesignDeclineInput, setShowDesignDeclineInput] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(100);


  const [unreadCount, setUnreadCount] = useState(0);

  const activeOrder = orders.find(o => o.id === activeOrderId || o.orderId === activeOrderId || o.orderCode === activeOrderId) || orders[0];
  const currentStep = activeOrder ? getStepIndex(activeOrder.stage) : 0;

  // Sync site visit details
  useEffect(() => {
    if (activeOrder?.siteVisitDetails) {
      const sv = activeOrder.siteVisitDetails;
      setSelectedDate(sv.auditDate || "");
      setSelectedTime(sv.auditTime || "");
      setSiteAddress(sv.customerAddress || customer.shippingAddress || "");
      setGpsCoords(sv.gpsLocation || "12.9716° N, 77.5946° E");
    }
  }, [activeOrderId]);

  // Unread count
  useEffect(() => {
    if (!activeOrder) return;
    const supabase = createClient();
    async function loadUnread() {
      const { count } = await supabase
        .from("order_messages")
        .select("*", { count: "exact", head: true })
        .eq("order_id", activeOrder!.orderId || activeOrder!.id)
        .eq("tab", "customer")
        .eq("is_read", false);
      if (count !== null) setUnreadCount(count);
    }
    loadUnread();
    // Use unique channel name per mount to avoid Supabase channel cache collision (Strict Mode)
    const channelName = `unread-${activeOrder.id}-${Date.now()}`;
    const ch = supabase
      .channel(channelName)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "order_messages", filter: `order_id=eq.${activeOrder.orderId || activeOrder.id}` }, (p) => {
        const msg = p.new as any;
        if (msg.tab === "customer" && msg.sender_role !== "Customer") {
          setUnreadCount(prev => prev + 1);
        }
      })
      .subscribe();
  }, [activeOrder?.id]);

  // Realtime subscription to sync active order and quotation changes dynamically
  useEffect(() => {
    if (!activeOrder) return;
    const supabase = createClient();
    const orderChannelName = `portal-order-sync-${activeOrder.id}-${Date.now()}`;
    
    const channel = supabase
      .channel(orderChannelName)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `id=eq.${activeOrder.id}` },
        (payload) => {
          if (payload.eventType === "UPDATE" || payload.eventType === "INSERT") {
            const updatedOrder = payload.new as any;
            if (updatedOrder) {
              setOrders(prev => prev.map(o => o.id === updatedOrder.id ? {
                ...o,
                stage: updatedOrder.stage,
                depositPaid: Number(updatedOrder.deposit_paid) || 0,
                paymentHistory: updatedOrder.payment_history || [],
                advanceInvoiceDetails: updatedOrder.advance_invoice_details || null,
                siteVisitDetails: updatedOrder.site_visit_details,
                designDetails: updatedOrder.design_details,
                productionDetails: updatedOrder.production_details,
                installationDetails: updatedOrder.installation_details,
                stageStatus: updatedOrder.stage_status,
                stageAdminNotes: updatedOrder.stage_admin_notes,
              } : o));
            }
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "quotations", filter: `order_id=eq.${activeOrder.id}` },
        (payload) => {
          if (payload.eventType === "UPDATE" || payload.eventType === "INSERT") {
            const updatedQuote = payload.new as any;
            if (updatedQuote) {
              setOrders(prev => prev.map(o => o.id === updatedQuote.order_id ? {
                ...o,
                quoteDetails: {
                  ...(o.quoteDetails || {}),
                  quotationId: updatedQuote.quotation_id,
                  status: updatedQuote.status,
                  grandTotal: Number(updatedQuote.grand_total) || 0,
                  subtotal: Number(updatedQuote.subtotal) || 0,
                  discount: Number(updatedQuote.discount) || 0,
                  tax: Number(updatedQuote.tax) || 0,
                  advancePercent: Number(updatedQuote.advance_percent) || 25,
                  advanceAmount: Number(updatedQuote.advance_amount) || 0,
                  advancePaid: updatedQuote.advance_paid || false,
                  advancePaidAt: updatedQuote.advance_paid_at,
                }
              } : o));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeOrder?.id]);

  const getBusinessDays = () => {
    const days: Date[] = [];
    const cur = new Date();
    while (days.length < 7) {
      cur.setDate(cur.getDate() + 1);
      if (cur.getDay() !== 0) days.push(new Date(cur));
    }
    return days;
  };

  const isSlotBooked = (date: string, time: string) =>
    orders.some(o => o.id !== activeOrder?.id && o.siteVisitDetails?.auditDate === date && o.siteVisitDetails?.auditTime === time);

  const handleScheduleSiteVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrder || !selectedDate || !selectedTime || !siteAddress) return;
    setSchedulingLoading(true);
    try {
      const payload = { auditDate: selectedDate, auditTime: selectedTime, customerAddress: siteAddress, gpsLocation: gpsCoords, sitePersonnel: "Hari", completed: false, reviewStatus: "Pending" };
      const res = await scheduleSiteVisitAction(activeOrder.id, payload);
      if (res.success && res.order) {
        setOrders(prev => prev.map(o => o.id === activeOrder.id ? { ...o, stage: res.order.stage, siteVisitDetails: res.order.site_visit_details } : o));
        setIsRescheduling(false);
      }
    } catch (err) { console.error(err); }
    finally { setSchedulingLoading(false); }
  };

  const handleApproveQuote = async () => {
    if (!activeOrder) return;
    setUpdatingStatus("quote-approve");
    const supabase = createClient();
    const updatedQuote = { ...activeOrder.quoteDetails, status: "Approved" };
    setOrders(prev => prev.map(o => o.id === activeOrder.id ? { ...o, stage: "Quotation Approved", quoteDetails: updatedQuote } : o));
    await supabase.from("order_messages").insert({ order_id: activeOrder.orderId || activeOrder.id, tab: "timeline", sender_name: "System", sender_role: "System", content: "Client approved the quotation details." });
    await supabase.from("quotations").update({ status: "Approved" }).eq("order_id", activeOrder.id);
    await supabase.from("orders").update({ stage: "Quotation Approved" }).eq("id", activeOrder.id);
    setUpdatingStatus(null);
  };

  const handleDeclineQuote = async () => {
    if (!activeOrder || !quoteFeedback.trim()) return;
    setUpdatingStatus("quote-decline");
    const supabase = createClient();
    const updatedQuote = { ...activeOrder.quoteDetails, status: "Negotiation" };
    setOrders(prev => prev.map(o => o.id === activeOrder.id ? { ...o, stage: "Quotation Negotiation", quoteDetails: updatedQuote } : o));
    await supabase.from("order_messages").insert({ order_id: activeOrder.orderId || activeOrder.id, tab: "customer", sender_name: customer.name, sender_role: "Customer", content: `Quotation Declined. Feedback: ${quoteFeedback}` });
    await supabase.from("quotations").update({ status: "Rejected" }).eq("order_id", activeOrder.id);
    await supabase.from("orders").update({ stage: "Quotation Negotiation" }).eq("id", activeOrder.id);
    setQuoteFeedback(""); setShowQuoteDeclineInput(false); setUpdatingStatus(null);
  };

  const handleApproveDesign = async () => {
    if (!activeOrder) return;
    setUpdatingStatus("design-approve");
    const supabase = createClient();
    const updatedDesign = { ...activeOrder.designDetails, status: "Approved" };
    setOrders(prev => prev.map(o => o.id === activeOrder.id ? { ...o, stage: "Design Approved", designDetails: updatedDesign } : o));
    await supabase.from("order_messages").insert({ order_id: activeOrder.orderId || activeOrder.id, tab: "timeline", sender_name: "System", sender_role: "System", content: "Client approved the design proof layout." });
    await supabase.from("orders").update({ stage: "Design Approved", design_details: updatedDesign }).eq("id", activeOrder.id);
    setUpdatingStatus(null);
  };

  const handleDeclineDesign = async () => {
    if (!activeOrder || !designFeedback.trim()) return;
    setUpdatingStatus("design-decline");
    const supabase = createClient();
    const updatedDesign = { ...activeOrder.designDetails, status: "Draft" };
    setOrders(prev => prev.map(o => o.id === activeOrder.id ? { ...o, stage: "Design In Progress", designDetails: updatedDesign } : o));
    await supabase.from("order_messages").insert({ order_id: activeOrder.orderId || activeOrder.id, tab: "customer", sender_name: customer.name, sender_role: "Customer", content: `Design Revision Requested. Notes: ${designFeedback}` });
    await supabase.from("orders").update({ stage: "Design In Progress", design_details: updatedDesign }).eq("id", activeOrder.id);
    setDesignFeedback(""); setShowDesignDeclineInput(false); setUpdatingStatus(null);
  };

  const sv = activeOrder?.siteVisitDetails || {};
  const qd = activeOrder?.quoteDetails || {};
  const dd = activeOrder?.designDetails || {};
  const pd = activeOrder?.productionDetails || {};
  const inst = activeOrder?.installationDetails || {};

  if (orders.length === 0) {
    return (
      <div className="min-h-screen bg-[#f4f6fb] flex items-center justify-center p-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-10 max-w-md w-full text-center shadow-lg">
          <AlertCircle size={48} className="text-slate-300 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-[#0b1c30] mb-2">No Active Orders</h1>
          <p className="text-sm text-slate-500">We couldn't find any active orders for your account.</p>
          <p className="text-xs text-slate-400 mt-6 font-bold">PRINTEC Signage Solutions</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f6fb] font-sans">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        * { font-family: 'Inter', sans-serif; }
        .portal-stepper-line { transition: width 0.6s cubic-bezier(0.4,0,0.2,1); }
        .scope-item { transition: all 0.2s ease; }
        .chat-scroll::-webkit-scrollbar { width: 4px; }
        .chat-scroll::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 4px; }
        @keyframes slideUp { from { opacity:0; transform: translateY(8px); } to { opacity:1; transform: translateY(0); } }
        .animate-slide-up { animation: slideUp 0.3s ease forwards; }
      `}</style>

      {/* ─── TOP HEADER ─── */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between gap-4">
          {/* Left: Logo + Order Info */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-[#1E40AF] rounded-lg flex items-center justify-center">
                <Printer size={16} className="text-white" />
              </div>
              <span className="font-black text-[#0b1c30] text-sm tracking-tight">NORTHSTAR</span>
            </div>
            <div className="w-px h-6 bg-slate-200" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black text-[#0b1c30] leading-none">
                  Order #{activeOrder?.orderCode || activeOrder?.id}
                </h1>
                <a
                  href="tel:+919876543210"
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 border border-blue-100 hover:border-blue-200 text-[#1E40AF] rounded-lg text-[10px] font-bold transition-all shadow-sm"
                  title="Call Manager (Sarah Jenkins)"
                >
                  <Phone size={11} className="stroke-[2.5]" />
                  <span>Call Manager</span>
                </a>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Client: {customer.name} | {activeOrder?.projectName || "Signage Project"}
              </p>
            </div>
          </div>

          {/* Right: Action Buttons */}
          <div className="flex items-center gap-2.5">
            {orders.length > 1 && (
              <select
                value={activeOrderId}
                onChange={e => setActiveOrderId(e.target.value)}
                className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 text-slate-600 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
              >
                {orders.map(o => (
                  <option key={o.id} value={o.id}>{o.orderCode || o.id} — {o.stage}</option>
                ))}
              </select>
            )}
          </div>
        </div>
      </header>

      {/* ─── PROGRESS STEPPER ─── */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-start justify-between relative">
            {/* Background line */}
            <div className="absolute top-[18px] left-0 right-0 h-[2px] bg-slate-100 z-0" />
            {/* Progress fill */}
            <div
              className="absolute top-[18px] left-0 h-[2px] bg-emerald-500 z-0 portal-stepper-line"
              style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}
            />

            {STEPS.map((step, idx) => {
              const Icon = step.icon;
              const isCompleted = idx < currentStep;
              const isActive = idx === currentStep;
              const isLocked = idx > currentStep;

              return (
                <div key={step.key} className="flex flex-col items-center text-center relative z-10 flex-1">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                    isActive
                      ? "bg-[#1E40AF] border-[#1E40AF] text-white shadow-[0_0_0_4px_rgba(30,64,175,0.12)]"
                      : isCompleted
                        ? "bg-emerald-500 border-emerald-500 text-white"
                        : "bg-white border-slate-200 text-slate-400"
                  }`}>
                    {isCompleted ? <Check size={14} className="stroke-[3]" /> : <Icon size={14} />}
                  </div>
                  <span className={`text-[11px] font-bold mt-2 block ${
                    isActive ? "text-[#1E40AF]" : isCompleted ? "text-emerald-600" : "text-slate-400"
                  }`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── MAIN CONTENT ─── */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">

          {/* ── LEFT: Stage Content ── */}
          <div className="space-y-5">

            {/* Current Stage Panel */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Stage label bar */}
              <div className="px-6 pt-5 pb-3 border-b border-slate-100">
                <span className="text-[10px] font-bold text-[#1E40AF] uppercase tracking-widest bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-full">
                  CURRENT STAGE: {STEPS[currentStep]?.label?.toUpperCase()}
                </span>
              </div>

              <div className="p-6">
                {/* ── SITE VISIT STAGE ── */}
                {currentStep <= 1 && (
                  <>
                    {(!sv.auditDate || isRescheduling) ? (
                      <div className="space-y-6">
                        <div>
                          <h2 className="text-xl font-black text-[#0b1c30] mb-1.5">Schedule Your Physical Site Audit</h2>
                          <p className="text-sm text-slate-500 leading-relaxed max-w-lg">
                            Our technical survey team needs to verify dimensions and substrate conditions before we can finalize the structural design for your exterior month signs. Estimated duration: 45 mins.
                          </p>
                        </div>

                        <form onSubmit={handleScheduleSiteVisit} className="space-y-5">
                          {/* Date Picker */}
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                              Pick a Date
                            </label>
                            <div className="flex gap-2 overflow-x-auto pb-1">
                              {getBusinessDays().map((day, idx) => {
                                const ds = day.toISOString().split("T")[0];
                                const dayName = day.toLocaleDateString("en-US", { weekday: "short" });
                                const monthName = day.toLocaleDateString("en-US", { month: "short" });
                                const selected = selectedDate === ds;
                                return (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => { setSelectedDate(ds); setSelectedTime(""); }}
                                    className={`flex flex-col items-center p-3 rounded-xl border text-center min-w-[64px] transition-all cursor-pointer ${
                                      selected
                                        ? "bg-[#eff4ff] border-[#1E40AF] text-[#1E40AF] ring-2 ring-blue-100"
                                        : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                                    }`}
                                  >
                                    <span className="text-[9px] uppercase tracking-wider text-slate-400">{dayName}</span>
                                    <span className="text-sm font-black mt-0.5">{day.getDate()}</span>
                                    <span className="text-[9px] text-slate-400">{monthName}</span>
                                  </button>
                                );
                              })}
                            </div>

                            {selectedDate && (
                              <div className="grid grid-cols-4 gap-2 mt-3">
                                {["10:00 AM", "11:30 AM", "02:00 PM", "03:30 PM"].map(slot => {
                                  const booked = isSlotBooked(selectedDate, slot);
                                  const sel = selectedTime === slot;
                                  return (
                                    <button
                                      key={slot}
                                      type="button"
                                      disabled={booked}
                                      onClick={() => setSelectedTime(slot)}
                                      className={`py-2.5 rounded-xl border text-xs font-bold transition-all ${
                                        booked ? "bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed"
                                          : sel ? "bg-[#eff4ff] border-[#1E40AF] text-[#1E40AF] ring-2 ring-blue-100"
                                            : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 cursor-pointer"
                                      }`}
                                    >
                                      {slot}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          {/* Location */}
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                              Choose Location in Maps
                            </label>
                            <input
                              type="text"
                              required
                              value={siteAddress}
                              onChange={e => setSiteAddress(e.target.value)}
                              placeholder="Full address where signage will be installed"
                              className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none bg-slate-50 focus:bg-white transition-all"
                            />

                            {/* Map visual */}
                            <div className="mt-2 border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                              <div
                                onClick={() => setGpsCoords(`${(12.97 + Math.random() * 0.01).toFixed(4)}° N, ${(77.59 + Math.random() * 0.01).toFixed(4)}° E`)}
                                className="h-28 bg-[#e8edf2] flex flex-col items-center justify-center relative cursor-crosshair group select-none"
                              >
                                <div className="absolute inset-0 bg-[linear-gradient(to_right,#d1d9e0_1px,transparent_1px),linear-gradient(to_bottom,#d1d9e0_1px,transparent_1px)] bg-[size:20px_20px] opacity-40" />
                                <div className="absolute w-8 h-8 rounded-full bg-blue-400/20 animate-ping" />
                                <MapPin size={28} className="text-[#1E40AF] relative z-10 drop-shadow-md" />
                                <span className="text-[10px] text-slate-500 mt-1.5 relative z-10 font-medium bg-white/90 px-2 py-0.5 rounded-full border border-slate-200">
                                  Click to pin location
                                </span>
                              </div>
                              <div className="px-3 py-2 bg-white border-t border-slate-200 flex items-center justify-between">
                                <span className="text-[10px] font-mono font-semibold text-slate-600">📍 {gpsCoords}</span>
                                <button
                                  type="button"
                                  onClick={() => { setMapsSearching(true); setTimeout(() => { setGpsCoords("12.9716° N, 77.5946° E"); setMapsSearching(false); }, 600); }}
                                  className="flex items-center gap-1 text-[10px] font-bold text-[#1E40AF] hover:underline"
                                >
                                  {mapsSearching ? <Loader2 size={10} className="animate-spin" /> : null}
                                  Auto-detect
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 pt-2">
                            <button
                              type="submit"
                              disabled={!selectedDate || !selectedTime || schedulingLoading}
                              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all disabled:opacity-50 shadow-sm"
                            >
                              {schedulingLoading ? <Loader2 size={14} className="animate-spin" /> : null}
                              Confirm Site Visit
                              <Check size={14} />
                            </button>
                            <button type="button" className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors">
                              Request Callback
                            </button>
                          </div>
                        </form>
                      </div>
                    ) : sv.completed === false ? (
                      // Scheduled confirmation
                      <div className="text-center space-y-5 py-4">
                        <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto">
                          <Check size={24} className="text-emerald-600 stroke-[3]" />
                        </div>
                        <div>
                          <h2 className="text-lg font-black text-[#0b1c30]">Site Visit Scheduled</h2>
                          <p className="text-sm text-slate-500 mt-1">Our team will arrive at the scheduled time.</p>
                        </div>
                        <div className="max-w-sm mx-auto bg-slate-50 border border-slate-200 rounded-xl p-4 text-left grid grid-cols-2 gap-3 text-xs">
                          <div><span className="text-[10px] text-slate-400 uppercase font-bold block">Date</span><p className="font-bold text-slate-800 font-mono mt-0.5">{sv.auditDate}</p></div>
                          <div><span className="text-[10px] text-slate-400 uppercase font-bold block">Time</span><p className="font-bold text-slate-800 font-mono mt-0.5">{sv.auditTime}</p></div>
                          <div className="col-span-2"><span className="text-[10px] text-slate-400 uppercase font-bold block">Address</span><p className="font-medium text-slate-800 mt-0.5">{sv.customerAddress}</p></div>
                        </div>
                        <button onClick={() => setIsRescheduling(true)} className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all flex items-center gap-2 mx-auto">
                          <RefreshCw size={12} /> Reschedule Appointment
                        </button>
                      </div>
                    ) : (
                      // Completed or pending approval
                      <div className="space-y-4">
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                          <AlertCircle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-bold text-amber-800">Site Survey Completed — Under Verification</p>
                            <p className="text-xs text-amber-700 mt-0.5">Measurement data is being reviewed by our engineering team.</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* ── QUOTATION STAGE ── */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    {/* Header */}
                    <div>
                      <h2 className="text-xl font-black text-[#0b1c30] mb-1">Quotation</h2>
                      <p className="text-sm text-slate-500">Review pricing options, set material preferences, and approve to proceed.</p>
                    </div>

                    {/* ── Sub-section A: Material Preferences (stage = Quotation In Progress) ── */}
                    {(activeOrder?.stage === "Quotation In Progress" || (activeOrder?.materialPreferences && activeOrder.materialPreferences.length > 0)) && (
                      <div className="border border-amber-200 rounded-xl overflow-hidden">
                        <div className="bg-amber-50 px-4 py-3 border-b border-amber-100 flex items-center gap-2">
                          <span className="text-sm font-black text-amber-800">🎨 Material Preferences</span>
                          <span className="text-xs text-amber-600 ml-auto">Help us tailor the perfect solution</span>
                        </div>
                        <div className="p-4 space-y-4">
                          {(activeOrder?.siteVisitItems || []).length === 0 ? (
                            <p className="text-sm text-slate-400 italic text-center py-4">Awaiting site visit measurements to load signage items.</p>
                          ) : (
                            (activeOrder?.siteVisitItems || []).map((item: any) => {
                              const savedPref = (activeOrder?.materialPreferences || []).find((mp: any) => mp.signage_item_id === item.id) || {};
                              return (
                                <div key={item.id} className="border border-slate-200 rounded-xl p-4">
                                  <div className="font-bold text-[#0b1c30] text-sm mb-3 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-[#1E40AF]" />
                                    {item.name}
                                    {(item.width || item.height) && (
                                      <span className="text-xs text-slate-400 font-normal">({item.width}×{item.height}ft)</span>
                                    )}
                                  </div>
                                  <div className="grid grid-cols-2 gap-3">
                                    {["acp_type", "acrylic_type", "letter_type", "led_type", "finish", "color"].map(field => {
                                      const fieldLabel = { acp_type: "ACP Type", acrylic_type: "Acrylic Type", letter_type: "Letter Type", led_type: "LED Type", finish: "Finish", color: "Color" }[field] || field;
                                      const fieldOptions: Record<string, string[]> = {
                                        acp_type: ["Standard White", "Glossy White", "Brushed Silver", "Gold", "Black", "Custom Color"],
                                        acrylic_type: ["Standard Clear", "Frosted", "Coloured", "Mirror", "Opal White"],
                                        letter_type: ["SS 3D Letters", "Acrylic Letters", "Foam Letters", "Backlit Letters", "MS Letters"],
                                        led_type: ["RGB", "Warm White", "Cool White", "No LED"],
                                        finish: ["Matte", "Glossy", "Satin", "Powder Coated"],
                                        color: ["White", "Black", "Silver", "Gold", "Brand Color", "Custom"],
                                      };
                                      return (
                                        <div key={field}>
                                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{fieldLabel}</label>
                                          <select
                                            defaultValue={(savedPref.preferences as any)?.[field] || ""}
                                            data-item-id={item.id}
                                            data-field={field}
                                            className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-2 focus:ring-1 focus:ring-blue-500 focus:outline-none bg-slate-50"
                                          >
                                            <option value="">— Select —</option>
                                            {(fieldOptions[field] || []).map(opt => (
                                              <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                          </select>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })
                          )}
                          {(activeOrder?.siteVisitItems || []).length > 0 && (
                            <button
                              onClick={async () => {
                                if (!activeOrder) return;
                                const supabase = createClient();
                                const prefs = (activeOrder.siteVisitItems || []).map((item: any) => {
                                  const selects = document.querySelectorAll<HTMLSelectElement>(`[data-item-id="${item.id}"]`);
                                  const prefData: Record<string, string> = {};
                                  selects.forEach(sel => {
                                    if (sel.dataset.field) {
                                      prefData[sel.dataset.field] = sel.value;
                                    }
                                  });
                                  return {
                                    order_id: activeOrder.id,
                                    signage_item_id: item.id,
                                    signage_item_label: item.name,
                                    preferences: prefData,
                                  };
                                });
                                for (const p of prefs) {
                                  await supabase.from("quotation_material_preferences").upsert(p, { onConflict: "order_id,signage_item_id" });
                                }
                                await supabase.from("order_messages").insert({ order_id: activeOrder.orderId || activeOrder.id, tab: "timeline", sender_name: "System", sender_role: "System", content: "Customer updated material preferences." });
                                alert("Preferences saved! Our team will use these when building your quotation.");
                              }}
                              className="w-full py-2.5 bg-amber-600 text-white rounded-xl text-sm font-bold hover:bg-amber-700 transition-all"
                            >
                              💾 Save Material Preferences
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* ── Sub-section B: Quotation Review (stage = Sent / Negotiation) ── */}
                    {(activeOrder?.stage === "Quotation Sent" || activeOrder?.stage === "Quotation Negotiation") && activeOrder?.quoteDetails && (
                      <div className="border border-slate-200 rounded-xl overflow-hidden">
                        <div className="bg-[#eff6ff] px-4 py-3 border-b border-blue-100 flex items-center justify-between">
                          <span className="text-sm font-black text-[#1E40AF]">📋 Your Quotation — {activeOrder.quoteDetails.quotationId}</span>
                          <span className="text-xs px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 font-bold">
                            {activeOrder.quoteDetails.status === "Sent" ? "Awaiting Approval" : activeOrder.quoteDetails.status}
                          </span>
                        </div>
                        <div className="p-4 space-y-4">
                          {/* Multi-option sections */}
                          {(activeOrder.quoteDetails.signageOptions || []).length > 0 ? (
                            (activeOrder.quoteDetails.signageOptions as any[]).map((section: any, si: number) => {
                              // If it has options (old structure), resolve flat lines from the first option
                              const lines = section.lines || section.options?.[0]?.lines || [];
                              const secNotes = section.notes || section.options?.[0]?.notes || "";
                              const secTotal = lines.reduce((s: number, l: any) => {
                                const pricingType = l.pricingType || l.unitType;
                                const totalSqFt = l.totalSqFt !== undefined ? l.totalSqFt : l.sqft;
                                if (pricingType === "per_sqft" || pricingType === "per_running_ft") return s + l.quantity * (totalSqFt || 0) * l.unitPrice;
                                return s + l.quantity * l.unitPrice;
                              }, 0);
                              return (
                                <div key={si} className="border border-slate-200 rounded-xl overflow-hidden mb-3">
                                  <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                                    <span className="text-sm font-bold text-[#0b1c30]">{section.itemLabel}</span>
                                    <span className="font-black text-sm text-[#1E40AF]">₹{secTotal.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
                                  </div>
                                  <div className="p-3 divide-y divide-slate-50">
                                    {lines.map((l: any, li: number) => {
                                      const pricingType = l.pricingType || l.unitType;
                                      const totalSqFt = l.totalSqFt !== undefined ? l.totalSqFt : l.sqft;
                                      const lineAmt = pricingType === "per_sqft" || pricingType === "per_running_ft" 
                                        ? l.quantity * (totalSqFt || 0) * l.unitPrice 
                                        : l.quantity * l.unitPrice;

                                      let detailStr = "";
                                      if (pricingType === "per_sqft") {
                                        detailStr = `(${l.quantity} × ${totalSqFt || 0} sqft @ ₹${l.unitPrice}/sqft)`;
                                      } else if (pricingType === "per_running_ft") {
                                        detailStr = `(${l.quantity} × ${totalSqFt || 0} rft @ ₹${l.unitPrice}/rft)`;
                                      } else {
                                        detailStr = `(${l.quantity} ${l.quantity > 1 ? "units" : "unit"} @ ₹${l.unitPrice}/unit)`;
                                      }

                                      return (
                                        <div key={li} className="py-2 flex justify-between text-xs">
                                          <div>
                                            <span className="font-semibold text-slate-700">{l.description}</span>
                                            <span className="text-slate-400 ml-2">
                                              {detailStr}
                                            </span>
                                          </div>
                                          <span className="font-bold text-slate-800">₹{lineAmt.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
                                        </div>
                                      );
                                    })}
                                    {secNotes && <p className="text-xs text-slate-400 mt-2 pt-1 italic">Note: {secNotes}</p>}
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            // Fallback: flat quotation display
                            <div className="border border-slate-200 rounded-xl overflow-hidden">
                              <table className="w-full text-sm">
                                <tbody className="divide-y divide-slate-100">
                                  {[{ label: "Subtotal", val: `₹${(activeOrder.quoteDetails.subtotal || 0).toLocaleString("en-IN")}` }, { label: "Discount", val: `−₹${(activeOrder.quoteDetails.discount || 0).toLocaleString("en-IN")}` }, { label: "GST", val: `₹${(activeOrder.quoteDetails.tax || 0).toLocaleString("en-IN")}` }].map((row, i) => (
                                    <tr key={i}><td className="px-4 py-2.5 text-slate-500 text-xs">{row.label}</td><td className="px-4 py-2.5 text-right text-slate-800 font-bold text-xs">{row.val}</td></tr>
                                  ))}
                                  <tr className="bg-slate-50"><td className="px-4 py-3 font-black text-[#1E40AF] text-sm">Grand Total</td><td className="px-4 py-3 text-right font-black text-emerald-700 font-mono">₹{(activeOrder.quoteDetails.grandTotal || 0).toLocaleString("en-IN")}</td></tr>
                                </tbody>
                              </table>
                            </div>
                          )}

                          {/* Grand total summary */}
                          <div className="flex justify-between items-center px-4 py-3 bg-slate-50 rounded-xl">
                            <span className="font-black text-[#0b1c30]">Grand Total</span>
                            <span className="font-black text-emerald-700 text-lg">₹{(activeOrder.quoteDetails.grandTotal || 0).toLocaleString("en-IN")}</span>
                          </div>

                          {/* Approve / Decline */}
                          {activeOrder.quoteDetails.status !== "Approved" && (
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
                              <p className="text-xs font-bold text-[#1E40AF]">Approve this quotation to proceed, or request revisions</p>
                              {showQuoteDeclineInput ? (
                                <div className="space-y-2">
                                  <textarea rows={3} value={quoteFeedback} onChange={e => setQuoteFeedback(e.target.value)} placeholder="Your revision feedback..." className="w-full p-2.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-red-500" />
                                  <div className="flex gap-2">
                                    <button onClick={() => setShowQuoteDeclineInput(false)} className="px-3 py-1.5 border border-slate-200 text-slate-500 rounded-lg text-xs font-bold">Cancel</button>
                                    <button onClick={handleDeclineQuote} disabled={!quoteFeedback.trim() || !!updatingStatus} className="px-3.5 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold disabled:opacity-50">Submit</button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex gap-2">
                                  <button onClick={() => setShowQuoteDeclineInput(true)} className="px-4 py-2 border border-slate-300 bg-white text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50">Request Revision</button>
                                  <button onClick={handleApproveQuote} disabled={!!updatingStatus} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 flex items-center gap-1.5 disabled:opacity-50">
                                    <Check size={13} /> Approve Quotation
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                          {activeOrder.quoteDetails.status === "Approved" && (
                            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2">
                              <Check size={16} className="text-emerald-600 stroke-[2.5]" />
                              <span className="text-sm font-bold text-emerald-700">Quotation Approved ✓</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* ── Sub-section C: Advance Payment (stage = Quotation Approved) ── */}
                    {(activeOrder?.stage === "Quotation Approved" || activeOrder?.quoteDetails?.advancePaid) && activeOrder?.quoteDetails && (
                      <div className="border border-emerald-200 rounded-xl overflow-hidden">
                        <div className="bg-emerald-50 px-4 py-3 border-b border-emerald-100 flex items-center justify-between">
                          <span className="text-sm font-black text-emerald-800">💰 Advance Payment</span>
                          {activeOrder.quoteDetails.advancePaid
                            ? <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 font-bold">✅ Paid</span>
                            : <span className="text-xs px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 font-bold">Pending</span>
                          }
                        </div>
                        <div className="p-4 space-y-4">
                          {/* Amount due */}
                          <div className="grid grid-cols-3 gap-3">
                            {[
                              { label: "Project Value", value: activeOrder.quoteDetails.grandTotal || 0 },
                              { label: `Advance (${activeOrder.quoteDetails.advancePercent || 25}%)`, value: activeOrder.quoteDetails.advanceAmount || 0, highlight: true },
                              { label: "Balance Due", value: (activeOrder.quoteDetails.grandTotal || 0) - (activeOrder.quoteDetails.advanceAmount || 0) },
                            ].map(row => (
                              <div key={row.label} style={{ padding: "12px", background: row.highlight ? "#1e40af" : "#f8fafc", borderRadius: 10, textAlign: "center", border: `1px solid ${row.highlight ? "#1e40af" : "#e2e8f0"}` }}>
                                <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", color: row.highlight ? "rgba(255,255,255,0.7)" : "#94a3b8", marginBottom: 4 }}>{row.label}</div>
                                <div style={{ fontSize: 14, fontWeight: 900, color: row.highlight ? "white" : "#0f172a" }}>₹{(row.value || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</div>
                              </div>
                            ))}
                          </div>

                          {/* Invoice details */}
                          {activeOrder.advanceInvoiceDetails && (
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1">
                              <div className="flex justify-between"><span className="text-slate-500">Invoice #</span><span className="font-bold">{activeOrder.advanceInvoiceDetails.invoiceNumber}</span></div>
                              <div className="flex justify-between"><span className="text-slate-500">Due Date</span><span className="font-bold">{new Date(activeOrder.advanceInvoiceDetails.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span></div>
                            </div>
                          )}

                          {/* Payment submission or verification notice */}
                          {!activeOrder.quoteDetails.advancePaid && (
                            (() => {
                              const hasPendingPayment = (activeOrder.paymentHistory || []).some((p: any) => p.status === "Pending Verification");
                              
                              if (hasPendingPayment) {
                                return (
                                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-center space-y-3">
                                    <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto text-amber-600">
                                      <Clock size={20} className="animate-pulse" />
                                    </div>
                                    <div>
                                      <h4 className="text-xs font-black text-amber-900 uppercase tracking-wider">Payment Verification In Progress</h4>
                                      <p className="text-xs text-amber-700 mt-2 max-w-sm mx-auto leading-relaxed font-semibold">
                                        Your payment receipt has been submitted and is currently being verified by our finance team. Once approved, your order will automatically advance to the Design stage.
                                      </p>
                                    </div>
                                  </div>
                                );
                              }

                              return (
                                <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                                  <p className="text-xs font-bold text-slate-600">Submit your payment details</p>
                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Payment Method</label>
                                      <select id="portal-payment-method" className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-slate-50">
                                        <option value="UPI">UPI</option>
                                        <option value="Bank Transfer">Bank Transfer</option>
                                        <option value="Cash">Cash</option>
                                        <option value="Cheque">Cheque</option>
                                      </select>
                                    </div>
                                    <div>
                                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">UTR / Reference No.</label>
                                      <input id="portal-payment-ref" type="text" placeholder="Transaction ID" className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-slate-50" />
                                    </div>
                                  </div>
                                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs">
                                    <div className="font-bold text-[#0b1c30] mb-1">Payment Details</div>
                                    <div className="text-slate-500 space-y-0.5">
                                      <div>UPI: <span className="font-mono font-bold">printec@upi</span></div>
                                      <div>Bank: HDFC Bank · A/C: 12345678901 · IFSC: HDFC0001234</div>
                                    </div>
                                  </div>
                                  <button
                                    onClick={async () => {
                                      if (!activeOrder) return;
                                      const method = (document.getElementById("portal-payment-method") as HTMLSelectElement)?.value || "UPI";
                                      const ref = (document.getElementById("portal-payment-ref") as HTMLInputElement)?.value || "";
                                      const supabase = createClient();
                                      const advAmt = activeOrder.quoteDetails?.advanceAmount || 0;
                                      const existing = Array.isArray(activeOrder.paymentHistory) ? activeOrder.paymentHistory : [];
                                      const updated = [...existing, { method, reference: ref, amount: advAmt, paidAt: new Date().toISOString(), status: "Pending Verification" }];
                                      
                                      setOrders(prev => prev.map(o => o.id === activeOrder.id ? { ...o, paymentHistory: updated } : o));
                                      
                                      await supabase.from("orders").update({ payment_history: updated }).eq("id", activeOrder.id);
                                      await supabase.from("order_messages").insert({ order_id: activeOrder.orderId || activeOrder.id, tab: "timeline", sender_name: "System", sender_role: "System", content: `Customer submitted ₹${advAmt.toLocaleString("en-IN")} via ${method}. Ref: ${ref || "—"}` });
                                      alert("Payment submitted! Our team will verify and update the order status.");
                                    }}
                                    className="w-full py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                                  >
                                    <Check size={14} /> Confirm Payment Submitted
                                  </button>
                                </div>
                              );
                            })()
                          )}

                          {/* Payment history */}
                          {(activeOrder.paymentHistory || []).length > 0 && (
                            <div className="space-y-2">
                              <p className="text-xs font-bold text-slate-500 uppercase">Payment History</p>
                              {(activeOrder.paymentHistory || []).map((p: any, idx: number) => (
                                <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                                  <div>
                                    <span className="font-bold text-[#0b1c30]">₹{p.amount?.toLocaleString("en-IN")}</span>
                                    <span className="text-slate-400 ml-1">via {p.method}</span>
                                    {p.reference && <span className="text-slate-400 ml-1">· {p.reference}</span>}
                                  </div>
                                  <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${ p.status === "Paid" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700" }`}>{p.status || "Pending"}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* ── No quotation yet ── */}
                    {activeOrder?.stage === "Quotation In Progress" && !activeOrder?.quoteDetails && (
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 text-center">
                        <div className="text-2xl mb-2">📊</div>
                        <p className="text-sm font-bold text-[#1E40AF]">Quotation In Progress</p>
                        <p className="text-xs text-slate-500 mt-1">Our team is preparing your customized quotation. You'll be notified when it's ready.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* ── DESIGN STAGE ── */}
                {currentStep === 3 && (
                  <div className="space-y-5">
                    <div>
                      <h2 className="text-xl font-black text-[#0b1c30] mb-1">Design Concept Proof</h2>
                      <p className="text-sm text-slate-500">Review the design mockup below. You can approve or request revisions.</p>
                    </div>
                    {dd.proofUrl ? (
                      <div className="border border-slate-200 rounded-xl bg-[#0b1c30] flex items-center justify-center p-4 min-h-52 relative">
                        <img src={dd.proofUrl} alt="Design Proof" className="max-h-64 object-contain transition-all" style={{ transform: `scale(${zoomLevel / 100})` }} onError={e => { e.currentTarget.src = "https://images.unsplash.com/photo-1542744094-3a31f103e35f?w=400&auto=format&fit=crop"; }} />
                        <div className="absolute bottom-3 right-3 bg-white/90 border border-slate-200 rounded-lg p-1.5 flex items-center gap-2">
                          <button onClick={() => setZoomLevel(v => Math.max(v - 20, 50))} className="p-0.5 text-slate-500 hover:text-slate-800"><ZoomOut size={12} /></button>
                          <span className="text-[10px] font-mono font-black">{zoomLevel}%</span>
                          <button onClick={() => setZoomLevel(v => Math.min(v + 20, 200))} className="p-0.5 text-slate-500 hover:text-slate-800"><ZoomIn size={12} /></button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-10 bg-slate-50 border border-slate-200 rounded-xl text-center text-slate-400 text-sm">Design proof will be uploaded once quotation is approved.</div>
                    )}
                    {dd.proofUrl && dd.status !== "Approved" && (
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
                        {showDesignDeclineInput ? (
                          <div className="space-y-2">
                            <textarea rows={3} value={designFeedback} onChange={e => setDesignFeedback(e.target.value)} placeholder="Design revision notes..." className="w-full p-2.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-red-500" />
                            <div className="flex gap-2">
                              <button onClick={() => setShowDesignDeclineInput(false)} className="px-3 py-1.5 border border-slate-200 text-slate-500 rounded-lg text-xs font-bold">Cancel</button>
                              <button onClick={handleDeclineDesign} disabled={!designFeedback.trim() || !!updatingStatus} className="px-3.5 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold disabled:opacity-50">Send Notes</button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <button onClick={() => setShowDesignDeclineInput(true)} className="px-4 py-2 border border-slate-300 bg-white text-slate-600 rounded-lg text-xs font-bold">Request Edit</button>
                            <button onClick={handleApproveDesign} disabled={!!updatingStatus} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 flex items-center gap-1.5 disabled:opacity-50">
                              <Check size={13} /> Approve Design
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                    {dd.status === "Approved" && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2">
                        <Check size={16} className="text-emerald-600 stroke-[2.5]" />
                        <span className="text-sm font-bold text-emerald-700">Design Approved — Moving to Fabrication</span>
                      </div>
                    )}
                  </div>
                )}

                {/* ── PRODUCTION / FABRICATION STAGE ── */}
                {currentStep === 4 && (
                  <div className="space-y-5">
                    <div>
                      <h2 className="text-xl font-black text-[#0b1c30] mb-1">Workshop Fabrication Status</h2>
                      <p className="text-sm text-slate-500">Real-time checklist of production milestones.</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { done: pd.printing, label: "Print layout & backing plotted" },
                        { done: pd.cutting, label: "CNC precision cutting complete" },
                        { done: pd.fabrication, label: "Aluminium frame welding tested" },
                        { done: pd.assembly, label: "LED circuitry & acrylic wired" },
                      ].map((item, i) => (
                        <div key={i} className={`p-4 border rounded-xl flex items-center justify-between ${item.done ? "bg-emerald-50/50 border-emerald-200 text-emerald-800" : "bg-slate-50 border-slate-200 text-slate-500"}`}>
                          <span className="text-xs font-semibold">{item.label}</span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${item.done ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"}`}>{item.done ? "Done" : "Pending"}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── INSTALLATION STAGE ── */}
                {currentStep === 5 && (
                  <div className="space-y-5">
                    <div>
                      <h2 className="text-xl font-black text-[#0b1c30] mb-1">Field Installation</h2>
                      <p className="text-sm text-slate-500">Installation completion sign-off and records.</p>
                    </div>
                    {inst.photoUrl ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="border border-slate-200 rounded-xl overflow-hidden aspect-video">
                          <img src={inst.photoUrl} alt="Installation" className="w-full h-full object-cover" onError={e => { e.currentTarget.src = "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=400&auto=format&fit=crop"; }} />
                        </div>
                        <div className="space-y-3">
                          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800">✓ Job Completed & Signed off by Client</div>
                          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                            <span className="text-slate-400 uppercase font-bold text-[10px] block mb-1">Signature</span>
                            <span className="font-serif italic text-slate-800 text-sm">{inst.customerSignature}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-8 bg-slate-50 border border-slate-200 rounded-xl text-center text-slate-400 text-sm">Installation records will appear here once complete.</div>
                    )}
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* ── RIGHT SIDEBAR ── */}
          <div className="space-y-5">
            {/* Updates & Chat */}
            {activeOrder && (
              <CustomerChat
                orderId={activeOrder.orderId || activeOrder.id}
                customerId={customer.customerId || customer.id}
                token={token}
                customerName={customer.name}
              />
            )}
          </div>
        </div>
      </div>


      {/* ─── MOBILE FLOATING CHAT BUTTON (hidden on lg+) ─── */}
      {activeOrder && (
        <MobileChatButton
          orderId={activeOrder.orderId || activeOrder.id}
          customerId={customer.customerId || customer.id}
          token={token}
          customerName={customer.name}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────
// Shared Chat Types
// ─────────────────────────────────────────────────
interface ChatProps {
  orderId: string;
  customerId: string;
  token: string;
  customerName: string;
}

interface ChatMsg {
  id: string;
  order_id: string;
  tab: string;
  sender_name: string;
  sender_role: string;
  content: string;
  created_at: string;
  is_read: boolean;
}

// ─────────────────────────────────────────────────
// useOrderMessages — shared hook with Supabase Realtime
// ─────────────────────────────────────────────────
function useOrderMessages(
  orderId: string,
  customerId: string,
  token: string,
  customerName: string
) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const prevCountRef = useRef(0);

  // Initial fetch
  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/portal/messages?order_id=${encodeURIComponent(orderId)}&customer_id=${encodeURIComponent(customerId)}&token=${encodeURIComponent(token)}`
      );
      if (res.ok) {
        const { messages: msgs } = await res.json();
        setMessages(msgs || []);
      }
    } catch (e) {
      console.error("Chat fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, [orderId, customerId, token]);

  // Subscribe to Supabase Realtime for instant updates
  useEffect(() => {
    fetchMessages();
    const supabase = createClient();
    // Use unique channel name per mount to avoid Supabase channel cache collision (Strict Mode)
    const channelName = `portal-chat-${orderId}-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "order_messages",
          filter: `order_id=eq.${orderId}`,
        },
        (payload) => {
          const newMsg = payload.new as ChatMsg;
          if (newMsg.tab !== "customer") return; // Only show customer-tab messages in portal
          setMessages((prev) => {
            // Prevent duplicates
            if (prev.some((m) => m.id === newMsg.id || (m.id.startsWith("opt-") && m.content === newMsg.content))) {
              // Replace optimistic message with real one
              if (newMsg.sender_role === "Customer") {
                return prev.map((m) => (m.id.startsWith("opt-") && m.content === newMsg.content ? newMsg : m));
              }
              return prev;
            }
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      // Unsubscribe and remove to prevent "already subscribed" errors on re-mount
      channel.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [orderId, fetchMessages]);

  // Mark messages as read when count grows (for mobile badge)
  const unreadCount = useMemo(() => {
    let count = 0;
    messages.forEach((m) => {
      if (m.sender_role !== "Customer" && m.sender_role !== "System" && !m.is_read) {
        count++;
      }
    });
    return count;
  }, [messages]);

  const sendMessage = useCallback(
    async (text: string, optimisticId: string): Promise<boolean> => {
      const trimmed = text.trim();
      if (!trimmed || sending) return false;
      setSending(true);
      try {
        const res = await fetch("/api/portal/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            order_id: orderId,
            customer_id: customerId,
            token,
            content: trimmed,
            sender_name: customerName,
          }),
        });
        if (!res.ok) throw new Error("Send failed");
        return true;
      } catch (e) {
        console.error("Send error:", e);
        return false;
      } finally {
        setSending(false);
      }
    },
    [orderId, customerId, token, customerName]
  );

  // Optimistic send with rollback
  const sendWithOptimistic = useCallback(
    async (input: string, setInput: (val: string) => void) => {
      const trimmed = input.trim();
      if (!trimmed) return;
      setInput("");
      const optimisticId = `opt-${Date.now()}`;
      const optimistic: ChatMsg = {
        id: optimisticId,
        order_id: orderId,
        tab: "customer",
        sender_name: customerName,
        sender_role: "Customer",
        content: trimmed,
        created_at: new Date().toISOString(),
        is_read: false,
      };
      // Add optimistic message
      setMessages((prev) => [...prev, optimistic]);
      // Try to send
      const success = await sendMessage(trimmed, optimisticId);
      if (!success) {
        // Rollback: remove the optimistic message
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      }
    },
    [orderId, customerName, sendMessage]
  );

  return { messages, loading, sending, unreadCount, sendWithOptimistic };
}

// ─────────────────────────────────────────────────
// CustomerChat — sidebar version (desktop)
// ─────────────────────────────────────────────────
function CustomerChat({ orderId, customerId, token, customerName }: ChatProps) {
  const [input, setInput] = useState("");
  const [expanded, setExpanded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { messages, loading, sending, sendWithOptimistic } = useOrderMessages(
    orderId,
    customerId,
    token,
    customerName
  );

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    await sendWithOptimistic(input, setInput);
  }

  const chatBody = (
    <>
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between flex-shrink-0 bg-white">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.15)]" />
          <h3 className="text-xs font-black text-[#0b1c30] uppercase tracking-widest">Updates & Chat</h3>
        </div>
        <button
          onClick={() => setExpanded(e => !e)}
          className="p-1.5 text-slate-400 hover:text-[#1E40AF] hover:bg-blue-50 rounded-lg transition-all"
          title={expanded ? "Minimize" : "Expand to fullscreen"}
        >
          {expanded ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#FCFCFD]">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={18} className="animate-spin text-slate-300" />
          </div>
        )}
        {!loading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
            <MessageSquare size={24} className="stroke-1 opacity-50" />
            <p className="text-xs font-medium text-center">No messages yet.<br />Send a message to start chatting with the Printec team.</p>
          </div>
        )}
        {messages.map((msg) => {
          const isMe = msg.sender_role === "Customer";
          const initials = msg.sender_name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
          const time = new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
          if (msg.sender_role === "System") {
            return (
              <div key={msg.id} className="flex justify-center">
                <span className="text-[10px] text-slate-400 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full font-medium">{msg.content}</span>
              </div>
            );
          }
          return (
            <div key={msg.id} className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : ""}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black shrink-0 ${
                isMe ? "bg-[#1E40AF] text-white" : "bg-slate-200 text-slate-600"
              }`}>{initials}</div>
              <div className={`flex flex-col max-w-[78%] ${isMe ? "items-end" : "items-start"}`}>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wide mb-0.5 px-1">{msg.sender_name}</span>
                <div className={`px-3 py-2 rounded-2xl text-xs leading-relaxed break-words shadow-sm ${
                  isMe
                    ? "bg-[#1E40AF] text-white rounded-br-sm"
                    : "bg-white text-slate-800 border border-slate-200 rounded-bl-sm"
                }`}>{msg.content}</div>
                <span className="text-[9px] text-slate-400 mt-1 px-1 font-mono">{time}{isMe && <CheckCheck size={9} className="inline ml-1 text-slate-300" />}</span>
              </div>
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-3 border-t border-slate-200 bg-white flex items-center gap-2 flex-shrink-0">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-3 py-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          disabled={sending}
        />
        <button
          type="submit"
          disabled={!input.trim() || sending}
          className="p-2.5 bg-[#1E40AF] text-white rounded-xl hover:bg-blue-700 transition-all disabled:opacity-40 flex items-center justify-center"
        >
          {sending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
        </button>
      </form>
    </>
  );

  return (
    <>
      {/* Desktop sidebar card (hidden on mobile) */}
      <div className="hidden lg:flex bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex-col" style={{ height: "600px" }}>
        {chatBody}
      </div>

      {/* Expanded popup modal */}
      {expanded && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-xl h-[85vh] bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
            {chatBody}
          </div>
        </div>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────
// MobileChatButton — floating button for mobile
// ─────────────────────────────────────────────────
function MobileChatButton({ orderId, customerId, token, customerName }: ChatProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const { messages, loading, sending, unreadCount, sendWithOptimistic } = useOrderMessages(
    orderId,
    customerId,
    token,
    customerName
  );

  // Scroll to bottom when chat opens
  useEffect(() => {
    if (open) {
      scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [open]);

  // Scroll to bottom when new messages arrive while chat is open
  useEffect(() => {
    if (open) {
      scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    await sendWithOptimistic(input, setInput);
  }

  return (
    <div className="lg:hidden">
      {/* Floating Button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#1E40AF] text-white rounded-full shadow-xl hover:bg-blue-700 transition-all hover:scale-105 flex items-center justify-center"
        >
          <MessageSquare size={22} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Mobile Chat Panel */}
      {open && (
        <div className="fixed inset-0 z-[60] flex flex-col justify-end bg-slate-900/50 backdrop-blur-sm transition-all" onClick={() => setOpen(false)}>
          <div className="w-full h-[85vh] bg-white rounded-t-2xl flex flex-col overflow-hidden shadow-[0_-10px_40px_rgba(0,0,0,0.1)]" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="px-4 py-3 bg-[#0b1c30] text-white flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <MessageSquare size={16} className="text-blue-300" />
              <span className="text-sm font-black">Chat with Printec</span>
              <span className="text-[9px] bg-emerald-500 text-white px-1.5 py-0.5 rounded-full font-bold">LIVE</span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-all"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#FCFCFD]">
            {loading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={18} className="animate-spin text-slate-300" />
              </div>
            )}
            {!loading && messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full py-20 text-slate-400 gap-3">
                <MessageSquare size={32} className="stroke-1 opacity-40" />
                <p className="text-sm font-medium text-center">No messages yet.<br />Send us a message!</p>
              </div>
            )}
            {messages.map((msg) => {
              const isMe = msg.sender_role === "Customer";
              const initials = msg.sender_name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
              const time = new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
              if (msg.sender_role === "System") {
                return (
                  <div key={msg.id} className="flex justify-center">
                    <span className="text-[10px] text-slate-400 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full font-medium">{msg.content}</span>
                  </div>
                );
              }
              return (
                <div key={msg.id} className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : ""}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                    isMe ? "bg-[#1E40AF] text-white" : "bg-slate-200 text-slate-600"
                  }`}>{initials}</div>
                  <div className={`flex flex-col max-w-[75%] ${isMe ? "items-end" : "items-start"}`}>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wide mb-0.5 px-1">{msg.sender_name}</span>
                    <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed break-words ${
                      isMe
                        ? "bg-[#1E40AF] text-white rounded-br-sm"
                        : "bg-white text-slate-800 border border-slate-200 rounded-bl-sm shadow-sm"
                    }`}>{msg.content}</div>
                    <span className="text-[9px] text-slate-400 mt-1 px-1 font-mono">{time}</span>
                  </div>
                </div>
              );
            })}
            <div ref={scrollRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-4 border-t border-slate-200 bg-white flex items-center gap-3 flex-shrink-0 pb-safe">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-4 py-3 border border-slate-200 rounded-2xl text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={!input.trim() || sending}
              className="w-11 h-11 bg-[#1E40AF] text-white rounded-full hover:bg-blue-700 transition-all disabled:opacity-40 flex items-center justify-center flex-shrink-0"
            >
              {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </form>
          </div>
        </div>
      )}
    </div>
  );
}
