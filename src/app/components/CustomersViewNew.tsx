"use client";

import React, { useState } from "react";
import { Search, Filter, Plus, MoreVertical, MapPin, Mail, Phone } from "lucide-react";

// Using real data from Server Components

const getStatusColor = (status: string | undefined) => {
  const colors: Record<string, { bg: string; text: string; label: string }> = {
    "Active": { bg: "#dcfce7", text: "#16a34a", label: "ACTIVE" },
    "Inactive": { bg: "#fee2e2", text: "#dc2626", label: "INACTIVE" },
    "Pending": { bg: "#fef3c7", text: "#ea580c", label: "PENDING" },
  };
  return colors[status || "Active"] || colors["Active"];
};

export function CustomersViewNew({ initialCustomers }: { initialCustomers: any[] }) {
  const [customers, setCustomers] = useState(initialCustomers);
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedCustomerId, setCopiedCustomerId] = useState<string | null>(null);

  const handleCopyLink = async (customerId: string) => {
    try {
      const res = await fetch(`/api/portal-token?customer_id=${customerId}`);
      const data = await res.json();
      if (data.url) {
        await navigator.clipboard.writeText(data.url);
        setCopiedCustomerId(customerId);
        setTimeout(() => setCopiedCustomerId(null), 2000);
      }
    } catch (err) {
      console.error("Error fetching portal token:", err);
      alert("Failed to retrieve customer portal link");
    }
  };

  const totalCustomers = customers.length;
  const activeCustomers = customers.filter(c => c.status === "Active").length;
  const pendingCustomers = customers.filter(c => c.status === "Pending").length;
  const activePercentage = totalCustomers > 0 ? Math.round((activeCustomers / totalCustomers) * 100) : 0;

  const stats = [
    {
      label: "TOTAL CUSTOMERS",
      value: totalCustomers.toString(),
      change: "All time",
      icon: MapPin,
      color: "#018F10",
    },
    {
      label: "ACTIVE ACCOUNTS",
      value: activeCustomers.toString(),
      change: `${activePercentage}% of total`,
      icon: Phone,
      color: "#3b82f6",
    },
    {
      label: "PENDING FOLLOW-UP",
      value: pendingCustomers.toString(),
      change: "Requires action",
      icon: Mail,
      color: "#f59e0b",
    },
    {
      label: "YTD REVENUE",
      value: "₹4.2M",
      change: "+22% from last year",
      icon: MapPin,
      color: "#06b6d4",
    },
  ];

  return (
    <div style={{ padding: "32px", background: "#f8fafc", minHeight: "100vh" }}>
      {/* Header Section */}
      <div style={{ marginBottom: "32px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a", margin: "0 0 8px" }}>
              Customers
            </h1>
            <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
              Browse and manage customer database entries and contact information
            </p>
          </div>

        </div>

        {/* Stats Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "16px" }}>
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
              placeholder="Search by customer name, phone or email..."
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
                e.currentTarget.style.borderColor = "#94a3b8";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(148, 163, 184, 0.1)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#e2e8f0";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>
          <button
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
          >
            <Filter size={16} /> Filters
          </button>
        </div>

        {/* Table with Scrollbar */}
        <div style={{ overflowY: "auto", maxHeight: "600px", overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ position: "sticky", top: 0, background: "#f8fafc", zIndex: 10 }}>
              <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                <th style={{ padding: "14px 20px", textAlign: "left", fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>CUSTOMER ID</th>
                <th style={{ padding: "14px 20px", textAlign: "left", fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>COMPANY NAME</th>
                <th style={{ padding: "14px 20px", textAlign: "left", fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>PHONE</th>
                <th style={{ padding: "14px 20px", textAlign: "left", fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>EMAIL</th>
                <th style={{ padding: "14px 20px", textAlign: "left", fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>CITY</th>
                <th style={{ padding: "14px 20px", textAlign: "center", fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>STATUS</th>
                <th style={{ padding: "14px 20px", textAlign: "center", fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>PORTAL LINK</th>
                <th style={{ padding: "14px 20px", textAlign: "center", fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((cust) => {
                const statusColor = getStatusColor(cust.status);
                return (
                  <tr key={cust.id} style={{ borderBottom: "1px solid #e2e8f0", transition: "background 0.2s" }} onMouseEnter={(e) => { e.currentTarget.style.background = "#f8fafc"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                    <td style={{ padding: "16px 20px", fontSize: "12px", color: "#64748b", fontWeight: "600" }}>{cust.id}</td>
                    <td style={{ padding: "16px 20px", fontSize: "13px", fontWeight: "600", color: "#0f172a" }}>{cust.name}</td>
                    <td style={{ padding: "16px 20px", fontSize: "13px", color: "#0f172a" }}>{cust.phone}</td>
                    <td style={{ padding: "16px 20px", fontSize: "13px", color: "#64748b" }}>{cust.email}</td>
                    <td style={{ padding: "16px 20px", fontSize: "13px", color: "#0f172a" }}>{cust.city}</td>
                    <td style={{ padding: "16px 20px", textAlign: "center" }}>
                      <span style={{ display: "inline-block", padding: "4px 12px", background: statusColor.bg, color: statusColor.text, borderRadius: "6px", fontSize: "11px", fontWeight: "700" }}>{statusColor.label}</span>
                    </td>
                    <td style={{ padding: "16px 20px", textAlign: "center" }}>
                      <button
                        onClick={() => handleCopyLink(cust.id)}
                        style={{
                          padding: "6px 12px",
                          background: copiedCustomerId === cust.id ? "#dcfce7" : "#003568",
                          border: "none",
                          borderRadius: "6px",
                          fontSize: "11px",
                          fontWeight: "600",
                          color: copiedCustomerId === cust.id ? "#16a34a" : "white",
                          cursor: "pointer",
                          transition: "all 0.2s"
                        }}
                      >
                        {copiedCustomerId === cust.id ? "Copied!" : "Copy Magic Link"}
                      </button>
                    </td>
                    <td style={{ padding: "16px 20px", textAlign: "center" }}>
                      <button style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: "4px 8px", transition: "all 0.2s" }} onMouseEnter={(e) => { e.currentTarget.style.color = "#475569"; }} onMouseLeave={(e) => { e.currentTarget.style.color = "#94a3b8"; }}>
                        <MoreVertical size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
