"use client";

import React, { useState } from "react";
import { Settings, Globe, ShieldAlert, Sparkles, Send, CheckCircle2, ChevronRight } from "lucide-react";
import { useDashboard, EnquirySource } from "@/context/DashboardContext";

export const SettingsView: React.FC = () => {
  const { simulateWebhookEnquiry } = useDashboard();
  
  // General configs
  const [sla24h, setSla24h] = useState("WhatsApp Ping Notification");
  const [sla48h, setSla48h] = useState("Direct Call Escalation");
  
  // Webhook Simulator Form
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientNotes, setClientNotes] = useState("");
  const [clientSource, setClientSource] = useState<EnquirySource>("Website");

  // Visual simulation state
  const [isSimulatingRedirect, setIsSimulatingRedirect] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const handleSimulateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !clientPhone) return;

    // Trigger simulation redirect flow
    setIsSimulatingRedirect(true);

    setTimeout(() => {
      // 1. Fire under-the-hood webhook logic inserting row into Enquiries
      simulateWebhookEnquiry(clientName, clientPhone, clientEmail, clientSource, clientNotes);
      
      // 2. Redirect client to success screen
      setIsSimulatingRedirect(false);
      setHasSubmitted(true);
    }, 1200); // Simulate network lag
  };

  const handleResetForm = () => {
    setHasSubmitted(false);
    setClientName("");
    setClientPhone("");
    setClientEmail("");
    setClientNotes("");
  };

  return (
    <div className="space-y-6" style={{ padding: "24px 24px 32px" }}>
      
      {/* Top Header Area */}
      <div>
        <h1 className="prt-page-title">System Settings</h1>
        <p className="prt-page-subtitle">
          Adjust operations parameters and test webhook integrations.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Columns: Operations Configurations */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* SLA Configuration */}
          <div className="prt-card p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center">
              <ShieldAlert size={16} className="mr-2 text-rose-500" />
              Inactivity SLA Timers & Escalate Rules
            </h3>
            <p className="text-xs text-slate-500 leading-normal">
              Customize system behavior when incoming inquiries remain pending without a scheduled site visit.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="prt-label block mb-1">
                  24-Hour Inactivity Action
                </label>
                <select
                  value={sla24h}
                  onChange={(e) => setSla24h(e.target.value)}
                  className="prt-input cursor-pointer"
                >
                  <option value="WhatsApp Ping Notification">Trigger Simulated WhatsApp Notification</option>
                  <option value="Email Alert">Send Admin Email Summary</option>
                  <option value="None">No Action</option>
                </select>
              </div>

              <div>
                <label className="prt-label block mb-1">
                  48-Hour Inactivity Action
                </label>
                <select
                  value={sla48h}
                  onChange={(e) => setSla48h(e.target.value)}
                  className="prt-input cursor-pointer"
                >
                  <option value="Direct Call Escalation">Escalate Visual SLA State & Call Direct</option>
                  <option value="Archived Alert">Auto-archive Lead</option>
                  <option value="None">No Action</option>
                </select>
              </div>
            </div>
          </div>

          {/* Pricing Config */}
          <div className="prt-card p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center">
              <Settings size={16} className="mr-2 text-slate-500" />
              General System Configurations
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="prt-label block mb-1">Currency Code</label>
                <input
                  type="text"
                  disabled
                  value="INR (Indian Rupee - ₹)"
                  className="prt-input bg-slate-100/50 text-slate-500"
                />
              </div>
              <div>
                <label className="prt-label block mb-1">Standard Deposit %</label>
                <input
                  type="text"
                  disabled
                  value="50% Advance"
                  className="prt-input bg-slate-100/50 text-slate-500"
                />
              </div>
              <div>
                <label className="prt-label block mb-1">Database Sync Status</label>
                <span className="w-full inline-flex justify-center items-center px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-xs font-semibold">
                  Supabase API Anchors Ready
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Webhook Simulator Form */}
        <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl flex flex-col justify-between border border-slate-850 min-h-[480px]">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-black tracking-widest text-emerald-400 uppercase flex items-center">
                <Globe size={14} className="mr-1.5 animate-spin" style={{ animationDuration: '6s' }} />
                Website Lead Webhook Simulator
              </span>
              <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 text-[9px] font-bold rounded-md">
                LIVE WEBHOOK
              </span>
            </div>

            <p className="text-slate-400 text-xs mt-3 leading-relaxed">
              Test how a client form submission on our external, static website triggers a row insert in the Admin Dashboard database in real-time.
            </p>

            {/* Simulated website state: Submitting */}
            {isSimulatingRedirect ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-4">
                <div className="w-10 h-10 border-4 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin"></div>
                <p className="text-xs text-slate-300 font-medium">Forwarding payload: POST /api/webhooks/enquiries ...</p>
              </div>
            ) : hasSubmitted ? (
              /* Simulated website redirect page: Success Screen */
              <div className="py-8 text-center space-y-4 animate-in fade-in duration-300">
                <div className="w-12 h-12 bg-emerald-950 border border-emerald-700 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-100">Our officials will call you soon!</h4>
                  <p className="text-slate-400 text-[11px] mt-1 leading-normal max-w-[200px] mx-auto">
                    Your enquiry was successfully routed to our sales department.
                  </p>
                </div>

                <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 text-[10px] text-emerald-400 font-mono text-left max-w-[240px] mx-auto space-y-1">
                  <div>// Simulated Webhook Event Hook</div>
                  <div>Status: 201 Created</div>
                  <div>Redirect URL: /thank-you</div>
                </div>

                <button
                  onClick={handleResetForm}
                  className="px-4 py-2 border border-slate-700 text-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
                >
                  Submit Another Lead
                </button>
              </div>
            ) : (
              /* Simulated client form inputs */
              <form onSubmit={handleSimulateSubmit} className="mt-4 space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Lead Name *</label>
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="e.g. Priyanshu Sinha"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Phone Number *</label>
                    <input
                      type="text"
                      required
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      placeholder="+91 95555 44444"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Channel Source</label>
                    <select
                      value={clientSource}
                      onChange={(e) => setClientSource(e.target.value as EnquirySource)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-400 focus:outline-none focus:text-slate-100"
                    >
                      <option value="Website">🌐 Static Website</option>
                      <option value="WhatsApp">💬 Direct WhatsApp link</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Email Address</label>
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="priyanshu@gmail.com"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Custom Signage Request (Notes)</label>
                  <textarea
                    rows={2}
                    value={clientNotes}
                    onChange={(e) => setClientNotes(e.target.value)}
                    placeholder="Acrylic letters logo required for reception counter..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-emerald-500 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-md hover:shadow-lg flex items-center justify-center space-x-1.5 cursor-pointer mt-1"
                >
                  <Send size={13} />
                  <span>Submit Webhook enquiry</span>
                </button>
              </form>
            )}
          </div>

          <div className="border-t border-slate-800 pt-3 text-[10px] text-slate-500 flex items-center justify-between">
            <span>Integration type: Client-Side Redirect Hook</span>
            <ChevronRight size={12} className="text-slate-700" />
          </div>
        </div>

      </div>
    </div>
  );
};
