import React from "react";
import { Settings, Lock, Shield, Bell } from "lucide-react";

export default function StaffSettingsPage() {
  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <Settings className="text-slate-800" /> Settings
        </h1>
        <p className="text-sm text-slate-500 mt-1">Configure your notification alerts, update credentials, and check system security.</p>
      </div>

      <div className="space-y-6">
        {/* Profile Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 font-extrabold text-lg flex items-center justify-center">
              SP
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Staff Profile settings</h3>
              <p className="text-xs text-slate-500">Configure credentials & profile visibility parameters.</p>
            </div>
          </div>
          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">Field Agent</span>
        </div>

        {/* Change password helper info */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-3">
            <Lock size={16} className="text-slate-500" /> Account Password
          </h2>
          <p className="text-xs text-slate-650 leading-relaxed font-medium mb-4">
            To change your password, click your profile avatar in the top right header dropdown menu and select "Change Password".
          </p>
        </div>

        {/* Notification settings */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Bell size={16} className="text-slate-500" /> System Alerts
          </h2>
          <div className="space-y-3">
            {[
              { title: "SLA Deadline Warnings", desc: "Get notifications when site visit or quotation SLA thresholds are breached." },
              { title: "WhatsApp Alert Updates", desc: "Receive immediate pings when messages are dispatched to client portals." },
              { title: "Approval Status Notifications", desc: "Receive updates when administrative team approves your submitted worksheet stages." }
            ].map((pref, idx) => (
              <label key={idx} className="flex items-start justify-between gap-4 py-2 border-b border-slate-100 last:border-0 cursor-pointer">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">{pref.title}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">{pref.desc}</p>
                </div>
                <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/20 cursor-pointer accent-blue-600" />
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
