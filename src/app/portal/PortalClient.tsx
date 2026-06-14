"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Printer, MapPin, FileText, CheckSquare, CheckCircle2, 
  MessageSquare, Send, ZoomIn, ZoomOut, Check, X, 
  AlertCircle, AlertTriangle, CreditCard, QrCode, Calendar, 
  Ruler, Activity, ChevronRight, User, Phone, Mail, Clock, ClipboardList
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { scheduleSiteVisitAction } from "@/app/actions/orderActions";

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
}

interface PortalClientProps {
  customer: Customer;
  orders: Order[];
  initialActiveOrderId: string | null;
  token: string;
}

export function PortalClient({ customer, orders: initialOrders, initialActiveOrderId, token }: PortalClientProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [activeOrderId, setActiveOrderId] = useState<string>(
    initialActiveOrderId || (initialOrders.length > 0 ? initialOrders[0].id : "")
  );
  const [activeTab, setActiveTab] = useState<"progress" | "quote" | "design" | "chat" | "billing">("progress");
  const [chatInput, setChatInput] = useState("");
  const [quoteFeedback, setQuoteFeedback] = useState("");
  const [designFeedback, setDesignFeedback] = useState("");
  const [showQuoteDeclineInput, setShowQuoteDeclineInput] = useState(false);
  const [showDesignDeclineInput, setShowDesignDeclineInput] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  // Site Visit Module states
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [landmark, setLandmark] = useState("");
  const [contactPerson, setContactPerson] = useState(customer.name);
  const [contactNumber, setContactNumber] = useState(customer.phone);
  const [siteType, setSiteType] = useState("Shop Front");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [siteAddress, setSiteAddress] = useState(customer.shippingAddress || "");
  const [gpsCoords, setGpsCoords] = useState("12.9716° N, 77.5946° E");
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [scheduleSuccess, setScheduleSuccess] = useState(false);
  const [schedulingLoading, setSchedulingLoading] = useState(false);
  const [mapsSearching, setMapsSearching] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  const activeOrder = orders.find(o => o.id === activeOrderId);

  // Sync site visit details when activeOrder changes
  useEffect(() => {
    if (activeOrder) {
      const svDetails = activeOrder.siteVisitDetails;
      setSelectedDate(svDetails?.auditDate || "");
      setSelectedTime(svDetails?.auditTime || "");
      setLandmark(svDetails?.landmark || "");
      setContactPerson(svDetails?.contactPerson || customer.name);
      setContactNumber(svDetails?.customerContact || customer.phone);
      setSiteType(svDetails?.siteType || "Shop Front");
      setSpecialInstructions(svDetails?.notes || "");
      setSiteAddress(svDetails?.customerAddress || customer.shippingAddress || "");
      setGpsCoords(svDetails?.gpsLocation || "12.9716° N, 77.5946° E");
    }
  }, [activeOrderId, activeOrder, customer]);

  // Helper to generate next 7 business days starting tomorrow
  const getBusinessDays = () => {
    const days = [];
    const today = new Date();
    let current = new Date(today);
    
    while (days.length < 7) {
      current.setDate(current.getDate() + 1);
      // Skip Sunday (0)
      if (current.getDay() !== 0) {
        days.push(new Date(current));
      }
    }
    return days;
  };

  // Prevent double booking slot validator
  const isSlotBooked = (dateStr: string, timeStr: string) => {
    return orders.some(o => 
      o.id !== activeOrder?.id && 
      o.siteVisitDetails && 
      o.siteVisitDetails.auditDate === dateStr && 
      o.siteVisitDetails.auditTime === timeStr
    );
  };

  const handleScheduleSiteVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrder || !selectedDate || !selectedTime || !siteAddress || !contactPerson || !contactNumber) return;
    
    setSchedulingLoading(true);
    
    const schedulePayload = {
      auditDate: selectedDate,
      auditTime: selectedTime,
      customerAddress: siteAddress,
      gpsLocation: gpsCoords,
      landmark: landmark,
      contactPerson: contactPerson,
      customerContact: contactNumber,
      siteType: siteType,
      notes: specialInstructions,
      sitePersonnel: "Hari", // default assigned auditor
      completed: false,
      reviewStatus: "Pending"
    };

    try {
      const res = await scheduleSiteVisitAction(activeOrder.id, schedulePayload);
      if (res.success && res.order) {
        // Update local state
        setOrders(prev => prev.map(o => o.id === activeOrder.id ? { 
          ...o, 
          stage: res.order.stage, 
          siteVisitDetails: res.order.site_visit_details,
          chatHistory: res.order.chat_history
        } : o));
        
        setIsRescheduling(false);
        setScheduleSuccess(true);
        setTimeout(() => setScheduleSuccess(false), 5000);
      }
    } catch (err) {
      console.error("Failed to schedule site visit:", err);
    } finally {
      setSchedulingLoading(false);
    }
  };

  const getNotificationHistory = () => {
    const history = [];
    const stage = activeOrder?.stage;
    const svDetails = activeOrder?.siteVisitDetails;
    
    // 1. Scheduled alert
    if (svDetails?.auditDate) {
      history.push({
        event: "Site Visit Scheduled",
        time: "Just now",
        channels: { portal: true, whatsapp: true, email: true }
      });
    }
    // 2. Completed alert
    if (svDetails?.completed) {
      history.push({
        event: "Site Visit Completed",
        time: "1 hour ago",
        channels: { portal: true, whatsapp: true, email: true }
      });
    }
    // 3. Approved alert
    if (svDetails?.reviewStatus === "Approved") {
      history.push({
        event: "Site Visit Approved",
        time: "2 hours ago",
        channels: { portal: true, whatsapp: true, email: true }
      });
    }
    // 4. Quotation In Progress alert
    if (stage === "Quotation In Progress" || stage === "Quotation Sent" || stage === "Quotation Negotiation" || stage === "Quotation Approved") {
      history.push({
        event: "Quotation In Progress",
        time: "3 hours ago",
        channels: { portal: true, whatsapp: true, email: true }
      });
    }
    
    return history;
  };



  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeOrder?.chatHistory]);

  if (orders.length === 0) {
    return (
      <div className="min-h-screen bg-[#f8f9ff] flex items-center justify-center p-6 font-sans">
        <div className="bg-white border border-[#c3c6d0] rounded-2xl p-8 max-w-md w-full text-center shadow-lg">
          <AlertCircle size={48} className="text-[#003568] mx-auto mb-4" />
          <h1 className="text-xl font-bold text-[#0b1c30] mb-2">No Active Orders</h1>
          <p className="text-sm text-[#43474f] mb-6">We couldn't find any active orders for your account at this time.</p>
          <p className="text-xs text-[#737780]">Printec Signage Solutions</p>
        </div>
      </div>
    );
  }

  const handleSendChat = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || !activeOrder) return;

    const newMessage = {
      id: Date.now().toString(),
      sender: `${customer.name} (Client)`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      message: chatInput.trim()
    };

    const updatedChatHistory = [...(activeOrder.chatHistory || []), newMessage];

    // Optimistic state update
    setOrders(prev => prev.map(o => o.id === activeOrder.id ? { ...o, chatHistory: updatedChatHistory } : o));
    setChatInput("");

    // Write to Supabase
    const supabase = createClient();
    const { error } = await supabase
      .from("orders")
      .update({ chat_history: updatedChatHistory })
      .eq("id", activeOrder.id);

    if (error) {
      console.error("Error updating chat history:", error);
    }
  };

  const handleApproveQuote = async () => {
    if (!activeOrder) return;
    setUpdatingStatus("quote-approve");

    const systemMessage = {
      id: `sys-${Date.now()}`,
      sender: "System",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      message: "Client approved the quotation details."
    };

    const updatedChat = [...(activeOrder.chatHistory || []), systemMessage];
    const updatedQuoteDetails = { ...activeOrder.quoteDetails, status: "Approved" };

    // Advance order stage to "Quotation Approved" or trigger admin progression
    const updatedOrder: Partial<Order> = {
      stage: "Quotation Approved",
      chatHistory: updatedChat,
      quoteDetails: updatedQuoteDetails
    };

    setOrders(prev => prev.map(o => o.id === activeOrder.id ? { ...o, ...updatedOrder } : o));

    const supabase = createClient();
    const { error } = await supabase
      .from("orders")
      .update({
        stage: "Quotation Approved",
        chat_history: updatedChat,
        quote_details: updatedQuoteDetails
      })
      .eq("id", activeOrder.id);

    if (error) console.error("Error approving quote:", error);
    setUpdatingStatus(null);
  };

  const handleDeclineQuote = async () => {
    if (!activeOrder || !quoteFeedback.trim()) return;
    setUpdatingStatus("quote-decline");

    const clientFeedbackMessage = {
      id: `client-${Date.now()}`,
      sender: `${customer.name} (Client)`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      message: `❌ Quotation Declined. Feedback: ${quoteFeedback}`
    };

    const systemMessage = {
      id: `sys-${Date.now()}`,
      sender: "System",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      message: "Client returned quotation for revision."
    };

    const updatedChat = [...(activeOrder.chatHistory || []), clientFeedbackMessage, systemMessage];
    const updatedQuoteDetails = { ...activeOrder.quoteDetails, status: "Negotiation" };

    const updatedOrder: Partial<Order> = {
      stage: "Quotation Negotiation",
      chatHistory: updatedChat,
      quoteDetails: updatedQuoteDetails
    };

    setOrders(prev => prev.map(o => o.id === activeOrder.id ? { ...o, ...updatedOrder } : o));
    setQuoteFeedback("");
    setShowQuoteDeclineInput(false);

    const supabase = createClient();
    await supabase
      .from("orders")
      .update({
        stage: "Quotation Negotiation",
        chat_history: updatedChat,
        quote_details: updatedQuoteDetails
      })
      .eq("id", activeOrder.id);

    setUpdatingStatus(null);
  };

  const handleApproveDesign = async () => {
    if (!activeOrder) return;
    setUpdatingStatus("design-approve");

    const systemMessage = {
      id: `sys-${Date.now()}`,
      sender: "System",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      message: "Client approved the design proof layout."
    };

    const updatedChat = [...(activeOrder.chatHistory || []), systemMessage];
    const updatedDesignDetails = { ...activeOrder.designDetails, status: "Approved" };

    const updatedOrder: Partial<Order> = {
      stage: "Design Approved",
      chatHistory: updatedChat,
      designDetails: updatedDesignDetails
    };

    setOrders(prev => prev.map(o => o.id === activeOrder.id ? { ...o, ...updatedOrder } : o));

    const supabase = createClient();
    await supabase
      .from("orders")
      .update({
        stage: "Design Approved",
        chat_history: updatedChat,
        design_details: updatedDesignDetails
      })
      .eq("id", activeOrder.id);

    setUpdatingStatus(null);
  };

  const handleDeclineDesign = async () => {
    if (!activeOrder || !designFeedback.trim()) return;
    setUpdatingStatus("design-decline");

    const clientFeedbackMessage = {
      id: `client-${Date.now()}`,
      sender: `${customer.name} (Client)`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      message: `❌ Design Proof Revision Requested. Notes: ${designFeedback}`
    };

    const systemMessage = {
      id: `sys-${Date.now()}`,
      sender: "System",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      message: "Design proof reverted to Draft stage for updates."
    };

    const updatedChat = [...(activeOrder.chatHistory || []), clientFeedbackMessage, systemMessage];
    const updatedDesignDetails = { ...activeOrder.designDetails, status: "Draft" };

    const updatedOrder: Partial<Order> = {
      stage: "Design In Progress",
      chatHistory: updatedChat,
      designDetails: updatedDesignDetails
    };

    setOrders(prev => prev.map(o => o.id === activeOrder.id ? { ...o, ...updatedOrder } : o));
    setDesignFeedback("");
    setShowDesignDeclineInput(false);

    const supabase = createClient();
    await supabase
      .from("orders")
      .update({
        stage: "Design In Progress",
        chat_history: updatedChat,
        design_details: updatedDesignDetails
      })
      .eq("id", activeOrder.id);

    setUpdatingStatus(null);
  };

  const handleConfirmMockPayment = async () => {
    if (!activeOrder) return;
    setPaymentLoading(true);

    const totalBudget = activeOrder.budget || 45000;
    // Simulate deposit confirmation (e.g. 50% or full payment)
    const paymentAmount = activeOrder.depositPaid === 0 ? Math.round(totalBudget * 0.3) : totalBudget - activeOrder.depositPaid;
    const newDepositPaid = activeOrder.depositPaid + paymentAmount;

    const paymentConfirmMessage = {
      id: `sys-${Date.now()}`,
      sender: "System",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      message: `💳 Client confirmed mock online UPI payment of ₹${paymentAmount.toLocaleString("en-IN")}. Pending admin verification.`
    };

    const updatedChat = [...(activeOrder.chatHistory || []), paymentConfirmMessage];

    setOrders(prev => prev.map(o => o.id === activeOrder.id ? { ...o, depositPaid: newDepositPaid, chatHistory: updatedChat } : o));

    const supabase = createClient();
    await supabase
      .from("orders")
      .update({
        deposit_paid: newDepositPaid,
        chat_history: updatedChat
      })
      .eq("id", activeOrder.id);

    setTimeout(() => {
      setPaymentLoading(false);
      setShowPaymentModal(false);
    }, 800);
  };

  // Helper getters to guarantee objects
  const getSiteVisit = () => activeOrder?.siteVisitDetails || { completed: false, width: 0, height: 0, depth: 0, auditDate: "", auditTime: "", photos: [] };
  const getQuote = () => activeOrder?.quoteDetails || { grandTotal: 0, signageType: "ACP Panels", material: "Brushed Aluminium (3mm)", mounting: "Standoffs", baseACPPrice: 0, hardwarePrice: 0, polishingPrice: 0, discount: 0, subtotal: 0, tax: 0 };
  const getDesign = () => activeOrder?.designDetails || { proofUrl: "", status: "Draft" };
  const getProduction = () => activeOrder?.productionDetails || { printing: false, cutting: false, fabrication: false, assembly: false };
  const getInstallation = () => activeOrder?.installationDetails || { photoUrl: "", customerSignature: "", paymentCode: "" };

  const sv = getSiteVisit();
  const qd = getQuote();
  const dd = getDesign();
  const pd = getProduction();
  const inst = getInstallation();

  // Helper to map order stage to a 5-step progress number
  const getVisualStageIndex = (stage: string): number => {
    switch (stage) {
      case "Site Visit Pending":
      case "Site Visit Scheduled":
      case "Site Visit Completed":
        return 1;
      case "Quotation In Progress":
      case "Quotation Sent":
      case "Quotation Negotiation":
      case "Quotation Approved":
        return 2;
      case "Design In Progress":
      case "Design Approved":
        return 3;
      case "Production":
      case "Ready For Installation":
        return 4;
      case "Installation Scheduled":
      case "Completed":
      case "Closed":
        return 5;
      default:
        return 1;
    }
  };

  const currentStageNum = activeOrder ? getVisualStageIndex(activeOrder.stage) : 1;

  const stepperItems = [
    { num: 1, label: "Site Audit", desc: "Measurements & survey" },
    { num: 2, label: "Quotation", desc: "Pricing breakdown" },
    { num: 3, label: "Design Concept", desc: "Proof blueprint signoff" },
    { num: 4, label: "Fabrication", desc: "Workshop assembly" },
    { num: 5, label: "Installation", desc: "Field setup completion" },
  ];

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] flex flex-col md:flex-row font-sans">
      
      {/* ── LEFT PANEL: ORDERS LIST (Rendered only if client has multiple orders) ── */}
      {orders.length > 1 && (
        <aside className="w-full md:w-[320px] bg-white border-r border-[#cbd5e1] shrink-0 flex flex-col select-none md:h-screen sticky top-0 z-20">
          <div className="p-6 border-b border-[#cbd5e1] flex items-center space-x-3 bg-[#f8f9ff]/50">
            <div className="bg-[#0b1c30] text-white p-2 rounded-lg">
              <Printer size={18} className="text-[#018F10]" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-[#0b1c30] tracking-wider uppercase leading-none">PRINTEC</h2>
              <p className="text-[10px] text-[#018F10] font-bold uppercase tracking-widest mt-1">Customer Hub</p>
            </div>
          </div>

          <div className="p-4 border-b border-[#cbd5e1]">
            <span className="text-[10px] font-black text-[#737780] uppercase tracking-widest block mb-2">My Orders</span>
            <p className="text-xs text-[#43474f]">Select an order reference below to review progress, designs, and billing.</p>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {orders.map(o => {
              const active = o.id === activeOrderId;
              const isUrgent = o.urgent;
              const stageIdx = getVisualStageIndex(o.stage);
              return (
                <button
                  key={o.id}
                  onClick={() => {
                    setActiveOrderId(o.id);
                    setActiveTab("progress");
                  }}
                  className={`w-full text-left p-4 rounded-xl transition-all border flex flex-col gap-2 relative ${
                    active 
                      ? "bg-[#eff4ff] border-[#018F10] shadow-sm" 
                      : "bg-white border-[#cbd5e1] hover:bg-slate-50"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-xs font-bold text-[#003568]">{o.orderCode || o.id}</span>
                    {isUrgent && (
                      <span className="bg-red-100 text-red-700 text-[8px] font-extrabold px-2 py-0.5 rounded-full uppercase">Urgent</span>
                    )}
                  </div>
                  <h3 className="text-xs font-black text-slate-800 line-clamp-1">{o.projectName}</h3>
                  
                  <div className="flex items-center justify-between text-[10px] text-[#737780] mt-1 pt-2 border-t border-slate-100">
                    <span className="font-semibold">{o.stage}</span>
                    <span className="font-mono font-bold text-[#018F10]">{stageIdx * 20}%</span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="p-4 border-t border-[#cbd5e1] bg-slate-50 text-[11px] text-slate-400 font-medium text-center">
            Logged in as <span className="font-bold text-slate-600 block">{customer.name}</span>
          </div>
        </aside>
      )}

      {/* ── MAIN WORKSPACE CONTENT ── */}
      <div className="flex-1 flex flex-col min-w-0 md:h-screen md:overflow-y-auto">
        
        {/* Portal Header */}
        <header className="bg-white border-b border-[#cbd5e1] px-6 md:px-10 py-5 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-10 shadow-xs">
          <div>
            <div className="flex items-center space-x-2 text-[10px] font-bold text-[#737780] uppercase tracking-widest">
              <span>Customer Portal</span>
              <span>&gt;</span>
              <span>Account Hub</span>
              <span>&gt;</span>
              <span className="text-[#018F10] font-mono">{activeOrder?.orderCode || activeOrder?.id}</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-[#0b1c30] mt-1 flex items-center gap-3">
              {activeOrder?.projectName}
              {activeOrder?.urgent && (
                <span className="bg-red-50 text-red-700 text-[10px] font-black border border-red-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider">Priority Fabricate</span>
              )}
            </h1>
          </div>

          {/* Client Company Quick Summary */}
          <div className="flex items-center space-x-3 bg-[#eff4ff] border border-[#cbd5e0] px-4 py-2.5 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-[#003568] text-white flex items-center justify-center font-black text-xs">
              {customer.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="text-xs font-bold leading-none text-[#0b1c30]">{customer.name}</p>
              <p className="text-[9px] uppercase font-bold text-[#737780] mt-1">{customer.city || "Bangalore"}</p>
            </div>
          </div>
        </header>

        <div className="p-6 md:p-10 space-y-8 max-w-5xl mx-auto w-full">

          {/* ── SITE VISIT STATUS CARD & WORKFLOW STEPPER ── */}
          <section className="bg-white border border-[#cbd5e1] rounded-2xl p-6 shadow-sm space-y-6">
            
            {/* Status Card Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 bg-slate-50 border border-slate-200 rounded-xl p-5 text-xs font-medium">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">Order ID</span>
                <p className="font-mono text-sm font-black text-[#003568]">{activeOrder?.orderCode || activeOrder?.id}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">Current Stage</span>
                <p className="text-sm font-black text-slate-800">{activeOrder?.stage}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">Health</span>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black border bg-emerald-50 text-emerald-700 border-emerald-200">
                  Active
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">Assigned Employee</span>
                <p className="text-sm font-bold text-slate-800">{sv?.sitePersonnel || "Hari"}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">Scheduled Visit</span>
                <p className="text-sm font-bold text-[#018F10]">
                  {sv?.auditDate ? `${sv.auditDate} (${sv.auditTime})` : "Not Scheduled Yet"}
                </p>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 flex justify-between items-center">
              <h3 className="text-xs font-black text-[#0b1c30] uppercase tracking-widest flex items-center gap-2">
                <Activity size={14} className="text-[#018F10]" />
                Order Progress Tracking
              </h3>
              <span className="text-[10px] font-mono font-bold text-[#018F10] bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                Active Stage: {activeOrder?.stage}
              </span>
            </div>

            {/* Stepper Steps UI */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-2 relative">
              {stepperItems.map((step) => {
                const isCompleted = step.num < currentStageNum;
                const isCurrent = step.num === currentStageNum;
                
                let circleBg = "bg-slate-100 text-slate-400 border-slate-200";
                let titleColor = "text-slate-400";
                if (isCompleted) {
                  circleBg = "bg-emerald-50 text-[#16a34a] border-[#16a34a]";
                  titleColor = "text-[#16a34a]";
                } else if (isCurrent) {
                  circleBg = "bg-[#eff4ff] text-[#003568] border-[#018F10] ring-4 ring-emerald-100";
                  titleColor = "text-[#003568] font-bold";
                }

                return (
                  <div key={step.num} className="flex flex-col items-center text-center relative group">
                    <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold text-xs mb-2 transition-all ${circleBg}`}>
                      {isCompleted ? <CheckCircle2 size={16} /> : step.num}
                    </div>
                    <span className={`text-xs block ${titleColor}`}>{step.label}</span>
                    <span className="text-[9px] text-[#737780] hidden md:block mt-0.5">{step.desc}</span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── WORKSPACE CONTROLS / TABS ── */}
          <div className="flex border-b border-[#cbd5e1] gap-2 md:gap-4 overflow-x-auto pb-1 shrink-0 scrollbar-none">
            {[
              { id: "progress", label: "Workflow Specs", icon: ClipboardList },
              { id: "quote", label: "Quotation & Invoicing", icon: FileText },
              { id: "design", label: "Design Blueprint", icon: Printer },
              { id: "billing", label: "Pay Deposit", icon: CreditCard },
              { id: "chat", label: "Live Printec Chat", icon: MessageSquare, badge: activeOrder?.chatHistory.length },
            ].map(tab => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                    active 
                      ? "border-[#018F10] text-[#018F10] bg-white" 
                      : "border-transparent text-[#737780] hover:text-[#0b1c30]"
                  }`}
                >
                  <Icon size={14} />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className="ml-1 bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full text-[9px] font-bold font-mono">{tab.badge}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* ── TAB CONTENT ── */}
          <main className="min-h-[400px]">
            
            {/* 1. PROGRESS / SPECIFICATION TAB */}
            {activeTab === "progress" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                
                {/* ── LEFT SECTION: Site Visit Scheduling & Measurements ── */}
                <div className="lg:col-span-2 space-y-6">
                  
                  {/* Scheduling Form / Rescheduling Mode */}
                  {(!sv.auditDate || isRescheduling) ? (
                    <div className="bg-white border border-[#cbd5e1] rounded-2xl p-6 md:p-8 space-y-6 shadow-xs">
                      <div>
                        <h3 className="text-sm font-black text-[#0b1c30] uppercase tracking-wider flex items-center gap-2">
                          <Calendar size={16} className="text-[#018F10]" />
                          {isRescheduling ? "Reschedule Site Visit Appointment" : "Step 1: Schedule Your Site Visit"}
                        </h3>
                        <p className="text-xs text-[#737780] mt-1">
                          Select a preferred date and time slot. We will dispatch an auditor to capture layout coordinates.
                        </p>
                      </div>

                      <form onSubmit={handleScheduleSiteVisit} className="space-y-6">
                        {/* Calendar Slot Selector */}
                        <div className="space-y-3">
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
                            Select Available Date
                          </label>
                          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                            {getBusinessDays().map((dayDate, idx) => {
                              const dateStr = dayDate.toISOString().split("T")[0];
                              const dayName = dayDate.toLocaleDateString("en-US", { weekday: "short" });
                              const monthName = dayDate.toLocaleDateString("en-US", { month: "short" });
                              const dayNum = dayDate.getDate();
                              const isSelected = selectedDate === dateStr;

                              return (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => {
                                    setSelectedDate(dateStr);
                                    setSelectedTime(""); // Reset time on date change
                                  }}
                                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center min-w-[70px] transition-all cursor-pointer ${
                                    isSelected
                                      ? "bg-[#eff4ff] border-[#018F10] text-[#003568] ring-2 ring-emerald-100 font-bold"
                                      : "bg-white border-slate-200 text-slate-600 hover:border-slate-350"
                                  }`}
                                >
                                  <span className="text-[9px] uppercase tracking-wider text-slate-400 block">{dayName}</span>
                                  <span className="text-base font-black block mt-1">{dayNum}</span>
                                  <span className="text-[9px] block text-slate-400">{monthName}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Time Slots Grid */}
                        {selectedDate && (
                          <div className="space-y-3 prt-animate-in">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
                              Select Available Time (Employee: {sv?.sitePersonnel || "Hari"})
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                              {["10:00 AM", "11:30 AM", "02:00 PM", "03:30 PM"].map((timeSlot) => {
                                const isBooked = isSlotBooked(selectedDate, timeSlot);
                                const isSelected = selectedTime === timeSlot;

                                return (
                                  <button
                                    key={timeSlot}
                                    type="button"
                                    disabled={isBooked}
                                    onClick={() => setSelectedTime(timeSlot)}
                                    className={`py-3 px-2 rounded-xl border text-xs font-bold transition-all text-center ${
                                      isBooked
                                        ? "bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed"
                                        : isSelected
                                          ? "bg-[#eff4ff] border-[#018F10] text-[#003568] ring-2 ring-emerald-100"
                                          : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 cursor-pointer"
                                    }`}
                                  >
                                    {timeSlot}
                                    {isBooked && <span className="block text-[8px] text-red-400 font-medium mt-0.5">Taken (Double-booked)</span>}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Scheduling fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                              Site Address *
                            </label>
                            <input
                              type="text"
                              required
                              value={siteAddress}
                              onChange={(e) => setSiteAddress(e.target.value)}
                              placeholder="Full installation site address"
                              className="w-full p-3 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-[#018F10] focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                              Landmark / Delivery Info
                            </label>
                            <input
                              type="text"
                              value={landmark}
                              onChange={(e) => setLandmark(e.target.value)}
                              placeholder="e.g. Near HDFC Bank, 2nd floor"
                              className="w-full p-3 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-[#018F10] focus:outline-none"
                            />
                          </div>
                        </div>

                        {/* Interactive GPS Maps Picker Mock */}
                        <div className="space-y-3">
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
                            Google Maps Coordinates Pin *
                          </label>
                          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50">
                            {/* Maps Canvas Area Mock */}
                            <div 
                              onClick={() => {
                                setGpsCoords(`${(12.97 + Math.random() * 0.01).toFixed(4)}° N, ${(77.59 + Math.random() * 0.01).toFixed(4)}° E`);
                              }}
                              className="h-32 bg-slate-100 flex flex-col items-center justify-center relative cursor-crosshair overflow-hidden group select-none"
                            >
                              {/* Grid representation */}
                              <div className="absolute inset-0 bg-[linear-gradient(to_right,#cbd5e1_1px,transparent_1px),linear-gradient(to_bottom,#cbd5e1_1px,transparent_1px)] bg-[size:24px_24px] opacity-15" />
                              <div className="absolute w-6 h-6 rounded-full bg-emerald-500/20 animate-ping" />
                              <MapPin size={28} className="text-[#018F10] relative z-10 transition-transform duration-300 group-hover:scale-110" />
                              <span className="text-[10px] text-slate-400 mt-2 relative z-10 font-bold bg-white/80 px-2 py-0.5 rounded shadow-xs">
                                Click Map area to reposition pin
                              </span>
                            </div>

                            <div className="p-3 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3">
                              <span className="text-xs font-mono font-bold text-slate-700">
                                📍 Coordinates: <span className="text-slate-900">{gpsCoords}</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setMapsSearching(true);
                                  setTimeout(() => {
                                    setGpsCoords("12.9716° N, 77.5946° E");
                                    setMapsSearching(false);
                                  }, 600);
                                }}
                                className="px-3 py-1 bg-white border border-slate-200 text-slate-600 rounded-lg text-[10px] font-bold hover:bg-slate-50 flex items-center gap-1.5"
                              >
                                {mapsSearching ? (
                                  <span className="w-3.5 h-3.5 border-2 border-[#018F10] border-t-transparent rounded-full animate-spin" />
                                ) : "Auto-detect Coordinates"}
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                              Contact Person *
                            </label>
                            <input
                              type="text"
                              required
                              value={contactPerson}
                              onChange={(e) => setContactPerson(e.target.value)}
                              placeholder="Name of onsite contact"
                              className="w-full p-3 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-[#018F10] focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                              Contact Number *
                            </label>
                            <input
                              type="tel"
                              required
                              value={contactNumber}
                              onChange={(e) => setContactNumber(e.target.value)}
                              placeholder="Phone number"
                              className="w-full p-3 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-[#018F10] focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                              Site Type *
                            </label>
                            <select
                              value={siteType}
                              onChange={(e) => setSiteType(e.target.value)}
                              className="w-full p-3 border border-slate-200 bg-white rounded-xl text-xs focus:ring-1 focus:ring-[#018F10] focus:outline-none"
                            >
                              <option value="Shop Front">Shop Front</option>
                              <option value="Office">Office</option>
                              <option value="Restaurant">Restaurant</option>
                              <option value="Hospital">Hospital</option>
                              <option value="Mall">Mall</option>
                              <option value="Factory">Factory</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                            Special Instructions / Onsite Logistics Notes
                          </label>
                          <textarea
                            rows={3}
                            value={specialInstructions}
                            onChange={(e) => setSpecialInstructions(e.target.value)}
                            placeholder="e.g. Parking available behind building. Contact security before entry. Visit only before 1 PM..."
                            className="w-full p-3 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-[#018F10] focus:outline-none"
                          />
                        </div>

                        {/* Action buttons */}
                        <div className="flex justify-end space-x-3 pt-2">
                          {isRescheduling && (
                            <button
                              type="button"
                              onClick={() => setIsRescheduling(false)}
                              className="px-5 py-2.5 bg-white border border-slate-200 text-slate-500 rounded-xl text-xs font-bold hover:bg-slate-50"
                            >
                              Cancel
                            </button>
                          )}
                          <button
                            type="submit"
                            disabled={!selectedDate || !selectedTime || schedulingLoading}
                            className="px-6 py-2.5 bg-[#018F10] hover:bg-[#01730c] text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-2 shadow-xs"
                          >
                            {schedulingLoading ? (
                              <>
                                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Processing Appointment...
                              </>
                            ) : isRescheduling ? "Update Scheduled Visit" : "Confirm Site Visit Appointment"}
                          </button>
                        </div>
                      </form>
                    </div>
                  ) : sv.completed === false ? (
                    // ── CONFIRMATION SCREEN (Scheduled successfully, but not completed yet) ──
                    <div className="bg-white border border-emerald-100 rounded-2xl p-6 md:p-8 space-y-6 shadow-xs text-center prt-animate-in">
                      <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto">
                        <Check className="w-8 h-8 text-emerald-600 stroke-[3]" />
                      </div>
                      
                      <div className="space-y-2">
                        <h3 className="text-lg font-black text-slate-800">Site Visit Scheduled Successfully</h3>
                        <p className="text-xs text-[#737780] max-w-md mx-auto">
                          Your site audit parameters are registered. A field engineer will arrive at the scheduled date and time.
                        </p>
                      </div>

                      <div className="max-w-md mx-auto bg-slate-50 border border-slate-200 rounded-xl p-5 text-left grid grid-cols-2 gap-4 text-xs">
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-slate-400 uppercase font-bold">Appointment Date</span>
                          <p className="font-bold text-slate-800 font-mono">{sv.auditDate}</p>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-slate-400 uppercase font-bold">Time Window</span>
                          <p className="font-bold text-slate-800 font-mono">{sv.auditTime}</p>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-slate-400 uppercase font-bold">Assigned Auditor</span>
                          <p className="font-bold text-slate-800">{sv.sitePersonnel || "Hari"}</p>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-slate-400 uppercase font-bold">Site Type</span>
                          <p className="font-bold text-slate-800">{sv.siteType || "Shop Front"}</p>
                        </div>
                        <div className="col-span-2 space-y-0.5 border-t border-slate-100 pt-3">
                          <span className="text-[10px] text-slate-400 uppercase font-bold">Audit Address</span>
                          <p className="font-medium text-slate-800 leading-normal">{sv.customerAddress}</p>
                        </div>
                        {sv.landmark && (
                          <div className="col-span-2 space-y-0.5">
                            <span className="text-[10px] text-slate-400 uppercase font-bold">Landmark Reference</span>
                            <p className="font-medium text-slate-800">{sv.landmark}</p>
                          </div>
                        )}
                        {sv.notes && (
                          <div className="col-span-2 space-y-0.5 border-t border-slate-100 pt-3">
                            <span className="text-[10px] text-slate-400 uppercase font-bold">Special Instructions</span>
                            <p className="font-medium text-slate-600 leading-normal italic">"{sv.notes}"</p>
                          </div>
                        )}
                      </div>

                      <div className="flex justify-center pt-2">
                        <button
                          type="button"
                          onClick={() => setIsRescheduling(true)}
                          className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all flex items-center gap-2"
                        >
                          <Calendar size={14} className="text-[#018F10]" />
                          Reschedule Site Visit Appointment
                        </button>
                      </div>
                    </div>
                  ) : sv.reviewStatus !== "Approved" ? (
                    // ── COMPLETED BUT PENDING ADMIN APPROVAL (Staff details hidden) ──
                    <div className="bg-white border border-amber-250 rounded-2xl p-6 md:p-8 space-y-6 shadow-xs prt-animate-in">
                      <div className="flex items-start space-x-4 bg-amber-50/50 border border-amber-200 rounded-xl p-5 text-amber-800">
                        <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={20} />
                        <div className="space-y-1">
                          <span className="text-sm font-black block">Site Survey Completed - Undergoing Verification</span>
                          <p className="text-xs text-amber-700 leading-relaxed">
                            Our field representative completed the site survey audit. The captured metrics and installation feasibility are currently undergoing engineering quality checks.
                          </p>
                        </div>
                      </div>

                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-xs grid grid-cols-2 gap-4">
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-slate-400 uppercase font-bold">Visit Completed Date</span>
                          <p className="font-bold text-slate-800">{sv.auditDate}</p>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-slate-400 uppercase font-bold">Visited By</span>
                          <p className="font-bold text-slate-800">{sv.sitePersonnel || "Hari"}</p>
                        </div>
                        <div className="col-span-2 space-y-2 border-t border-slate-100 pt-3 text-slate-500 italic">
                          💡 Measurement dimensions, wall assessment, and site mockup photos will be published here automatically once approved by the Printec Administrator.
                        </div>
                      </div>

                      <div className="flex justify-center pt-2">
                        <button
                          type="button"
                          onClick={() => setIsRescheduling(true)}
                          className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all flex items-center gap-2"
                        >
                          <Calendar size={14} className="text-[#018F10]" />
                          Request Audit Resurvey / Change Details
                        </button>
                      </div>
                    </div>
                  ) : (
                    // ── APPROVED SITE VISIT VIEW (Visible after admin approval) ──
                    <div className="space-y-6 prt-animate-in">
                      
                      {/* Visit Summary Card */}
                      <div className="bg-white border border-[#cbd5e1] rounded-2xl p-6 space-y-4 shadow-2xs">
                        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                          <h4 className="text-xs font-black text-[#0b1c30] uppercase tracking-widest flex items-center gap-2">
                            <Clock size={14} className="text-[#018F10]" />
                            Site Visit Summary (Approved)
                          </h4>
                          <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-2.5 py-0.5 rounded text-[10px] font-black uppercase">
                            Approved
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                          <div className="space-y-0.5">
                            <span className="text-[10px] text-slate-400 uppercase font-bold">Visited By</span>
                            <p className="font-bold text-slate-800">{sv.sitePersonnel || "Hari"}</p>
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[10px] text-slate-400 uppercase font-bold">Visit Date</span>
                            <p className="font-bold text-slate-800 font-mono">{sv.auditDate}</p>
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[10px] text-slate-400 uppercase font-bold">Time Window</span>
                            <p className="font-bold text-slate-800 font-mono">{sv.auditTime}</p>
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[10px] text-slate-400 uppercase font-bold">Visit Duration</span>
                            <p className="font-bold text-slate-800 font-mono">{sv.elapsedDuration || "35 mins"}</p>
                          </div>
                        </div>
                      </div>

                      {/* Measurement Summary Card */}
                      <div className="bg-white border border-[#cbd5e1] rounded-2xl p-6 space-y-4 shadow-2xs">
                        <h4 className="text-xs font-black text-[#0b1c30] uppercase tracking-widest flex items-center gap-2 pb-3 border-b border-slate-100">
                          <Ruler size={14} className="text-[#018F10]" />
                          Measurement Summary
                        </h4>

                        <div className="space-y-4">
                          {(sv.locations || [
                            { name: "Main Fascia", width: "12 ft", height: "3 ft", depth: "6 in", groundClearance: "10 ft" },
                            { name: "Side Projection Board", width: "4 ft", height: "2 ft", depth: "4 in", groundClearance: "N/A" }
                          ]).map((loc: any, idx: number) => (
                            <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div className="space-y-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Location {idx + 1}</span>
                                <h5 className="text-xs font-black text-[#0b1c30]">{loc.name}</h5>
                              </div>
                              <div className="grid grid-cols-2 sm:flex sm:items-center gap-x-6 gap-y-2 text-xs font-semibold">
                                <div className="space-y-0.5">
                                  <span className="text-[9px] text-slate-400 uppercase block leading-none">Width</span>
                                  <span className="font-mono text-slate-800">{loc.width}</span>
                                </div>
                                <div className="space-y-0.5">
                                  <span className="text-[9px] text-slate-400 uppercase block leading-none">Height</span>
                                  <span className="font-mono text-slate-800">{loc.height}</span>
                                </div>
                                <div className="space-y-0.5">
                                  <span className="text-[9px] text-slate-400 uppercase block leading-none">Depth</span>
                                  <span className="font-mono text-slate-800">{loc.depth}</span>
                                </div>
                                <div className="space-y-0.5">
                                  <span className="text-[9px] text-slate-400 uppercase block leading-none">Clearance</span>
                                  <span className="font-mono text-slate-800">{loc.groundClearance || "N/A"}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Site Photos Gallery Card */}
                      <div className="bg-white border border-[#cbd5e1] rounded-2xl p-6 space-y-4 shadow-2xs">
                        <h4 className="text-xs font-black text-[#0b1c30] uppercase tracking-widest flex items-center gap-2 pb-3 border-b border-slate-100">
                          <Printer size={14} className="text-[#018F10]" />
                          Site Photos Gallery
                        </h4>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          {[
                            { title: "Front View", url: sv.photoCategories?.front || "https://images.unsplash.com/photo-1542744094-3a31f103e35f?w=250&auto=format&fit=crop" },
                            { title: "Installation Area", url: sv.photoCategories?.area || "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=250&auto=format&fit=crop" },
                            { title: "Power Source", url: sv.photoCategories?.electrical || "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=250&auto=format&fit=crop" },
                            { title: "Measurement Reference", url: sv.photoCategories?.competitor || "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=250&auto=format&fit=crop" }
                          ].map((item, idx) => (
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              key={idx}
                              className="group block border border-slate-200 rounded-xl overflow-hidden bg-slate-50 relative aspect-square transition-all hover:border-[#018F10]"
                            >
                              <img src={item.url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/80 to-transparent p-3 pt-6 text-[10px] text-white font-bold uppercase tracking-wide">
                                {item.title}
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>

                      {/* Site Assessment Card */}
                      <div className="bg-white border border-[#cbd5e1] rounded-2xl p-6 space-y-4 shadow-2xs">
                        <h4 className="text-xs font-black text-[#0b1c30] uppercase tracking-widest flex items-center gap-2 pb-3 border-b border-slate-100">
                          <ClipboardList size={14} className="text-[#018F10]" />
                          Site Assessment Details
                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-0.5">
                            <span className="text-[10px] text-slate-400 uppercase font-bold">Wall Type</span>
                            <p className="font-bold text-slate-800">{sv.wallType || "Concrete/Brick"}</p>
                          </div>
                          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-0.5">
                            <span className="text-[10px] text-slate-400 uppercase font-bold">Mounting Method</span>
                            <p className="font-bold text-slate-800">{sv.mountingMethod || "Anchor Bolts with Metal Frame"}</p>
                          </div>
                          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-0.5">
                            <span className="text-[10px] text-slate-400 uppercase font-bold">Power Available Onsite</span>
                            <p className="font-bold text-slate-800">{sv.powerAvailable || "Yes"}</p>
                          </div>
                          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-0.5">
                            <span className="text-[10px] text-slate-400 uppercase font-bold">Distance to Power Source</span>
                            <p className="font-bold text-slate-800 font-mono">{sv.distanceToPowerSource || "5 ft"}</p>
                          </div>
                          {sv.notes && (
                            <div className="col-span-1 sm:col-span-2 p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                              <span className="text-[10px] text-slate-400 uppercase font-bold">General Feasibility Notes</span>
                              <p className="font-medium text-slate-700 leading-normal italic">"{sv.notes}"</p>
                            </div>
                          )}
                        </div>
                      </div>

                    </div>
                  )}

                  {/* Fabrication checklist & installation signoff remain below */}
                  {sv.completed && sv.reviewStatus === "Approved" && (
                    <div className="space-y-6 pt-2">
                      {/* Workshop fabrication checklist */}
                      <div className="bg-white border border-[#cbd5e1] rounded-2xl p-6 space-y-4">
                        <h4 className="text-xs font-black text-[#0b1c30] uppercase tracking-widest flex items-center gap-2">
                          <CheckSquare size={14} className="text-[#018F10]" />
                          Workshop Fabrication Checklist (Real-time Status)
                        </h4>
                        
                        {currentStageNum >= 4 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                              { checked: pd.printing, label: "1. Print layout sheet & backing support plotted" },
                              { checked: pd.cutting, label: "2. CNC precision cutting & routing alignment complete" },
                              { checked: pd.fabrication, label: "3. Aluminium frame backing welding tested" },
                              { checked: pd.assembly, label: "4. Acrylic letter mounting & LED internal circuitry wired" },
                            ].map((item, idx) => (
                              <div key={idx} className={`p-4 border rounded-xl flex items-center justify-between ${
                                item.checked ? "bg-emerald-50/35 border-emerald-200 text-emerald-800" : "bg-slate-50 border-slate-200 text-slate-400"
                              }`}>
                                <span className="text-xs font-bold">{item.label}</span>
                                {item.checked ? (
                                  <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-[9px] font-bold">Done</span>
                                ) : (
                                  <span className="bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full text-[9px] font-bold">Pending</span>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center text-slate-400 text-xs">
                            Workshop checklists activate once quotation and designs are finalized.
                          </div>
                        )}
                      </div>

                      {/* Installation details */}
                      <div className="bg-white border border-[#cbd5e1] rounded-2xl p-6 space-y-4">
                        <h4 className="text-xs font-black text-[#0b1c30] uppercase tracking-widest flex items-center gap-2">
                          <CheckCircle2 size={14} className="text-[#018F10]" />
                          Field Installation Sign-off Proof
                        </h4>
                        {inst.photoUrl ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 aspect-video">
                              <img src={inst.photoUrl} alt="Installation Completion" className="w-full h-full object-cover" onError={(e)=>{e.currentTarget.src='https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=400&auto=format&fit=crop';}} />
                            </div>
                            <div className="space-y-3 flex flex-col justify-center">
                              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold space-y-1">
                                <span className="block text-slate-400 text-[10px] uppercase font-bold">Sign-off Status</span>
                                <p>✓ Job Completed & Signed off by Client</p>
                              </div>
                              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                                <span className="text-[10px] text-slate-400 uppercase block font-bold">Customer Representative Signature</span>
                                <span className="font-serif italic text-slate-800 text-sm font-bold block mt-1">{inst.customerSignature}</span>
                                <span className="text-[9px] text-slate-400 font-mono mt-2 block">Security Code Verified: {inst.paymentCode}</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-[#737780] italic">Field installation records will update here upon delivery confirmation.</p>
                        )}
                      </div>
                    </div>
                  )}

                </div>

                {/* ── RIGHT SECTION: Notifications Center Log ── */}
                <div className="space-y-6">
                  <div className="bg-white border border-[#cbd5e1] rounded-2xl p-6 space-y-4 shadow-xs">
                    <h3 className="text-xs font-black text-[#0b1c30] uppercase tracking-widest flex items-center gap-2 pb-3 border-b border-slate-100">
                      <Mail size={14} className="text-[#018F10]" />
                      Customer Notifications Center
                    </h3>
                    <p className="text-[11px] text-slate-500 leading-normal">
                      Real-time log of automated messages dispatched to your registered details (Phone: <strong className="text-slate-700">{customer.phone}</strong>, Email: <strong className="text-slate-700">{customer.email}</strong>).
                    </p>

                    {getNotificationHistory().length > 0 ? (
                      <div className="space-y-3.5 pt-2">
                        {getNotificationHistory().map((alertLog, idx) => (
                          <div key={idx} className="border border-slate-150 rounded-xl p-3.5 bg-slate-50/50 space-y-2.5">
                            <div className="flex justify-between items-start">
                              <span className="text-xs font-black text-slate-800">{alertLog.event}</span>
                              <span className="text-[9px] font-mono text-slate-400 font-medium">{alertLog.time}</span>
                            </div>
                            <div className="flex flex-wrap gap-2 text-[9px] font-bold text-slate-400">
                              <span className="flex items-center gap-1 bg-emerald-50 text-emerald-600 border border-emerald-150 rounded-full px-2 py-0.5">
                                <Check size={10} className="stroke-[3]" /> Portal Alert
                              </span>
                              <span className="flex items-center gap-1 bg-emerald-50 text-emerald-600 border border-emerald-150 rounded-full px-2 py-0.5">
                                <Check size={10} className="stroke-[3]" /> WhatsApp SMS
                              </span>
                              <span className="flex items-center gap-1 bg-emerald-50 text-emerald-600 border border-emerald-150 rounded-full px-2 py-0.5">
                                <Check size={10} className="stroke-[3]" /> Email Dispatch
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-5 bg-slate-50 border border-slate-200 border-dashed rounded-xl text-center text-slate-400 text-xs italic">
                        No automated alerts dispatched yet. Site scheduling triggers Portal, WhatsApp & Email messages.
                      </div>
                    )}
                  </div>

                  {/* Rescheduling Helper Panel */}
                  {sv.auditDate && sv.completed === false && !isRescheduling && (
                    <div className="bg-[#eff4ff] border border-blue-200 rounded-2xl p-5 text-xs text-[#003568] space-y-2">
                      <span className="font-bold block">Need to Reschedule?</span>
                      <p className="text-[11px] leading-relaxed text-slate-600">
                        You can reschedule your appointment at any time before our audit representative visits your site. Rescheduling releases your current time slot back to the public pool.
                      </p>
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* 2. QUOTATION / INVOICING TAB */}
            {activeTab === "quote" && (
              <div className="space-y-6">
                <div className="bg-white border border-[#cbd5e1] rounded-2xl p-6 space-y-6">
                  <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                    <h3 className="text-xs font-black text-[#0b1c30] uppercase tracking-widest flex items-center gap-2">
                      <FileText size={14} className="text-[#018F10]" />
                      Invoice Quotation Details
                    </h3>
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${
                      qd.status === "Approved" 
                        ? "bg-emerald-50 text-emerald-700 border-emerald-250" 
                        : "bg-amber-50 text-amber-600 border-amber-250"
                    }`}>
                      {qd.status || "Draft"}
                    </span>
                  </div>

                  {/* Pricing Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                          <th className="pb-3">Fabrication Parameters</th>
                          <th className="pb-3 text-right">Unit / Value</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        <tr>
                          <td className="py-3.5 text-slate-500">Signage Type</td>
                          <td className="py-3.5 text-right text-slate-800 font-bold">{qd.signageType}</td>
                        </tr>
                        <tr>
                          <td className="py-3.5 text-slate-500">Materials Spec</td>
                          <td className="py-3.5 text-right text-slate-800 font-bold">{qd.material}</td>
                        </tr>
                        <tr>
                          <td className="py-3.5 text-slate-500">Mounting Support</td>
                          <td className="py-3.5 text-right text-slate-800 font-bold">{qd.mounting}</td>
                        </tr>
                        <tr>
                          <td className="py-3.5 text-slate-500">Physical Dimensions</td>
                          <td className="py-3.5 text-right text-slate-800 font-mono font-bold">{qd.width}″ × {qd.height}″ (Depth: {qd.depth}″)</td>
                        </tr>
                        <tr>
                          <td className="py-3.5 text-slate-500">Base ACP Fabrication Cost</td>
                          <td className="py-3.5 text-right text-slate-800 font-mono">₹{(qd.baseACPPrice || 0).toLocaleString("en-IN")}</td>
                        </tr>
                        <tr>
                          <td className="py-3.5 text-slate-500">Hardware & Fittings Cost</td>
                          <td className="py-3.5 text-right text-slate-800 font-mono">₹{(qd.hardwarePrice || 0).toLocaleString("en-IN")}</td>
                        </tr>
                        <tr>
                          <td className="py-3.5 text-slate-500">Polishing & Finishing</td>
                          <td className="py-3.5 text-right text-slate-800 font-mono">₹{(qd.polishingPrice || 0).toLocaleString("en-IN")}</td>
                        </tr>
                        {qd.discount > 0 && (
                          <tr className="text-red-600">
                            <td className="py-3.5 font-bold">Special Customer Discount</td>
                            <td className="py-3.5 text-right font-mono font-bold">-₹{qd.discount.toLocaleString("en-IN")}</td>
                          </tr>
                        )}
                        <tr className="font-bold border-t border-slate-200">
                          <td className="py-4 text-slate-700">Subtotal Amount</td>
                          <td className="py-4 text-right text-slate-900 font-mono">₹{(qd.subtotal || 0).toLocaleString("en-IN")}</td>
                        </tr>
                        <tr className="font-bold text-slate-500">
                          <td className="py-3.5">Tax (18% IGST/GST)</td>
                          <td className="py-3.5 text-right font-mono">₹{(qd.tax || 0).toLocaleString("en-IN")}</td>
                        </tr>
                        <tr className="font-black text-sm border-t border-dashed border-slate-200">
                          <td className="py-4 text-[#003568]">Grand Total Amount</td>
                          <td className="py-4 text-right text-emerald-700 font-mono text-base">₹{(qd.grandTotal || 0).toLocaleString("en-IN")}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Actionable approvals if stage is appropriate */}
                  {qd.status !== "Approved" && (activeOrder?.stage === "Quotation Sent" || activeOrder?.stage === "Quotation Negotiation") && (
                    <div className="bg-[#eff4ff] border border-[#cbd5e0] rounded-2xl p-5 space-y-4">
                      <div>
                        <span className="text-xs font-black text-[#003568] block">Review and Approve Quotation Invoice</span>
                        <p className="text-[11px] text-slate-500 leading-normal mt-1">
                          Please verify the financial cost sheet above. Approving will notify Printec Admin to schedule design draft creation.
                        </p>
                      </div>

                      {showQuoteDeclineInput ? (
                        <div className="space-y-3">
                          <label className="block text-[10px] font-bold text-red-700 uppercase">Specify Revision Feedback / Changes Requested</label>
                          <textarea
                            rows={3}
                            value={quoteFeedback}
                            onChange={(e) => setQuoteFeedback(e.target.value)}
                            placeholder="Please let us know your requirements..."
                            className="w-full p-3 border border-slate-350 rounded-xl text-xs focus:ring-1 focus:ring-red-500 focus:outline-none"
                          />
                          <div className="flex space-x-2">
                            <button
                              onClick={() => setShowQuoteDeclineInput(false)}
                              className="px-3 py-1.5 bg-white border border-slate-200 text-slate-500 rounded-lg text-xs font-bold"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleDeclineQuote}
                              disabled={!quoteFeedback.trim() || updatingStatus !== null}
                              className="px-3.5 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 disabled:opacity-50"
                            >
                              {updatingStatus === "quote-decline" ? "Submitting..." : "Submit Revision Notes"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex space-x-3">
                          <button
                            onClick={() => setShowQuoteDeclineInput(true)}
                            className="px-4 py-2 border border-slate-300 text-slate-600 bg-white rounded-xl text-xs font-bold hover:bg-slate-50"
                          >
                            Decline / Request Revision
                          </button>
                          <button
                            onClick={handleApproveQuote}
                            disabled={updatingStatus !== null}
                            className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 flex items-center gap-1.5 disabled:opacity-50"
                          >
                            <Check size={14} /> Approve Quotation
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 3. DESIGN BLUEPRINT PROOF TAB */}
            {activeTab === "design" && (
              <div className="space-y-6">
                <div className="bg-white border border-[#cbd5e1] rounded-2xl p-6 space-y-6">
                  <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                    <h3 className="text-xs font-black text-[#0b1c30] uppercase tracking-widest flex items-center gap-2">
                      <Printer size={14} className="text-[#018F10]" />
                      Design Blueprint & Concept Mockup Proof
                    </h3>
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${
                      dd.status === "Approved" 
                        ? "bg-emerald-50 text-emerald-700 border-emerald-250" 
                        : "bg-amber-50 text-amber-600 border-amber-250"
                    }`}>
                      {dd.status || "Draft"}
                    </span>
                  </div>

                  {dd.proofUrl ? (
                    <div className="space-y-6">
                      {/* Zoomable Image Container */}
                      <div className="relative border border-slate-200 rounded-2xl bg-[#0b1c30] flex items-center justify-center p-6 overflow-hidden min-h-[300px]">
                        <img 
                          src={dd.proofUrl} 
                          alt="Concept Proof" 
                          className="max-h-[320px] object-contain transition-all duration-300"
                          style={{ transform: `scale(${zoomLevel / 100})` }}
                          onError={(e)=>{e.currentTarget.src='https://images.unsplash.com/photo-1542744094-3a31f103e35f?w=400&auto=format&fit=crop';}}
                        />
                        
                        {/* Interactive Zoom Overlay controls */}
                        <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-xs border border-slate-200 rounded-lg p-2 flex items-center space-x-2 shadow-sm">
                          <button onClick={() => setZoomLevel(prev => Math.max(prev - 20, 50))} className="p-1 text-slate-500 hover:text-slate-800 rounded"><ZoomOut size={12} /></button>
                          <span className="text-[10px] font-mono font-black select-none cursor-pointer" onClick={() => setZoomLevel(100)}>{zoomLevel}%</span>
                          <button onClick={() => setZoomLevel(prev => Math.min(prev + 20, 200))} className="p-1 text-slate-500 hover:text-slate-800 rounded"><ZoomIn size={12} /></button>
                        </div>
                      </div>

                      {/* Design parameters details */}
                      <div className="flex justify-between items-center text-xs text-[#737780] pt-2 border-t border-slate-100 font-mono">
                        <span>FILE: signage_blueprint_concept.pdf</span>
                        <span>Scale Ratio: 1:10 Vector</span>
                      </div>

                      {/* Actionable design approval cards */}
                      {dd.status !== "Approved" && (
                        <div className="bg-[#f8f9ff] border border-slate-200 rounded-2xl p-5 space-y-4">
                          <div>
                            <span className="text-xs font-black text-[#003568] block">Approve or Request Revisions for Design Mockup</span>
                            <p className="text-[11px] text-slate-500 leading-normal mt-1">
                              Please review the alignment, letter fonts, dimensions, and styling proofs. Revisions can be specified below.
                            </p>
                          </div>

                          {showDesignDeclineInput ? (
                            <div className="space-y-3">
                              <label className="block text-[10px] font-bold text-red-700 uppercase">Specify Design Correction Feedback</label>
                              <textarea
                                rows={3}
                                value={designFeedback}
                                onChange={(e) => setDesignFeedback(e.target.value)}
                                placeholder="e.g. Change font of acrylic letters, or modify wiring conduit entry point..."
                                className="w-full p-3 border border-slate-350 rounded-xl text-xs focus:ring-1 focus:ring-red-500 focus:outline-none"
                              />
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => setShowDesignDeclineInput(false)}
                                  className="px-3 py-1.5 bg-white border border-slate-200 text-slate-500 rounded-lg text-xs font-bold"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={handleDeclineDesign}
                                  disabled={!designFeedback.trim() || updatingStatus !== null}
                                  className="px-3.5 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 disabled:opacity-50"
                                >
                                  {updatingStatus === "design-decline" ? "Submitting..." : "Send Revision Notes"}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex space-x-3">
                              <button
                                onClick={() => setShowDesignDeclineInput(true)}
                                className="px-4 py-2 border border-slate-300 text-slate-600 bg-white rounded-xl text-xs font-bold hover:bg-slate-50"
                              >
                                Decline / Request Design Edit
                              </button>
                              <button
                                onClick={handleApproveDesign}
                                disabled={updatingStatus !== null}
                                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 flex items-center gap-1.5 disabled:opacity-50"
                              >
                                <Check size={14} /> Approve Design Proof
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-8 bg-slate-50 border border-slate-200 rounded-xl text-center text-slate-400 text-xs">
                      Engineering design proofs will be uploaded by our designers once quotation is approved.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 4. BILLING / PAY DEPOSIT TAB */}
            {activeTab === "billing" && (
              <div className="space-y-6">
                <div className="bg-white border border-[#cbd5e1] rounded-2xl p-6 space-y-6">
                  <h3 className="text-xs font-black text-[#0b1c30] uppercase tracking-widest flex items-center gap-2 pb-4 border-b border-slate-100">
                    <CreditCard size={14} className="text-[#018F10]" />
                    Invoicing & Payment Details
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Total Contract Value</span>
                      <div className="text-lg font-black text-slate-800 mt-2 font-mono">
                        ₹{(qd.grandTotal || activeOrder?.budget || 0).toLocaleString("en-IN")}
                      </div>
                    </div>

                    <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 text-center">
                      <span className="text-[10px] font-bold text-emerald-600 uppercase">Deposits Received</span>
                      <div className="text-lg font-black text-emerald-800 mt-2 font-mono">
                        ₹{(activeOrder?.depositPaid || 0).toLocaleString("en-IN")}
                      </div>
                    </div>

                    <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-4 text-center">
                      <span className="text-[10px] font-bold text-amber-600 uppercase">Outstanding Balance</span>
                      <div className="text-lg font-black text-amber-800 mt-2 font-mono">
                        ₹{Math.max((qd.grandTotal || activeOrder?.budget || 0) - (activeOrder?.depositPaid || 0), 0).toLocaleString("en-IN")}
                      </div>
                    </div>
                  </div>

                  {/* Bank transfer payment instructions */}
                  <div className="border border-slate-200 rounded-2xl p-5 space-y-4 bg-slate-50">
                    <span className="text-xs font-bold text-slate-700 block uppercase tracking-wider">Payment Options</span>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                      <div className="space-y-2 text-xs">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Method 1: Direct Bank Transfer (NEFT/RTGS)</span>
                        <p className="font-semibold text-slate-700">Account Name: <span className="text-slate-900 block font-bold mt-0.5">PRINTEC SIGNAGE SOLUTIONS PVT LTD</span></p>
                        <p className="font-semibold text-slate-700 font-mono">Account Number: 50200088382939</p>
                        <p className="font-semibold text-slate-700">Bank Name: HDFC Bank Ltd</p>
                        <p className="font-semibold text-slate-700 font-mono">IFSC Code: HDFC0001202</p>
                      </div>

                      <div className="flex flex-col items-center justify-center border-l md:border-l border-slate-200 pl-0 md:pl-6 text-center space-y-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Method 2: Scan UPI QR Code</span>
                        <div className="w-32 h-32 border border-slate-200 rounded-xl bg-white flex items-center justify-center p-2">
                          <QrCode size={100} className="text-[#0b1c30]" />
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">printec@hdfcbank</span>
                      </div>
                    </div>
                  </div>

                  {/* Pay button */}
                  {Math.max((qd.grandTotal || activeOrder?.budget || 0) - (activeOrder?.depositPaid || 0), 0) > 0 && (
                    <div className="flex justify-end">
                      <button
                        onClick={() => setShowPaymentModal(true)}
                        className="px-6 py-3 bg-[#018F10] hover:bg-[#01730c] text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2"
                      >
                        <CreditCard size={14} />
                        Simulate Payment Confirmation
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 5. DIRECT MESSAGING TAB */}
            {activeTab === "chat" && (
              <div className="space-y-6">
                <div className="bg-white border border-[#cbd5e1] rounded-2xl flex flex-col h-[520px] shadow-sm overflow-hidden">
                  
                  {/* Chat Header */}
                  <div className="px-6 py-4 border-b border-[#cbd5e1] bg-[#f8f9ff] flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-[#003568] text-white flex items-center justify-center font-bold text-xs">
                        P
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#0b1c30]">Printec Support Executive</h4>
                        <span className="text-[9px] text-emerald-600 font-bold block mt-0.5">● Online</span>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono font-bold text-slate-400">Order: {activeOrder?.id}</span>
                  </div>

                  {/* Message History */}
                  <div className="flex-1 p-6 overflow-y-auto space-y-4 custom-scrollbar bg-slate-50/50">
                    {activeOrder?.chatHistory.map((chat: any) => {
                      const isClient = chat.sender.includes("Client");
                      const isSystem = chat.sender === "System";

                      if (isSystem) {
                        return (
                          <div key={chat.id} className="flex justify-center">
                            <span className="bg-slate-100 text-slate-500 border border-slate-200 px-3 py-1 rounded-full text-[9px] font-bold tracking-wider uppercase">
                              {chat.message}
                            </span>
                          </div>
                        );
                      }

                      return (
                        <div key={chat.id} className={`flex flex-col ${isClient ? "items-end" : "items-start"}`}>
                          <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs ${
                            isClient 
                              ? "bg-[#0b1c30] text-white rounded-br-none" 
                              : "bg-white border border-[#cbd5e1] text-slate-800 rounded-bl-none shadow-2xs"
                          }`}>
                            <p className="font-semibold mb-1 text-[9px] opacity-75">{chat.sender}</p>
                            <p className="leading-normal">{chat.message}</p>
                            <span className="block text-[8px] opacity-60 text-right mt-1.5 font-mono">{chat.time}</span>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Input form */}
                  <form onSubmit={handleSendChat} className="p-4 border-t border-[#cbd5e1] bg-white flex items-center space-x-3">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Type your message, query, or revision requests here..."
                      className="flex-1 p-3 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#018F10] focus:ring-1 focus:ring-[#018F10]"
                    />
                    <button
                      type="submit"
                      disabled={!chatInput.trim()}
                      className="p-3 bg-[#018F10] hover:bg-[#01730c] text-white rounded-xl transition-all disabled:opacity-50"
                    >
                      <Send size={14} />
                    </button>
                  </form>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* ── MOCK PAYMENT MODAL ── */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">UPI Mock Payment Confirmation</h2>
              <button onClick={() => setShowPaymentModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded">
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6 space-y-4 text-center">
              <QrCode size={120} className="text-[#0b1c30] mx-auto" />
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Amount Due</span>
                <p className="text-lg font-black text-slate-800 font-mono">
                  ₹{Math.max((qd.grandTotal || activeOrder?.budget || 0) - (activeOrder?.depositPaid || 0), 0).toLocaleString("en-IN")}
                </p>
              </div>
              <p className="text-xs text-slate-500 leading-normal">
                To simulate checking out: scan the code or transfer using direct netbanking, then click below to trigger a mock confirmation update.
              </p>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="px-4 py-2 border border-slate-300 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmMockPayment}
                disabled={paymentLoading}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold disabled:opacity-50"
              >
                {paymentLoading ? "Processing..." : "Confirm UPI Transfer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
