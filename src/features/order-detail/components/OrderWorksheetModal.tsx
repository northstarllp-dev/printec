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
  Order, PipelineStage, SiteVisitDetails,
  DesignDetails, ProductionDetails, InstallationDetails, Customer, Employee,
} from "@/types";
import { SiteVisitModule } from "./site-visit/SiteVisitModule";
import { SiteVisitReviewModal } from "./site-visit/SiteVisitReviewModal";
import { QuotationModule } from "./quotation/QuotationModule";
import { DesignModule } from "./design/DesignModule";
import LoadingLines from "@/components/ui/loading-lines";
import { ProductionModule } from "./production/ProductionModule";
import { AdminControlModule } from "./admin/AdminControlModule";
import { InstallationModule } from "./installation/InstallationModule";
import {
  updateSiteVisitDetailsAction,
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
  approveSiteVisitAction,
  freezeSiteVisitAction,
} from "@/features/orders/actions/orderActions";
import { mapSiteVisitFromDb } from "@/features/orders/actions/siteVisitMapper";

/* ─── helpers ──────────────────────────────────────────────────── */
const STAGE_LABEL: Record<string, { label: string; color: string }> = {
  "Site Visit Pending": { label: "Site Visit", color: "#818CF8" },
  "Site Visit Scheduled": { label: "Scheduled", color: "#818CF8" },
  "Site Visit Completed": { label: "Site Done", color: "#818CF8" },
  "Quotation In Progress": { label: "Quoting", color: "#F97316" },
  "Quotation Sent": { label: "Quote Sent", color: "#F97316" },
  "Quotation Negotiation": { label: "Negotiating", color: "#F97316" },
  "Quotation Approved": { label: "Quote OK", color: "#F97316" },
  "Design In Progress": { label: "Design", color: "#EC4899" },
  "Design Approved": { label: "Design OK", color: "#EC4899" },
  "Production": { label: "Production", color: "#3B82F6" },
  "Ready For Installation": { label: "Ready", color: "#3B82F6" },
  "Installation Scheduled": { label: "Install", color: "#0EA5E9" },
  "Completed": { label: "Completed", color: "#22C55E" },
  "Closed": { label: "Closed", color: "#22C55E" },
};



const WORKFLOW_STEPS = [
  { label: "Enquiry", tab: -1, icon: "📋" },
  { label: "Site Visit", tab: 0, icon: "📍" },
  { label: "Quote", tab: 1, icon: "📄" },
  { label: "Design", tab: 2, icon: "🎨" },
  { label: "Production", tab: 3, icon: "🏭" },
  { label: "Installation", tab: 4, icon: "🔧" },
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
interface Product {
  id: string;
  product_id: string;
  name: string;
  category: string | null;
  pricing_type?: string | null;
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

interface OrderWorksheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  customers: Customer[];
  employees: Employee[];
  allOrders?: any[];
  currentUserRole: "Admin" | "Employee";
  currentEmployee: Employee | null;
  products?: Product[];
  initialQuotation?: any;
  siteVisitItems?: SiteVisitItem[];
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
  products = [],
  initialQuotation = null,
  siteVisitItems = [],
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
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
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
        .from("order_activity")
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
        table: "order_activity",
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
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "orders",
        filter: `id=eq.${order.id}`
      }, (payload) => {
        const updated = payload.new as any;
        if (updated) {
          setOrder(prev => ({
            ...prev,
            stage: updated.stage,
            stageStatus: updated.stage_status,
            stageAdminNotes: updated.stage_admin_notes,
            chatHistory: updated.chat_history || prev.chatHistory,
            designDetails: updated.design_details || prev.designDetails,
            productionDetails: updated.production_details || prev.productionDetails,
            installationDetails: updated.installation_details || prev.installationDetails,
          }));
        }
      })
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "site_visits",
        filter: `order_id=eq.${order.id}`
      }, (payload) => {
        if (payload.eventType === "DELETE") {
          setOrder(prev => ({
            ...prev,
            siteVisitDetails: undefined
          }));
        } else {
          const mapped = mapSiteVisitFromDb(payload.new);
          if (mapped) {
            setOrder(prev => {
              const existingLocations = prev.siteVisitDetails?.locations || [];
              return {
                ...prev,
                siteVisitDetails: {
                  ...mapped,
                  locations: mapped.locations && mapped.locations.length > 0 ? mapped.locations : existingLocations
                }
              };
            });
          }
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

  /* ── Local State Wrappers ── */
  const updateSiteVisitDetails = async (orderId: string, details: Partial<SiteVisitDetails>) => {
    setOrder((prev) => ({ ...prev, siteVisitDetails: { ...(prev.siteVisitDetails || {}), ...details } as SiteVisitDetails }));
  };
  // Quote details are now managed entirely by QuotationModule via quotationActions.
  const updateDesignDetails = async (orderId: string, details: Partial<DesignDetails>) => {
    setOrder((prev) => ({ ...prev, designDetails: { ...(prev.designDetails || {}), ...details } as DesignDetails }));
  };
  const updateProductionDetails = async (orderId: string, details: Partial<ProductionDetails>) => {
    setOrder((prev) => ({ ...prev, productionDetails: { ...(prev.productionDetails || {}), ...details } as ProductionDetails }));
  };
  const updateInstallationDetails = async (orderId: string, details: Partial<InstallationDetails>) => {
    setOrder((prev) => ({ ...prev, installationDetails: { ...(prev.installationDetails || {}), ...details } as InstallationDetails }));
  };

  const handleAdminApprove = async () => {
    setIsProcessing(true);
    try {
      await handleSaveDraft();
      // On Site Visit tab, don't execute immediately; open the review modal instead.
      if (activeStepTab === 0 && order.stageStatus === "Normal") {
        setIsReviewModalOpen(true);
        setIsProcessing(false);
        return;
      }
      await adminApproveStageAction(order.id);
      setOrder(prev => ({ ...prev, stageStatus: "Normal" }));
      router.refresh();
      triggerLocalAlert("Stage approved and advanced.", "success");
      setShowRejectInput(false);
    } catch (err) { triggerLocalAlert("Failed to approve stage.", "error"); }
    finally { setIsProcessing(false); }
  };

  const handleAdminRequestChanges = async (notes: string) => {
    if (!notes.trim()) { triggerLocalAlert("Please provide rejection feedback.", "warning"); return; }
    setIsProcessing(true);
    try {
      await adminRejectStageAction(order.id, notes);
      setOrder(prev => ({ ...prev, stageStatus: "Normal" }));
      router.refresh();
      setRejectNotes(""); setShowRejectInput(false);
      triggerLocalAlert("Feedback sent back.", "info");
    } catch (err) { triggerLocalAlert("Failed to submit rejection.", "error"); }
    finally { setIsProcessing(false); }
  };
  const handleUpdateOrderStage = async (orderId: string, stage: string) => {
    setIsProcessing(true);
    try {
      await updateOrderStageAction(orderId, stage);
      setOrder(prev => ({ ...prev, stage: stage as PipelineStage }));
      router.refresh();
      triggerLocalAlert(`Stage changed to ${stage}`, "success");
    } catch (err) {
      console.error(err);
      triggerLocalAlert("Failed to change stage", "error");
    } finally { setIsProcessing(false); }
  };
  const handleRequestAdvancement = async () => {
    setIsProcessing(true);
    try {
      await handleSaveDraft();
      // If on the Site Visit tab, don't execute immediately; open the review modal instead.
      if (activeStepTab === 0) {
        setIsReviewModalOpen(true);
        setIsProcessing(false);
        return;
      } else {
        await requestStageAdvancementAction(order.id);
        await addChatMessageAction(order.id, "System", `${currentEmployee?.name || "Staff"} requested stage advancement.`);
        router.refresh();
        triggerLocalAlert("Stage advancement requested.", "success");
      }
    } catch (err) { triggerLocalAlert("Failed to submit.", "error"); }
    finally { setIsProcessing(false); }
  };
  const handleUpdateHealth = async (health: string, reason?: string) => {
    setIsProcessing(true);
    try {
      const res = await updateOrderHealthAction(order.id, health, reason);
      if (res && res.length > 0) {
        setOrder((prev) => ({ ...prev, health: res[0].health, lost_reason: res[0].lost_reason, chatHistory: res[0].chat_history }));
        triggerLocalAlert(`Order health set to ${health}.`, "success");
        router.refresh();
      }
    } catch (err) { triggerLocalAlert("Failed to update health.", "error"); }
    finally { setIsProcessing(false); }
  };
  const handleReopen = async () => {
    setIsProcessing(true);
    try {
      const res = await reopenOrderAction(order.id);
      if (res && res.length > 0) {
        setOrder((prev) => ({ ...prev, health: res[0].health, lost_reason: res[0].lost_reason, chatHistory: res[0].chat_history }));
        triggerLocalAlert("Order reopened.", "success");
        router.refresh();
      }
    } catch (err) { triggerLocalAlert("Failed to reopen.", "error"); }
    finally { setIsProcessing(false); }
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
    setIsProcessing(true);
    try {
      // Save based on active tab
      switch (activeStepTab) {
        case 0: // Site Visit
          if (order.siteVisitDetails) {
            await updateSiteVisitDetailsAction(order.id, order.siteVisitDetails);
          }
          break;
        case 1: // Quotation — saved directly from QuotationModule
          break;
        case 2: // Design
          if (order.designDetails) {
            await updateDesignDetailsAction(order.id, order.designDetails);
          }
          break;
        case 3: // Production
          if (order.productionDetails) {
            await updateProductionDetailsAction(order.id, order.productionDetails);
          }
          break;
        case 4: // Installation
          if (order.installationDetails) {
            await updateInstallationDetailsAction(order.id, order.installationDetails);
          }
          break;
      }
      triggerLocalAlert("Draft saved successfully!", "success");
      router.refresh();
    } catch (err) {
      triggerLocalAlert("Failed to save draft.", "error");
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  /* ── Module fallbacks ── */
  const sv = order.siteVisitDetails || { width: 0, height: 0, depth: 0, auditDate: "", auditTime: "", sitePersonnel: "", photos: [], completed: false, notes: "", locations: [] };
  const dd = order.designDetails || { proofUrl: "", status: "Draft" };
  const pd = order.productionDetails || { printing: false, cutting: false, fabrication: false, assembly: false };
  const inst = order.installationDetails || { photoUrl: "", customerSignature: "", paymentCode: "" };
  const isCurrentTabFrozen = activeStepTab === 0 ? sv.completed : false;

  // Strict Site Visit Validations
  const isSiteVisitScheduled = !!(sv.auditDate && sv.auditTime);
  const hasSiteVisitLocations = !!(sv.locations && sv.locations.length > 0);
  const canAdvanceSiteVisit = activeStepTab !== 0 || (isSiteVisitScheduled && hasSiteVisitLocations);
  const siteVisitAdvanceTooltip = activeStepTab === 0 && !canAdvanceSiteVisit 
    ? "Schedule the visit and add at least one location item to unlock approval." 
    : "";

  const actionButtonsNode = (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
      {order.health && order.health !== "Active" ? (
        <>
          <span style={{ fontSize: "12px", color: "#64748B", fontWeight: "600", display: "none" }}>
            Order is <strong style={{ color: "#DC2626" }}>{order.health}</strong>
          </span>
          <button onClick={handleReopen} style={{ padding: "6px 14px", background: "var(--color-secondary)", border: "none", color: "white", borderRadius: "6px", fontSize: "12px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
            <RefreshCw size={13} /> Reopen
          </button>
        </>
      ) : (
        (!isCurrentTabFrozen && (
          <>
            <button onClick={handleSaveDraft} style={{ padding: "6px 14px", border: "1px solid #E2E8F0", background: "white", color: "#0F172A", borderRadius: "6px", fontSize: "12px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", transition: "all 0.15s" }}>
              <Save size={13} /> Save Draft
            </button>
            {isEmployee ? (
              <button onClick={handleRequestAdvancement} style={{ padding: "6px 14px", background: "#22C55E", border: "none", color: "white", borderRadius: "6px", fontSize: "12px", fontWeight: "800", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", transition: "all 0.15s" }}>
                <CheckCircle2 size={13} /> Push for Approval
              </button>
            ) : (
              currentStageIndex === activeStepTab && order.stageStatus === "Normal" && (
                <button onClick={handleAdminApprove} style={{ padding: "6px 14px", background: "#22C55E", border: "none", color: "white", borderRadius: "6px", fontSize: "12px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", transition: "all 0.15s" }}>
                  <Check size={13} /> Approve & Advance
                </button>
              )
            )}
          </>
        ))
      )}
    </div>
  );

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
          onClose={() => { }} onUpdate={(d) => updateSiteVisitDetails(order.id, d)}
          onSubmitForApproval={async (): Promise<void> => { await requestStageAdvancementAction(order.id); }}
          onAdminApprove={async (): Promise<void> => { await handleAdminApprove(); }}
          onAdminRequestChanges={async (notes: string): Promise<void> => { setRejectNotes(notes); await adminRejectStageAction(order.id, notes); }}
        />
      );
      case 1: return (
        <QuotationModule
          order={{
            id: order.id,
            orderId: order.orderId,
            projectName: order.projectName,
            customerName: order.customerName,
            customerId: order.customerId,
            stage: order.stage,
          }}
          isEmployee={isEmployee}
          products={products as any}
          initialQuotation={initialQuotation}
          siteVisitItems={siteVisitItems}
        />
      );
      case 2: return <DesignModule order={order} isEmployee={isEmployee} updateDesignDetails={updateDesignDetails} />;
      case 3: return <ProductionModule order={order} isEmployee={isEmployee} updateProductionDetails={updateProductionDetails} />;
      case 4: return <InstallationModule order={order} isEmployee={isEmployee} updateInstallationDetails={updateInstallationDetails} />;
      case 99: return (
        <AdminControlModule
          order={order}
          customers={customers}
          employees={employees}
          onAdminApprove={handleAdminApprove}
          onAdminRequestChanges={handleAdminRequestChanges}
          updateSiteVisitDetails={updateSiteVisitDetails}
          updateOrderStage={handleUpdateOrderStage}
        />
      );
      default: return null;
    }
  };

  /* ── Workflow steps for middle panel ── */
  const workflowSteps = [
    ...(isEmployee ? [] : [{ label: "Enquiry", tabIndex: -1, done: true }]),
    ...(isEmployee ? [] : [{ label: "Admin Controls", tabIndex: 99, done: false }]),
    { label: "Site Visit", tabIndex: 0, done: currentStageIndex > 0 },
    { label: "Quote", tabIndex: 1, done: currentStageIndex > 1 },
    { label: "Design", tabIndex: 2, done: currentStageIndex > 2 },
    { label: "Production", tabIndex: 3, done: currentStageIndex > 3 },
    { label: "Installation", tabIndex: 4, done: currentStageIndex > 4 },
  ];

  const activeModuleTitle = activeStepTab === 99 ? "Admin Control Panel" : ["Site Visit Audit", "Product Quote", "Design Proof", "Fabrication Checklist", "Field Installation"][activeStepTab] || "Order Details";

  /* ── Counts for top bar pills ── */
  const activeCount = allOrders.filter((o) => o.stage !== "Completed" && o.stage !== "Closed").length;
  const quotingCount = allOrders.filter((o) => o.stage?.startsWith("Quotation")).length;
  const doneCount = allOrders.filter((o) => o.stage === "Completed" || o.stage === "Closed").length;

  return (
    <div style={{ position: "relative", display: "flex", flexDirection: "column", flex: 1, height: "100%", maxHeight: "100%", overflow: "hidden", background: "#F8FAFC" }}>
      {isProcessing && (
        <div className="absolute inset-0 z-[9999] flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <LoadingLines />
        </div>
      )}

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

        <div className="hidden md:flex" style={{ gap: "8px", marginLeft: "auto", alignItems: "center" }}>
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
                
                const isSiteVisitStage = o.stage === "Site Visit Scheduled" || o.stage === "Site Visit Completed";
                const hasNoDate = !o.siteVisitDetails || !o.siteVisitDetails.auditDate;
                const displayStage = (isSiteVisitStage && hasNoDate) ? "Site Visit Pending" : o.stage;
                const stageInfo = STAGE_LABEL[displayStage] || { label: displayStage, color: "#94A3B8" };

                const progress = Math.round(((stageToTabIndex(displayStage) + 1) / 5) * 100);

                return (
                  <div
                    key={o.id}
                    onClick={() => router.push(`/admin/orders/${o.orderId || o.id}`)}
                    style={{
                      padding: "12px",
                      borderBottom: "1px solid #F1F5F9",
                      cursor: "pointer",
                      background: isSelected ? "linear-gradient(to right, #FFF7ED, transparent)" : "white",
                      borderLeft: isSelected ? "3px solid #F97316" : "3px solid transparent",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = "#F8FAFC"; }}
                    onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = "white"; }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "4px", marginBottom: "3px" }}>
                      <span style={{ fontSize: "13px", fontWeight: "700", color: "#0F172A", lineHeight: 1.3, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {o.projectName}
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

        {/* ══ PANEL 2: REMOVED (Replaced by horizontal timeline) ══ */}

        {/* ══ PANEL 3: MODULE CONTENT ══ */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden", background: "#F1F5F9" }}>

          {/* Customer Strip & Horizontal Timeline Header */}
          <div style={{ background: "white", flexShrink: 0, padding: "0 24px" }}>

            {/* Top row: Order Info & Customer */}
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "12px", padding: "16px 0", borderBottom: "1px solid #F1F5F9" }}>
              <div>
                <div style={{ fontSize: "11px", fontWeight: "700", color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>
                  {order.orderCode}
                </div>
                <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#0F172A", lineHeight: 1.2 }}>
                  {order.projectName}
                </h2>
              </div>

              {/* Customer Info Mini-Bar */}
              {client && (
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "12px", background: "#F8FAFC", padding: "6px 16px", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
                  <div style={{ fontSize: "12px", fontWeight: "700", color: "#0F172A" }}>{client.name}</div>
                  {client.phone && (
                    <div style={{ fontSize: "12px", color: "#64748B" }}>
                      📞 {isEmployee ? (client.phone.replace(/\D/g, "").length < 4 ? "****" : client.phone.replace(/\D/g, "").slice(0, 2) + "******" + client.phone.replace(/\D/g, "").slice(-2)) : client.phone}
                    </div>
                  )}
                  {!isEmployee && (
                    <>
                      <div style={{ width: "1px", height: "14px", background: "#CBD5E1" }} />
                      <button
                        onClick={handleCopyMagicLink}
                        style={{ background: "none", border: "none", color: "#F97316", fontSize: "12px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                      >
                        <Share2 size={12} /> {copiedLink ? "Copied!" : "Portal"}
                      </button>
                      <div style={{ width: "1px", height: "14px", background: "#CBD5E1" }} />
                      <button
                        onClick={() => setActiveStepTab(99)}
                        style={{ background: activeStepTab === 99 ? "var(--color-secondary)" : "none", border: "none", color: activeStepTab === 99 ? "white" : "#0F172A", fontSize: "12px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", padding: "4px 8px", borderRadius: "6px", transition: "all 0.15s" }}
                      >
                        <Lock size={12} /> Admin Controls
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Horizontal Timeline */}
            {activeStepTab !== 99 && (
              <div className="hidden md:flex" style={{ position: "relative", paddingTop: "24px", paddingBottom: "0px", justifyContent: "space-between" }}>
                {/* Background Connecting Line */}
                <div style={{ position: "absolute", top: "36px", left: "40px", right: "40px", height: "2px", background: "#E2E8F0", zIndex: 0 }} />

                {workflowSteps.filter(s => s.tabIndex !== 99).map((step, i) => {
                  const isActive = activeStepTab === step.tabIndex;
                  const isDone = step.done || step.tabIndex < currentStageIndex;
                  const isFuture = !isActive && !isDone;

                  return (
                    <button
                      key={step.label}
                      onClick={() => { if (step.tabIndex >= 0) setActiveStepTab(step.tabIndex); }}
                      disabled={step.tabIndex < 0}
                      style={{
                        position: "relative", zIndex: 1, background: "none", border: "none", padding: "0 10px",
                        display: "flex", flexDirection: "column", alignItems: "center", gap: "8px",
                        cursor: step.tabIndex >= 0 ? "pointer" : "default", width: "100px",
                        outline: "none"
                      }}
                    >
                      {/* Node */}
                      <div style={{
                        width: "26px", height: "26px", borderRadius: "50%",
                        background: isActive ? "var(--color-secondary)" : isDone ? "#22C55E" : "white",
                        border: `2px solid ${isActive ? "var(--color-secondary)" : isDone ? "#22C55E" : "#CBD5E1"}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        boxShadow: isActive ? "0 0 0 4px #EFF6FF" : "none",
                        transition: "all 0.2s ease",
                        zIndex: 2
                      }}>
                        {isDone ? (
                          <Check size={14} color="white" strokeWidth={3} />
                        ) : (
                          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: isActive ? "white" : "transparent" }} />
                        )}
                      </div>

                      {/* Label Tab matching bottom area */}
                      <div style={{
                        background: isActive ? "#F1F5F9" : "transparent",
                        padding: "8px 16px",
                        borderTopLeftRadius: "8px",
                        borderTopRightRadius: "8px",
                        color: isActive ? "var(--color-secondary)" : isDone ? "#475569" : "#94A3B8",
                        fontWeight: isActive ? "800" : "600",
                        fontSize: "12px",
                        width: "120px",
                        textAlign: "center",
                        borderBottom: isActive ? "none" : "1px solid transparent",
                        marginBottom: "-1px", // seamlessly connect to the background of the form area
                        position: "relative",
                        zIndex: isActive ? 3 : 1
                      }}>
                        {step.label}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Module Header (if not 99, we can still show a clean title) */}
          <div style={{ padding: activeStepTab === 99 ? "24px 24px 0 24px" : "16px 24px 0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              {activeStepTab === 99 && (
                <button
                  onClick={() => setActiveStepTab(stageToTabIndex(order.stage))}
                  style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--color-primary)", border: "none", borderRadius: "8px", cursor: "pointer", color: "white", fontSize: "13px", fontWeight: "700", padding: "10px 16px", transition: "all 0.2s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-primary-container)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "var(--color-primary)"; }}
                >
                  <ArrowLeft size={16} /> Back to Worksheet
                </button>
              )}
              <div>
                <h2 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#0F172A" }}>
                  {activeModuleTitle}
                </h2>
                <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#94A3B8" }}></p>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>


              {/* Stage approval status */}
              {order.stageStatus && order.stageStatus !== "Normal" && (
                <span style={{ fontSize: "11px", fontWeight: "800", color: "#EA580C", background: "#FFF7ED", border: "1px solid #FED7AA", padding: "4px 12px", borderRadius: "6px" }}>
                  Pending Approval
                </span>
              )}

              {/* Action Buttons removed from header as per request */}
            </div>
          </div>

          {/* Module body (scrollable) */}
          <div style={{ flex: 1, overflowY: "auto", padding: "0 24px 24px 24px" }}>

            <div style={{ background: "white", border: "1px solid #E2E8F0", borderTop: "none", borderBottomLeftRadius: "12px", borderBottomRightRadius: "12px", borderTopRightRadius: "12px", overflow: "visible", minHeight: "100%", borderTopLeftRadius: activeStepTab === 99 ? "12px" : "0px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)" }}>
              <div style={{ padding: "24px" }}>
                {renderModule()}
              </div>
            </div>

          </div>

          {/* Sticky footer actions */}
          <div style={{ padding: "14px 20px", background: "#F8FAFC", borderTop: "1px solid #E2E8F0", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, boxShadow: "0 -2px 10px rgba(0,0,0,0.05)" }}>
            <div />
            {activeStepTab === 1 ? (
              order.health && order.health !== "Active" ? (
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <span style={{ fontSize: "12px", color: "#64748B", fontWeight: "600" }}>
                    Order is <strong style={{ color: "#DC2626" }}>{order.health}</strong>
                  </span>
                  <button onClick={handleReopen} style={{ padding: "7px 16px", background: "var(--color-secondary)", border: "none", color: "white", borderRadius: "8px", fontSize: "12px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                    <RefreshCw size={13} /> Reopen Order
                  </button>
                </div>
              ) : (
                <div id="modal-footer-portal" style={{ display: "flex", gap: "10px", alignItems: "center" }} />
              )
            ) : (
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
                    {!isCurrentTabFrozen && (
                      <>
                        {/* Save Draft button */}
                        <button onClick={handleSaveDraft} style={{ padding: "7px 16px", border: "1px solid #E2E8F0", background: "white", color: "#64748B", borderRadius: "8px", fontSize: "12px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                          <Save size={13} /> Save Draft
                        </button>
    
                        {/* Advance stage / Staff section approval push */}
                        {isEmployee ? (
                          <div title={siteVisitAdvanceTooltip} style={{ display: "inline-block" }}>
                            <button disabled={!canAdvanceSiteVisit} onClick={handleRequestAdvancement} style={{ padding: "8px 18px", background: canAdvanceSiteVisit ? "#22C55E" : "#94A3B8", border: "none", color: "white", borderRadius: "8px", fontSize: "12px", fontWeight: "800", cursor: canAdvanceSiteVisit ? "pointer" : "not-allowed", display: "flex", alignItems: "center", gap: "6px" }}>
                              <CheckCircle2 size={13} /> Push {activeModuleTitle} to Admin for Approval
                            </button>
                          </div>
                        ) : (
                          currentStageIndex === activeStepTab && order.stageStatus === "Normal" && (
                            <div title={siteVisitAdvanceTooltip} style={{ display: "inline-block" }}>
                              <button disabled={!canAdvanceSiteVisit} onClick={handleAdminApprove} style={{ padding: "7px 16px", background: canAdvanceSiteVisit ? "#22C55E" : "#94A3B8", border: "none", color: "white", borderRadius: "8px", fontSize: "12px", fontWeight: "700", cursor: canAdvanceSiteVisit ? "pointer" : "not-allowed", display: "flex", alignItems: "center", gap: "6px" }}>
                                <Check size={13} /> Approve & Advance
                              </button>
                            </div>
                          )
                        )}
                      </>
                    )}
                  </>
                )}
              </div>
            )}
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
            height: "100%",
            zIndex: 40
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

      {/* ── FLOATING CHAT BUTTON (Order Hub) ── */}
      {!activeRightPanel && (
        <button
          onClick={() => setActiveRightPanel("chat")}
          style={{
            position: "absolute",
            bottom: "96px",
            right: "24px",
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            background: "var(--color-secondary)",
            color: "white",
            border: "none",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            zIndex: 50,
            transition: "transform 0.2s, box-shadow 0.2s"
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.05)"; e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.2)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)"; }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          {(logsCount > 0 || chatCount > 0) && (
            <span style={{
              position: "absolute",
              top: "-2px",
              right: "-2px",
              background: "#EF4444",
              color: "white",
              minWidth: "20px",
              height: "20px",
              borderRadius: "10px",
              fontSize: "11px",
              fontWeight: "700",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 4px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
            }}>
              {logsCount + chatCount}
            </span>
          )}
        </button>
      )}

      {/* ── REVIEW & CONFIRM MODAL (Site Visit) ── */}
      {isReviewModalOpen && (
        <SiteVisitReviewModal
          siteVisit={sv}
          orderName={order.projectName || order.orderId || ""}
          onClose={() => setIsReviewModalOpen(false)}
          onConfirm={async () => {
            try {
              await freezeSiteVisitAction(order.id);
              if (isEmployee) {
                setOrder(prev => ({ ...prev, stageStatus: "Pending Admin Approval: Site Visit Completed", siteVisitDetails: { ...prev.siteVisitDetails, completed: true } as any }));
                triggerLocalAlert("Site visit confirmed and locked. Awaiting admin review.", "success");
              } else {
                // If admin confirms, also approve the stage
                await adminApproveStageAction(order.id);
                setOrder(prev => ({ ...prev, stageStatus: "Normal", siteVisitDetails: { ...prev.siteVisitDetails, completed: true } as any }));
                triggerLocalAlert("Site visit locked and stage advanced.", "success");
              }
              router.refresh();
              setIsReviewModalOpen(false);
            } catch (err) {
              console.error(err);
              triggerLocalAlert("Failed to confirm site visit.", "error");
            }
          }}
        />
      )}
    </div>
  );
};
