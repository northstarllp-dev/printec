"use client";

import React, { useState } from "react";
import { Search, Filter, Plus, AlertCircle, CheckCircle, Clock, Phone } from "lucide-react";
import { useDashboard } from "@/context/DashboardContext";
import { AddEnquiryModal, EnquiryFormData } from "./AddEnquiryModal";
import { ConvertEnquiryModal } from "./ConvertEnquiryModal";

const getStatusColor = (status: string) => {
  const colors: Record<string, { bg: string; text: string; label: string }> = {
    "Pending": { bg: "#e0e7ff", text: "#6366f1", label: "PENDING" },
    "Contacted": { bg: "#dbeafe", text: "#0284c7", label: "CONTACTED" },
    "Quoted": { bg: "#fef3c7", text: "#ea580c", label: "QUOTED" },
    "Converted": { bg: "#dcfce7", text: "#16a34a", label: "CONVERTED" },
  };
  return colors[status] || colors["Pending"];
};

export function EnquiriesView() {
  const { enquiries, convertEnquiryToOrder, addEnquiry } = useDashboard()!;
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState<{id: string, leadName: string} | null>(null);

  const handleAddEnquiry = async (data: EnquiryFormData) => {
    try {
      await addEnquiry({
        leadName: data.leadName,
        phone: data.phone,
        whatsapp: data.whatsappNumber,
        email: data.email,
        source: data.primaryMode === "whatsapp" ? "WhatsApp" : "Phone Call",
        notes: data.notes,
        primaryCommunicationMode: data.primaryMode === "whatsapp" ? "WHATSAPP" : "MAIL",
        location: data.location
      });
      setIsAddModalOpen(false);
    } catch (error) {
      console.error("Error adding enquiry:", error);
      alert("Failed to add enquiry. Check console.");
    }
  };

  const totalEnquiries = enquiries.length;
  const pendingResponses = enquiries.filter(e => e.status === "Pending").length;
  const convertedCount = enquiries.filter(e => e.status === "Converted").length;
  const conversionRate = totalEnquiries > 0 ? Math.round((convertedCount / totalEnquiries) * 100) : 0;

  const stats = [
    {
      label: "TOTAL ENQUIRIES",
      value: totalEnquiries.toString(),
      change: "All time",
      icon: AlertCircle,
      color: "#3b82f6",
    },
    {
      label: "PENDING RESPONSES",
      value: pendingResponses.toString(),
      change: "Requires action",
      icon: Clock,
      color: "#f59e0b",
    },
    {
      label: "CONVERTED",
      value: convertedCount.toString(),
      change: "Total successful orders",
      icon: CheckCircle,
      color: "#06b6d4",
    },
    {
      label: "CONVERSION RATE",
      value: `${conversionRate}%`,
      change: "Based on all enquiries",
      icon: CheckCircle,
      color: "#018F10",
    },
  ];

  return (
    <div style={{ padding: "32px", background: "#f8fafc", minHeight: "100vh" }}>
      {/* Header Section */}
      <div style={{ marginBottom: "32px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a", margin: "0 0 8px" }}>
              Enquiries Management
            </h1>
            <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
              Track and manage incoming customer enquiries and leads
            </p>
          </div>
          <button
            style={{
              padding: "10px 16px",
              background: "#018F10",
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
              e.currentTarget.style.background = "#01730c";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#018F10";
            }}
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus size={16} /> New Enquiry
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
      <div style={{ background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "visible" }}>
        {/* Search & Filter Bar */}
        <div style={{ padding: "20px", borderBottom: "1px solid #e2e8f0", display: "flex", gap: "12px", alignItems: "center" }}>
          <div style={{ flex: 1, position: "relative" }}>
            <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
            <input
              type="text"
              placeholder="Search by lead name or phone..."
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
        <div style={{ overflow: "visible" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ position: "sticky", top: 0, background: "#f8fafc", zIndex: 10 }}>
              <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                <th style={{ padding: "14px 20px", textAlign: "left", fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>DATE</th>
                <th style={{ padding: "14px 20px", textAlign: "left", fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>LEAD NAME</th>
                <th style={{ padding: "14px 20px", textAlign: "left", fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>PHONE</th>
                <th style={{ padding: "14px 20px", textAlign: "left", fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>SOURCE</th>
                <th style={{ padding: "14px 20px", textAlign: "right", fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {enquiries.filter(e => e.leadName.toLowerCase().includes(searchTerm.toLowerCase()) || e.phone.includes(searchTerm)).map((enq) => {
                const statusColor = getStatusColor(enq.status);
                return (
                  <tr key={enq.id} style={{ borderBottom: "1px solid #e2e8f0", transition: "background 0.2s" }} onMouseEnter={(e) => { e.currentTarget.style.background = "#f8fafc"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                    <td style={{ padding: "16px 20px", fontSize: "13px", color: "#64748b", fontWeight: "500" }}>{new Date(enq.dateReceived).toLocaleDateString()}</td>
                    <td style={{ padding: "16px 20px", fontSize: "13px", fontWeight: "600", color: "#0f172a" }}>{enq.leadName}</td>
                    <td style={{ padding: "16px 20px", fontSize: "13px", color: "#0f172a" }}>{enq.phone}</td>
                    <td style={{ padding: "16px 20px", fontSize: "12px", color: "#64748b" }}>{enq.source}</td>
                    <td style={{ padding: "16px 20px", textAlign: "right" }}>
                      <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                        <button 
                          onClick={() => alert(`Sending Welcome Message via ${enq.primaryCommunicationMode === 'WHATSAPP' ? 'WhatsApp' : 'Email'} to ${enq.leadName}`)}
                          style={{ padding: "6px 12px", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "12px", fontWeight: "600", color: "#475569", cursor: "pointer", transition: "all 0.2s" }}
                          onMouseEnter={(e) => e.currentTarget.style.background = "#e2e8f0"}
                          onMouseLeave={(e) => e.currentTarget.style.background = "#f1f5f9"}
                        >
                          Send Welcome Msg
                        </button>
                        {enq.status !== "Converted" ? (
                          <button 
                            onClick={() => {
                              setSelectedEnquiry({ id: enq.id, leadName: enq.leadName });
                              setConvertModalOpen(true);
                            }}
                            style={{ padding: "6px 12px", background: "#018F10", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: "600", color: "white", cursor: "pointer", transition: "all 0.2s" }}
                            onMouseEnter={(e) => e.currentTarget.style.background = "#01730c"}
                            onMouseLeave={(e) => e.currentTarget.style.background = "#018F10"}
                          >
                            Convert to Order
                          </button>
                        ) : (
                          <span style={{ fontSize: "12px", fontWeight: "600", color: "#16a34a", padding: "6px 12px" }}>Converted</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {enquiries.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: "40px 20px", textAlign: "center", color: "#64748b" }}>
                    No enquiries found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <AddEnquiryModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddEnquiry}
      />

      {selectedEnquiry && (
        <ConvertEnquiryModal
          isOpen={convertModalOpen}
          onClose={() => {
            setConvertModalOpen(false);
            setSelectedEnquiry(null);
          }}
          defaultProjectName={`New Project for ${selectedEnquiry.leadName}`}
          onSubmit={async (projectName, budget) => {
            await convertEnquiryToOrder(selectedEnquiry.id, [], projectName, budget);
            setConvertModalOpen(false);
            setSelectedEnquiry(null);
          }}
        />
      )}
    </div>
  );
}
