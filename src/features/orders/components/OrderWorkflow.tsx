"use client";

import React from "react";
import { CheckCircle, Circle, AlertCircle } from "lucide-react";

interface WorkflowStage {
  id: string;
  label: string;
  status: "completed" | "current" | "pending" | "delayed";
}

interface OrderWorkflowProps {
  stages?: WorkflowStage[];
  currentStage?: string;
  isDelayed?: boolean;
}

export function OrderWorkflow({
  stages = [
    { id: "enquiry", label: "Enquiry Logged", status: "completed" },
    { id: "survey", label: "Site Survey", status: "completed" },
    { id: "quote", label: "Quote Approved", status: "current" },
    { id: "design", label: "Design Finalized", status: "pending" },
    { id: "production", label: "Under Production", status: "pending" },
    { id: "installation", label: "Out for Installation", status: "pending" },
  ],
  currentStage = "quote",
  isDelayed = false,
}: OrderWorkflowProps) {
  const getStageColor = (status: string) => {
    switch (status) {
      case "completed":
        return { bg: "#dcfce7", text: "#16a34a", border: "#16a34a" };
      case "current":
        return { bg: "#dbeafe", text: "#0284c7", border: "#018F10" };
      case "delayed":
        return { bg: "#fee2e2", text: "#dc2626", border: "#dc2626" };
      default:
        return { bg: "#f1f5f9", text: "#64748b", border: "#cbd5e1" };
    }
  };

  const getIcon = (status: string) => {
    if (status === "completed") return <CheckCircle size={20} />;
    if (status === "delayed") return <AlertCircle size={20} />;
    return <Circle size={20} />;
  };

  return (
    <div
      style={{
        background: "white",
        borderRadius: "12px",
        padding: "24px",
        border: "1px solid #e2e8f0",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a", margin: 0 }}>
          Order Progression
        </h3>
        {isDelayed && (
          <p style={{ fontSize: "12px", color: "#dc2626", marginTop: "6px", display: "flex", alignItems: "center", gap: "4px", margin: 0 }}>
            <AlertCircle size={14} /> Order is behind schedule
          </p>
        )}
      </div>

      {/* Workflow */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", overflowX: "auto", paddingBottom: "12px" }}>
        {stages.map((stage, index) => {
          const color = getStageColor(stage.status);
          const isLast = index === stages.length - 1;

          return (
            <React.Fragment key={stage.id}>
              {/* Stage Circle */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  flex: "0 0 auto",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    background: color.bg,
                    border: `2px solid ${color.border}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: color.text,
                    marginBottom: "8px",
                  }}
                >
                  {getIcon(stage.status)}
                </div>
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: stage.status === "current" ? "700" : "500",
                    color: stage.status === "current" ? "#0284c7" : "#64748b",
                    textAlign: "center",
                    maxWidth: "80px",
                    lineHeight: "1.2",
                  }}
                >
                  {stage.label}
                </span>
              </div>

              {/* Connector Line */}
              {!isLast && (
                <div
                  style={{
                    width: "24px",
                    height: "2px",
                    background: stage.status === "completed" ? "#16a34a" : "#cbd5e1",
                    flex: "0 0 auto",
                    marginBottom: "32px",
                  }}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: "24px", marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #e2e8f0", fontSize: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#dcfce7", border: "1px solid #16a34a" }} />
          <span style={{ color: "#64748b" }}>Completed</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#dbeafe", border: "2px solid #018F10" }} />
          <span style={{ color: "#64748b" }}>Current</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#f1f5f9", border: "1px solid #cbd5e1" }} />
          <span style={{ color: "#64748b" }}>Pending</span>
        </div>
      </div>
    </div>
  );
}
