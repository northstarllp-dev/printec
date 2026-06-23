"use client";

import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  MapPin,
  FileCheck,
  Layout,
  CreditCard,
  MessageSquare,
  CheckCircle,
  Clock,
  Calendar,
  User,
  Check,
  RefreshCw,
  AlertCircle,
  Loader2,
  ArrowRight,
  Wrench
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { scheduleSiteVisitAction } from "@/features/orders/actions/orderActions";
import { mapSiteVisitFromDb } from "@/features/orders/actions/siteVisitMapper";

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

interface OrderDetailClientProps {
  customer: Customer;
  order: Order;
  token: string;
}

const tabs = [
  { id: "site_visit", label: "Site Visit", icon: MapPin },
  { id: "quotation", label: "Quotation", icon: FileCheck },
  { id: "design", label: "Design", icon: Layout },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "chat", label: "Chat", icon: MessageSquare },
];

const stages = ["Enquiries", "Site Visit", "Quotations", "Design", "Production", "Installation"];

export function OrderDetailClient({ customer, order: initialOrder, token }: OrderDetailClientProps) {
  // Determine initial tab based on order stage
  const getInitialTab = () => {
    if (!initialOrder.stage) return "site_visit";
    if (initialOrder.stage.includes("Site Visit Pending") || initialOrder.stage === "Site Visit Pending") return "site_visit";
    if (initialOrder.stage.includes("Quotation")) return "quotation";
    if (initialOrder.stage.includes("Design")) return "design";
    if (initialOrder.stage.includes("Production") || initialOrder.stage.includes("Ready For")) return "billing";
    if (initialOrder.stage.includes("Installation") || initialOrder.stage.includes("Completed")) return "chat";
    return "site_visit";
  };
  
  const [activeTab, setActiveTab] = useState(getInitialTab());
  const [order, setOrder] = useState(initialOrder);
  
  // Site Visit scheduling states
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [siteAddress, setSiteAddress] = useState(customer.shippingAddress || "");
  const [gpsCoords, setGpsCoords] = useState("12.9716° N, 77.5946° E");
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [schedulingLoading, setSchedulingLoading] = useState(false);
  const [mapsSearching, setMapsSearching] = useState(false);

  // Make sure we map the order stage to our stages array
  const stageMapping: Record<string, string> = {
    "Site Visit Pending": "Enquiries",
    "Site Visit Scheduled": "Site Visit",
    "Site Visit Completed": "Site Visit",
    "Quotation In Progress": "Quotations",
    "Quotation Sent": "Quotations",
    "Quotation Negotiation": "Quotations",
    "Quotation Approved": "Quotations",
    "Design In Progress": "Design",
    "Design Approved": "Design",
    "Production": "Production",
    "Ready For Installation": "Production",
    "Installation Scheduled": "Installation",
    "Completed": "Installation",
    "Closed": "Installation",
  };
  const mappedStage = stageMapping[order.stage] || "Enquiries";
  const currentStageIndex = stages.indexOf(mappedStage) !== -1 ? stages.indexOf(mappedStage) : 0;
  const sv = order.siteVisitDetails || {};
  const qd = order.quoteDetails || {};
  const dd = order.designDetails || {};

  // Sync site visit details
  useEffect(() => {
    if (order?.siteVisitDetails) {
      const sv = order.siteVisitDetails;
      setSelectedDate(sv.auditDate || "");
      setSelectedTime(sv.auditTime || "");
      setSiteAddress(sv.customerAddress || customer.shippingAddress || "");
      setGpsCoords(sv.gpsLocation || "12.9716° N, 77.5946° E");
    }
  }, [order.id, order.siteVisitDetails]);

  // Realtime subscription to sync order, site visit, and quotation changes dynamically
  useEffect(() => {
    if (!order) return;
    const supabase = createClient();
    const orderChannelName = `portal-order-detail-sync-${order.id}-${Date.now()}`;

    const channel = supabase
      .channel(orderChannelName)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `id=eq.${order.id}` },
        (payload) => {
          if (payload.eventType === "UPDATE" || payload.eventType === "INSERT") {
            const updatedOrder = payload.new as any;
            if (updatedOrder) {
              setOrder(prev => ({
                ...prev,
                stage: updatedOrder.stage,
                depositPaid: Number(updatedOrder.deposit_paid) || 0,
                paymentHistory: updatedOrder.payment_history || [],
                advanceInvoiceDetails: updatedOrder.advance_invoice_details || null,
                designDetails: updatedOrder.design_details,
                productionDetails: updatedOrder.production_details,
                installationDetails: updatedOrder.installation_details,
                stageStatus: updatedOrder.stage_status,
                stageAdminNotes: updatedOrder.stage_admin_notes,
              }));
            }
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "site_visits", filter: `order_id=eq.${order.id}` },
        (payload) => {
          if (payload.eventType === "DELETE") {
            setOrder(prev => ({
              ...prev,
              siteVisitDetails: undefined
            }));
          } else {
            const mapped = mapSiteVisitFromDb(payload.new);
            if (mapped) {
              setOrder(prev => ({
                ...prev,
                siteVisitDetails: {
                  ...mapped,
                  locations: mapped.locations && mapped.locations.length > 0 ? mapped.locations : (prev.siteVisitDetails?.locations || [])
                }
              }));
            }
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "quotations", filter: `order_id=eq.${order.id}` },
        (payload) => {
          if (payload.eventType === "UPDATE" || payload.eventType === "INSERT") {
            const updatedQuote = payload.new as any;
            if (updatedQuote) {
              setOrder(prev => ({
                ...prev,
                quoteDetails: {
                  ...(prev.quoteDetails || {}),
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
              }));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [order.id]);

  // Debug active tab
  useEffect(() => {
    console.log("Active tab changed to:", activeTab);
  }, [activeTab]);

  const getBusinessDays = () => {
    const days: Date[] = [];
    const cur = new Date();
    while (days.length < 7) {
      cur.setDate(cur.getDate() + 1);
      if (cur.getDay() !== 0) days.push(new Date(cur));
    }
    return days;
  };

  const isSlotBooked = (date: string, time: string) => false;

  const handleScheduleSiteVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order || !selectedDate || !selectedTime || !siteAddress) return;
    setSchedulingLoading(true);
    try {
      const payload = { auditDate: selectedDate, auditTime: selectedTime, customerAddress: siteAddress, gpsLocation: gpsCoords, sitePersonnel: "Hari", completed: false, reviewStatus: "Pending" };
      const res = await scheduleSiteVisitAction(order.id, payload);
      if (res.success && res.order) {
        setOrder(prev => ({ ...prev, stage: res.order.stage, siteVisitDetails: res.order.siteVisitDetails }));
        setIsRescheduling(false);
      }
    } catch (err) { console.error(err); }
    finally { setSchedulingLoading(false); }
  };

  const handleBackToPortal = () => {
    const url = new URL("/portal", window.location.origin);
    url.searchParams.set("customer_id", customer.customerId || customer.id);
    url.searchParams.set("token", token);
    window.location.href = url.toString();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBackToPortal}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900">{order.projectName}</h1>
              <p className="text-sm text-gray-500">Order {order.orderCode || order.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              currentStageIndex >= 2
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-blue-50 text-blue-700 border border-blue-200"
            }`}>
              {order.stage}
            </span>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            {stages.map((stage, idx) => {
              const isCompleted = idx < currentStageIndex;
              const isActive = idx === currentStageIndex;
              
              const tabMap: Record<string, string> = {
                "Enquiries": "site_visit",
                "Site Visit": "site_visit",
                "Quotations": "quotation",
                "Design": "design",
                "Production": "billing",
                "Installation": "chat"
              };
              
              const targetTab = tabMap[stage];
              const isTabActive = activeTab === targetTab;
              
              const Icon = idx === 0 ? CheckCircle : idx === 1 ? MapPin : idx === 2 ? FileCheck : idx === 3 ? Layout : idx ===4 ? CheckCircle : Wrench;

              return (
                <React.Fragment key={idx}>
                  <button
                    onClick={() => {
                      console.log("CLICKED", stage, "setting to", targetTab);
                      setActiveTab(targetTab);
                    }}
                    className="flex flex-col items-center gap-2 focus:outline-none focus:ring-4 focus:ring-blue-200 rounded-xl p-2"
                    style={{ cursor: "pointer" }}
                  >
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                        isTabActive || isActive
                          ? "bg-blue-500 text-white"
                          : isCompleted
                            ? "bg-emerald-500 text-white"
                            : "bg-gray-200 text-gray-400"
                      } hover:scale-110`}
                    >
                      <Icon size={16} />
                    </div>
                    <span
                      className={`text-sm font-semibold ${
                        isTabActive || isActive
                          ? "text-blue-600"
                          : isCompleted
                            ? "text-green-600"
                            : "text-gray-500"
                      }`}
                    >
                      {stage}
                    </span>
                  </button>
                  {idx < stages.length - 1 && (
                    <div className={`flex-1 h-1 mx-4 rounded-full ${
                      idx < currentStageIndex ? "bg-green-500" : "bg-gray-200"
                    }`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-2 overflow-x-auto py-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-5 py-3 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                    activeTab === tab.id
                      ? "bg-blue-50 text-blue-600 border border-blue-200"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === "site_visit" && (
          <div className="space-y-6">
            {(!sv.auditDate || isRescheduling) ? (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-black text-gray-900 mb-1.5">
                    Schedule Your Physical Site Audit
                  </h2>
                  <p className="text-sm text-gray-500 leading-relaxed max-w-lg">
                    Our technical survey team needs to verify dimensions and substrate conditions before we can finalize the structural design. Estimated duration: 45 mins.
                  </p>
                </div>

                <form onSubmit={handleScheduleSiteVisit} className="space-y-5">
                  {/* Date Picker */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
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
                                ? "bg-blue-50 border-blue-600 text-blue-600 ring-2 ring-blue-100"
                                : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                            }`}
                          >
                            <span className="text-[9px] uppercase tracking-wider text-gray-400">{dayName}</span>
                            <span className="text-sm font-black mt-0.5">{day.getDate()}</span>
                            <span className="text-[9px] text-gray-400">{monthName}</span>
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
                                booked ? "bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed"
                                  : sel ? "bg-blue-50 border-blue-600 text-blue-600 ring-2 ring-blue-100"
                                    : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 cursor-pointer"
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
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                      Choose Location in Maps
                    </label>
                    <input
                      type="text"
                      required
                      value={siteAddress}
                      onChange={e => setSiteAddress(e.target.value)}
                      placeholder="Full address where signage will be installed"
                      className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none bg-gray-50 focus:bg-white transition-all"
                    />

                    {/* Map visual */}
                    <div className="mt-2 border border-gray-200 rounded-xl overflow-hidden bg-gray-50">
                      <div
                        onClick={() => setGpsCoords(`${(12.97 + Math.random() * 0.01).toFixed(4)}° N, ${(77.59 + Math.random() * 0.01).toFixed(4)}° E`)}
                        className="h-28 bg-[#e8edf2] flex flex-col items-center justify-center relative cursor-crosshair group select-none"
                      >
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,#d1d9e0_1px,transparent_1px),linear-gradient(to_bottom,#d1d9e0_1px,transparent_1px)] bg-[size:20px_20px] opacity-40" />
                        <div className="absolute w-8 h-8 rounded-full bg-blue-400/20 animate-ping" />
                        <MapPin size={28} className="text-blue-600 relative z-10 drop-shadow-md" />
                        <span className="text-[10px] text-gray-500 mt-1.5 relative z-10 font-medium bg-white/90 px-2 py-0.5 rounded-full border border-gray-200">
                          Click to pin location
                        </span>
                      </div>
                      <div className="px-3 py-2 bg-white border-t border-gray-200 flex items-center justify-between">
                        <span className="text-[10px] font-mono font-semibold text-gray-600">📍 {gpsCoords}</span>
                        <button
                          type="button"
                          onClick={() => { setMapsSearching(true); setTimeout(() => { setGpsCoords("12.9716° N, 77.5946° E"); setMapsSearching(false); }, 600); }}
                          className="flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:underline"
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
                    <button type="button" className="px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors">
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
                  <h2 className="text-lg font-black text-gray-900">Site Visit Scheduled</h2>
                  <p className="text-sm text-gray-500 mt-1">Our team will arrive at the scheduled time.</p>
                </div>
                <div className="max-w-sm mx-auto bg-gray-50 border border-gray-200 rounded-xl p-4 text-left grid grid-cols-2 gap-3 text-xs">
                  <div><span className="text-[10px] text-gray-400 uppercase font-bold block">Date</span><p className="font-bold text-gray-800 font-mono mt-0.5">{sv.auditDate}</p></div>
                  <div><span className="text-[10px] text-gray-400 uppercase font-bold block">Time</span><p className="font-bold text-gray-800 font-mono mt-0.5">{sv.auditTime}</p></div>
                  <div className="col-span-2"><span className="text-[10px] text-gray-400 uppercase font-bold block">Address</span><p className="font-medium text-gray-800 mt-0.5">{sv.customerAddress}</p></div>
                </div>
                <button onClick={() => setIsRescheduling(true)} className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-50 transition-all flex items-center gap-2 mx-auto">
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
          </div>
        )}
        {activeTab === "quotation" && <QuotationTab order={order} />}
        {activeTab === "design" && <DesignTab order={order} />}
        {activeTab === "billing" && <BillingTab order={order} />}
        {activeTab === "chat" && <ChatTab order={order} />}
      </main>
    </div>
  );
}

function QuotationTab({ order }: { order: Order }) {
  const qd = order.quoteDetails || {};
  const items = qd.items || [];
  
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900">Quotation</h2>
            <p className="text-sm text-gray-500 mt-2">Valid for 7 days</p>
          </div>
          <span className="px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-full text-sm font-bold">
            {order.stage === "Quotation Approved" ? "Approved" : order.stage === "Quotation Sent" ? "Sent" : "Pending Approval"}
          </span>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">Quotation is being prepared.</p>
            <p className="text-sm mt-2">Check back later for updates!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 text-xs font-bold text-gray-500 uppercase">Description</th>
                  <th className="text-center py-3 text-xs font-bold text-gray-500 uppercase">Qty</th>
                  <th className="text-right py-3 text-xs font-bold text-gray-500 uppercase">Cost/Sq Ft</th>
                  <th className="text-right py-3 text-xs font-bold text-gray-500 uppercase">Total Sq Ft</th>
                  <th className="text-right py-3 text-xs font-bold text-gray-500 uppercase">Unit Price</th>
                  <th className="text-right py-3 text-xs font-bold text-gray-500 uppercase">GST %</th>
                  <th className="text-right py-3 text-xs font-bold text-gray-500 uppercase">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item: any) => {
                  const lineTotal = item.quantity * item.unitPrice;
                  return (
                    <tr key={item.id}>
                      <td className="py-3 text-sm text-gray-900">{item.description}</td>
                      <td className="py-3 text-sm text-center font-mono text-gray-800">{item.quantity}</td>
                      <td className="py-3 text-sm text-right font-mono text-gray-800">₹{(item.costPerSqFt || 0).toLocaleString("en-IN")}</td>
                      <td className="py-3 text-sm text-right font-mono text-gray-800">{(item.totalSqFt || 0).toLocaleString("en-IN")} sq ft</td>
                      <td className="py-3 text-sm text-right font-mono text-gray-800">₹{(item.unitPrice || 0).toLocaleString("en-IN")}</td>
                      <td className="py-3 text-sm text-right font-mono text-gray-800">{item.gstRate}%</td>
                      <td className="py-3 text-sm font-mono text-gray-800 text-right">₹{lineTotal.toLocaleString("en-IN")}</td>
                    </tr>
                  );
                })}
                {qd.discount > 0 && (
                  <tr className="bg-rose-50">
                    <td colSpan={6} className="py-3 text-sm font-semibold text-rose-700 text-right pr-3">
                      Less Discount:
                    </td>
                    <td className="py-3 text-sm font-mono text-rose-700 text-right">
                      - ₹{(qd.discount || 0).toLocaleString("en-IN")}
                    </td>
                  </tr>
                )}
                <tr className="bg-blue-50">
                  <td colSpan={6} className="py-3 text-sm font-semibold text-blue-900 text-right pr-3">
                    Subtotal:
                  </td>
                  <td className="py-3 text-sm font-mono text-blue-900 text-right">
                    ₹{(qd.subtotal || 0).toLocaleString("en-IN")}
                  </td>
                </tr>
                <tr className="bg-blue-50">
                  <td colSpan={6} className="py-3 text-sm font-semibold text-blue-900 text-right pr-3">
                    Total GST:
                  </td>
                  <td className="py-3 text-sm font-mono text-blue-900 text-right">
                    ₹{(qd.tax || 0).toLocaleString("en-IN")}
                  </td>
                </tr>
                <tr className="bg-gray-50">
                  <td colSpan={6} className="py-4 text-lg font-extrabold text-gray-900 text-right pr-3">
                    Grand Total:
                  </td>
                  <td className="py-4 text-lg font-extrabold text-emerald-700 text-right font-mono">
                    ₹{(qd.grandTotal || 0).toLocaleString("en-IN")}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function DesignTab({ order }: { order: Order }) {
  const dd = order.designDetails || {};
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <h2 className="text-2xl font-extrabold text-gray-900 mb-6">Design Preview</h2>

        <div className="aspect-video bg-gray-100 rounded-xl flex items-center justify-center mb-6">
          {dd.proofUrl ? (
            <img
              src={dd.proofUrl}
              alt="Design Proof"
              className="max-h-64 object-contain"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = "https://images.unsplash.com/photo-1542744094-3a31f103e35f?w=400&auto=format&fit=crop";
              }}
            />
          ) : (
            <div className="text-center">
              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <Layout size={48} className="text-gray-400" />
              </div>
              <p className="text-gray-500">Design proof will appear here once quotation is approved</p>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors">
            Approve Design
          </button>
          <button className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors">
            Request Changes
          </button>
        </div>
      </div>
    </div>
  );
}

function BillingTab({ order }: { order: Order }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Payment Summary</h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Total Amount</span>
              <span className="text-xl font-bold text-gray-900 font-mono">
                ₹0
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Paid Amount</span>
              <span className="text-xl font-bold text-green-600 font-mono">
                ₹0
              </span>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <span className="text-gray-900 font-bold">Balance</span>
              <span className="text-2xl font-extrabold text-orange-600 font-mono">
                ₹0
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Payment Options</h3>

          <div className="space-y-3">
            <button className="w-full px-4 py-3 border border-blue-500 text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-colors">
              Pay via UPI
            </button>
            <button className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors">
              Bank Transfer
            </button>
            <button className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors">
              Cash on Delivery
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChatTab({ order }: { order: Order }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 h-[500px] flex flex-col">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900">Communication</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="flex gap-3">
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold">
            A
          </div>
          <div className="max-w-[70%]">
            <div className="bg-gray-100 rounded-xl p-3">
              <p className="text-sm text-gray-900">Hi! Welcome to Printec! We have received your order and will get started soon.</p>
            </div>
            <span className="text-xs text-gray-500 mt-1 block">Today at 10:00 AM</span>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <div className="max-w-[70%] text-right">
            <div className="bg-blue-600 text-white rounded-xl p-3">
              <p className="text-sm">Great! Looking forward to the design.</p>
            </div>
            <span className="text-xs text-gray-500 mt-1 block">Today at 10:05 AM</span>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-gray-200 flex gap-2">
        <input
          type="text"
          placeholder="Type your message..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors">
          Send
        </button>
      </div>
    </div>
  );
}
