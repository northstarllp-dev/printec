"use client";

import React, { useState } from "react";
import { X, Send, Loader } from "lucide-react";

interface AddEnquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: EnquiryFormData) => void;
}

export interface EnquiryFormData {
  leadName: string;
  phone: string;
  whatsappNumber: string;
  email: string;
  primaryMode: "phone" | "email" | "whatsapp";
  notes: string;
  location: string;
}

export function AddEnquiryModal({ isOpen, onClose, onSubmit }: AddEnquiryModalProps) {
  const [formData, setFormData] = useState<EnquiryFormData>({
    leadName: "",
    phone: "",
    whatsappNumber: "",
    email: "",
    primaryMode: "phone",
    notes: "",
    location: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [syncWhatsapp, setSyncWhatsapp] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const next = { ...prev, [name]: value };
      if (name === "phone" && syncWhatsapp) {
        next.whatsappNumber = value;
      }
      return next;
    });
  };

  const handleSyncToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setSyncWhatsapp(checked);
    if (checked) {
      setFormData(prev => ({ ...prev, whatsappNumber: prev.phone }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    onSubmit(formData);
    setIsSubmitting(false);
    setFormData({
      leadName: "",
      phone: "",
      whatsappNumber: "",
      email: "",
      primaryMode: "phone",
      notes: "",
      location: "",
    });
    setSyncWhatsapp(false);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15, 23, 42, 0.4)",
          backdropFilter: "blur(4px)",
          zIndex: 50,
          animation: "fadeIn 0.2s ease-out",
        }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          background: "white",
          borderRadius: "16px",
          width: "90%",
          maxWidth: "600px",
          maxHeight: "90vh",
          overflow: "auto",
          zIndex: 51,
          animation: "slideUp 0.3s ease-out",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "20px 24px",
            background: "#f8fafc",
            borderBottom: "1px solid #e2e8f0",
          }}
        >
          <div>
            <h2 style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", margin: 0 }}>
              New Lead Enquiry
            </h2>
            <p style={{ fontSize: "12px", color: "#64748b", margin: "4px 0 0 0" }}>
              Enter the client's details to log a new enquiry.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "white",
              border: "1px solid #e2e8f0",
              cursor: "pointer",
              color: "#64748b",
              padding: "6px",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "#f1f5f9"}
            onMouseLeave={(e) => e.currentTarget.style.background = "white"}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: "24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            
            {/* Lead Name */}
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#0f172a", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                Lead Name *
              </label>
              <input
                type="text"
                name="leadName"
                value={formData.leadName}
                onChange={handleChange}
                required
                placeholder="e.g. Ramesh Kumar"
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                  fontFamily: "inherit",
                  transition: "all 0.2s",
                  background: "#f8fafc"
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#018F10"; e.currentTarget.style.background = "white"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#cbd5e1"; e.currentTarget.style.background = "#f8fafc"; }}
              />
            </div>

            {/* Phone */}
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#0f172a", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                Phone Number *
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                placeholder="+91 98765 43210"
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                  fontFamily: "inherit",
                  transition: "all 0.2s",
                  background: "#f8fafc"
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#018F10"; e.currentTarget.style.background = "white"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#cbd5e1"; e.currentTarget.style.background = "#f8fafc"; }}
              />
            </div>

            {/* WhatsApp Number */}
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#0f172a", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                WhatsApp Number
              </label>
              <input
                type="tel"
                name="whatsappNumber"
                value={formData.whatsappNumber}
                onChange={handleChange}
                placeholder="+91 98765 43210"
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                  fontFamily: "inherit",
                  transition: "all 0.2s",
                  background: "#f8fafc"
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#018F10"; e.currentTarget.style.background = "white"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#cbd5e1"; e.currentTarget.style.background = "#f8fafc"; }}
              />
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "8px" }}>
                <input 
                  type="checkbox" 
                  id="sync-wa" 
                  checked={syncWhatsapp} 
                  onChange={handleSyncToggle} 
                  style={{ cursor: "pointer", accentColor: "#018F10", width: "14px", height: "14px", margin: 0 }} 
                />
                <label htmlFor="sync-wa" style={{ fontSize: "11px", fontWeight: "600", color: "#64748b", cursor: "pointer", userSelect: "none" }}>
                  Same as phone number
                </label>
              </div>
            </div>

            {/* Email */}
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#0f172a", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="client@company.com"
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                  fontFamily: "inherit",
                  transition: "all 0.2s",
                  background: "#f8fafc"
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#018F10"; e.currentTarget.style.background = "white"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#cbd5e1"; e.currentTarget.style.background = "#f8fafc"; }}
              />
            </div>

            {/* Primary Mode of Communication */}
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#0f172a", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                Primary Mode *
              </label>
              <select
                name="primaryMode"
                value={formData.primaryMode}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                  fontFamily: "inherit",
                  background: "#f8fafc",
                  transition: "all 0.2s",
                  cursor: "pointer"
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#018F10"; e.currentTarget.style.background = "white"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#cbd5e1"; e.currentTarget.style.background = "#f8fafc"; }}
              >
                <option value="phone">Phone Call</option>
                <option value="email">Email</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </div>

            {/* Location */}
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#0f172a", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                Location / Area
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g., WhiteField, JP Nagar"
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                  fontFamily: "inherit",
                  transition: "all 0.2s",
                  background: "#f8fafc"
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#018F10"; e.currentTarget.style.background = "white"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#cbd5e1"; e.currentTarget.style.background = "#f8fafc"; }}
              />
            </div>

            {/* Requirements */}
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#0f172a", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                Requirement Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Enter any details about their requirements..."
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  fontSize: "14px",
                  minHeight: "100px",
                  boxSizing: "border-box",
                  fontFamily: "inherit",
                  resize: "vertical",
                  transition: "all 0.2s",
                  background: "#f8fafc"
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#018F10"; e.currentTarget.style.background = "white"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#cbd5e1"; e.currentTarget.style.background = "#f8fafc"; }}
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div style={{ display: "flex", gap: "12px", marginTop: "24px", paddingTop: "24px", borderTop: "1px solid #e2e8f0" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: "10px 16px",
                background: "#f1f5f9",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "600",
                color: "#0f172a",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#e2e8f0";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#f1f5f9";
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                flex: 1,
                padding: "10px 16px",
                background: "#018F10",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "600",
                color: "white",
                cursor: isSubmitting ? "not-allowed" : "pointer",
                transition: "all 0.2s",
                opacity: isSubmitting ? 0.7 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
              }}
              onMouseEnter={(e) => {
                if (!isSubmitting) e.currentTarget.style.background = "#01730c";
              }}
              onMouseLeave={(e) => {
                if (!isSubmitting) e.currentTarget.style.background = "#018F10";
              }}
            >
              {isSubmitting ? <Loader size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Send size={16} />}
              {isSubmitting ? "Creating..." : "Create Enquiry"}
            </button>
          </div>
        </form>

        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translate(-50%, -45%);
            }
            to {
              opacity: 1;
              transform: translate(-50%, -50%);
            }
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </>
  );
}
