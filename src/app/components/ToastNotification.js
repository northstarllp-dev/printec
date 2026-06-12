"use client";

import React from "react";
import { X, Send, MessageSquare, Mail, CheckCircle2 } from "lucide-react";
import { useApp } from "@/app/context/store";
import styles from "./ToastNotification.module.css";

export default function ToastNotification() {
  const { activeToast, setActiveToast } = useApp();

  if (!activeToast) return null;

  return (
    <div className={styles.toastContainer}>
      <div className={styles.toastHeader}>
        <div className={styles.toastTitle}>
          <Send size={16} className={styles.iconWhatsapp} />
          <span>Automated Notifications Dispatched</span>
        </div>
        <button
          className={styles.toastClose}
          onClick={() => setActiveToast(null)}
          aria-label="Close notification"
        >
          <X size={16} />
        </button>
      </div>

      <div className={styles.toastBody}>
        Customer <span style={{ fontWeight: 700 }}>{activeToast.customerName}</span> has been notified for Enquiry/Order <span style={{ fontFamily: "monospace", fontWeight: "bold" }}>{activeToast.id}</span>.
      </div>

      <div className={styles.toastDivider} />

      <div className={styles.notificationItems}>
        <div className={styles.notificationItem}>
          <MessageSquare size={14} className={styles.iconWhatsapp} />
          <div>
            WhatsApp Sent to <span className={styles.recipientText}>{activeToast.phone}</span>
            <div style={{ color: "var(--neutral)", fontSize: "11px", display: "flex", alignItems: "center", gap: "2px", marginTop: "2px" }}>
              <CheckCircle2 size={10} style={{ color: "#16A34A" }} /> Delivered & Read
            </div>
          </div>
        </div>

        <div className={styles.notificationItem}>
          <Mail size={14} className={styles.iconEmail} />
          <div>
            Email Sent to <span className={styles.recipientText}>{activeToast.email}</span>
            <div style={{ color: "var(--neutral)", fontSize: "11px", display: "flex", alignItems: "center", gap: "2px", marginTop: "2px" }}>
              <CheckCircle2 size={10} style={{ color: "#16A34A" }} /> Delivered to inbox
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
