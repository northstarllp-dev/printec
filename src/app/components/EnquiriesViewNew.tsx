"use client";

import React, { useState, useEffect } from "react";
import { Search, Filter, Plus, AlertCircle, CheckCircle, Clock, Phone, Copy, MessageSquare, Mail, X } from "lucide-react";
import { AddEnquiryModal, EnquiryFormData } from "./AddEnquiryModal";
import { ConvertEnquiryModal } from "./ConvertEnquiryModal";
import { createEnquiry, updateEnquiry } from "@/app/actions/enquiryActions";
import { createOrder } from "@/app/actions/orderActions";
import { createCustomer } from "@/app/actions/customerActions";

const getStatusColor = (status: string) => {
  const colors: Record<string, { bg: string; text: string; label: string }> = {
    "Pending": { bg: "#e0e7ff", text: "#6366f1", label: "PENDING" },
    "Contacted": { bg: "#dbeafe", text: "#0284c7", label: "CONTACTED" },
    "Quoted": { bg: "#fef3c7", text: "#ea580c", label: "QUOTED" },
    "Converted": { bg: "#dcfce7", text: "#16a34a", label: "CONVERTED" },
  };
  return colors[status] || colors["Pending"];
};

export function EnquiriesViewNew({ initialEnquiries, initialCustomers }: { initialEnquiries: any[], initialCustomers: any[] }) {
  const [enquiries, setEnquiries] = useState(initialEnquiries);
  const [customers, setCustomers] = useState(initialCustomers);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState<{id: string, leadName: string} | null>(null);

  // Welcome message states
  const [welcomeModalOpen, setWelcomeModalOpen] = useState(false);
  const [welcomeCustomerInfo, setWelcomeCustomerInfo] = useState<{ customerId: string; customerName: string; phone: string; email: string } | null>(null);

  const handleAddEnquiry = async (data: EnquiryFormData) => {
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
      const result = await createEnquiry(newEnq);
      if (result && result[0]) {
        const mapped = {
          id: result[0].id,
          dateReceived: result[0].date_received,
          leadName: result[0].lead_name,
          phone: result[0].phone,
          whatsapp: result[0].whatsapp,
          email: result[0].email,
          source: result[0].source,
          status: result[0].status,
          notes: result[0].notes,
          primaryCommunicationMode: result[0].primary_communication_mode,
          location: result[0].location
        };
        setEnquiries([mapped, ...enquiries]);
      }
      setIsAddModalOpen(false);
    } catch (error) {
      console.error("Error adding enquiry:", error);
      alert("Failed to add enquiry. Check console.");
    }
  };
  
  const convertEnquiryToOrderLocal = async (enquiryId: string, assignedEmployees: string[], projectName: string, budget: number) => {
    const enq = enquiries.find(e => e.id === enquiryId);
    if (!enq) return;

    try {
      let customer = customers.find(c => c.phone === enq.phone);
      if (!customer) {
        const custResult = await createCustomer({
          name: enq.leadName,
          phone: enq.phone,
          whatsapp: enq.whatsapp,
          email: enq.email,
          billing_address: "Address Details Pending Intake",
          shipping_address: "Installation Address Pending Survey"
        });
        if (custResult && custResult[0]) {
          customer = { id: custResult[0].id, name: custResult[0].name, phone: custResult[0].phone, email: custResult[0].email };
          setCustomers(prev => [...prev, customer!]);
        }
      }

      if (customer) {
        await createOrder({
          project_name: projectName,
          customer_id: customer.id,
          stage: "Site Visit Pending",
          budget,
          deposit_paid: 0,
          customer_name: customer.name
        });
      }

      await updateEnquiry(enquiryId, { status: "Converted" });
      setEnquiries(prev => prev.map(e => e.id === enquiryId ? { ...e, status: "Converted" } : e));
    } catch (err) {
      console.error("Conversion failed", err);
      alert("Failed to convert enquiry to order.");
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
                          onClick={() => {
                            const customer = customers.find(c => c.phone === enq.phone || c.email === enq.email);
                            if (customer) {
                              setWelcomeCustomerInfo({
                                customerId: customer.id,
                                customerName: customer.name,
                                phone: customer.phone,
                                email: customer.email
                              });
                              setWelcomeModalOpen(true);
                            } else {
                              if (confirm(`This lead (${enq.leadName}) has not been converted to an order/customer profile yet. Would you like to convert it to an order now to generate a portal link?`)) {
                                setSelectedEnquiry({ id: enq.id, leadName: enq.leadName });
                                setConvertModalOpen(true);
                              }
                            }
                          }}
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
            const enq = enquiries.find(e => e.id === selectedEnquiry.id);
            await convertEnquiryToOrderLocal(selectedEnquiry.id, [], projectName, budget);
            setConvertModalOpen(false);
            
            if (enq) {
              // Retrieve the newly created customer profile by searching for phone match
              setTimeout(() => {
                const latestCustomer = customers.find(c => c.phone === enq.phone);
                if (latestCustomer) {
                  setWelcomeCustomerInfo({
                    customerId: latestCustomer.id,
                    customerName: latestCustomer.name,
                    phone: latestCustomer.phone,
                    email: latestCustomer.email
                  });
                  setWelcomeModalOpen(true);
                } else {
                  // Fallback to name match or most recent customer in state
                  const fallbackCustomer = customers.find(c => c.name === enq.leadName) || customers[0];
                  if (fallbackCustomer) {
                    setWelcomeCustomerInfo({
                      customerId: fallbackCustomer.id,
                      customerName: fallbackCustomer.name,
                      phone: fallbackCustomer.phone,
                      email: fallbackCustomer.email
                    });
                    setWelcomeModalOpen(true);
                  }
                }
              }, 600);
            }
            setSelectedEnquiry(null);
          }}
        />
      )}

      {welcomeCustomerInfo && (
        <WelcomeMessageModal
          isOpen={welcomeModalOpen}
          onClose={() => {
            setWelcomeModalOpen(false);
            setWelcomeCustomerInfo(null);
          }}
          customerInfo={welcomeCustomerInfo}
        />
      )}
    </div>
  );
}

interface WelcomeMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerInfo: { customerId: string; customerName: string; phone: string; email: string };
}

export function WelcomeMessageModal({ isOpen, onClose, customerInfo }: WelcomeMessageModalProps) {
  const [loading, setLoading] = useState(true);
  const [portalUrl, setPortalUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && customerInfo.customerId) {
      setLoading(true);
      fetch(`/api/portal-token?customer_id=${customerInfo.customerId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.url) {
            setPortalUrl(data.url);
          }
          setLoading(false);
        })
        .catch((err) => {
          console.error("Error fetching portal token:", err);
          setLoading(false);
        });
    }
  }, [isOpen, customerInfo.customerId]);

  if (!isOpen) return null;

  const messageText = `Hello ${customerInfo.customerName},

Welcome to Printec! We are excited to work with you on your signage project.

You can track your order status, approve quotations/designs, make payments, and chat directly with our team on your secure Customer Portal:
${portalUrl || "Loading link..."}

Best regards,
Printec Team`;

  const handleCopy = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendWhatsApp = () => {
    const cleanPhone = customerInfo.phone.replace(/[^0-9]/g, "");
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const encodedText = encodeURIComponent(messageText);
    window.open(`https://wa.me/${formattedPhone}?text=${encodedText}`, "_blank");
  };

  const handleSendEmail = () => {
    const subject = encodeURIComponent("Welcome to Printec - Customer Portal Link");
    const body = encodeURIComponent(messageText);
    window.open(`mailto:${customerInfo.email || ""}?subject=${subject}&body=${body}`, "_blank");
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
      zIndex: 1100,
      padding: "20px",
      fontFamily: "var(--font-sans), sans-serif"
    }}>
      <div style={{
        background: "white",
        borderRadius: "16px",
        width: "100%",
        maxWidth: "520px",
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
        display: "flex",
        flexDirection: "column",
        maxHeight: "90vh",
        overflow: "hidden"
      }}>
        {/* Header */}
        <div style={{
          padding: "20px 24px",
          borderBottom: "1px solid #e2e8f0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "#f8fafc"
        }}>
          <div>
            <h2 style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a", margin: 0 }}>Customer Portal Welcome Message</h2>
            <p style={{ fontSize: "12px", color: "#64748b", margin: "4px 0 0 0" }}>Review and send the magic portal link to the customer.</p>
          </div>
          <button 
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "#94a3b8",
              cursor: "pointer",
              padding: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "6px"
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "16px" }}>
          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
              <div style={{ width: "24px", height: "24px", border: "2px solid #018F10", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
              Generating secure customer link...
            </div>
          ) : (
            <>
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>
                  Message Preview
                </label>
                <textarea 
                  readOnly
                  value={messageText}
                  style={{
                    width: "100%",
                    height: "180px",
                    padding: "12px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    fontSize: "13px",
                    color: "#334155",
                    fontFamily: "inherit",
                    resize: "none",
                    background: "#f8fafc"
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={handleCopy}
                  style={{
                    flex: 1,
                    padding: "10px 14px",
                    background: copied ? "#dcfce7" : "#f1f5f9",
                    border: `1px solid ${copied ? "#86efac" : "#cbd5e1"}`,
                    color: copied ? "#16a34a" : "#475569",
                    borderRadius: "8px",
                    fontSize: "12px",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    cursor: "pointer"
                  }}
                >
                  <Copy size={14} />
                  {copied ? "Copied!" : "Copy Message"}
                </button>

                <button
                  onClick={handleSendWhatsApp}
                  style={{
                    flex: 1,
                    padding: "10px 14px",
                    background: "#25D366",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "12px",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    cursor: "pointer"
                  }}
                >
                  <MessageSquare size={14} />
                  Send WhatsApp
                </button>

                <button
                  onClick={handleSendEmail}
                  style={{
                    flex: 1,
                    padding: "10px 14px",
                    background: "#003568",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "12px",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    cursor: "pointer"
                  }}
                >
                  <Mail size={14} />
                  Send Email
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
