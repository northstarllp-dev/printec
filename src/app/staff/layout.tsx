"use client";

import React, { useState } from "react";
import { 
  Bell, CheckCircle, AlertCircle, Info, LogOut,
  Calendar, ClipboardList, PhoneCall, User, History,
  RotateCcw, Menu
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useDashboard } from "@/context/DashboardContext";

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { 
    notifications, 
    markAllNotificationsRead, 
    clearNotifications,
    isAuthenticated, 
    logout, 
    currentUserRole,
    activities, 
    undoActivity,
    selectedOrderForWorksheet
  } = useDashboard();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // If we are on the login page, don't show the layout header
  if (pathname === "/staff/login") {
    return <>{children}</>;
  }

  if (!isAuthenticated || currentUserRole !== "Employee") {
    return (
      <div style={{ minHeight:"100vh", background:"#0F172A", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16 }}>
        <div style={{ width:36, height:36, border:"3px solid #22C55E", borderTopColor:"transparent", borderRadius:"50%", animation:"prt-spin 0.8s linear infinite" }} />
        <span style={{ fontSize:13, color:"#64748B" }}>Redirecting to Staff Portal…</span>
      </div>
    );
  }

  if (selectedOrderForWorksheet) {
    return (
      <div style={{ display: "flex", minHeight: "100vh", background: "var(--color-background)", width: "100%" }}>
        {children}
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  const navItems = [
    { id: "/staff/orders", label: "Tasks" },
    { id: "/staff/enquire", label: "Enquire" },
    { id: "/staff/team", label: "Team" },
  ] as const;

  const isActivePath = (itemPath: string) => {
    if (itemPath === "/staff/orders") {
      return pathname === "/staff/orders" || pathname === "/staff";
    }
    return pathname.startsWith(itemPath);
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--color-background)" }}>
      {/* ── MAIN WORKSPACE ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        
        {/* Workspace Top Row */}
        <header style={{ display: "flex", alignItems: "center", width: "100%", height: "56px", background: "white", borderBottom: "1px solid #e2e8f0", paddingLeft: "32px", paddingRight: "32px", position: "sticky", top: 0, zIndex: 40 }}>
          <nav style={{ display: "flex", gap: "24px", height: "100%", alignItems: "center" }}>
            {navItems.map(item => {
              const isActive = isActivePath(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => router.push(item.id)}
                  style={{
                    background: "none",
                    border: "none",
                    borderBottom: isActive ? "3px solid #22c55e" : "none",
                    color: isActive ? "#22c55e" : "#64748b",
                    fontSize: "14px",
                    fontWeight: isActive ? "700" : "600",
                    cursor: "pointer",
                    padding: "0",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = "#0f172a";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = "#64748b";
                    }
                  }}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right: Actions + Profile */}
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: "auto" }}>
            {/* History */}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => { setIsHistoryOpen(p => !p); setIsNotifOpen(false); setIsProfileOpen(false); }}
                title="Action History"
                style={{ width: 34, height: 34, borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-secondary)", background: "none", border: "none", cursor: "pointer", transition: "all 0.15s" }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--surface-hover)")}
                onMouseLeave={e => (e.currentTarget.style.background = "none")}
              >
                <History size={16} />
              </button>
              {isHistoryOpen && (
                <>
                  <div style={{ position: "fixed", inset: 0, zIndex: 49 }} onClick={() => setIsHistoryOpen(false)} />
                  <div className="prt-animate-in" style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", width: 340, background: "white", border: "1px solid var(--border)", borderRadius: "var(--radius-xl)", boxShadow: "var(--shadow-pop)", zIndex: 50, overflow: "hidden" }}>
                    <div style={{ padding: "10px 16px", background: "var(--surface-container-low)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Operation History</span>
                      <span style={{ fontSize: 10, color: "var(--text-muted)" }}>Rollback enabled</span>
                    </div>
                    <div style={{ maxHeight: 280, overflowY: "auto" }}>
                      {activities.length === 0 ? (
                        <div style={{ padding: 24, textAlign: "center", fontSize: 12, color: "var(--text-muted)" }}>No actions recorded yet.</div>
                      ) : activities.map((act: any) => (
                        <div key={act.id} style={{ padding: "10px 16px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, borderBottom: "1px solid var(--background)" }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                              <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-primary)", background: "var(--surface-container-low)", padding: "1px 6px", borderRadius: 4 }}>{act.user}</span>
                              <span style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "monospace" }}>{act.timestamp}</span>
                            </div>
                            <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{act.description}</span>
                          </div>
                          <button
                            onClick={() => undoActivity(act.id)}
                            style={{ fontSize: 11, color: "var(--secondary-500)", background: "var(--secondary-container)", border: "1px solid var(--secondary-fixed)", padding: "3px 8px", borderRadius: "var(--radius-md)", cursor: "pointer", fontWeight: 700, display: "flex", alignItems: "center", gap: 4, flexShrink: 0, whiteSpace: "nowrap" }}
                          >
                            <RotateCcw size={10} />Undo
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Notifications */}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => { setIsNotifOpen(p => !p); setIsHistoryOpen(false); setIsProfileOpen(false); }}
                title="Notifications"
                style={{ width: 34, height: 34, borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-secondary)", background: "none", border: "none", cursor: "pointer", transition: "all 0.15s", position: "relative" }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--surface-hover)")}
                onMouseLeave={e => (e.currentTarget.style.background = "none")}
              >
                <Bell size={16} />
                {unreadCount > 0 && (
                  <span style={{ position: "absolute", top: 6, right: 6, width: 8, height: 8, background: "#EF4444", borderRadius: "50%", border: "2px solid white" }} />
                )}
              </button>
              {isNotifOpen && (
                <>
                  <div style={{ position: "fixed", inset: 0, zIndex: 49 }} onClick={() => setIsNotifOpen(false)} />
                  <div className="prt-animate-in" style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", width: 300, background: "white", border: "1px solid var(--border)", borderRadius: "var(--radius-xl)", boxShadow: "var(--shadow-pop)", zIndex: 50, overflow: "hidden" }}>
                    <div style={{ padding: "10px 16px", background: "var(--surface-container-low)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Notifications</span>
                      <div style={{ display: "flex", gap: 10 }}>
                        <button onClick={markAllNotificationsRead} style={{ fontSize: 11, color: "var(--secondary-500)", fontWeight: 700, background: "none", border: "none", cursor: "pointer" }}>Mark read</button>
                        <button onClick={clearNotifications} style={{ fontSize: 11, color: "#EF4444", fontWeight: 700, background: "none", border: "none", cursor: "pointer" }}>Clear</button>
                      </div>
                    </div>
                    <div style={{ maxHeight: 260, overflowY: "auto" }}>
                      {notifications.length === 0 ? (
                        <div style={{ padding: 24, textAlign: "center", fontSize: 12, color: "var(--text-muted)" }}>No notifications.</div>
                      ) : notifications.map((notif: any) => (
                        <div key={notif.id} style={{ padding: "10px 16px", display: "flex", alignItems: "flex-start", gap: 10, borderBottom: "1px solid var(--background)", background: notif.read ? "white" : "var(--surface-container-low)" }}>
                          <span style={{ marginTop: 1 }}>
                            {notif.type === "success" ? <CheckCircle size={13} color="var(--secondary-500)" /> :
                             notif.type === "error" || notif.type === "warning" ? <AlertCircle size={13} color="#EF4444" /> :
                             <Info size={13} color="var(--text-muted)" />}
                          </span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.3 }}>{notif.title}</div>
                            <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 2 }}>{notif.message}</div>
                            <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 3, fontFamily: "monospace" }}>{notif.time}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Profile */}
            <div className="flex items-center gap-3 cursor-pointer group ml-2 pl-4 border-l border-[var(--color-outline-variant)] relative">
              <button
                onClick={() => { setIsProfileOpen(p => !p); setIsNotifOpen(false); setIsHistoryOpen(false); }}
                className="flex items-center gap-3 bg-transparent border-none cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full border-2 border-[var(--color-primary-container)] bg-[var(--color-surface-container-high)] flex items-center justify-center font-bold text-[var(--color-primary)]">
                  AS
                </div>
                <div className="hidden lg:block text-left">
                  <p className="text-body-md font-bold leading-tight">Amit S.</p>
                  <p className="text-[10px] uppercase font-bold text-[var(--color-on-surface-variant)]">Field Agent</p>
                </div>
              </button>
              {isProfileOpen && (
                <>
                  <div style={{ position: "fixed", inset: 0, zIndex: 49 }} onClick={() => setIsProfileOpen(false)} />
                  <div className="prt-animate-in" style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", width: 180, background: "white", border: "1px solid var(--border)", borderRadius: "var(--radius-xl)", boxShadow: "var(--shadow-pop)", zIndex: 50, overflow: "hidden", padding: 4 }}>
                    <button
                      onClick={() => { logout(); router.push("/staff/login"); }}
                      style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: "var(--radius-md)", fontSize: 13, fontWeight: 600, color: "#EF4444", background: "none", border: "none", cursor: "pointer", transition: "background 0.15s", textAlign: "left" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#FFF1F2")}
                      onMouseLeave={e => (e.currentTarget.style.background = "none")}
                    >
                      <LogOut size={14} />
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Mobile Dropdown Menu */}
        {isMobileMenuOpen && (
          <div style={{ background: "white", borderBottom: "1px solid var(--border)", padding: "12px 24px", display: "flex", flexDirection: "column", gap: 2 }} className="show-mobile">
            {navItems.map(item => {
              const isActive = isActivePath(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => { router.push(item.id); setIsMobileMenuOpen(false); }}
                  style={{ textAlign: "left", padding: "8px 0", fontSize: 14, fontWeight: isActive ? 700 : 500, color: isActive ? "var(--secondary-500)" : "var(--text-secondary)", background: "none", border: "none", cursor: "pointer" }}
                >
                  {item.label}
                </button>
              );
            })}
            <div style={{ height: 1, background: "var(--border)", margin: "8px 0" }} />
            <button
              onClick={() => { logout(); router.push("/staff/login"); }}
              style={{ textAlign: "left", padding: "8px 0", fontSize: 14, fontWeight: 600, color: "#EF4444", background: "none", border: "none", cursor: "pointer" }}
            >
              Sign Out
            </button>
          </div>
        )}

        {/* Main Workspace Scroll Area */}
        <main style={{ flex: 1, overflowY: "auto", background: "var(--background)" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
            {children}
          </div>
        </main>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .hidden-mobile { display: none !important; }
        }
        @media (min-width: 769px) {
          .show-mobile { display: none !important; }
        }
      `}</style>
    </div>
  );
}
