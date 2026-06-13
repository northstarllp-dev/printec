"use client";

import React, { useState } from "react";
import { 
  Plus, BarChart3, Globe, Phone, Clock, Search, MoreVertical, 
  TrendingUp, Trash2, Edit3, Eye, Download, SlidersHorizontal,
  ChevronLeft, ChevronRight
} from "lucide-react";
import { useDashboard, Order, PipelineStage } from "@/context/DashboardContext";

interface DashboardViewProps {
  onOpenAddOrder: () => void;
  onOpenEditOrder: (order: Order) => void;
}

// ─────────────────────────────────────────────
// STAGE BADGE CONFIG — directly from Figma SS3
// ─────────────────────────────────────────────
const stageBadge: Record<PipelineStage, { label: string; className: string }> = {
  "Enquired":        { label: "NEW ENQUIRY",    className: "prt-badge prt-badge-new-enquiry" },
  "Site Visit":      { label: "SITE VISIT REQ", className: "prt-badge prt-badge-site-visit" },
  "Quotation":       { label: "QUOTE PENDING",  className: "prt-badge prt-badge-quote-pending" },
  "Design":          { label: "DESIGN STAGE",   className: "prt-badge prt-badge-design" },
  "Production":      { label: "PRODUCTION",     className: "prt-badge prt-badge-production" },
  "Installation":    { label: "INSTALLATION",   className: "prt-badge prt-badge-installation" },
  "Order Completed": { label: "COMPLETED",      className: "prt-badge prt-badge-completed" },
};

const EMPLOYEE_NAMES: Record<string, string> = {
  SK: "Suresh Kumar",
  RM: "Rajesh Mishra",
  AK: "Amit Khan",
  JS: "Jagdish Singh",
  AM: "Ananya Mehta",
};

const ROWS_PER_PAGE = 10;

export const DashboardView: React.FC<DashboardViewProps> = ({ onOpenAddOrder, onOpenEditOrder }) => {
  const { 
    orders, enquiries, customers, 
    setSelectedOrderForWorksheet, setActivePage,
    deleteOrder, searchQuery, setSearchQuery,
    currentUserRole, addNotification
  } = useDashboard();

  const [stageFilter, setStageFilter] = useState<PipelineStage | "All">("All");
  const [sortBy, setSortBy] = useState<"date-desc" | "date-asc" | "name-asc" | "name-desc">("date-desc");
  const [priorityOnly, setPriorityOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    // Simulate data loading to demonstrate skeleton loaders
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const isEmployee = currentUserRole === "Employee";

  // ── Metrics ──────────────────────────────────
  const totalActive = orders.filter(o => o.stage !== "Order Completed").length;
  const websiteLeads = enquiries.filter(e => e.status === "Pending").length;
  const pendingCalls = orders.filter(o => o.stage === "Site Visit").length;

  // ── Filtering & Sorting ───────────────────────
  const filtered = orders.filter(o => {
    if (isEmployee && !o.assignedEmployees.includes("AK")) return false;
    const cust = customers.find(c => c.id === o.customerId);
    const search = searchQuery.toLowerCase();
    const matches = 
      o.id.toLowerCase().includes(search) ||
      o.projectName.toLowerCase().includes(search) ||
      (cust?.name.toLowerCase().includes(search) ?? false);
    const stageOk = stageFilter === "All" || o.stage === stageFilter;
    const priorityOk = !priorityOnly || o.urgent;
    return matches && stageOk && priorityOk;
  }).sort((a, b) => {
    if (sortBy === "date-desc") return new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime();
    if (sortBy === "date-asc")  return new Date(a.dateCreated).getTime() - new Date(b.dateCreated).getTime();
    if (sortBy === "name-asc")  return a.projectName.localeCompare(b.projectName);
    if (sortBy === "name-desc") return b.projectName.localeCompare(a.projectName);
    return 0;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const paginated = filtered.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE);

  const formatDate = (d: string) => {
    try {
      return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(d));
    } catch { return d; }
  };

  const formatINR = (v: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(v);

  const stagesList: (PipelineStage | "All")[] = [
    "All", "Enquired", "Site Visit", "Quotation", "Design", "Production", "Installation", "Order Completed"
  ];

  return (
    <div className="p-6 md:p-8 w-full max-w-[1440px] mx-auto font-sans">
      {/* ── PAGE HEADER ────────────────────────── */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-display-lg text-[var(--color-primary)]">
            {isEmployee ? "My Tasks & Jobs" : "Orders Management"}
          </h1>
          <p className="text-body-md text-[var(--color-on-surface-variant)] mt-1">
            {isEmployee ? "Review your assigned projects and upload site audits" : "Track and process initial project requests"}
          </p>
        </div>
        {!isEmployee && (
          <div className="flex items-center gap-4">
            <button
              onClick={() => addNotification("Export Started", "Downloading CSV...", "success")}
              className="flex items-center gap-2 px-4 py-2 border border-[var(--color-outline)] rounded text-[var(--color-primary)] font-semibold hover:bg-[var(--color-surface-container-low)] transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              <span className="text-body-md">Export CSV</span>
            </button>
            <button
              onClick={onOpenAddOrder}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary-container)] text-white rounded-lg font-semibold hover:opacity-90 active:scale-95 transition-all shadow-md"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span className="text-body-md">Manual Entry</span>
            </button>
          </div>
        )}
      </div>

      {/* ── KPI CARDS (Bento Grid) ──────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        
        {/* Card 1 */}
        <div className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-[var(--radius-lg)] p-6 flex flex-col relative overflow-hidden group hover:shadow-md transition-shadow prt-animate-in">
          <div className="flex justify-between items-start mb-4 relative z-10">
            <h3 className="text-body-md font-semibold text-[var(--color-on-surface-variant)]">Total Active</h3>
            <span className="material-symbols-outlined text-[var(--color-outline)]">query_stats</span>
          </div>
          <div className="relative z-10">
            <p className="text-display-lg text-[var(--color-primary)] font-data-tabular">{String(totalActive).padStart(3, "0")}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="material-symbols-outlined text-[16px] text-[#0f7514]">trending_up</span>
              <span className="text-label-caps text-[#0f7514]">+12% this month</span>
            </div>
          </div>
          <span className="material-symbols-outlined absolute -bottom-4 -right-4 text-[80px] text-[var(--color-surface-container-high)] opacity-50 group-hover:scale-110 transition-transform duration-500">query_stats</span>
        </div>

        {/* Card 2 */}
        <div className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-[var(--radius-lg)] p-6 flex flex-col relative overflow-hidden group hover:shadow-md transition-shadow prt-animate-in" style={{ animationDelay: "0.05s" }}>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <h3 className="text-body-md font-semibold text-[var(--color-on-surface-variant)]">Website Leads</h3>
            <span className="material-symbols-outlined text-[var(--color-outline)]">language</span>
          </div>
          <div className="relative z-10">
            <p className="text-display-lg text-[var(--color-primary)] font-data-tabular">{websiteLeads}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-label-caps text-[var(--color-on-surface-variant)]">Last 7 days</span>
            </div>
          </div>
          <span className="material-symbols-outlined absolute -bottom-4 -right-4 text-[80px] text-[var(--color-surface-container-high)] opacity-50 group-hover:scale-110 transition-transform duration-500">language</span>
        </div>

        {/* Card 3 */}
        <div className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-[var(--radius-lg)] p-6 flex flex-col relative overflow-hidden group hover:shadow-md transition-shadow prt-animate-in" style={{ animationDelay: "0.1s" }}>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <h3 className="text-body-md font-semibold text-[var(--color-on-surface-variant)]">Pending Calls</h3>
            <span className="material-symbols-outlined text-[var(--color-outline)]">phone_in_talk</span>
          </div>
          <div className="relative z-10">
            <p className="text-display-lg text-[var(--color-primary)] font-data-tabular">{String(pendingCalls).padStart(2, "0")}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="material-symbols-outlined text-[16px] text-[var(--color-error)]">priority_high</span>
              <span className="text-label-caps text-[var(--color-error)]">Immediate action req.</span>
            </div>
          </div>
          <span className="material-symbols-outlined absolute -bottom-4 -right-4 text-[80px] text-[var(--color-surface-container-high)] opacity-50 group-hover:scale-110 transition-transform duration-500">phone_in_talk</span>
        </div>

        {/* Card 4 */}
        <div className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-[var(--radius-lg)] p-6 flex flex-col relative overflow-hidden group hover:shadow-md transition-shadow prt-animate-in" style={{ animationDelay: "0.15s" }}>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <h3 className="text-body-md font-semibold text-[var(--color-on-surface-variant)]">Avg. Response</h3>
            <span className="material-symbols-outlined text-[var(--color-outline)]">schedule</span>
          </div>
          <div className="relative z-10">
            <p className="text-display-lg text-[var(--color-primary)] font-data-tabular">2.4h</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="material-symbols-outlined text-[16px] text-[#0f7514]">check_circle</span>
              <span className="text-label-caps text-[#0f7514]">Under target (4h)</span>
            </div>
          </div>
          <span className="material-symbols-outlined absolute -bottom-4 -right-4 text-[80px] text-[var(--color-surface-container-high)] opacity-50 group-hover:scale-110 transition-transform duration-500">schedule</span>
        </div>
      </div>

      {/* ── TABLE CARD ─────────────────────────── */}
      <div className="prt-card" style={{ overflow: "hidden" }}>

        {/* Toolbar */}
        <div className="p-4 border-b border-[var(--color-outline-variant)] flex items-center gap-4 flex-wrap bg-[var(--color-surface-container-lowest)]">
          
          {/* Search */}
          <div className="flex-1 min-w-[200px] relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-on-surface-variant)]" />
            <input
              type="text"
              placeholder="Search by project or customer..."
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2 border border-[var(--color-outline-variant)] rounded bg-[var(--color-surface-container-low)] text-body-md text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)] transition-colors placeholder:text-[var(--color-on-surface-variant)]"
            />
          </div>

          {/* Stage filter */}
          <select
            value={stageFilter}
            onChange={e => { setStageFilter(e.target.value as any); setCurrentPage(1); }}
            className="text-body-md font-semibold text-[var(--color-on-surface-variant)] border border-[var(--color-outline-variant)] rounded py-2 px-3 bg-[var(--color-surface-container-lowest)] cursor-pointer outline-none focus:border-[var(--color-primary)]"
          >
            <option value="All">All Stages</option>
            <option value="Enquired">New Enquiry</option>
            <option value="Site Visit">Site Visit</option>
            <option value="Quotation">Quote Pending</option>
            <option value="Design">Design Stage</option>
            <option value="Production">Production</option>
            <option value="Installation">Installation</option>
            <option value="Order Completed">Completed</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={e => { setSortBy(e.target.value as any); setCurrentPage(1); }}
            className="text-body-md font-semibold text-[var(--color-on-surface-variant)] border border-[var(--color-outline-variant)] rounded py-2 px-3 bg-[var(--color-surface-container-lowest)] cursor-pointer outline-none focus:border-[var(--color-primary)]"
          >
            <option value="date-desc">Newest first</option>
            <option value="date-asc">Oldest first</option>
            <option value="name-asc">Name A–Z</option>
            <option value="name-desc">Name Z–A</option>
          </select>

          {isEmployee && (
            <button
              onClick={() => { setPriorityOnly(p => !p); setCurrentPage(1); }}
              className={`text-body-md font-semibold border rounded py-2 px-3 transition-colors ${
                priorityOnly 
                  ? "bg-[var(--color-error)] border-[var(--color-error)] text-white" 
                  : "bg-[var(--color-surface-container-lowest)] border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-low)]"
              }`}
            >
              {priorityOnly ? "⚡ Urgent only" : "All priority"}
            </button>
          )}
        </div>

        {/* Table */}
        <div style={{ overflowX: "auto" }}>
          <table className="prt-table" style={{ minWidth: 900 }}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Order No.</th>
                <th>Project Name</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Budget</th>
                <th>Assigned Team</th>
                {isEmployee && <th>Priority</th>}
                <th style={{ width: 60 }}></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: Math.min(filtered.length, ROWS_PER_PAGE) || 3 }).map((_, i) => (
                  <tr key={`skeleton-${i}`}>
                    <td colSpan={isEmployee ? 9 : 8} style={{ padding: "20px 16px" }}>
                      <div style={{ height: "16px", background: "rgba(124, 58, 237, 0.08)", borderRadius: "var(--radius-md)", animation: "prt-fade-in 1.5s infinite alternate" }} />
                    </td>
                  </tr>
                ))
              ) : paginated.map((order, idx) => {
                const client = customers.find(c => c.id === order.customerId);
                const badge = stageBadge[order.stage] ?? { label: order.stage, className: "prt-badge prt-badge-enquired" };
                const allAssigned = [
                  ...(order.assignedEmployees || []),
                  ...(order.assignedDesigners || []),
                  ...(order.assignedMarketers || []),
                ].filter((v, i, arr) => arr.indexOf(v) === i).slice(0, 4);

                return (
                  <tr
                    key={order.id}
                    onClick={() => { setSelectedOrderForWorksheet(order); setActivePage("worksheet"); }}
                    style={{ cursor: "pointer", animationDelay: `${idx * 0.05}s` }}
                    className="prt-table-row prt-animate-in"
                  >
                    {/* Date */}
                    <td className="text-[var(--color-on-surface-variant)] text-body-md whitespace-nowrap">
                      {formatDate(order.dateCreated)}
                    </td>

                    {/* Order No. */}
                    <td>
                      <span className="font-data-tabular text-body-md text-[var(--color-on-surface)] bg-[var(--color-surface-container-high)] border border-[var(--color-outline-variant)] rounded px-2 py-1 whitespace-nowrap">
                        {order.id}
                      </span>
                    </td>

                    {/* Project Name */}
                    <td>
                      <div>
                        <div className="text-body-md font-bold text-[var(--color-primary)] leading-tight">
                          {order.projectName}
                          {order.urgent && <span className="ml-2 text-[10px] text-[var(--color-error)] font-bold">⚡ URGENT</span>}
                        </div>
                        <div className="text-label-caps text-[var(--color-on-surface-variant)] mt-1">
                          ID: {order.id.split("-").slice(-2).join("-")}
                        </div>
                      </div>
                    </td>

                    {/* Customer */}
                    <td className="text-body-md text-[var(--color-on-surface-variant)] font-medium">
                      {client?.name ?? "—"}
                    </td>

                    {/* Status Badge */}
                    <td>
                      <div className="flex flex-col gap-1 items-start">
                        <span className={badge.className}>
                          {badge.label}
                        </span>
                        {order.stageStatus && order.stageStatus !== "Normal" && (
                          <span className="prt-badge prt-badge-quote-pending text-[8px]">
                            Awaiting approval
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Budget */}
                    <td className="text-body-md text-[var(--color-on-surface)] font-data-tabular font-bold whitespace-nowrap">
                      {formatINR(order.budget)}
                    </td>

                    {/* Assigned Team — Avatar Group */}
                    <td onClick={e => e.stopPropagation()}>
                      {allAssigned.length === 0 ? (
                        <span className="text-body-md text-[var(--color-on-surface-variant)] italic">Unassigned</span>
                      ) : (
                        <div className="flex items-center">
                          {allAssigned.map((initials, idx) => (
                            <div
                              key={initials}
                              title={EMPLOYEE_NAMES[initials] ?? initials}
                              className={`w-7 h-7 rounded-full bg-[var(--color-primary-container)] text-white text-[10px] font-bold flex items-center justify-center border-2 border-[var(--color-surface-container-lowest)] cursor-help relative ${idx === 0 ? "" : "-ml-2"}`}
                              style={{ zIndex: allAssigned.length - idx }}
                            >
                              {initials}
                            </div>
                          ))}
                          {allAssigned.length >= 3 && (
                            <div className="w-7 h-7 rounded-full bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)] text-[10px] font-bold flex items-center justify-center border-2 border-[var(--color-surface-container-lowest)] -ml-2">
                              +{allAssigned.length - 3}
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Priority (for employee) */}
                    {isEmployee && (
                      <td>
                        {order.urgent ? (
                          <span className="prt-badge prt-badge-urgent">Urgent</span>
                        ) : (
                          <span className="text-body-md text-[var(--color-on-surface-variant)]">Normal</span>
                        )}
                      </td>
                    )}

                    {/* Actions Menu */}
                    <td
                      style={{ textAlign: "right", position: "relative" }}
                      onClick={e => e.stopPropagation()}
                    >
                      <button
                        onClick={() => setActiveMenuId(activeMenuId === order.id ? null : order.id)}
                        style={{ width: 28, height: 28, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "1px solid transparent", cursor: "pointer", color: "var(--text-muted)", transition: "all 0.15s" }}
                        onMouseEnter={e => { e.currentTarget.style.background = "var(--surface-hover)"; e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-primary)"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.borderColor = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; }}
                        title="Actions"
                      >
                        <MoreVertical size={14} />
                      </button>

                      {activeMenuId === order.id && (
                        <>
                          <div style={{ position: "fixed", inset: 0, zIndex: 39 }} onClick={() => setActiveMenuId(null)} />
                          <div className="prt-animate-in" style={{
                            position: "absolute", right: 0, top: "calc(100% + 4px)", width: 172,
                            background: "white", border: "1px solid var(--border)", borderRadius: 10,
                            boxShadow: "var(--shadow-pop)", zIndex: 40, padding: 4, overflow: "hidden"
                          }}>
                            {[
                              { icon: Eye, label: "Open Worksheet", color: "var(--text-primary)", action: () => { setSelectedOrderForWorksheet(order); setActivePage("worksheet"); setActiveMenuId(null); }},
                              { icon: Edit3, label: "Edit Order", color: "var(--text-primary)", action: () => { onOpenEditOrder(order); setActiveMenuId(null); }},
                            ].map(item => (
                              <button
                                key={item.label}
                                onClick={item.action}
                                style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: 7, fontSize: 13, fontWeight: 600, color: item.color, background: "none", border: "none", cursor: "pointer", transition: "background 0.1s", textAlign: "left" }}
                                onMouseEnter={e => (e.currentTarget.style.background = "var(--surface-hover)")}
                                onMouseLeave={e => (e.currentTarget.style.background = "none")}
                              >
                                <item.icon size={13} />
                                {item.label}
                              </button>
                            ))}
                            {!isEmployee && (
                              <>
                                <div style={{ height: 1, background: "var(--background)", margin: "4px 0" }} />
                                <button
                                  onClick={() => { if (window.confirm("Delete this order?")) { deleteOrder(order.id); } setActiveMenuId(null); }}
                                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: 7, fontSize: 13, fontWeight: 600, color: "var(--error-text)", background: "none", border: "none", cursor: "pointer", transition: "background 0.1s", textAlign: "left" }}
                                  onMouseEnter={e => (e.currentTarget.style.background = "var(--error-bg)")}
                                  onMouseLeave={e => (e.currentTarget.style.background = "none")}
                                >
                                  <Trash2 size={13} />
                                  Delete Order
                                </button>
                              </>
                            )}
                          </div>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}

              {paginated.length === 0 && (
                <tr>
                  <td colSpan={isEmployee ? 9 : 8} style={{ padding: "48px 16px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
                    No orders match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div style={{ padding: "10px 16px", borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--surface-container-low)" }}>
          <span style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 500 }}>
            Showing {Math.min((currentPage - 1) * ROWS_PER_PAGE + 1, filtered.length)}–{Math.min(currentPage * ROWS_PER_PAGE, filtered.length)} of {filtered.length} orders
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid var(--border)", background: currentPage === 1 ? "var(--surface-container-low)" : "var(--surface-container-lowest)", display: "flex", alignItems: "center", justifyContent: "center", cursor: currentPage === 1 ? "not-allowed" : "pointer", color: currentPage === 1 ? "var(--text-muted)" : "var(--text-secondary)" }}
            >
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => 
              p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1
            ).reduce((acc, p, idx, arr) => {
              if (idx > 0 && p - arr[idx - 1] > 1) acc.push(-1);
              acc.push(p);
              return acc;
            }, [] as number[]).map((p, i) => 
              p === -1 ? (
                <span key={`ellipsis-${i}`} style={{ fontSize: 12, color: "var(--text-muted)", padding: "0 4px" }}>…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  style={{
                    width: 28, height: 28, borderRadius: 6, border: "1px solid",
                    borderColor: p === currentPage ? "var(--primary-900)" : "var(--border)",
                    background: p === currentPage ? "var(--primary-900)" : "var(--surface-container-lowest)",
                    color: p === currentPage ? "var(--text-inverted)" : "var(--text-secondary)",
                    fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit"
                  }}
                >
                  {p}
                </button>
              )
            )}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid var(--border)", background: currentPage === totalPages ? "var(--surface-container-low)" : "var(--surface-container-lowest)", display: "flex", alignItems: "center", justifyContent: "center", cursor: currentPage === totalPages ? "not-allowed" : "pointer", color: currentPage === totalPages ? "var(--text-muted)" : "var(--text-secondary)" }}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .prt-table-row:hover td { background: #F8FAFC; }
        @media (max-width: 768px) {
          .prt-card [style*="grid-template-columns: repeat(4"] { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </div>
  );
};
