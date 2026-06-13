"use client";

import React, { useState } from "react";
import { Plus, Filter, Globe, Phone, MessageSquare, Link, ChevronsUpDown, Calendar, HelpCircle, PhoneCall, AlertTriangle } from "lucide-react";
import { useDashboard, Enquiry, EnquirySource } from "@/context/DashboardContext";
import { Field, FieldContent, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/interfaces-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const EnquiriesView: React.FC = () => {
  const { enquiries, addEnquiry, convertEnquiryToOrder, currentUserRole, addNotification } = useDashboard();
  const isEmployee = currentUserRole === "Employee";
  
  // Local state for Manual Add Enquiry Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [leadName, setLeadName] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [source, setSource] = useState<EnquirySource>("Phone Call");
  const [notes, setNotes] = useState("");
  const [primaryCommunicationMode, setPrimaryCommunicationMode] = useState<"MAIL" | "WHATSAPP">("WHATSAPP");
  const [location, setLocation] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "info" } | null>(null);

  // Local state for Conversion Dialog
  const [conversionEnquiry, setConversionEnquiry] = useState<Enquiry | null>(null);
  const [projectName, setProjectName] = useState("");
  const [budget, setBudget] = useState("");
  const [assignedTeam, setAssignedTeam] = useState("");

  // Filter and Sort states
  const [selectedSourceFilter, setSelectedSourceFilter] = useState<EnquirySource | "All">("All");
  const [sortByDate, setSortByDate] = useState<"Newest" | "Oldest">("Newest");

  // Counters
  const pendingEnquiries = enquiries.filter(e => e.status === "Pending");
  const countBySource = (src: EnquirySource) => pendingEnquiries.filter(e => e.source === src).length;

  const handleOpenConvert = (enq: Enquiry) => {
    setConversionEnquiry(enq);
    setProjectName(`Signage for ${enq.leadName.split("(")[0].trim()}`);
    setBudget("15000");
    setAssignedTeam("RM");
  };

  const handleConvertSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!conversionEnquiry || !projectName) return;

    const team = assignedTeam
      .split(",")
      .map(t => t.trim().toUpperCase())
      .filter(t => t.length > 0);

    convertEnquiryToOrder(conversionEnquiry.id, team, projectName, 0);
    setConversionEnquiry(null);
  };

  const handleAddEnquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadName || !phone) return;

    addEnquiry({
      leadName,
      phone,
      whatsapp: whatsapp || phone,
      email,
      source,
      notes,
      primaryCommunicationMode,
      location
    });

    addNotification("Enquiry Added", "New manual enquiry added successfully.", "success");
    setIsModalOpen(false);
    // Reset Form
    setLeadName("");
    setPhone("");
    setWhatsapp("");
    setEmail("");
    setSource("Phone Call");
    setNotes("");
    setPrimaryCommunicationMode("WHATSAPP");
    setLocation("");
  };

  const handleSendWelcomeMessage = (enq: Enquiry) => {
    const cleanPhone = enq.whatsapp ? enq.whatsapp.replace(/\D/g, "") : enq.phone.replace(/\D/g, "");
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    
    const locationStr = enq.location || "your location";
    const notesStr = enq.notes ? enq.notes : "Signage requirements";

    if (enq.primaryCommunicationMode === "WHATSAPP") {
      const message = `Hi ${enq.leadName.split("(")[0].trim()}, thank you for contacting Printec! We have received your enquiry for signages at ${locationStr}. Our team is reviewing your requirements: "${notesStr}". We will connect with you shortly!`;
      const waUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
      window.open(waUrl, "_blank");
      
      setToast({
        message: `Welcome message opened in WhatsApp Web for ${enq.leadName}!`,
        type: "success"
      });
      setTimeout(() => setToast(null), 4000);
    } else {
      const subject = encodeURIComponent("Welcome to Printec Signage Solutions");
      const body = encodeURIComponent(
        `Hi ${enq.leadName.split("(")[0].trim()},\n\nThank you for contacting Printec. We have received your enquiry for signages at ${locationStr}.\n\nOur team is currently reviewing your requirement details:\n"${notesStr}"\n\nWe will get back to you shortly with next steps.\n\nBest regards,\nPrintec Operations Team`
      );
      const mailtoUrl = `mailto:${enq.email || ""}?subject=${subject}&body=${body}`;
      window.open(mailtoUrl, "_blank");
      
      setToast({
        message: `Welcome email initiated to ${enq.email || "client"}!`,
        type: "success"
      });
      setTimeout(() => setToast(null), 4000);
    }
  };

  // Helper to get elapsed hours
  const getElapsedHours = (dateString: string) => {
    return Math.floor((new Date().getTime() - new Date(dateString).getTime()) / (1000 * 60 * 60));
  };

  // SLA warn triggers
  const getSLADetails = (dateString: string) => {
    const hours = getElapsedHours(dateString);
    if (hours >= 48) {
      return {
        flag: "direct_call",
        label: `${hours}h Inactive - ESCALATE DIRECT CALL`,
        style: "bg-red-50 text-red-700 border-red-100 ring-2 ring-red-500/20"
      };
    } else if (hours >= 24) {
      return {
        flag: "whatsapp_ping",
        label: `${hours}h Inactive - PING WHATSAPP`,
        style: "bg-amber-50 text-amber-700 border-amber-100"
      };
    }
    return {
      flag: "none",
      label: `${hours}h Received - Active SLA`,
      style: "bg-slate-50 text-slate-500 border-slate-100"
    };
  };

  // Source icons & badges
  const getSourceIcon = (src: EnquirySource) => {
    switch (src) {
      case "Website": return <Globe size={13} className="text-blue-500" />;
      case "Phone Call": return <Phone size={13} className="text-emerald-500" />;
      case "WhatsApp": return <MessageSquare size={13} className="text-green-500" fill="currentColor" />;
    }
  };

  // Process data
  let processedEnquiries = enquiries.filter(e => {
    if (isEmployee && e.source === "Website") return false;
    const matchesSource = selectedSourceFilter === "All" || e.source === selectedSourceFilter;
    return matchesSource && e.status === "Pending"; // Only show pending enquiries
  });

  processedEnquiries.sort((a, b) => {
    const timeA = new Date(a.dateReceived).getTime();
    const timeB = new Date(b.dateReceived).getTime();
    return sortByDate === "Newest" ? timeB - timeA : timeA - timeB;
  });

  return (
    <div className="space-y-6">
      
      {/* A. Top Header Area */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center space-y-4 sm:space-y-0 pb-3 border-b border-outline-variant">
        <div>
          <h2 className="text-2xl md:text-3xl font-semibold text-on-surface tracking-tight">Inbound Enquiries</h2>
          
          {/* Source Counters */}
          <div className="flex flex-wrap gap-4 mt-2 text-xs font-semibold text-on-surface-variant">
            {!isEmployee && (
              <>
                <span className="flex items-center"><Globe size={12} className="mr-1 text-primary" /> Website: <strong className="text-on-surface ml-1">{countBySource("Website")}</strong></span>
                <span className="text-outline-variant">|</span>
              </>
            )}
            <span className="flex items-center"><Phone size={12} className="mr-1 text-secondary" /> Phone Call: <strong className="text-on-surface ml-1">{countBySource("Phone Call")}</strong></span>
            <span className="text-outline-variant">|</span>
            <span className="flex items-center"><MessageSquare size={12} className="mr-1 text-secondary" /> WhatsApp: <strong className="text-on-surface ml-1">{countBySource("WhatsApp")}</strong></span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => addNotification("Export Started", "Downloading enquiries log...", "success")}
            className="prt-btn prt-btn-secondary"
          >
            <Plus size={13} className="mr-1.5 rotate-45" /> Export CSV
          </button>
          
          <button
            onClick={() => setIsModalOpen(true)}
            className="prt-btn prt-btn-primary"
          >
            <Plus size={13} className="mr-1.5" /> Manual Entry
          </button>
        </div>
      </div>

      {/* B. Filter Control Bar */}
      <div className="prt-card p-4 flex flex-col md:flex-row justify-between items-start md:items-center space-y-3 md:space-y-0 shadow-none">
        <div className="flex items-center space-x-2">
          <span className="p-1.5 bg-surface-container-low rounded text-on-surface-variant"><Filter size={15} /></span>
          <span className="text-xs font-bold text-on-surface uppercase tracking-wider">Categorize Source:</span>
        </div>

        <div className="flex flex-wrap md:flex-nowrap items-center gap-3 w-full md:w-auto">
          {/* Source filters */}
          <div className="flex flex-wrap gap-1">
            {(["All", "Website", "Phone Call", "WhatsApp"] as const)
              .filter(src => !(isEmployee && src === "Website"))
              .map((src) => {
                const isSelected = selectedSourceFilter === src;
                return (
                  <button
                    key={src}
                    onClick={() => setSelectedSourceFilter(src)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded border transition-all duration-150 cursor-pointer ${
                      isSelected
                        ? "bg-primary text-on-primary border-primary"
                        : "bg-surface-container-lowest text-on-surface-variant border-outline-variant hover:bg-surface-hover"
                    }`}
                  >
                    {src === "All" ? "All Channels" : src}
                  </button>
                );
              })}
          </div>

          <span className="text-outline-variant hidden md:inline">|</span>

          {/* Sort selection */}
          <div className="flex items-center space-x-1.5">
            <span className="text-xs font-semibold text-on-surface-variant uppercase">Order By:</span>
            <select
              value={sortByDate}
              onChange={(e) => setSortByDate(e.target.value as "Newest" | "Oldest")}
              className="px-2.5 py-1.5 bg-surface-container-lowest border border-outline-variant text-on-surface-variant text-xs font-semibold rounded focus:outline-none"
            >
              <option value="Newest">Newest First</option>
              <option value="Oldest">Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* C. Enquiry Data Table */}
      <div className="prt-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="prt-table">
            <thead>
              <tr>
                <th className="px-6 py-4">Date Received</th>
                <th className="px-6 py-4">Lead Details & Contact</th>
                <th className="px-6 py-4">Inbound Source</th>
                <th className="px-6 py-4">Inactivity SLA Warnings</th>
                <th className="px-6 py-4">Lead Intake Notes</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {processedEnquiries.map((enq) => {
                const sla = getSLADetails(enq.dateReceived);
                let slaBadgeStyle = "bg-surface-container-low text-on-surface-variant border-outline-variant";
                if (sla.flag === "direct_call") {
                  slaBadgeStyle = "bg-[var(--error-bg)] text-[var(--error-text)] border-[var(--error-text)]";
                } else if (sla.flag === "whatsapp_ping") {
                  slaBadgeStyle = "bg-[var(--warning-bg)] text-[var(--warning-text)] border-[var(--warning-text)]";
                }
                return (
                  <tr key={enq.id} className="prt-table-row">
                    {/* Date Received */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-on-surface font-semibold text-sm">
                        <Calendar size={13} className="mr-1.5 text-on-surface-variant" />
                        {new Date(enq.dateReceived).toLocaleDateString()}
                      </div>
                      <div className="text-[10px] font-medium text-on-surface-variant mt-0.5 font-mono">
                        {new Date(enq.dateReceived).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>

                    {/* Lead details */}
                    <td className="px-6 py-4">
                      <span className="font-bold text-on-surface text-sm block">
                        {enq.leadName}
                      </span>
                      <span className="text-xs text-on-surface-variant block mt-0.5 font-mono">
                        Ph: {enq.phone}
                      </span>
                      {enq.email && (
                        <span className="text-[10px] text-on-surface-variant block mt-0.5 font-mono">
                          {enq.email}
                        </span>
                      )}
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-surface-container-low text-on-surface-variant text-[10px] font-medium border border-outline-variant">
                          📍 {enq.location || "N/A"}
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-surface-container-low text-on-surface-variant text-[10px] font-medium border border-outline-variant">
                          {enq.primaryCommunicationMode === "WHATSAPP" ? "💬 WhatsApp" : "✉️ Email"}
                        </span>
                      </div>
                    </td>

                    {/* Source badge */}
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 text-[10px] font-bold rounded border border-outline-variant bg-surface-container-low text-on-surface-variant space-x-1.5">
                        {getSourceIcon(enq.source)}
                        <span>{enq.source}</span>
                      </span>
                    </td>

                    {/* SLA Warning status flags */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1.5 text-[10px] font-bold rounded border leading-tight ${slaBadgeStyle}`}>
                        {sla.flag === "direct_call" ? (
                          <PhoneCall size={12} className="mr-1.5 animate-bounce" />
                        ) : sla.flag === "whatsapp_ping" ? (
                          <MessageSquare size={12} className="mr-1.5 text-warning" />
                        ) : null}
                        {sla.label}
                      </span>
                    </td>

                    {/* Intake notes */}
                    <td className="px-6 py-4 max-w-[200px]">
                      <p className="text-xs text-on-surface-variant truncate-2-lines line-clamp-2">
                        {enq.notes || "No notes logged."}
                      </p>
                    </td>

                    {/* Action buttons */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex flex-col sm:flex-row items-end sm:items-center justify-end gap-2">
                        <button
                          onClick={() => handleSendWelcomeMessage(enq)}
                          className="prt-btn prt-btn-outlined"
                        >
                          Send Welcome Message
                        </button>
                        
                        <button
                          onClick={() => handleOpenConvert(enq)}
                          className="prt-btn prt-btn-inverted"
                        >
                          Generate Order
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {processedEnquiries.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-on-surface-variant text-sm font-medium">
                    No pending inbound enquiries found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MANUAL ADD ENQUIRY MODAL (POPUP FORM) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">
                Log New Inbound Enquiry
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors">
                <Plus size={20} className="rotate-45" />
              </button>
            </div>

            <form onSubmit={handleAddEnquirySubmit} className="p-6">
              <FieldGroup>
                <FieldSet>
                  <Field>
                    <FieldLabel htmlFor="leadName">Lead Name *</FieldLabel>
                    <FieldContent>
                      <Input
                        id="leadName"
                        required
                        value={leadName}
                        onChange={(e) => setLeadName(e.target.value)}
                        placeholder="e.g. Ramesh Kumar"
                      />
                    </FieldContent>
                  </Field>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel htmlFor="phone">Phone Number *</FieldLabel>
                      <FieldContent>
                        <Input
                          id="phone"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="Primary contact"
                        />
                      </FieldContent>
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="whatsapp">WhatsApp Number</FieldLabel>
                      <FieldContent>
                        <Input
                          id="whatsapp"
                          value={whatsapp}
                          onChange={(e) => setWhatsapp(e.target.value)}
                          placeholder="Same as phone if empty"
                        />
                      </FieldContent>
                    </Field>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel htmlFor="email">Email Address</FieldLabel>
                      <FieldContent>
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="e.g. lead@outlook.com"
                        />
                      </FieldContent>
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="source">Inbound Channel Source</FieldLabel>
                      <FieldContent>
                        <select
                          id="source"
                          value={source}
                          onChange={(e) => setSource(e.target.value as EnquirySource)}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="Phone Call">📞 Phone Call</option>
                          <option value="WhatsApp">💬 WhatsApp</option>
                          {!isEmployee && <option value="Website">🌐 Website Submission</option>}
                        </select>
                      </FieldContent>
                    </Field>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel htmlFor="primaryComm">Primary Mode of Communication *</FieldLabel>
                      <FieldContent>
                        <select
                          id="primaryComm"
                          value={primaryCommunicationMode}
                          onChange={(e) => setPrimaryCommunicationMode(e.target.value as "MAIL" | "WHATSAPP")}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-medium"
                        >
                          <option value="WHATSAPP">WhatsApp</option>
                          <option value="MAIL">Email</option>
                        </select>
                      </FieldContent>
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="location">Basic Location Details *</FieldLabel>
                      <FieldContent>
                        <Input
                          id="location"
                          required
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          placeholder="e.g. Whitefield, JP Nagar"
                        />
                      </FieldContent>
                    </Field>
                  </div>

                  <Field>
                    <FieldLabel htmlFor="notes">Workflow / Requirement Notes</FieldLabel>
                    <FieldContent>
                      <Textarea
                        id="notes"
                        rows={3}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Details of signage required, location, dimensions mentioned..."
                        className="resize-none"
                      />
                    </FieldContent>
                  </Field>
                </FieldSet>
              </FieldGroup>

              <div className="flex justify-end space-x-3 pt-6 mt-6 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--color-primary-container)] transition-colors shadow-sm"
                >
                  Log Enquiry Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONVERT ENQUIRY TO ORDER POPUP */}
      {conversionEnquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">
                Convert Lead to Signage Project
              </h2>
              <button onClick={() => setConversionEnquiry(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors">
                <Plus size={20} className="rotate-45" />
              </button>
            </div>

            <form onSubmit={handleConvertSubmit} className="p-6 space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl text-xs space-y-1">
                <p className="font-bold text-slate-700">Lead Profile Context:</p>
                <p className="text-slate-500">Name: <strong className="text-slate-800">{conversionEnquiry.leadName}</strong></p>
                <p className="text-slate-500">Phone: <strong className="text-slate-800">{conversionEnquiry.phone}</strong></p>
                {conversionEnquiry.notes && <p className="text-slate-400 italic">"{conversionEnquiry.notes}"</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Project Name *</label>
                <input
                  type="text"
                  required
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g. Backlit Neon Board for Deluxe Bakers"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Assign Installation Crew</label>
                <input
                  type="text"
                  value={assignedTeam}
                  onChange={(e) => setAssignedTeam(e.target.value)}
                  placeholder="Initials (e.g. RM, SK)"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setConversionEnquiry(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold shadow-sm"
                >
                  Generate Order ID & Begin Pipeline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-5 right-5 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl flex items-center space-x-2 z-55 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-ping"></div>
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 font-bold text-slate-400 hover:text-white">✕</button>
        </div>
      )}
    </div>
  );
};
