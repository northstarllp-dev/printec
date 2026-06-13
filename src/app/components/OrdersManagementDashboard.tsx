"use client";

import React, { useState } from "react";
import { 
  Download, 
  Plus, 
  Search, 
  Filter,
  ChevronDown,
  MoreVertical,
  TrendingUp,
  Clock,
  AlertCircle,
  UserPlus,
  Eye,
  Trash2
} from "lucide-react";
import { useDashboard } from "@/context/DashboardContext";

const getStatusColor = (status: string) => {
  const colors: Record<string, { bg: string; text: string; label: string }> = {
    "Enquired": { bg: "#e0e7ff", text: "#6366f1", label: "ENQUIRED" },
    "Site Visit": { bg: "#e0e7ff", text: "#6366f1", label: "SITE VISIT" },
    "Quotation": { bg: "#fef3c7", text: "#ea580c", label: "QUOTATION" },
    "Design": { bg: "#f3e8ff", text: "#a855f7", label: "DESIGN" },
    "Production": { bg: "#dbeafe", text: "#0284c7", label: "PRODUCTION" },
    "Installation": { bg: "#dbeafe", text: "#0284c7", label: "INSTALLATION" },
    "Order Completed": { bg: "#dcfce7", text: "#16a34a", label: "COMPLETED" },
  };
  return colors[status] || colors["Enquired"];
};

export function OrdersManagementDashboard({ onOpenAddOrder }: { onOpenAddOrder?: () => void }) {
  const [searchTerm, setSearchTerm] = useState("");
  const { orders, customers, addNotification, currentUserRole, assignEmployeesToOrder, setSelectedOrderForWorksheet, deleteOrder } = useDashboard();
  
  // State for staff assignment popover
  const [assigningOrderId, setAssigningOrderId] = useState<string | null>(null);
  
  // State for options dropdown
  const [optionsOrderId, setOptionsOrderId] = useState<string | null>(null);

  const stats = [
    {
      label: "TOTAL ACTIVE",
      value: orders.length.toString(),
      change: "Current orders in pipeline",
      icon: TrendingUp,
      color: "#22c55e",
    },
    {
      label: "WEBSITE LEADS",
      value: "42",
      change: "Last 7 days",
      icon: TrendingUp,
      color: "#3b82f6",
    },
    {
      label: "PENDING CALLS",
      value: "08",
      change: "Immediate action req.",
      icon: AlertCircle,
      color: "#f59e0b",
    },
    {
      label: "AVG. RESPONSE",
      value: "2.4h",
      change: "Under target (4h)",
      icon: Clock,
      color: "#06b6d4",
    },
  ];

  const handleExportCSV = () => {
    addNotification("Export Started", "Downloading orders.csv...", "success");
  };

  const filteredOrders = orders.filter(order => 
    order.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ padding: "32px", background: "#f8fafc", minHeight: "100vh" }}>
      {/* Header Section */}
      <div style={{ marginBottom: "32px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a", margin: "0 0 8px" }}>
              Orders Management
            </h1>
            <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
              Track and process initial project requests
            </p>
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              onClick={handleExportCSV}
              style={{
                padding: "10px 16px",
                background: "#f1f5f9",
                border: "1px solid #cbd5e1",
                borderRadius: "8px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "13px",
                fontWeight: "600",
                color: "#475569",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#e2e8f0";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#f1f5f9";
              }}
            >
              <Download size={16} /> Export CSV
            </button>
            <button
              onClick={onOpenAddOrder}
              style={{
                padding: "10px 16px",
                background: "#22c55e",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "13px",
                fontWeight: "600",
                color: "white",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#16a34a";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#22c55e";
              }}
            >
              <Plus size={16} /> Manual Entry
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div
                key={idx}
                style={{
                  background: "white",
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px",
                  padding: "20px",
                  transition: "all 0.3s",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                  <span style={{ fontSize: "11px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {stat.label}
                  </span>
                  <div style={{ width: "32px", height: "32px", background: `${stat.color}15`, borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon size={16} style={{ color: stat.color }} />
                  </div>
                </div>
                <div style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a", marginBottom: "8px" }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: "12px", color: "#64748b" }}>
                  {stat.change}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Table Section */}
      <div style={{ background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
        {/* Search & Filter Bar */}
        <div style={{ padding: "20px", borderBottom: "1px solid #e2e8f0", display: "flex", gap: "12px", alignItems: "center" }}>
          <div style={{ flex: 1, position: "relative" }}>
            <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
            <input
              type="text"
              placeholder="Search by project or customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px 10px 36px",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                fontSize: "13px",
                fontFamily: "inherit",
                transition: "all 0.2s",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#3b82f6";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
                e.currentTarget.style.outline = "none";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#e2e8f0";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>
          <button style={{ padding: "10px 16px", background: "white", border: "1px solid #e2e8f0", borderRadius: "8px", display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: "500", color: "#475569", cursor: "pointer" }}>
            <Filter size={16} /> All Statuses <ChevronDown size={14} />
          </button>
        </div>

        {/* Table View */}
        <div style={{ overflowY: "auto", maxHeight: "600px", overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ position: "sticky", top: 0, background: "#f8fafc", zIndex: 10 }}>
              <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                <th style={{ padding: "14px 20px", textAlign: "left", fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  DATE
                </th>
                <th style={{ padding: "14px 20px", textAlign: "left", fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  PROJECT NAME
                </th>
                <th style={{ padding: "14px 20px", textAlign: "left", fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  CUSTOMER
                </th>
                <th style={{ padding: "14px 20px", textAlign: "center", fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  STATUS
                </th>
                <th style={{ padding: "14px 20px", textAlign: "left", fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  TEAM
                </th>
                <th style={{ padding: "14px 20px", textAlign: "center", fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order, idx) => {
                const statusColor = getStatusColor(order.stage);
                const customerName = customers.find(c => c.id === order.customerId)?.name || "Unknown";
                const dateStr = new Date(order.dateCreated).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
                
                return (
                  <tr
                    key={order.id}
                    style={{
                      borderBottom: "1px solid #e2e8f0",
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#f8fafc";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <td style={{ padding: "16px 20px", fontSize: "13px", color: "#64748b", fontWeight: "500" }}>
                      {dateStr}
                    </td>
                    <td style={{ padding: "16px 20px" }}>
                      <div style={{ fontSize: "13px", fontWeight: "600", color: "#0f172a" }}>
                        {order.projectName}
                      </div>
                      <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>
                        ID: {order.id}
                      </div>
                    </td>
                    <td style={{ padding: "16px 20px", fontSize: "13px", color: "#0f172a", fontWeight: "500" }}>
                      {customerName}
                    </td>
                    <td style={{ padding: "16px 20px", textAlign: "center" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "4px 12px",
                          background: statusColor.bg,
                          color: statusColor.text,
                          borderRadius: "6px",
                          fontSize: "11px",
                          fontWeight: "700",
                        }}
                      >
                        {statusColor.label}
                      </span>
                    </td>
                    <td style={{ padding: "16px 20px" }}>
                      <div className="flex items-center gap-1 relative">
                        {order.assignedEmployees && order.assignedEmployees.map((emp, i) => (
                          <div
                            key={i}
                            title={emp}
                            className="w-7 h-7 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center text-[10px] font-bold border-2 border-white cursor-pointer"
                            style={{ marginLeft: i > 0 ? "-8px" : "0" }}
                          >
                            {emp.substring(0, 2).toUpperCase()}
                          </div>
                        ))}
                        {(!order.assignedEmployees || order.assignedEmployees.length === 0) && (
                          <span className="text-xs text-slate-400 italic">Unassigned</span>
                        )}
                        {currentUserRole === "Admin" && (
                          <div className="relative">
                            <button
                              onClick={() => setAssigningOrderId(assigningOrderId === order.id ? null : order.id)}
                              className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-[10px] font-bold border-2 border-white cursor-pointer transition-colors"
                              style={{ marginLeft: order.assignedEmployees && order.assignedEmployees.length > 0 ? "-8px" : "8px" }}
                              title="Assign Staff"
                            >
                              <UserPlus size={12} />
                            </button>
                            {/* Simple Staff Selection Popover */}
                            {assigningOrderId === order.id && (
                              <div className="absolute left-0 mt-2 p-2 bg-white border border-slate-200 rounded-lg shadow-lg z-50 min-w-[150px]">
                                <div className="text-xs font-bold text-slate-500 mb-2 px-1">Assign Staff</div>
                                {["SK", "RM", "AK", "AM"].map(staff => {
                                  const isAssigned = order.assignedEmployees?.includes(staff);
                                  return (
                                    <label key={staff} className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded cursor-pointer">
                                      <input 
                                        type="checkbox" 
                                        checked={isAssigned || false}
                                        onChange={(e) => {
                                          let current = order.assignedEmployees || [];
                                          if (e.target.checked) current = [...current, staff];
                                          else current = current.filter(x => x !== staff);
                                          assignEmployeesToOrder(order.id, current);
                                        }}
                                      />
                                      <span className="text-sm font-medium">{staff}</span>
                                    </label>
                                  );
                                })}
                                <div className="mt-2 text-right">
                                  <button onClick={() => setAssigningOrderId(null)} className="text-xs text-[var(--color-primary)] font-bold cursor-pointer hover:underline">Done</button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: "16px 20px", textAlign: "center", position: "relative" }}>
                      <button
                        onClick={() => setOptionsOrderId(optionsOrderId === order.id ? null : order.id)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "#94a3b8",
                          padding: "4px 8px",
                          transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = "#475569";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = "#94a3b8";
                        }}
                      >
                        <MoreVertical size={16} />
                      </button>
                      
                      {optionsOrderId === order.id && (
                        <div className="absolute right-8 top-10 bg-white border border-slate-200 rounded-lg shadow-lg z-50 min-w-[160px] py-1 text-left">
                          <button
                            onClick={() => {
                              setSelectedOrderForWorksheet(order);
                              setOptionsOrderId(null);
                            }}
                            className="w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                          >
                            <Eye size={14} className="text-slate-400" /> View Order
                          </button>
                          
                          {currentUserRole === "Admin" && (
                            <button
                              onClick={() => {
                                if (window.confirm("Are you sure you want to delete this order?")) {
                                  deleteOrder(order.id);
                                }
                                setOptionsOrderId(null);
                              }}
                              className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors border-t border-slate-100"
                            >
                              <Trash2 size={14} className="text-red-400" /> Delete Order
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: "40px 20px", textAlign: "center", color: "#64748b" }}>
                    No orders found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
