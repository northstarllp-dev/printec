"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShoppingCart,
  CheckCircle2,
  DollarSign,
  MessageSquare,
  Factory,
  Wrench,
  LifeBuoy,
  XCircle,
  FileText,
  Plus,
  Eye,
  MoreHorizontal,
  AlertTriangle,
} from "lucide-react";
import { AddEnquiryModal, EnquiryFormData } from "@/features/enquiries/components/AddEnquiryModal";
import { createEnquiry } from "@/features/enquiries/actions/enquiryActions";

/* ─── helpers ──────────────────────────────────────────────────── */
const STAGE_LABEL: Record<string, { label: string; dot: string }> = {
  "Site Visit Pending":    { label: "Site Visit", dot: "#818CF8" },
  "Site Visit Scheduled":  { label: "Scheduled",  dot: "#818CF8" },
  "Site Visit Completed":  { label: "Site Done",   dot: "#818CF8" },
  "Quotation In Progress": { label: "Quoting",     dot: "#F97316" },
  "Quotation Sent":        { label: "Quote Sent",  dot: "#F97316" },
  "Quotation Negotiation": { label: "Negotiating", dot: "#F97316" },
  "Quotation Approved":    { label: "Quote OK",    dot: "#F97316" },
  "Design In Progress":    { label: "Design",      dot: "#EC4899" },
  "Design Approved":       { label: "Design OK",   dot: "#EC4899" },
  "Production":            { label: "In Production", dot: "#3B82F6" },
  "Ready For Installation":{ label: "Ready",       dot: "#3B82F6" },
  "Installation Scheduled":{ label: "Installation", dot: "#0EA5E9" },
  "Completed":             { label: "Completed",   dot: "#22C55E" },
  "Closed":                { label: "Closed",      dot: "#22C55E" },
};

const PRIORITY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  High:   { bg: "#FEF2F2", text: "#DC2626", border: "#FECACA" },
  Medium: { bg: "#FFFBEB", text: "#D97706", border: "#FDE68A" },
  Low:    { bg: "#F0FDF4", text: "#16A34A", border: "#BBF7D0" },
};

function getPriority(order: any): "High" | "Medium" | "Low" {
  if (order.urgent) return "High";
  if (order.deadlineStatus === "Action Required" || order.deadlineStatus === "Delayed") return "Medium";
  return "Low";
}

const PIPELINE_STAGES = [
  "Site Visit Pending",
  "Quotation Sent",
  "Design Approved",
  "Production",
  "Installation Scheduled",
  "Completed",
];

const PIPELINE_COLORS = [
  "#818CF8",
  "#F97316",
  "#EC4899",
  "#3B82F6",
  "#0EA5E9",
  "#22C55E",
];

/* ─── Component ─────────────────────────────────────────────────── */
interface AdminDashboardClientProps {
  orders: any[];
  enquiries: any[];
}

export function AdminDashboardClient({ orders, enquiries }: AdminDashboardClientProps) {
  const router = useRouter();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  /* Stats */
  const totalOrders = orders.length;
  const completedOrders = orders.filter(
    (o) => o.stage === "Completed" || o.stage === "Closed"
  ).length;
  const inProduction = orders.filter(
    (o) => o.stage === "Production" || o.stage === "Ready For Installation"
  ).length;
  const installations = orders.filter((o) => o.stage === "Installation Scheduled").length;
  const newEnquiries = enquiries.filter((e) => e.status === "Pending" || e.status === "New").length;
  const lostOrders = orders.filter((o) => o.health === "Lost").length;

  /* Stat card config */
  const STATS = [
    {
      label: "Total Orders",
      value: totalOrders,
      sub: `${orders.filter(o => o.stage !== "Completed" && o.stage !== "Closed").length} active`,
      change: "+12% vs last month",
      up: true,
      icon: ShoppingCart,
      iconBg: "var(--secondary-container)",
      iconColor: "var(--color-secondary)",
    },
    {
      label: "Completed",
      value: completedOrders,
      sub: "This month",
      change: "+8% vs last month",
      up: true,
      icon: CheckCircle2,
      iconBg: "#F0FDF4",
      iconColor: "#22C55E",
    },
    {
      label: "Revenue",
      value: "₹4,87,50,000",
      sub: `Outstanding: ₹23,40,000`,
      change: "+15% vs last month",
      up: true,
      icon: DollarSign,
      iconBg: "#F0FDF4",
      iconColor: "#16A34A",
      large: true,
    },
    {
      label: "New Enquiries",
      value: newEnquiries || 15,
      sub: "8 visits scheduled",
      change: "+3% vs last month",
      up: true,
      icon: MessageSquare,
      iconBg: "var(--secondary-container)",
      iconColor: "var(--color-secondary)",
    },
    {
      label: "In Production",
      value: inProduction || 2,
      sub: "1 in QC",
      change: "",
      up: null,
      icon: Factory,
      iconBg: "#EFF6FF",
      iconColor: "#3B82F6",
    },
    {
      label: "Installations",
      value: installations || 1,
      sub: "Scheduled",
      change: "",
      up: null,
      icon: Wrench,
      iconBg: "#ECFEFF",
      iconColor: "#0E7490",
    },
    {
      label: "Open Tickets",
      value: 7,
      sub: "Support requests",
      change: "",
      up: null,
      icon: LifeBuoy,
      iconBg: "#FFF7ED",
      iconColor: "#EA580C",
    },
    {
      label: "Lost Orders",
      value: lostOrders || 6,
      sub: "This quarter",
      change: "",
      up: null,
      icon: XCircle,
      iconBg: "#FEF2F2",
      iconColor: "#DC2626",
    },
  ];

  /* Recent Orders (last 5) */
  const recentOrders = orders.slice(0, 5);

  /* Pipeline counts */
  const pipelineCounts = PIPELINE_STAGES.map((stage) => ({
    stage,
    count: orders.filter((o) => o.stage === stage).length,
    label: STAGE_LABEL[stage]?.label || stage,
  }));

  /* Pending Tickets — mock data */
  const pendingTickets = [
    { id: "TKT-001", title: "LED light not working in main signage", customer: "Sneha Reddy", date: "26 Feb 2024", priority: "High" as const },
  ];

  return (
    <div style={{ padding: "32px", background: "#F8FAFC", minHeight: "100vh" }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: "800", color: "#0F172A", margin: 0 }}>
            Dashboard
          </h1>
          <p style={{ fontSize: "13px", color: "#64748B", margin: "4px 0 0" }}>
            Overview of your business performance
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              padding: "9px 16px", borderRadius: "8px",
              border: "1px solid var(--color-secondary)", background: "white",
              fontSize: "13px", fontWeight: "600", color: "var(--color-secondary)",
              cursor: "pointer", transition: "all 0.15s",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--secondary-container)"}
            onMouseLeave={e => e.currentTarget.style.background = "white"}
          >
            <FileText size={14} /> Generate Report
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              padding: "9px 16px", borderRadius: "8px",
              border: "none", background: "var(--color-primary)",
              fontSize: "13px", fontWeight: "700", color: "white",
              cursor: "pointer", transition: "all 0.15s",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--color-primary-container)"}
            onMouseLeave={e => e.currentTarget.style.background = "var(--color-primary)"}
          >
            <Plus size={14} /> Add Enquiry
          </button>
        </div>
      </div>

      {/* ── Stat Cards (2 rows of 4) ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "28px" }}>
        {STATS.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              style={{
                background: "white",
                border: "1px solid #E2E8F0",
                borderRadius: "12px",
                padding: "20px",
                cursor: "default",
                transition: "box-shadow 0.15s",
              }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.06)")}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "12px" }}>
                <p style={{ margin: 0, fontSize: "11px", fontWeight: "700", color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {stat.label}
                </p>
                <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: stat.iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon size={15} style={{ color: stat.iconColor }} />
                </div>
              </div>
              <div style={{ fontSize: stat.large ? "22px" : "28px", fontWeight: "800", color: "#0F172A", marginBottom: "6px", lineHeight: 1 }}>
                {stat.value}
              </div>
              <div style={{ fontSize: "11px", color: "#64748B" }}>{stat.sub}</div>
              {stat.change && (
                <div style={{ fontSize: "10px", fontWeight: "700", color: stat.up ? "#16A34A" : "#DC2626", marginTop: "6px" }}>
                  {stat.up ? "↑" : "↓"} {stat.change}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Bottom two columns: Recent Orders + Pending Tickets ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "20px", marginBottom: "24px" }}>

        {/* Recent Orders */}
        <div style={{ background: "white", border: "1px solid #E2E8F0", borderRadius: "12px", overflow: "hidden" }}>
          <div style={{ padding: "18px 24px", borderBottom: "1px solid #E2E8F0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h2 style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: "#0F172A" }}>Recent Orders</h2>
            <button
              onClick={() => router.push("/admin/orders")}
              style={{ fontSize: "12px", fontWeight: "700", color: "var(--color-primary)", background: "none", border: "none", cursor: "pointer" }}
            >
              View All
            </button>
          </div>
          <div>
            {recentOrders.map((order, i) => {
              const stageInfo = STAGE_LABEL[order.stage] || { label: order.stage, dot: "#94A3B8" };
              const priority = getPriority(order);
              const pStyles = PRIORITY_STYLES[priority];
              return (
                <div
                  key={order.id}
                  style={{
                    display: "flex", alignItems: "center",
                    padding: "14px 24px",
                    borderBottom: i < recentOrders.length - 1 ? "1px solid #F1F5F9" : "none",
                    gap: "12px",
                    cursor: "pointer",
                    transition: "background 0.15s",
                  }}
                  onClick={() => router.push(`/admin/orders/${order.orderId || order.id}`)}
                  onMouseEnter={e => (e.currentTarget.style.background = "#F8FAFC")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  {/* Order Code + Customer */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "13px", fontWeight: "700", color: "#0F172A" }}>
                        {order.orderCode}
                      </span>
                      <span
                        style={{
                          fontSize: "9px", fontWeight: "800", textTransform: "uppercase",
                          padding: "2px 6px", borderRadius: "4px",
                          background: order.health === "Active" ? "#F0FDF4" : "#FEF2F2",
                          color: order.health === "Active" ? "#16A34A" : "#DC2626",
                          border: `1px solid ${order.health === "Active" ? "#BBF7D0" : "#FECACA"}`,
                        }}
                      >
                        {order.health || "active"}
                      </span>
                    </div>
                    <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748B", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {order.customerName || order.projectName}
                    </p>
                  </div>



                  {/* Stage */}
                  <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: stageInfo.dot, flexShrink: 0 }} />
                    <span style={{ fontSize: "12px", color: "#475569", fontWeight: "600", whiteSpace: "nowrap" }}>
                      {stageInfo.label}
                    </span>
                  </div>

                  {/* Priority Badge */}
                  <span
                    style={{
                      fontSize: "10px", fontWeight: "800", textTransform: "uppercase",
                      padding: "3px 8px", borderRadius: "6px",
                      background: pStyles.bg, color: pStyles.text, border: `1px solid ${pStyles.border}`,
                      flexShrink: 0,
                    }}
                  >
                    {priority}
                  </span>

                  {/* Dots menu */}
                  <div style={{ position: "relative" }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === order.id ? null : order.id); }}
                      style={{ padding: "4px", background: "none", border: "none", cursor: "pointer", color: "#94A3B8", borderRadius: "4px" }}
                    >
                      <MoreHorizontal size={16} />
                    </button>
                    {openMenuId === order.id && (
                      <>
                        <div style={{ position: "fixed", inset: 0, zIndex: 49 }} onClick={() => setOpenMenuId(null)} />
                        <div style={{ position: "absolute", right: 0, top: "calc(100% + 4px)", background: "white", border: "1px solid #E2E8F0", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", zIndex: 50, minWidth: 140, overflow: "hidden" }}>
                          <button
                            onClick={() => { setOpenMenuId(null); router.push(`/admin/orders/${order.orderId || order.id}`); }}
                            style={{ width: "100%", padding: "9px 14px", display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none", fontSize: "12px", fontWeight: "600", color: "#0F172A", cursor: "pointer", textAlign: "left" }}
                            onMouseEnter={e => e.currentTarget.style.background = "#F8FAFC"}
                            onMouseLeave={e => e.currentTarget.style.background = "none"}
                          >
                            <Eye size={13} /> View Order
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
            {recentOrders.length === 0 && (
              <div style={{ padding: "40px", textAlign: "center", color: "#94A3B8", fontSize: "13px" }}>
                No orders yet.
              </div>
            )}
          </div>
        </div>

        {/* Pending Tickets */}
        <div style={{ background: "white", border: "1px solid #E2E8F0", borderRadius: "12px", overflow: "hidden" }}>
          <div style={{ padding: "18px 20px", borderBottom: "1px solid #E2E8F0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h2 style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: "#0F172A" }}>Pending Tickets</h2>
            <span style={{ fontSize: "10px", fontWeight: "800", background: "#EF4444", color: "white", padding: "2px 8px", borderRadius: "99px" }}>
              {pendingTickets.length} open
            </span>
          </div>
          <div style={{ padding: "16px" }}>
            {pendingTickets.map((ticket) => {
              const pStyles = PRIORITY_STYLES[ticket.priority];
              return (
                <div
                  key={ticket.id}
                  style={{
                    background: "#FFFBEB",
                    border: "1px solid #FDE68A",
                    borderRadius: "10px",
                    padding: "14px",
                    marginBottom: "12px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px", marginBottom: "8px" }}>
                    <p style={{ margin: 0, fontSize: "13px", fontWeight: "700", color: "#0F172A", lineHeight: 1.4 }}>
                      {ticket.title}
                    </p>
                    <span
                      style={{
                        fontSize: "9px", fontWeight: "800", textTransform: "uppercase",
                        padding: "2px 7px", borderRadius: "99px",
                        background: pStyles.bg, color: pStyles.text, border: `1px solid ${pStyles.border}`,
                        flexShrink: 0,
                      }}
                    >
                      {ticket.priority}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <AlertTriangle size={11} style={{ color: "#D97706" }} />
                    <span style={{ fontSize: "11px", color: "#64748B" }}>
                      {ticket.customer} • {ticket.date}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Order Pipeline ── */}
      <div style={{ background: "white", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "20px 24px" }}>
        <h2 style={{ margin: "0 0 20px", fontSize: "14px", fontWeight: "700", color: "#0F172A" }}>Order Pipeline</h2>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${PIPELINE_STAGES.length}, 1fr)`, gap: "0" }}>
          {pipelineCounts.map((item, i) => (
            <div
              key={item.stage}
              style={{
                textAlign: "center",
                padding: "0 8px",
                borderRight: i < pipelineCounts.length - 1 ? "1px solid #F1F5F9" : "none",
              }}
            >
              <div style={{ fontSize: "28px", fontWeight: "800", color: "#0F172A", marginBottom: "4px" }}>
                {item.count}
              </div>
              <div
                style={{
                  width: "100%",
                  height: "4px",
                  borderRadius: "99px",
                  background: PIPELINE_COLORS[i] + "30",
                  marginBottom: "8px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: item.count > 0 ? "100%" : "0%",
                    background: PIPELINE_COLORS[i],
                    borderRadius: "99px",
                    transition: "width 0.5s ease",
                  }}
                />
              </div>
              <div style={{ fontSize: "11px", fontWeight: "600", color: "#64748B" }}>
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      <AddEnquiryModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={async (data: EnquiryFormData) => {
          try {
            const newEnq = {
              lead_name: data.leadName,
              phone: data.phone,
              whatsapp: data.whatsappNumber,
              email: data.email,
              source: data.primaryMode === "whatsapp" ? "WhatsApp" : "Phone Call",
              notes: data.notes,
              primary_communication_mode: data.primaryMode === "whatsapp" ? "WHATSAPP" : "MAIL",
              location: data.location,
              status: "Pending"
            };
            await createEnquiry(newEnq);
            setIsAddModalOpen(false);
            router.refresh();
          } catch (error) {
            console.error("Error adding enquiry:", error);
            alert("Failed to add enquiry.");
          }
        }}
      />
    </div>
  );
}
