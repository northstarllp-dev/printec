"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { OrderCommunicationCenter } from "@/components/communication/OrderCommunicationCenter";
import {
  Search, Send, X, Maximize2, RefreshCw,
  Check, Share2, Pencil, CheckCircle2,
  MapPin, FileText, LayoutDashboard, CheckSquare,
  ArrowLeft, MoreVertical, Lock, Save,
} from "lucide-react";
import {
  Order, PipelineStage, SiteVisitDetails, QuoteDetails,
  DesignDetails, ProductionDetails, InstallationDetails, Customer, Employee,
} from "@/types";
import { SiteVisitModule } from "./site-visit/SiteVisitModule";
import { QuotationModule } from "./quotation/QuotationModule";
import { DesignModule } from "./design/DesignModule";
import { ProductionModule } from "./production/ProductionModule";
import { InstallationModule } from "./installation/InstallationModule";
import {
  updateSiteVisitDetailsAction,
  updateQuoteDetailsAction,
  updateDesignDetailsAction,
  updateProductionDetailsAction,
  updateInstallationDetailsAction,
  requestStageAdvancementAction,
  adminApproveStageAction,
  adminRejectStageAction,
  updateOrderStageAction,
  addChatMessageAction,
  updateOrderHealthAction,
  reopenOrderAction,
} from "@/features/orders/actions/orderActions";

/* ─── helpers ──────────────────────────────────────────────────── */
const STAGE_LABEL: Record<string, { label: string; color: string }> = {
  "Site Visit Pending":    { label: "Site Visit",  color: "#818CF8" },
  "Site Visit Scheduled":  { label: "Scheduled",   color: "#818CF8" },
  "Site Visit Completed":  { label: "Site Done",   color: "#818CF8" },
  "Quotation In Progress": { label: "Quoting",     color: "#F97316" },
  "Quotation Sent":        { label: "Quote Sent",  color: "#F97316" },
  "Quotation Negotiation": { label: "Negotiating", color: "#F97316" },
  "Quotation Approved":    { label: "Quote OK",    color: "#F97316" },
  "Design In Progress":    { label: "Design",      color: "#EC4899" },
  "Design Approved":       { label: "Design OK",   color: "#EC4899" },
  "Production":            { label: "Production",  color: "#3B82F6" },
  "Ready For Installation":{ label: "Ready",       color: "#3B82F6" },
  "Installation Scheduled":{ label: "Install",     color: "#0EA5E9" },
  "Completed":             { label: "Completed",   color: "#22C55E" },
  "Closed":                { label: "Closed",      color: "#22C55E" },
};

const PRIORITY: (o: any) => "High" | "Medium" | "Low" = (o) => {
  if (o.urgent) return "High";
  if (o.deadlineStatus === "Action Required" || o.deadlineStatus === "Delayed") return "Medium";
  return "Low";
};

const PRIORITY_STYLE = {
  High:   { bg: "#FEF2F2", text: "#DC2626", border: "#FECACA" },
  Medium: { bg: "#FFFBEB", text: "#D97706", border: "#FDE68A" },
  Low:    { bg: "#F0FDF4", text: "#16A34A", border: "#BBF7D0" },
};

const WORKFLOW_STEPS = [
  { label: "Enquiry",     tab: -1, icon: "📋" },
  { label: "Site Visit",  tab: 0,  icon: "📍" },
  { label: "Quote",       tab: 1,  icon: "📄" },
  { label: "Design",      tab: 2,  icon: "🎨" },
  { label: "Installation",tab: 4,  icon: "🔧" },
];

function stageToTabIndex(stage: PipelineStage): number {
  switch (stage) {
    case "Site Visit Pending":
    case "Site Visit Scheduled":
    case "Site Visit Completed":
      return 0;
    case "Quotation In Progress":
    case "Quotation Sent":
    case "Quotation Negotiation":
    case "Quotation Approved":
      return 1;
    case "Design In Progress":
    case "Design Approved":
      return 2;
    case "Production":
    case "Ready For Installation":
      return 3;
    case "Installation Scheduled":
    case "Completed":
    case "Closed":
      return 4;
    default:
      return 0;
  }
}

/* ─── Props ─────────────────────────────────────────────────────── */
interface OrderWorksheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  customers: Customer[];
  employees: Employee[];
  allOrders?: any[];
  currentUserRole: "Admin" | "Employee";
  currentEmployee: Employee | null;
}

/* ─── Component ─────────────────────────────────────────────────── */
export const OrderWorksheetModal: React.FC<OrderWorksheetModalProps> = ({
  isOpen,
  onClose,
  order: initialOrder,
  customers,
  employees,
  allOrders = [],
  currentUserRole,
  currentEmployee,
}) => {
  const router = useRouter();
  const [order, setOrder] = useState<Order>(initialOrder);
  const [localAlert, setLocalAlert] = useState<{
    message: string;
    type: "info" | "success" | "warning" | "error";
  } | null>(null);
  const [activeStepTab, setActiveStepTab] = useState<number>(
    stageToTabIndex(initialOrder.stage)
  );
  const [rejectNotes, setRejectNotes] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [activeRightPanel, setActiveRightPanel] = useState<"logs" | "chat" | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showLostReasonDropdown, setShowLostReasonDropdown] = useState(false);
  const [selectedLostReason, setSelectedLostReason] = useState("");
  const [orderSearch, setOrderSearch] = useState("");
  const [orderTab, setOrderTab] = useState<"all" | "active" | "pending">("all");

  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => { setOrder(initialOrder); }, [initialOrder]);
  useEffect(() => { setActiveStepTab(stageToTabIndex(order.stage)); }, [order.stage]);

  useEffect(() => {
    const supabase = createClient();
    async function loadMessages() {
      const { data } = await supabase
        .from("order_messages")
        .select("*")
        .eq("order_id", order.orderId || order.id);
      if (data) setMessages(data);
    }
    loadMessages();

    const channel = supabase
      .channel(`order-comm-modal-${order.id}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "order_messages",
        filter: `order_id=eq.${order.orderId || order.id}`
      }, (payload) => {
        if (payload.eventType === "INSERT") {
          setMessages(prev => {
            if (prev.some(m => m.id === payload.new.id)) return prev;
            return [...prev, payload.new];
          });
        } else if (payload.eventType === "UPDATE") {
          setMessages(prev => prev.map(m => m.id === payload.new.id ? payload.new : m));
        } else if (payload.eventType === "DELETE") {
          setMessages(prev => prev.filter(m => m.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [order.id, order.orderId]);

  const logsCount = messages.filter((m) => m.tab === "timeline").length;
  const chatCount = messages.filter((m) => m.tab === "internal").length;

  if (!isOpen) return null;

  const triggerLocalAlert = (
    message: string,
    type: "info" | "success" | "warning" | "error"
  ) => {
    setLocalAlert({ message, type });
    setTimeout(() => setLocalAlert(null), 3500);
  };

  /* ── Data ── */
  const client = customers.find((c) => c.id === order.customerId);
  const isEmployee = currentUserRole === "Employee";
  const currentStageIndex = stageToTabIndex(order.stage);

  /* ── Server Action Wrappers ── */
  const updateSiteVisitDetails = async (orderId: string, details: Partial<SiteVisitDetails>) => {
    setOrder((prev) => ({ ...prev, siteVisitDetails: { ...(prev.siteVisitDetails || {}), ...details } as SiteVisitDetails }));
    try { await updateSiteVisitDetailsAction(orderId, details); } catch (err) { console.error(err); }
  };
  const updateQuoteDetails = async (orderId: string, details: Partial<QuoteDetails>) => {
    setOrder((prev) => ({ ...prev, quoteDetails: { ...(prev.quoteDetails || {}), ...details } as QuoteDetails }));
    try { await updateQuoteDetailsAction(orderId, details); } catch (err) { console.error(err); }
  };
  const updateDesignDetails = async (orderId: string, details: Partial<DesignDetails>) => {
    setOrder((prev) => ({ ...prev, designDetails: { ...(prev.designDetails || {}), ...details } as DesignDetails }));
    try { await updateDesignDetailsAction(orderId, details); } catch (err) { console.error(err); }
  };
  const updateProductionDetails = async (orderId: string, details: Partial<ProductionDetails>) => {
    setOrder((prev) => ({ ...prev, productionDetails: { ...(prev.productionDetails || {}), ...details } as ProductionDetails }));
    try { await updateProductionDetailsAction(orderId, details); } catch (err) { console.error(err); }
  };
  const updateInstallationDetails = async (orderId: string, details: Partial<InstallationDetails>) => {
    setOrder((prev) => ({ ...prev, installationDetails: { ...(prev.installationDetails || {}), ...details } as InstallationDetails }));
    try { await updateInstallationDetailsAction(orderId, details); } catch (err) { console.error(err); }
  };

  const handleAdminApprove = async () => {
    try {
      await adminApproveStageAction(order.id);
      router.refresh();
      triggerLocalAlert("Stage approved and advanced.", "success");
      setShowRejectInput(false);
    } catch (err) { triggerLocalAlert("Failed to approve stage.", "error"); }
  };
  const handleAdminReject = async () => {
    if (!rejectNotes.trim()) { triggerLocalAlert("Please provide rejection feedback.", "warning"); return; }
    try {
      await adminRejectStageAction(order.id, rejectNotes);
      router.refresh();
      setRejectNotes(""); setShowRejectInput(false);
      triggerLocalAlert("Feedback sent back.", "info");
    } catch (err) { triggerLocalAlert("Failed to submit rejection.", "error"); }
  };
  const handleRequestAdvancement = async () => {
    try {
      await requestStageAdvancementAction(order.id);
      await addChatMessageAction(order.id, "System", `${currentEmployee?.name || "Staff"} requested stage advancement.`);
      router.refresh();
      triggerLocalAlert("Stage advancement requested.", "success");
    } catch (err) { triggerLocalAlert("Failed to request advancement.", "error"); }
  };
  const handleUpdateHealth = async (health: string, reason?: string) => {
    try {
      const res = await updateOrderHealthAction(order.id, health, reason);
      if (res && res.length > 0) {
        setOrder((prev) => ({ ...prev, health: res[0].health, lost_reason: res[0].lost_reason, chatHistory: res[0].chat_history }));
        triggerLocalAlert(`Order health set to ${health}.`, "success");
        router.refresh();
      }
    } catch (err) { triggerLocalAlert("Failed to update health.", "error"); }
  };
  const handleReopen = async () => {
    try {
      const res = await reopenOrderAction(order.id);
      if (res && res.length > 0) {
        setOrder((prev) => ({ ...prev, health: res[0].health, lost_reason: res[0].lost_reason, chatHistory: res[0].chat_history }));
        triggerLocalAlert("Order reopened.", "success");
        router.refresh();
      }
    } catch (err) { triggerLocalAlert("Failed to reopen.", "error"); }
  };



  const handleCopyMagicLink = async () => {
    if (!client) return;
    try {
      const res = await fetch(`/api/portal-token?customer_id=${client.customerId || client.id}&order_id=${order.orderId || order.id}`);
      const data = await res.json();
      if (data.url) {
        await navigator.clipboard.writeText(data.url);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
        triggerLocalAlert("Magic portal link copied!", "success");
      }
    } catch (err) { triggerLocalAlert("Failed to copy portal link.", "error"); }
  };

  const handleSaveDraft = async () => {
    try {
      // Save based on active tab
      switch (activeStepTab) {
        case 0: // Site Visit
          if (order.siteVisitDetails) {
            await updateSiteVisitDetails(order.id, order.siteVisitDetails);
          }
          break;
        case 1: // Quotation
          if (order.quoteDetails) {
            await updateQuoteDetails(order.id, order.quoteDetails);
          }
          break;
        case 2: // Design
          if (order.designDetails) {
            await updateDesignDetails(order.id, order.designDetails);
          }
          break;
        case 3: // Production
          if (order.productionDetails) {
            await updateProductionDetails(order.id, order.productionDetails);
          }
          break;
        case 4: // Installation
          if (order.installationDetails) {
            await updateInstallationDetails(order.id, order.installationDetails);
          }
          break;
      }
      triggerLocalAlert("Draft saved successfully!", "success");
    } catch (err) {
      triggerLocalAlert("Failed to save draft.", "error");
      console.error(err);
    }
  };

  /* ── Module fallbacks ── */
  const sv = order.siteVisitDetails || { width: 0, height: 0, depth: 0, auditDate: "", auditTime: "", sitePersonnel: "", photos: [], completed: false, notes: "" };
  const qd = order.quoteDetails || { signageType: "ACP Panels", width: 0, height: 0, depth: 0, material: "", mounting: "", baseACPPrice: 0, hardwarePrice: 0, polishingPrice: 0, discount: 0, subtotal: 0, tax: 0, grandTotal: 0 };
  const dd = order.designDetails || { proofUrl: "", status: "Draft" };
  const pd = order.productionDetails || { printing: false, cutting: false, fabrication: false, assembly: false };
  const inst = order.installationDetails || { photoUrl: "", customerSignature: "", paymentCode: "" };

  /* ── Filtered order list for left panel ── */
  const filteredOrders = allOrders.filter((o) => {
    const matchesSearch =
      o.projectName?.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.customerName?.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.orderCode?.toLowerCase().includes(orderSearch.toLowerCase());
    if (!matchesSearch) return false;
    if (orderTab === "active") return o.stage !== "Completed" && o.stage !== "Closed";
    if (orderTab === "pending") return o.stage === "Site Visit Pending" || o.stage === "Quotation In Progress";
    return true;
  });

  /* ── Module content ── */
  const renderModule = () => {
    switch (activeStepTab) {
      case 0: return (
        <SiteVisitModule
          order={order} customers={customers} employees={employees}
          currentUserRole={currentUserRole} currentEmployee={currentEmployee}
          onClose={() => {}} onUpdate={(d) => updateSiteVisitDetails(order.id, d)}
          onSubmitForApproval={async (): Promise<void> => { await requestStageAdvancementAction(order.id); }}
          onAdminApprove={async (): Promise<void> => { await handleAdminApprove(); }}
          onAdminRequestChanges={async (notes: string): Promise<void> => { setRejectNotes(notes); await adminRejectStageAction(order.id, notes); }}
        />
      );
      case 1: return <QuotationModule order={order} isEmployee={isEmployee} updateQuoteDetails={updateQuoteDetails} />;
      case 2: return <DesignModule order={order} isEmployee={isEmployee} updateDesignDetails={updateDesignDetails} />;
      case 3: return <ProductionModule order={order} isEmployee={isEmployee} updateProductionDetails={updateProductionDetails} />;
      case 4: return <InstallationModule order={order} isEmployee={isEmployee} updateInstallationDetails={updateInstallationDetails} />;
      default: return null;
    }
  };

  /* ── Workflow steps for middle panel ── */
  const workflowSteps = [
    ...(isEmployee ? [] : [{ label: "Enquiry",     tabIndex: -1, done: true }]),
    { label: "Site Visit",  tabIndex: 0, done: currentStageIndex > 0 },
    { label: "Quote",       tabIndex: 1, done: currentStageIndex > 1 },
    { label: "Design",      tabIndex: 2, done: currentStageIndex > 2 },
    { label: "Installation",tabIndex: 4, done: currentStageIndex > 4 },
  ];

  const activeModuleTitle = ["Site Visit Audit", "Product Quote", "Design Proof", "Fabrication Checklist", "Field Installation"][activeStepTab] || "Order Details";

  /* ── Counts for top bar pills ── */
  const activeCount = allOrders.filter((o) => o.stage !== "Completed" && o.stage !== "Closed").length;
  const quotingCount = allOrders.filter((o) => o.stage?.startsWith("Quotation")).length;
  const doneCount = allOrders.filter((o) => o.stage === "Completed" || o.stage === "Closed").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, height: "100%", maxHeight: "100%", overflow: "hidden", background: "#F8FAFC" }}>

      {/* ── TOP BAR ── */}
      <header style={{ height: "52px", background: "white", borderBottom: "1px solid #E2E8F0", display: "flex", alignItems: "center", paddingLeft: "16px", paddingRight: "20px", gap: "12px", flexShrink: 0, zIndex: 30 }}>
        <button
          onClick={onClose}
          style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none", cursor: "pointer", color: "#64748B", fontSize: "13px", fontWeight: "600", padding: "0 8px 0 0" }}
        >
          <ArrowLeft size={14} /> Back
        </button>
        <div style={{ width: "1px", height: "20px", background: "#E2E8F0" }} />
        <span style={{ fontSize: "14px", fontWeight: "700", color: "#0F172A" }}>Order Management</span>

        <div style={{ display: "flex", gap: "8px", marginLeft: "auto" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "4px", background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: "6px", padding: "3px 10px", fontSize: "11px", fontWeight: "700", color: "#2563EB" }}>
            ↑ {activeCount} Active
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "4px", background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: "6px", padding: "3px 10px", fontSize: "11px", fontWeight: "700", color: "#EA580C" }}>
            ◉ {quotingCount} Quoting
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "4px", background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: "6px", padding: "3px 10px", fontSize: "11px", fontWeight: "700", color: "#16A34A" }}>
            ✓ {doneCount} Done
          </span>
        </div>

        {localAlert && (
          <div style={{
            marginLeft: "8px", padding: "6px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: "600",
            background: localAlert.type === "success" ? "#F0FDF4" : localAlert.type === "warning" ? "#FFFBEB" : localAlert.type === "error" ? "#FEF2F2" : "#EFF6FF",
            color: localAlert.type === "success" ? "#16A34A" : localAlert.type === "warning" ? "#D97706" : localAlert.type === "error" ? "#DC2626" : "#2563EB",
            border: `1px solid ${localAlert.type === "success" ? "#BBF7D0" : localAlert.type === "warning" ? "#FDE68A" : localAlert.type === "error" ? "#FECACA" : "#BFDBFE"}`,
          }}>
            {localAlert.message}
          </div>
        )}
      </header>

      {/* ── 3 PANELS ── */}
      <div style={{ display: "flex", flex: 1, minHeight: 0, overflow: "hidden" }}>

        {/* ══ PANEL 1: ORDER LIST ══ */}
        {allOrders.length > 0 && (
          <aside style={{ width: "280px", flexShrink: 0, borderRight: "1px solid #E2E8F0", background: "white", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            
            {/* Search */}
            <div style={{ padding: "12px", borderBottom: "1px solid #F1F5F9" }}>
              <div style={{ position: "relative" }}>
                <Search size={12} style={{ position: "absolute", left: "9px", top: "50%", transform: "translateY(-50%)", color: "#94A3B8", pointerEvents: "none" }} />
                <input
                  type="text"
                  placeholder="Search orders..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  style={{ width: "100%", padding: "6px 8px 6px 28px", border: "1px solid #E2E8F0", borderRadius: "7px", fontSize: "12px", background: "#F8FAFC", outline: "none", fontFamily: "inherit", color: "#0F172A" }}
                />
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", padding: "8px 10px", gap: "4px", borderBottom: "1px solid #F1F5F9" }}>
              {(["all", "active", "pending"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setOrderTab(tab)}
                  style={{
                    flex: 1, padding: "5px 4px", fontSize: "11px", fontWeight: "700",
                    background: orderTab === tab ? "var(--color-secondary)" : "transparent",
                    color: orderTab === tab ? "white" : "#94A3B8",
                    border: "none", borderRadius: "6px", cursor: "pointer",
                    textTransform: "capitalize", transition: "all 0.15s",
                  }}
                >
                  {tab === "all" ? "All" : tab === "active" ? "Active" : "Pending"}
                </button>
              ))}
            </div>

            {/* Order Cards */}
            <div style={{ flex: 1, overflowY: "auto" }}>
              {filteredOrders.map((o) => {
                const isSelected = o.id === order.id;
                const stageInfo = STAGE_LABEL[o.stage] || { label: o.stage, color: "#94A3B8" };
                const pri = PRIORITY(o);
                const priStyle = PRIORITY_STYLE[pri];
                const progress = Math.round(((stageToTabIndex(o.stage) + 1) / 5) * 100);

                return (
                  <div
                    key={o.id}
                    onClick={() => router.push(`/admin/orders/${o.orderId || o.id}`)}
                    style={{
                      padding: "12px",
                      borderBottom: "1px solid #F1F5F9",
                      cursor: "pointer",
                      background: isSelected ? "#EFF6FF" : "white",
                      borderLeft: isSelected ? "3px solid var(--color-secondary)" : "3px solid transparent",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = "#F8FAFC"; }}
                    onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = "white"; }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "4px", marginBottom: "3px" }}>
                      <span style={{ fontSize: "13px", fontWeight: "700", color: "#0F172A", lineHeight: 1.3, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {o.projectName}
                      </span>
                      <span style={{ fontSize: "9px", fontWeight: "800", padding: "2px 6px", borderRadius: "4px", background: priStyle.bg, color: priStyle.text, border: `1px solid ${priStyle.border}`, flexShrink: 0, textTransform: "uppercase" }}>
                        {pri}
                      </span>
                    </div>
                    <div style={{ fontSize: "11px", color: "#94A3B8", marginBottom: "6px" }}>
                      {o.orderCode} • {o.customerName || "—"}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: stageInfo.color, flexShrink: 0 }} />
                      <span style={{ fontSize: "11px", color: "#64748B", fontWeight: "600" }}>{stageInfo.label}</span>
                    </div>
                    {/* Progress bar */}
                    <div style={{ width: "100%", height: "3px", background: "#E2E8F0", borderRadius: "99px", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${progress}%`, background: "var(--color-secondary)", borderRadius: "99px", transition: "width 0.4s ease" }} />
                    </div>
                    <div style={{ fontSize: "10px", color: "#94A3B8", marginTop: "4px", textAlign: "right" }}>
                      {new Date(o.dateCreated).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </div>
                  </div>
                );
              })}
              {filteredOrders.length === 0 && (
                <div style={{ padding: "24px 12px", textAlign: "center", fontSize: "12px", color: "#94A3B8" }}>
                  No orders found.
                </div>
              )}
            </div>
          </aside>
        )}

        {/* ══ PANEL 2: WORKFLOW STEPS ══ */}
        <aside style={{ width: "240px", flexShrink: 0, borderRight: "1px solid #E2E8F0", background: "#FAFAFA", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          
          {/* Order header */}
          {isEmployee && (
            <div style={{ padding: "16px", borderBottom: "1px solid #E2E8F0" }}>
              <div style={{ fontSize: "10px", fontWeight: "700", color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>
                {order.orderCode}
              </div>
              <h2 style={{ margin: "0 0 6px", fontSize: "14px", fontWeight: "800", color: "#0F172A", lineHeight: 1.3 }}>
                {order.projectName}
              </h2>
              {(() => {
                const stageInfo = STAGE_LABEL[order.stage] || { label: order.stage, color: "#94A3B8" };
                return (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "3px 8px", borderRadius: "6px", fontSize: "10px", fontWeight: "700", background: stageInfo.color + "15", color: stageInfo.color, border: `1px solid ${stageInfo.color}30` }}>
                    ● {stageInfo.label}
                  </span>
                );
              })()}
            </div>
          )}

          {/* Workflow steps */}
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 12px" }}>
            {workflowSteps.map((step, i) => {
              const isActive = activeStepTab === step.tabIndex;
              const isDone = step.done || step.tabIndex < currentStageIndex;
              return (
                <button
                  key={step.label}
                  onClick={() => { if (step.tabIndex >= 0) setActiveStepTab(step.tabIndex); }}
                  disabled={step.tabIndex < 0}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: "12px",
                    padding: "10px 12px", marginBottom: "4px",
                    background: isActive ? "var(--color-secondary)" : isDone ? "#F0FDF4" : "white",
                    border: `1px solid ${isActive ? "var(--color-secondary)" : isDone ? "#BBF7D0" : "#E2E8F0"}`,
                    borderRadius: "10px", cursor: step.tabIndex >= 0 ? "pointer" : "default",
                    transition: "all 0.15s", textAlign: "left",
                  }}
                >
                  {/* Step indicator */}
                  <div style={{
                    width: "28px", height: "28px", borderRadius: "50%", flexShrink: 0,
                    background: isActive ? "rgba(255,255,255,0.15)" : isDone ? "#22C55E" : "#F1F5F9",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    border: `2px solid ${isActive ? "rgba(255,255,255,0.3)" : isDone ? "#16A34A" : "#E2E8F0"}`,
                  }}>
                    {isDone ? (
                      <Check size={13} style={{ color: isActive ? "white" : "white" }} />
                    ) : (
                      <span style={{ fontSize: "11px", fontWeight: "800", color: isActive ? "white" : "#94A3B8" }}>
                        {i + 1}
                      </span>
                    )}
                  </div>
                  <div>
                    <div style={{ fontSize: "12px", fontWeight: "700", color: isActive ? "white" : "#0F172A" }}>
                      {step.label}
                    </div>
                    <div style={{ fontSize: "10px", color: isActive ? "rgba(255,255,255,0.7)" : "#94A3B8", fontWeight: "500" }}>
                      Step {i + 1}
                    </div>
                  </div>
                </button>
              );
            })}
            
            {/* Divider Line */}
            <hr style={{ border: "none", borderTop: "1px solid #cbd5e1", margin: "16px 4px" }} />

            {/* Project Logs (Admin only) */}
            {!isEmployee && (
              <button
                onClick={() => {
                  setActiveRightPanel(activeRightPanel === "logs" ? null : "logs");
                }}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: "12px",
                  padding: "10px 12px", marginBottom: "8px",
                  background: activeRightPanel === "logs" ? "var(--color-secondary)" : "white",
                  border: `1px solid ${activeRightPanel === "logs" ? "var(--color-secondary)" : "#E2E8F0"}`,
                  borderRadius: "10px",
                  cursor: "pointer", transition: "all 0.15s", textAlign: "left"
                }}
                onMouseEnter={e => { if (activeRightPanel !== "logs") e.currentTarget.style.background = "#F8FAFC"; }}
                onMouseLeave={e => { if (activeRightPanel !== "logs") e.currentTarget.style.background = "white"; }}
              >
                <div style={{
                  width: "28px", height: "28px", borderRadius: "50%", flexShrink: 0,
                  background: activeRightPanel === "logs" ? "rgba(255,255,255,0.15)" : "#F1F5F9",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  border: `2px solid ${activeRightPanel === "logs" ? "rgba(255,255,255,0.3)" : "#E2E8F0"}`
                }}>
                  <span style={{ fontSize: "12px" }}>📋</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flex: 1 }}>
                  <div>
                    <div style={{ fontSize: "12px", fontWeight: "700", color: activeRightPanel === "logs" ? "white" : "#0F172A" }}>
                      Project Logs
                    </div>
                    <div style={{ fontSize: "10px", color: activeRightPanel === "logs" ? "rgba(255,255,255,0.7)" : "#94A3B8", fontWeight: "500" }}>
                      System trail & logs
                    </div>
                  </div>
                  {logsCount > 0 && (
                    <span style={{
                      fontSize: "10px", fontWeight: "800", padding: "2px 6px", borderRadius: "10px",
                      background: activeRightPanel === "logs" ? "white" : "#F1F5F9",
                      color: activeRightPanel === "logs" ? "var(--color-secondary)" : "#64748B",
                      border: activeRightPanel === "logs" ? "none" : "1px solid #E2E8F0"
                    }}>
                      {logsCount}
                    </span>
                  )}
                </div>
              </button>
            )}

            {/* Team Chat (Admin & Staff) */}
            <button
              onClick={() => {
                setActiveRightPanel(activeRightPanel === "chat" ? null : "chat");
              }}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: "12px",
                padding: "10px 12px", marginBottom: "8px",
                background: activeRightPanel === "chat" ? "var(--color-secondary)" : "white",
                border: `1px solid ${activeRightPanel === "chat" ? "var(--color-secondary)" : "#E2E8F0"}`,
                borderRadius: "10px",
                cursor: "pointer", transition: "all 0.15s", textAlign: "left"
              }}
              onMouseEnter={e => { if (activeRightPanel !== "chat") e.currentTarget.style.background = "#F8FAFC"; }}
              onMouseLeave={e => { if (activeRightPanel !== "chat") e.currentTarget.style.background = "white"; }}
            >
              <div style={{
                width: "28px", height: "28px", borderRadius: "50%", flexShrink: 0,
                background: activeRightPanel === "chat" ? "rgba(255,255,255,0.15)" : "#F1F5F9",
                display: "flex", alignItems: "center", justifyContent: "center",
                border: `2px solid ${activeRightPanel === "chat" ? "rgba(255,255,255,0.3)" : "#E2E8F0"}`
              }}>
                <span style={{ fontSize: "12px" }}>💬</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flex: 1 }}>
                <div>
                  <div style={{ fontSize: "12px", fontWeight: "700", color: activeRightPanel === "chat" ? "white" : "#0F172A" }}>
                    Team Chat
                  </div>
                  <div style={{ fontSize: "10px", color: activeRightPanel === "chat" ? "rgba(255,255,255,0.7)" : "#94A3B8", fontWeight: "500" }}>
                    Internal communication
                  </div>
                </div>
                {chatCount > 0 && (
                  <span style={{
                    fontSize: "10px", fontWeight: "800", padding: "2px 6px", borderRadius: "10px",
                    background: activeRightPanel === "chat" ? "white" : "#F1F5F9",
                    color: activeRightPanel === "chat" ? "var(--color-secondary)" : "#64748B",
                    border: activeRightPanel === "chat" ? "none" : "1px solid #E2E8F0"
                  }}>
                    {chatCount}
                  </span>
                )}
              </div>
            </button>
          </div>

          {/* Customer info (Moved to complete bottom, borderTop instead of borderBottom) */}
          <div style={{ borderTop: "1px solid #E2E8F0", padding: "14px", background: "white", flexShrink: 0 }}>
            <div style={{ fontSize: "9px", fontWeight: "700", color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>Customer</div>
            {client ? (
              <>
                <div style={{ fontSize: "13px", fontWeight: "700", color: "#0F172A", marginBottom: "3px" }}>{client.name}</div>
                {client.phone && (
                  <div style={{ fontSize: "11px", color: "#64748B", marginBottom: "2px" }}>
                    📞 {isEmployee ? (client.phone.replace(/\D/g, "").length < 4 ? "****" : client.phone.replace(/\D/g, "").slice(0, 2) + "******" + client.phone.replace(/\D/g, "").slice(-2)) : client.phone}
                  </div>
                )}
                {client.email && (
                  <div style={{ fontSize: "11px", color: "#64748B", marginBottom: "8px" }}>
                    ✉ {isEmployee ? (client.email.split("@").length === 2 ? client.email.split("@")[0].slice(0, 1) + "*****" + client.email.split("@")[0].slice(-1) + "@" + client.email.split("@")[1] : "*****@***.***") : client.email}
                  </div>
                )}
                <button
                  onClick={isEmployee ? undefined : handleCopyMagicLink}
                  disabled={isEmployee}
                  style={{
                    width: "100%", padding: "8px", borderRadius: "8px", fontSize: "12px", fontWeight: "700",
                    background: isEmployee ? "#CBD5E1" : "#F97316",
                    color: isEmployee ? "#64748B" : "white",
                    border: "none",
                    cursor: isEmployee ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={e => { if (!isEmployee) e.currentTarget.style.background = "#ea580c"; }}
                  onMouseLeave={e => { if (!isEmployee) e.currentTarget.style.background = "#F97316"; }}
                >
                  {isEmployee ? <Lock size={12} /> : <Share2 size={12} />} {isEmployee ? "Portal Link Locked" : (copiedLink ? "Copied!" : "Customer Portal")}
                </button>
                <button
                  onClick={isEmployee ? undefined : handleCopyMagicLink}
                  disabled={isEmployee}
                  style={{
                    width: "100%", marginTop: "6px", padding: "7px", borderRadius: "8px", fontSize: "11px", fontWeight: "600",
                    background: isEmployee ? "#F8FAFC" : "white",
                    color: isEmployee ? "#94A3B8" : "#64748B",
                    border: "1px solid #E2E8F0",
                    cursor: isEmployee ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "5px"
                  }}
                >
                  {isEmployee ? <Lock size={11} /> : <Share2 size={11} />} Copy portal link
                </button>
              </>
            ) : (
              <p style={{ margin: 0, fontSize: "12px", color: "#94A3B8" }}>No client linked</p>
            )}
          </div>
        </aside>

        {/* ══ PANEL 3: MODULE CONTENT ══ */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>

          {/* Module header */}
          <div style={{ padding: "16px 24px", borderBottom: "1px solid #E2E8F0", background: "white", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#0F172A" }}>
                {activeModuleTitle}
              </h2>
              <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#94A3B8" }}>
                {activeStepTab === 2 && sv.sitePersonnel ? `Designer: ${sv.sitePersonnel}` : ""}{" "}
                {order.versionHistory && order.versionHistory.length > 0 ? `• ${order.versionHistory.length} versions` : ""}
              </p>
            </div>
            {/* Stage approval status */}
            {order.stageStatus && order.stageStatus !== "Normal" && (
              <span style={{ fontSize: "11px", fontWeight: "800", color: "#EA580C", background: "#FFF7ED", border: "1px solid #FED7AA", padding: "4px 12px", borderRadius: "6px" }}>
                Pending Approval
              </span>
            )}
          </div>

          {/* Module body (scrollable) */}
          <div style={{ flex: 1, overflowY: "auto", padding: "24px", paddingBottom: "100px" }}>

            {/* Admin approval banner */}
            {order.stageStatus && order.stageStatus !== "Normal" && !isEmployee && (
              <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: "10px", padding: "14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "20px" }}>
                <div>
                  <p style={{ margin: 0, fontSize: "13px", fontWeight: "700", color: "#92400E" }}>Advancement Approval Requested</p>
                  <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#B45309" }}>Staff has requested to advance this order. Review and approve or reject.</p>
                </div>
                <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                  <button onClick={() => setShowRejectInput(!showRejectInput)} style={{ padding: "7px 14px", border: "1px solid #FDE68A", background: "white", color: "#D97706", borderRadius: "7px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>
                    Reject
                  </button>
                  <button onClick={handleAdminApprove} style={{ padding: "7px 14px", background: "#22C55E", border: "none", color: "white", borderRadius: "7px", fontSize: "12px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                    <Check size={13} /> Approve
                  </button>
                </div>
              </div>
            )}

            {/* Reject input */}
            {showRejectInput && !isEmployee && (
              <div style={{ background: "white", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "16px", marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "10px", fontWeight: "700", color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>Rejection Feedback</label>
                <textarea
                  rows={2}
                  placeholder="Specify edits needed..."
                  value={rejectNotes}
                  onChange={(e) => setRejectNotes(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #E2E8F0", borderRadius: "8px", fontSize: "12px", outline: "none", resize: "none", fontFamily: "inherit" }}
                />
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "10px" }}>
                  <button onClick={() => setShowRejectInput(false)} style={{ padding: "6px 14px", border: "1px solid #E2E8F0", background: "white", color: "#64748B", borderRadius: "7px", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>Cancel</button>
                  <button onClick={handleAdminReject} style={{ padding: "6px 14px", background: "#EF4444", border: "none", color: "white", borderRadius: "7px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>Submit Notes</button>
                </div>
              </div>
            )}

            {/* Module content */}
            <div style={{ background: "white", border: "1px solid #E2E8F0", borderRadius: "12px", overflow: "hidden" }}>
              <div style={{ padding: "20px" }}>
                {renderModule()}
              </div>
            </div>



          </div>

          {/* Sticky footer actions */}
          <div style={{ padding: "14px 20px", background: "#F8FAFC", borderTop: "1px solid #E2E8F0", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, boxShadow: "0 -2px 10px rgba(0,0,0,0.05)" }}>
            <div />
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              {order.health && order.health !== "Active" ? (
                <>
                  <span style={{ fontSize: "12px", color: "#64748B", fontWeight: "600" }}>
                    Order is <strong style={{ color: "#DC2626" }}>{order.health}</strong>
                  </span>
                  <button onClick={handleReopen} style={{ padding: "7px 16px", background: "var(--color-secondary)", border: "none", color: "white", borderRadius: "8px", fontSize: "12px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                    <RefreshCw size={13} /> Reopen Order
                  </button>
                </>
              ) : (
                <>
                  {/* Save Draft button */}
                  <button onClick={handleSaveDraft} style={{ padding: "7px 16px", border: "1px solid #E2E8F0", background: "white", color: "#64748B", borderRadius: "8px", fontSize: "12px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                    <Save size={13} /> Save Draft
                  </button>

                  {/* Advance stage / Staff section approval push */}
                  {isEmployee ? (
                    <button onClick={handleRequestAdvancement} style={{ padding: "8px 18px", background: "#22C55E", border: "none", color: "white", borderRadius: "8px", fontSize: "12px", fontWeight: "800", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                      <CheckCircle2 size={13} /> Push {activeModuleTitle} to Admin for Approval
                    </button>
                  ) : (
                    currentStageIndex === activeStepTab && order.stageStatus === "Normal" && (
                      <button onClick={handleAdminApprove} style={{ padding: "7px 16px", background: "#22C55E", border: "none", color: "white", borderRadius: "8px", fontSize: "12px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                        <Check size={13} /> Approve & Advance
                      </button>
                    )
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* ══ PANEL 4: SLIDING DRAWER PANEL ══ */}
        {activeRightPanel && (
          <aside style={{
            width: "380px",
            flexShrink: 0,
            borderLeft: "1px solid #E2E8F0",
            background: "white",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            height: "100%"
          }}>
            <OrderCommunicationCenter
              orderId={order.orderId || order.id}
              currentUserId={currentEmployee?.id || "admin-id"}
              currentUserRole={currentUserRole}
              currentUserName={currentUserRole === "Admin" ? "Admin" : (currentEmployee?.name || "Staff")}
              employees={employees}
              customers={customers}
              onClose={() => setActiveRightPanel(null)}
              defaultTab={activeRightPanel === "logs" ? "timeline" : "internal"}
            />
          </aside>
        )}
      </div>
    </div>
  );
};
