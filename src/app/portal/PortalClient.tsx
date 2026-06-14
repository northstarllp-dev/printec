"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Printer, MapPin, FileText, CheckSquare, CheckCircle2, 
  MessageSquare, Send, ZoomIn, ZoomOut, Check, X, 
  AlertCircle, AlertTriangle, CreditCard, QrCode, Calendar, 
  Ruler, Activity, ChevronRight, User, Phone, Mail, Clock, ClipboardList
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";

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

  const chatEndRef = useRef<HTMLDivElement>(null);

  const activeOrder = orders.find(o => o.id === activeOrderId);

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
                    <span className="font-mono text-xs font-bold text-[#003568]">{o.id}</span>
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
              <span className="text-[#018F10] font-mono">{activeOrder?.id}</span>
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

          {/* ── SECTION A: HORIZONTAL WORKFLOW STEPPER ── */}
          <section className="bg-white border border-[#cbd5e1] rounded-2xl p-6 shadow-xs">
            <div className="flex justify-between items-center mb-6">
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
              <div className="space-y-6">
                
                {/* Site Visit Parameters */}
                <div className="bg-white border border-[#cbd5e1] rounded-2xl p-6 space-y-4">
                  <h4 className="text-xs font-black text-[#0b1c30] uppercase tracking-widest flex items-center gap-2">
                    <MapPin size={14} className="text-[#018F10]" />
                    Site Survey Parameters & Dimensions
                  </h4>
                  
                  {sv.completed ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Board Dimensions</span>
                        <div className="text-lg font-black text-slate-800 mt-2 font-mono flex items-center justify-center gap-1">
                          <Ruler size={16} className="text-[#018F10]" />
                          {sv.width}″ × {sv.height}″
                        </div>
                        <span className="text-[9px] text-slate-400 block mt-1">Width × Height (Depth: {sv.depth}″)</span>
                      </div>

                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Audit Completed Date</span>
                        <div className="text-sm font-bold text-slate-800 mt-2.5 flex items-center justify-center gap-1">
                          <Calendar size={14} className="text-[#018F10]" />
                          {sv.auditDate}
                        </div>
                        <span className="text-[9px] text-slate-400 block mt-1">Audit Time: {sv.auditTime}</span>
                      </div>

                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Assigned Auditor</span>
                        <div className="text-sm font-bold text-slate-800 mt-2.5 flex items-center justify-center gap-1">
                          <User size={14} className="text-[#018F10]" />
                          {sv.sitePersonnel || "Field Agent"}
                        </div>
                        <span className="text-[9px] text-slate-400 block mt-1">Printec Executive</span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-6 flex items-start space-x-3 text-amber-800">
                      <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={16} />
                      <div>
                        <span className="text-xs font-bold block">Site Audit Pending</span>
                        <p className="text-[11px] text-amber-700 leading-normal mt-1">
                          Our field executive is scheduled to visit your site to capture precise layout measurements. Physical coordinates will update here.
                        </p>
                      </div>
                    </div>
                  )}

                  {sv.notes && (
                    <div className="p-4 bg-[#f8f9ff] border border-slate-100 rounded-xl">
                      <span className="text-[9px] font-bold text-[#737780] uppercase tracking-wider block mb-1">Site Logistics Notes</span>
                      <p className="text-xs text-slate-600 leading-normal italic">"{sv.notes}"</p>
                    </div>
                  )}

                  {sv.photos && sv.photos.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Captured Site Photos</span>
                      <div className="flex flex-wrap gap-3">
                        {sv.photos.map((photo: string, i: number) => (
                          <a href={photo} target="_blank" rel="noopener noreferrer" key={i} className="w-20 h-20 rounded-xl border border-slate-200 bg-slate-100 overflow-hidden hover:opacity-90 transition-opacity">
                            <img src={photo} alt={`Site audit ${i+1}`} className="w-full h-full object-cover" onError={(e)=>{e.currentTarget.src='https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=100&auto=format&fit=crop';}} />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Production fabrication items */}
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
