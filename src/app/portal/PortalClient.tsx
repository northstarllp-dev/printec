"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Printer, MapPin, FileText, CheckSquare, CheckCircle2,
  MessageSquare, Send, ZoomIn, ZoomOut, Check, X,
  AlertCircle, CreditCard, QrCode, Calendar,
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
  urgent: boolean;
  assignedEmployees: string[];
  assignedDesigners?: string[];
  assignedMarketers?: string[];
  dateCreated: string;
  deadlineStatus: string;
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
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);

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
    return () => {
      ch.unsubscribe();
      supabase.removeChannel(ch);
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
        setOrders(prev => prev.map(o => o.id === activeOrder.id ? { ...o, stage: res.order.stage, siteVisitDetails: res.order.siteVisitDetails } : o));
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
    await supabase.from("orders").update({ stage: "Quotation Approved", quote_details: updatedQuote }).eq("id", activeOrder.id);
    setUpdatingStatus(null);
  };

  const handleDeclineQuote = async () => {
    if (!activeOrder || !quoteFeedback.trim()) return;
    setUpdatingStatus("quote-decline");
    const supabase = createClient();
    const updatedQuote = { ...activeOrder.quoteDetails, status: "Negotiation" };
    setOrders(prev => prev.map(o => o.id === activeOrder.id ? { ...o, stage: "Quotation Negotiation", quoteDetails: updatedQuote } : o));
    await supabase.from("order_messages").insert({ order_id: activeOrder.orderId || activeOrder.id, tab: "customer", sender_name: customer.name, sender_role: "Customer", content: `Quotation Declined. Feedback: ${quoteFeedback}` });
    await supabase.from("orders").update({ stage: "Quotation Negotiation", quote_details: updatedQuote }).eq("id", activeOrder.id);
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

  const handleConfirmMockPayment = async () => {
    if (!activeOrder) return;
    setPaymentLoading(true);
    const qd = activeOrder.quoteDetails || {};
    const total = qd.grandTotal || 0;
    const amount = 0;
    const supabase = createClient();
    await supabase.from("order_messages").insert({ order_id: activeOrder.orderId || activeOrder.id, tab: "timeline", sender_name: "System", sender_role: "System", content: `💳 Client confirmed mock UPI payment. Pending admin verification.` });
    setTimeout(() => { setPaymentLoading(false); setShowPaymentModal(false); }, 800);
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
              <h1 className="text-base font-black text-[#0b1c30] leading-none">
                Order #{activeOrder?.orderCode || activeOrder?.id}
              </h1>
              <p className="text-[11px] text-slate-500 mt-0.5">
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
                  <div className="space-y-5">
                    <div>
                      <h2 className="text-xl font-black text-[#0b1c30] mb-1">Review Your Quotation</h2>
                      <p className="text-sm text-slate-500">Please review the cost breakdown below and approve or request revisions.</p>
                    </div>
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Item</th>
                            <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {[
                            { label: "Signage Type", val: qd.signageType || "ACP Panels" },
                            { label: "Materials", val: qd.material || "Brushed Aluminium" },
                            { label: "Mounting", val: qd.mounting || "Standoffs" },
                            { label: "Base Fabrication", val: `₹${(qd.baseACPPrice || 0).toLocaleString("en-IN")}` },
                            { label: "Hardware & Fittings", val: `₹${(qd.hardwarePrice || 0).toLocaleString("en-IN")}` },
                            { label: "Subtotal", val: `₹${(qd.subtotal || 0).toLocaleString("en-IN")}` },
                            { label: "GST (18%)", val: `₹${(qd.tax || 0).toLocaleString("en-IN")}` },
                          ].map((row, i) => (
                            <tr key={i}>
                              <td className="px-4 py-3 text-slate-500 text-xs">{row.label}</td>
                              <td className="px-4 py-3 text-right text-slate-800 font-bold text-xs">{row.val}</td>
                            </tr>
                          ))}
                          <tr className="bg-slate-50">
                            <td className="px-4 py-3.5 font-black text-[#1E40AF] text-sm">Grand Total</td>
                            <td className="px-4 py-3.5 text-right font-black text-emerald-700 text-sm font-mono">₹{(qd.grandTotal || 0).toLocaleString("en-IN")}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {qd.status !== "Approved" && (activeOrder?.stage === "Quotation Sent" || activeOrder?.stage === "Quotation Negotiation") && (
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
                        <p className="text-xs font-bold text-[#1E40AF]">Approve this quotation to proceed to Design</p>
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
                            <button onClick={() => setShowQuoteDeclineInput(true)} className="px-4 py-2 border border-slate-300 bg-white text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50">Decline / Revise</button>
                            <button onClick={handleApproveQuote} disabled={!!updatingStatus} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 flex items-center gap-1.5 disabled:opacity-50">
                              <Check size={13} /> Approve Quotation
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                    {qd.status === "Approved" && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2">
                        <Check size={16} className="text-emerald-600 stroke-[2.5]" />
                        <span className="text-sm font-bold text-emerald-700">Quotation Approved</span>
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



            {/* ── PAYMENT (if applicable) ── */}
            {(currentStep >= 2) && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                <h3 className="text-sm font-black text-[#0b1c30] flex items-center gap-2">
                  <CreditCard size={15} className="text-slate-400" />
                  Invoicing & Payments
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Total Value", val: `₹0`, color: "slate" },
                    { label: "Paid", val: `₹0`, color: "emerald" },
                    { label: "Balance", val: `₹0`, color: "amber" },
                  ].map((card, i) => (
                    <div key={i} className={`rounded-xl p-3.5 text-center border ${
                      card.color === "emerald" ? "bg-emerald-50 border-emerald-100" :
                        card.color === "amber" ? "bg-amber-50 border-amber-100" : "bg-slate-50 border-slate-200"
                    }`}>
                      <span className={`text-[9px] font-black uppercase tracking-wide ${
                        card.color === "emerald" ? "text-emerald-600" : card.color === "amber" ? "text-amber-600" : "text-slate-400"
                      }`}>{card.label}</span>
                      <p className={`text-sm font-black mt-1 font-mono ${
                        card.color === "emerald" ? "text-emerald-800" : card.color === "amber" ? "text-amber-800" : "text-slate-800"
                      }`}>{card.val}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT SIDEBAR ── */}
          <div className="space-y-5">

            {/* Project Logistics */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3.5 border-b border-slate-100">
                <h3 className="text-xs font-black text-[#0b1c30] uppercase tracking-widest">Project Logistics</h3>
              </div>

              {/* Location Image */}
              <div className="relative h-36 bg-slate-100 overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1486325212027-8081e485255e?w=400&auto=format&fit=crop"
                  alt="Site Location"
                  className="w-full h-full object-cover"
                  onError={e => { e.currentTarget.style.display = "none"; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>

              <div className="p-4 space-y-3">
                {/* Address */}
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MapPin size={13} className="text-slate-500" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#0b1c30] leading-relaxed">
                      {sv.customerAddress || customer.shippingAddress || "Site address will appear after scheduling"}
                    </p>
                  </div>
                </div>

                {/* Project Manager */}
                <div className="flex items-center gap-2.5 py-2 border-t border-slate-100">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white flex items-center justify-center font-black text-xs flex-shrink-0">
                    S
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-[#0b1c30]">Sarah Jenkins</p>
                    <p className="text-[10px] text-slate-400">Project Manager</p>
                  </div>
                </div>

                <button className="w-full flex items-center justify-center gap-2 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                  <Phone size={12} />
                  Contact Manager
                </button>
              </div>
            </div>

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

      {/* ─── PAYMENT MODAL ─── */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <h2 className="text-sm font-bold text-[#0b1c30]">UPI Payment Confirmation</h2>
              <button onClick={() => setShowPaymentModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded"><X size={16} /></button>
            </div>
            <div className="p-6 space-y-4 text-center">
              <QrCode size={100} className="text-[#0b1c30] mx-auto" />
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Amount Due</span>
                <p className="text-xl font-black text-slate-800 font-mono mt-1">
                  ₹0
                </p>
              </div>
              <p className="text-xs text-slate-500">Scan or transfer via netbanking, then confirm below.</p>
            </div>
            <div className="px-5 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-2">
              <button onClick={() => setShowPaymentModal(false)} className="px-4 py-2 border border-slate-300 text-slate-600 rounded-xl text-xs font-bold">Cancel</button>
              <button onClick={handleConfirmMockPayment} disabled={paymentLoading} className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold disabled:opacity-50">
                {paymentLoading ? "Processing..." : "Confirm Payment"}
              </button>
            </div>
          </div>
        </div>
      )}

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
