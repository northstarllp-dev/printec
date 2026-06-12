"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Mail, MessageSquare, PhoneCall, Printer, CheckCircle } from "lucide-react";
import { useApp } from "@/app/context/store";
import styles from "./NavigationHeader.module.css";

export default function NavigationHeader() {
  const pathname = usePathname();
  const { notificationLogs } = useApp();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const popoverRef = useRef(null);

  // Close popover if clicked outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setPopoverOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className={styles.header}>
      <div className={styles.leftSection}>
        <Link href="/" className={styles.logoContainer}>
          <span className={styles.logoIcon}>
            <Printer size={24} strokeWidth={2.5} />
          </span>
          <span>PRINTEC</span>
        </Link>

        <nav className={styles.navLinks}>
          <Link
            href="/"
            className={`${styles.navLink} ${pathname === "/" ? styles.activeNavLink : ""}`}
          >
            Orders
          </Link>
          <Link
            href="/enquiries"
            className={`${styles.navLink} ${pathname === "/enquiries" ? styles.activeNavLink : ""}`}
          >
            Enquiries
          </Link>
        </nav>
      </div>

      <div className={styles.rightSection}>
        {/* Notification Bell */}
        <div className={styles.notificationWrapper} ref={popoverRef}>
          <button
            className={styles.iconButton}
            onClick={() => setPopoverOpen(!popoverOpen)}
            aria-label="View notifications"
          >
            <Bell size={20} />
            {notificationLogs.length > 0 && <span className={styles.badge} />}
          </button>

          {popoverOpen && (
            <div className={styles.popover}>
              <div className={styles.popoverHeader}>
                <h3 className={styles.popoverTitle}>Automated Message Logs</h3>
                <span className={styles.clearButton}>Simulated Output</span>
              </div>
              <div className={styles.popoverContent}>
                {notificationLogs.length === 0 ? (
                  <div className={styles.emptyLogs}>
                    <p>No messages sent yet.</p>
                    <p style={{ fontSize: "11px", marginTop: "4px", color: "var(--neutral)" }}>
                      Create an enquiry to trigger automated WhatsApp and Email notifications.
                    </p>
                  </div>
                ) : (
                  notificationLogs.map((log) => (
                    <div key={log.id} className={styles.logItem}>
                      <div className={styles.logMeta}>
                        <span
                          className={`${styles.logTypeBadge} ${
                            log.type === "whatsapp" ? styles.logWhatsapp : styles.logEmail
                          }`}
                        >
                          {log.type === "whatsapp" ? (
                            <>
                              <MessageSquare size={10} style={{ marginRight: "2px" }} /> WhatsApp
                            </>
                          ) : (
                            <>
                              <Mail size={10} style={{ marginRight: "2px" }} /> Email
                            </>
                          )}
                        </span>
                        <span className={styles.logTime}>{log.timestamp}</span>
                      </div>
                      <div className={styles.logRecipient}>
                        To: {log.recipient}
                      </div>
                      <div className={styles.logBody}>{log.content}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "10px", color: "#16A34A", fontWeight: "600" }}>
                        <CheckCircle size={10} /> {log.status}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Info */}
        <div className={styles.userProfile}>
          <svg
            className={styles.avatar}
            width="40"
            height="40"
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="20" cy="20" r="20" fill="#0F172A" />
            <path
              d="M20 21C23.866 21 27 17.866 27 14C27 10.134 23.866 7 20 7C16.134 7 13 10.134 13 14C13 17.866 16.134 21 20 21Z"
              fill="#E2E8F0"
            />
            <path
              d="M32 32.5C32 27.8056 26.6274 24 20 24C13.3726 24 8 27.8056 8 32.5"
              stroke="#E2E8F0"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
          <div className={styles.userInfo}>
            <span className={styles.userName}>Rajesh K.</span>
            <span className={styles.userRole}>Project Admin</span>
          </div>
        </div>
      </div>
    </header>
  );
}
