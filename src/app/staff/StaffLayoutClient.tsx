"use client";

import React, { useState } from "react";
import { 
  Bell, CheckCircle, AlertCircle, Info, LogOut,
  History, RotateCcw, Lock, Loader2, Key
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { signOut, updateUserPassword } from "@/app/actions/authActions";

interface StaffLayoutClientProps {
  children: React.ReactNode;
  profile: {
    id: string;
    name: string;
    email: string;
    role: string;
    staff_role: string;
  };
}

export function StaffLayoutClient({ children, profile }: StaffLayoutClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isWorksheetPage = pathname.startsWith("/staff/orders/") && pathname !== "/staff/orders";

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  // Layout-scoped in-memory notifications
  const [notifications, setNotifications] = useState<any[]>([
    {
      id: "NOT-1",
      title: "SLA Warning: Action Required",
      message: "Lead Rohan Varma has been pending without site visit for 50h. Escalate to call immediately.",
      time: "2 hours ago",
      type: "error",
      read: false
    },
    {
      id: "NOT-2",
      title: "SLA Warning: WhatsApp Follow-up",
      message: "Lead Amit Sharma has been pending for 25h. Triggering WhatsApp alert.",
      time: "4 hours ago",
      type: "warning",
      read: false
    },
    {
      id: "NOT-3",
      title: "New Webhook Submission",
      message: "New website enquiry logged automatically for Sneha Reddy.",
      time: "1 hour ago",
      type: "success",
      read: true
    }
  ]);

  // Layout-scoped in-memory activities
  const [activities, setActivities] = useState<any[]>([]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const undoActivity = (activityId: string) => {
    setActivities(prev => prev.filter(a => a.id !== activityId));
  };

  const handleLogout = async () => {
    await signOut();
    router.push("/staff/login");
  };

  const navItems = [
    { id: "/staff/orders", label: "Tasks" },
  ] as const;

  const isActivePath = (itemPath: string) => {
    if (itemPath === "/staff/orders") {
      return pathname === "/staff/orders" || pathname === "/staff";
    }
    return pathname.startsWith(itemPath);
  };

  const initials = profile.name
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    setIsSubmittingPassword(true);
    try {
      const res = await updateUserPassword(newPassword);
      if (res.error) {
        setPasswordError(res.error);
      } else {
        setPasswordSuccess("Password updated successfully!");
        setTimeout(() => {
          setIsChangePasswordModalOpen(false);
          setNewPassword("");
          setConfirmPassword("");
        }, 1500);
      }
    } catch (err: any) {
      setPasswordError(err.message || "An error occurred.");
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--color-background)" }}>
      {/* ── MAIN WORKSPACE ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        
        {/* Workspace Top Row */}
        {!isWorksheetPage && (
          <header style={{ display: "flex", alignItems: "center", width: "100%", height: "56px", background: "white", borderBottom: "1px solid #e2e8f0", paddingLeft: "32px", paddingRight: "32px", position: "sticky", top: 0, zIndex: 40 }}>
            {/* Logo & Portal Role Indicator */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginRight: "32px", flexShrink: 0 }}>
              <div style={{ width: "28px", height: "28px", background: "#0F172A", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg viewBox="0 0 24 24" style={{ width: "14px", height: "14px", color: "#018F10" }} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 20h18" /><path d="M6 20V11" />
                  <circle cx="6" cy="11" r="1" fill="#018F10" />
                  <path d="M6 11l6-4.5" />
                  <circle cx="12" cy="6.5" r="1" fill="#018F10" />
                  <path d="M12 6.5l5 3.5" />
                </svg>
              </div>
              <div style={{ display: "flex", flexDirection: "column", lineHeight: "1" }}>
                <span style={{ fontSize: "13px", fontWeight: "800", color: "#0F172A", letterSpacing: "0.03em" }}>PRINTEC</span>
                <span style={{ fontSize: "9px", color: "#018F10", fontWeight: "700", textTransform: "uppercase", marginTop: "1px" }}>Staff Portal</span>
              </div>
            </div>

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
                      borderBottom: isActive ? "3px solid #018F10" : "none",
                      color: isActive ? "#018F10" : "#64748b",
                      fontSize: "14px",
                      fontWeight: isActive ? "700" : "600",
                      cursor: "pointer",
                      padding: "0",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      transition: "all 0.2s",
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
                    {initials}
                  </div>
                  <div className="hidden lg:block text-left">
                    <p className="text-body-md font-bold leading-tight">{profile.name}</p>
                    <p className="text-[10px] uppercase font-bold text-[var(--color-on-surface-variant)]">{profile.staff_role || "Field Agent"}</p>
                  </div>
                </button>
                {isProfileOpen && (
                  <>
                    <div style={{ position: "fixed", inset: 0, zIndex: 49 }} onClick={() => setIsProfileOpen(false)} />
                    <div className="prt-animate-in" style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", width: 180, background: "white", border: "1px solid var(--border)", borderRadius: "var(--radius-xl)", boxShadow: "var(--shadow-pop)", zIndex: 50, overflow: "hidden", padding: 4 }}>
                      <button
                        onClick={() => { setIsChangePasswordModalOpen(true); setIsProfileOpen(false); setPasswordError(""); setPasswordSuccess(""); setNewPassword(""); setConfirmPassword(""); }}
                        style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: "var(--radius-md)", fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", background: "none", border: "none", cursor: "pointer", transition: "background 0.15s", textAlign: "left" }}
                      >
                        <Key size={14} />
                        Change Password
                      </button>
                      <div style={{ height: 1, background: "var(--border)", margin: "4px 0" }} />
                      <button
                        onClick={handleLogout}
                        style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: "var(--radius-md)", fontSize: 13, fontWeight: 600, color: "#EF4444", background: "none", border: "none", cursor: "pointer", transition: "background 0.15s", textAlign: "left" }}
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
        )}

        <main style={{ flex: 1, display: "flex", flexDirection: "column", background: "var(--color-background)" }}>
          <div style={isWorksheetPage ? { width: "100%", display: "flex", flexDirection: "column", flex: 1 } : { maxWidth: 1280, margin: "0 auto" }}>
            {children}
          </div>
        </main>
      </div>

      {isChangePasswordModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "white", width: "100%", maxWidth: "400px", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)", padding: "24px" }} className="prt-animate-in">
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", color: "#018F10" }}>
                <Lock size={16} />
              </div>
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#0F172A", margin: 0 }}>Change Password</h3>
                <p style={{ fontSize: "11px", color: "#64748B", margin: 0 }}>Update your staff portal password credentials</p>
              </div>
            </div>

            {passwordError && (
              <div style={{ marginBottom: "12px", padding: "8px 12px", background: "#FFF1F2", border: "1px solid #FECDD3", borderRadius: "6px", fontSize: "12px", color: "#BE123C", fontWeight: "600" }}>
                {passwordError}
              </div>
            )}

            {passwordSuccess && (
              <div style={{ marginBottom: "12px", padding: "8px 12px", background: "#DCFCE7", border: "1px solid #BBF7D0", borderRadius: "6px", fontSize: "12px", color: "#16A34A", fontWeight: "600" }}>
                {passwordSuccess}
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#475569", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>New Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{ width: "100%", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "13px", padding: "8px 12px", outline: "none" }}
                  placeholder="Minimum 6 characters"
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#475569", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{ width: "100%", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "13px", padding: "8px 12px", outline: "none" }}
                  placeholder="Repeat new password"
                />
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={() => setIsChangePasswordModalOpen(false)}
                  disabled={isSubmittingPassword}
                  style={{ flex: 1, padding: "8px 16px", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "12px", fontWeight: "700", color: "#475569", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPassword}
                  style={{ flex: 1, padding: "8px 16px", background: "#018F10", border: "none", borderRadius: "8px", fontSize: "12px", fontWeight: "700", color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                >
                  {isSubmittingPassword ? <Loader2 size={14} style={{ animation: "prt-spin 1s linear infinite" }} /> : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
