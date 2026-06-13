"use client";

import React, { useState } from "react";
import { Search, Filter, Plus, MoreVertical, Users, Star, Clock, AlertCircle } from "lucide-react";

const generateMockEmployees = () => {
  const roles = ["Senior Lead Fabricator", "Installation Supervisor", "Design Artist", "Structural Engineer", "Quality Inspector", "Project Coordinator"];
  const employees = [];
  
  for (let i = 1; i <= 128; i++) {
    employees.push({
      id: `EMP-${String(i).padStart(4, "0")}`,
      name: `Employee ${i}`,
      role: roles[i % roles.length],
      phone: `+91 ${String(Math.floor(Math.random() * 9000000000) + 1000000000).slice(0, 10)}`,
      status: ["Active", "On Site", "Off Duty"][i % 3],
      rating: (Math.random() * 2 + 3.5).toFixed(1),
      workload: Math.floor(Math.random() * 8) + 1,
    });
  }
  return employees;
};

const mockEmployees = generateMockEmployees();

const getStatusColor = (status: string) => {
  const colors: Record<string, { bg: string; text: string; label: string }> = {
    "Active": { bg: "#dcfce7", text: "#16a34a", label: "ACTIVE" },
    "On Site": { bg: "#dbeafe", text: "#0284c7", label: "ON SITE" },
    "Off Duty": { bg: "#fee2e2", text: "#dc2626", label: "OFF DUTY" },
  };
  return colors[status] || colors["Active"];
};

export function EmployeesViewNew() {
  const [searchTerm, setSearchTerm] = useState("");
  const [employees] = useState(mockEmployees);

  const stats = [
    {
      label: "TOTAL EMPLOYEES",
      value: "42",
      change: "+3 this quarter",
      icon: Users,
      color: "#3b82f6",
    },
    {
      label: "ACTIVE NOW",
      value: "28",
      change: "67% of workforce",
      icon: AlertCircle,
      color: "#22c55e",
    },
    {
      label: "AVG. RATING",
      value: "4.6/5",
      change: "Above target (4.5)",
      icon: Star,
      color: "#f59e0b",
    },
    {
      label: "AVG. WORKLOAD",
      value: "4.2",
      change: "Projects per employee",
      icon: Clock,
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
              Employees Directory
            </h1>
            <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
              Monitor team members, assigned workloads, and performance ratings
            </p>
          </div>
          <button
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
            <Plus size={16} /> Add Employee
          </button>
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
              placeholder="Search by employee name, role or ID..."
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
                <th style={{ padding: "14px 20px", textAlign: "left", fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>EMPLOYEE ID</th>
                <th style={{ padding: "14px 20px", textAlign: "left", fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>NAME</th>
                <th style={{ padding: "14px 20px", textAlign: "left", fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>ROLE</th>
                <th style={{ padding: "14px 20px", textAlign: "left", fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>PHONE</th>
                <th style={{ padding: "14px 20px", textAlign: "center", fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>STATUS</th>
                <th style={{ padding: "14px 20px", textAlign: "center", fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>RATING</th>
                <th style={{ padding: "14px 20px", textAlign: "center", fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>WORKLOAD</th>
                <th style={{ padding: "14px 20px", textAlign: "center", fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => {
                const statusColor = getStatusColor(emp.status);
                return (
                  <tr key={emp.id} style={{ borderBottom: "1px solid #e2e8f0", transition: "background 0.2s" }} onMouseEnter={(e) => { e.currentTarget.style.background = "#f8fafc"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                    <td style={{ padding: "16px 20px", fontSize: "12px", color: "#64748b", fontWeight: "600" }}>{emp.id}</td>
                    <td style={{ padding: "16px 20px", fontSize: "13px", fontWeight: "600", color: "#0f172a" }}>{emp.name}</td>
                    <td style={{ padding: "16px 20px", fontSize: "13px", color: "#64748b" }}>{emp.role}</td>
                    <td style={{ padding: "16px 20px", fontSize: "13px", color: "#0f172a" }}>{emp.phone}</td>
                    <td style={{ padding: "16px 20px", textAlign: "center" }}>
                      <span style={{ display: "inline-block", padding: "4px 12px", background: statusColor.bg, color: statusColor.text, borderRadius: "6px", fontSize: "11px", fontWeight: "700" }}>{statusColor.label}</span>
                    </td>
                    <td style={{ padding: "16px 20px", textAlign: "center", fontSize: "13px", fontWeight: "600", color: "#f59e0b" }}>⭐ {emp.rating}</td>
                    <td style={{ padding: "16px 20px", textAlign: "center", fontSize: "13px", fontWeight: "600", color: "#0f172a" }}>{emp.workload}</td>
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
