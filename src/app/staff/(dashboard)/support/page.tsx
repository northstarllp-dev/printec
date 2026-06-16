import React from "react";
import { LifeBuoy, Send, MessageSquare, AlertCircle } from "lucide-react";

export default function StaffSupportPage() {
  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <LifeBuoy className="text-blue-600" /> Support Desk
        </h1>
        <p className="text-sm text-slate-500 mt-1">Submit internal tickets, request site visit equipment, or contact administrator directly.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Form */}
        <div className="md:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <h2 className="text-sm font-bold text-slate-800 mb-4">Create New Ticket</h2>
          <form className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Issue Subject</label>
              <input 
                type="text" 
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                placeholder="e.g. Scaffolding requirement for A007" 
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Category</label>
              <select className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white">
                <option>Site Audit Equipment</option>
                <option>Mobile App Bug / Sync issue</option>
                <option>Customer Dispute</option>
                <option>Other / Admin escalation</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Description</label>
              <textarea 
                rows={4}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 resize-none"
                placeholder="Specify details, relevant order ID, or contact person details..."
              />
            </div>
            <button 
              type="button" 
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors flex items-center gap-1.5"
            >
              <Send size={12} /> Submit Ticket
            </button>
          </form>
        </div>

        {/* Right Info */}
        <div className="space-y-6">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-2">
              <AlertCircle size={14} className="text-amber-500" /> Admin Escalations
            </h3>
            <p className="text-xs text-slate-650 leading-relaxed font-medium">
              If there is an urgent timeline issue on-site, call the coordinator at <strong className="text-slate-800">+91 99999 88888</strong>. Do not wait for ticket response.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-3">
              <MessageSquare size={14} className="text-blue-600" /> Ticket History
            </h3>
            <div className="space-y-3">
              <div className="border-b border-slate-100 pb-2">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mb-1">
                  <span>Category: Equipment</span>
                  <span className="text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Resolved</span>
                </div>
                <p className="text-xs text-slate-800 font-bold leading-snug">Scaffolding delivery for Sector 5 Site</p>
                <p className="text-[10px] text-slate-450 mt-1">Updated 2 days ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
