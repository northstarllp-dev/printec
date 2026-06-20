import React, { useState, useEffect } from "react";
import { X, Users, CheckCircle2, ChevronRight, User } from "lucide-react";
import { fetchEmployeeStats, assignTeamToOrder } from "@/features/orders/actions/orderActions";

interface AssignTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  onSuccess: () => void;
}

export function AssignTeamModal({ isOpen, onClose, orderId, onSuccess }: AssignTeamModalProps) {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [activeTab, setActiveTab] = useState<"siteVisitor" | "designer" | "marketer">("siteVisitor");

  const [siteVisitor, setSiteVisitor] = useState("");
  const [designer, setDesigner] = useState("");
  const [marketer, setMarketer] = useState("");

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetchEmployeeStats()
        .then(data => {
          setEmployees(data);
          setLoading(false);
        })
        .catch(err => {
          console.error("Failed to fetch employee stats", err);
          setLoading(false);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    try {
      setSaving(true);
      await assignTeamToOrder(orderId, { siteVisitor, designer, marketer });
      setSaving(false);
      onSuccess();
    } catch (err) {
      console.error(err);
      setSaving(false);
      alert("Failed to assign team.");
    }
  };

  const tabs = [
    { id: "siteVisitor", label: "Site Visitor", role: "Site Visitor" },
    { id: "designer", label: "Designer", role: "Designer" },
    { id: "marketer", label: "Marketer", role: "Marketer" },
  ];

  const filteredEmployees = employees.filter(emp => emp.staff_role === tabs.find(t => t.id === activeTab)?.role);
  
  const getSelectedForTab = (tabId: string) => {
    if (tabId === "siteVisitor") return siteVisitor;
    if (tabId === "designer") return designer;
    return marketer;
  };

  const setSelectedForTab = (tabId: string, val: string) => {
    if (tabId === "siteVisitor") setSiteVisitor(val);
    else if (tabId === "designer") setDesigner(val);
    else setMarketer(val);
  };

  return (
    <div style={{
      position: "fixed",
      top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(15, 23, 42, 0.4)",
      backdropFilter: "blur(4px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
      padding: "20px"
    }}>
      <div style={{
        background: "white",
        borderRadius: "20px",
        width: "100%",
        maxWidth: "550px",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        display: "flex",
        flexDirection: "column",
        maxHeight: "90vh",
        overflow: "hidden",
        animation: "slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
      }}>
        {/* Header */}
        <div style={{
          padding: "24px",
          borderBottom: "1px solid #f1f5f9",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "#ffffff"
        }}>
          <div>
            <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: "10px", letterSpacing: "-0.02em" }}>
              <div style={{ background: "#eff6ff", padding: "8px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Users size={20} color="#3b82f6" />
              </div>
              Assign Team
            </h2>
            <p style={{ fontSize: "14px", color: "#64748b", margin: "6px 0 0 0", fontWeight: "500" }}>Allocate staff for this newly converted order.</p>
          </div>
          <button 
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "#94a3b8",
              cursor: "pointer",
              padding: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "8px",
              transition: "all 0.2s ease"
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#f1f5f9"; e.currentTarget.style.color = "#475569"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#94a3b8"; }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
          {/* Tabs */}
          <div style={{ padding: "16px 24px 0 24px", borderBottom: "1px solid #f1f5f9" }}>
            <div style={{ display: "flex", gap: "8px" }}>
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                const hasSelection = !!getSelectedForTab(tab.id);
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    style={{
                      flex: 1,
                      padding: "10px 16px",
                      background: isActive ? "#f8fafc" : "transparent",
                      border: "none",
                      borderBottom: isActive ? "2px solid #3b82f6" : "2px solid transparent",
                      color: isActive ? "#0f172a" : "#64748b",
                      fontSize: "14px",
                      fontWeight: isActive ? "700" : "600",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px"
                    }}
                  >
                    {tab.label}
                    {hasSelection && <CheckCircle2 size={14} color="#10b981" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ padding: "24px", overflowY: "auto", flex: 1, background: "#f8fafc" }}>
            {loading ? (
              <div style={{ textAlign: "center", padding: "40px", color: "#64748b", fontSize: "14px", fontWeight: "500" }}>
                Loading staff availability...
              </div>
            ) : filteredEmployees.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px", background: "white", borderRadius: "16px", border: "1px dashed #cbd5e1" }}>
                <User size={32} color="#cbd5e1" style={{ margin: "0 auto 12px auto" }} />
                <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#334155", margin: "0 0 4px 0" }}>No employees found</h3>
                <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>There are no active employees with the role of {tabs.find(t => t.id === activeTab)?.role}.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {filteredEmployees.map(emp => {
                  const isSelected = getSelectedForTab(activeTab) === emp.id;
                  return (
                    <div 
                      key={emp.id}
                      onClick={() => setSelectedForTab(activeTab, isSelected ? "" : emp.id)}
                      style={{
                        padding: "16px",
                        background: isSelected ? "#eff6ff" : "white",
                        border: isSelected ? "1px solid #bfdbfe" : "1px solid #e2e8f0",
                        borderRadius: "16px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "16px",
                        transition: "all 0.2s ease",
                        boxShadow: isSelected ? "0 4px 6px -1px rgba(59, 130, 246, 0.1)" : "0 1px 2px 0 rgba(0, 0, 0, 0.05)"
                      }}
                      onMouseEnter={(e) => { if (!isSelected) { e.currentTarget.style.borderColor = "#cbd5e1"; e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.05)"; } }}
                      onMouseLeave={(e) => { if (!isSelected) { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.boxShadow = "0 1px 2px 0 rgba(0, 0, 0, 0.05)"; } }}
                    >
                      <div style={{ 
                        width: "40px", height: "40px", 
                        borderRadius: "50%", 
                        background: isSelected ? "#3b82f6" : "#f1f5f9", 
                        color: isSelected ? "white" : "#475569",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "16px", fontWeight: "700"
                      }}>
                        {emp.name.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "15px", fontWeight: "700", color: "#0f172a" }}>{emp.name}</div>
                        <div style={{ fontSize: "13px", color: "#64748b", marginTop: "4px", display: "flex", flexDirection: "column", gap: "6px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span style={{ 
                              background: emp.activeJobs > 0 ? "#fffbeb" : "#f1f5f9", 
                              color: emp.activeJobs > 0 ? "#b45309" : "#64748b", 
                              padding: "2px 8px", 
                              borderRadius: "10px", 
                              fontSize: "11px", 
                              fontWeight: "700" 
                            }}>
                              {emp.activeJobs} {emp.activeJobs === 1 ? "Active Job" : "Active Jobs"}
                            </span>
                          </div>
                          
                          {emp.activeJobs > 0 && (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "2px" }}>
                              {emp.jobTitles.slice(0, 3).map((job: string, idx: number) => (
                                <span key={idx} style={{ 
                                  background: "#f8fafc", 
                                  border: "1px solid #e2e8f0", 
                                  color: "#475569", 
                                  padding: "2px 6px", 
                                  borderRadius: "6px", 
                                  fontSize: "11px", 
                                  fontWeight: "500",
                                  maxWidth: "140px", 
                                  whiteSpace: "nowrap", 
                                  overflow: "hidden", 
                                  textOverflow: "ellipsis" 
                                }}>
                                  {job}
                                </span>
                              ))}
                              {emp.activeJobs > 3 && (
                                <span style={{ color: "#94a3b8", fontSize: "11px", padding: "2px 4px", fontWeight: "600", display: "flex", alignItems: "center" }}>
                                  +{emp.activeJobs - 3} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div style={{ 
                        width: "24px", height: "24px", 
                        borderRadius: "50%", 
                        border: isSelected ? "none" : "2px solid #cbd5e1",
                        background: isSelected ? "#3b82f6" : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center"
                      }}>
                        {isSelected && <CheckCircle2 size={16} color="white" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: "20px 24px",
          borderTop: "1px solid #f1f5f9",
          background: "white",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div style={{ fontSize: "13px", color: "#64748b", fontWeight: "500" }}>
            {siteVisitor || designer || marketer ? (
              <span style={{ color: "#3b82f6", fontWeight: "600" }}>Assignments pending save</span>
            ) : (
              "Select team members above"
            )}
          </div>
          <button
            onClick={handleSubmit}
            disabled={saving}
            style={{
              padding: "12px 24px",
              background: "#1E40AF",
              border: "none",
              borderRadius: "12px",
              color: "white",
              fontSize: "14px",
              fontWeight: "700",
              cursor: saving ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              opacity: saving ? 0.7 : 1,
              transition: "all 0.2s ease",
              boxShadow: "0 4px 6px -1px rgba(30, 64, 175, 0.2)"
            }}
            onMouseEnter={(e) => { if (!saving) { e.currentTarget.style.background = "#1e3a8a"; e.currentTarget.style.transform = "translateY(-1px)"; } }}
            onMouseLeave={(e) => { if (!saving) { e.currentTarget.style.background = "#1E40AF"; e.currentTarget.style.transform = "translateY(0)"; } }}
          >
            {saving ? "Saving..." : "Save Assignments"}
            {!saving && <ChevronRight size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}
