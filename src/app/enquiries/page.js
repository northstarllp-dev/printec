"use client";

import React, { useState } from "react";
import { Plus, Search, Star, Filter } from "lucide-react";
import { useApp } from "@/app/context/store";
import styles from "./enquiries.module.css";

export default function EnquiriesPage() {
  const {
    enquiries,
    orders,
    employees,
    createEnquiry,
    assignEmployeeToOrder
  } = useApp();

  const [activeTab, setActiveTab] = useState("enquiries");

  // Search & Filters state
  const [searchTerm, setSearchTerm] = useState("");
  const [sourceFilter, setSourceFilter] = useState("All");

  // Modals state
  const [addEnquiryOpen, setAddEnquiryOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedEnquiryForAssign, setSelectedEnquiryForAssign] = useState(null);
  const [checkedEmployees, setCheckedEmployees] = useState([]);

  // Form state
  const [newEnquiryForm, setNewEnquiryForm] = useState({
    projectName: "",
    customerName: "",
    source: "Website",
    budget: "",
    email: "",
    phone: "",
    date: "2026-06-12"
  });

  // Gamified Referral calculations
  const calculateReferrals = () => {
    const counts = {};
    employees.forEach(emp => { counts[emp] = { count: 0, budget: 0 }; });

    orders.forEach(o => {
      if (counts[o.referredBy]) {
        counts[o.referredBy].count += 1;
        counts[o.referredBy].budget += o.budget;
      }
    });

    return Object.entries(counts).map(([name, stats]) => ({
      name,
      leads: stats.count,
      value: stats.budget,
      bonus: stats.count * 1000 + Math.floor(stats.budget * 0.02)
    })).sort((a, b) => b.leads - a.leads);
  };

  const referralData = calculateReferrals();

  // Filter lists
  const filteredEnquiries = enquiries.filter(e => {
    const matchSearch = e.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        e.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        e.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchSource = sourceFilter === "All" || e.source === sourceFilter;
    return matchSearch && matchSource;
  });

  // Lookup assigned employees from corresponding order
  const getAssignedEmployeesForEnquiry = (enquiryId) => {
    const matchedOrder = orders.find((o) => o.id === enquiryId);
    return matchedOrder ? matchedOrder.assignedEmployees : [];
  };

  // Open assign modal
  const openAssignModal = (enquiry) => {
    setSelectedEnquiryForAssign(enquiry);
    const assigned = getAssignedEmployeesForEnquiry(enquiry.id);
    setCheckedEmployees(assigned);
    setAssignModalOpen(true);
  };

  const handleSaveAssign = () => {
    if (selectedEnquiryForAssign) {
      assignEmployeeToOrder(selectedEnquiryForAssign.id, checkedEmployees);
    }
    setAssignModalOpen(false);
    setSelectedEnquiryForAssign(null);
  };

  const handleEmployeeCheckbox = (name) => {
    setCheckedEmployees(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  // Submit Enquiry
  const handleCreateEnquirySubmit = (e) => {
    e.preventDefault();
    if (
      !newEnquiryForm.projectName ||
      !newEnquiryForm.customerName ||
      !newEnquiryForm.budget ||
      !newEnquiryForm.email ||
      !newEnquiryForm.phone
    ) {
      alert("Please fill in all fields.");
      return;
    }

    createEnquiry({
      projectName: newEnquiryForm.projectName,
      customerName: newEnquiryForm.customerName,
      source: newEnquiryForm.source,
      budget: Number(newEnquiryForm.budget),
      email: newEnquiryForm.email,
      phone: newEnquiryForm.phone,
      date: newEnquiryForm.date,
      status: "Enquired"
    });

    setNewEnquiryForm({
      projectName: "",
      customerName: "",
      source: "Website",
      budget: "",
      email: "",
      phone: "",
      date: "2026-06-12"
    });
    setAddEnquiryOpen(false);
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className={styles.container}>
      {/* Top Banner */}
      <div className={styles.topBar}>
        <div className={styles.titleContainer}>
          <h1 className={styles.title}>Enquiries Directory</h1>
          <p className={styles.subtitle}>
            Manage incoming customer inquiries and trigger automated notifications
          </p>
        </div>
        <div className={styles.actionButtons}>
          <button className={styles.btnPrimary} onClick={() => setAddEnquiryOpen(true)}>
            <Plus size={16} /> Add Enquiry
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabsContainer}>
        <button
          className={`${styles.tabButton} ${activeTab === "enquiries" ? styles.activeTabButton : ""}`}
          onClick={() => { setActiveTab("enquiries"); setSearchTerm(""); }}
        >
          Enquiries List
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === "referrals" ? styles.activeTabButton : ""}`}
          onClick={() => setActiveTab("referrals")}
        >
          Referral Leaderboard
        </button>
      </div>

      {/* ENQUIRIES TAB */}
      {activeTab === "enquiries" && (
        <>
          <div className={styles.controlsSection}>
            <div className={styles.searchWrapper}>
              <Search size={16} className={styles.searchIcon} />
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Search enquiries..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className={styles.filterSelect}
              value={sourceFilter}
              onChange={e => setSourceFilter(e.target.value)}
            >
              <option value="All">All Lead Sources</option>
              <option value="Website">Website</option>
              <option value="Reference">Reference</option>
              <option value="Google Maps">Google Maps</option>
              <option value="Cold Call">Cold Call</option>
            </select>
          </div>

          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Project Description</th>
                  <th>Client Contact Info</th>
                  <th>Source</th>
                  <th>Est. Budget</th>
                  <th>Staff Assignments</th>
                </tr>
              </thead>
              <tbody>
                {filteredEnquiries.map(e => {
                  const assigned = getAssignedEmployeesForEnquiry(e.id);
                  return (
                    <tr key={e.id}>
                      <td>{e.date}</td>
                      <td>
                        <div className={styles.projectNameCol}>
                          <span className={styles.projectName}>{e.projectName}</span>
                          <span className={styles.projectId}>Generated ID: {e.id}</span>
                        </div>
                      </td>
                      <td>
                        <div className={styles.contactDetails}>
                          <span className={styles.contactUnmasked}>{e.customerName}</span>
                          <span>{e.email}</span>
                          <span>{e.phone}</span>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-enquiry">{e.source}</span>
                      </td>
                      <td style={{ fontWeight: 700 }}>{formatCurrency(e.budget)}</td>
                      <td>
                        {assigned.length > 0 ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                            <div style={{ display: "flex", gap: "4px" }}>
                              {assigned.map((emp, i) => (
                                <span key={i} className="initialCircle" style={{ width: "24px", height: "24px", fontSize: "10px" }} title={emp}>
                                  {emp.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                                </span>
                              ))}
                            </div>
                            <span style={{ fontSize: "11px", color: "var(--neutral)", textDecoration: "underline", cursor: "pointer" }} onClick={() => openAssignModal(e)}>
                              Edit Staff
                            </span>
                          </div>
                        ) : (
                          <button className={styles.btnPrimary} onClick={() => openAssignModal(e)} style={{ fontSize: "11px", padding: "6px 12px", width: "auto" }}>
                            Assign Employees
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* SALES REFERRAL REWARDS */}
      {activeTab === "referrals" && (
        <div className={styles.tableContainer}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--neutral-border)" }}>
            <h2 style={{ fontSize: "16px", fontWeight: "800", display: "flex", alignItems: "center", gap: "8px" }}>
              <Star size={18} style={{ color: "gold" }} /> Internal Employee Referral Leaderboard
            </h2>
          </div>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Employee Name</th>
                <th>Referred Leads</th>
                <th>Total Project Volume</th>
                <th>Accumulated Bonus Commission</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {referralData.map((emp, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 700 }}>{emp.name}</td>
                  <td>{emp.leads}</td>
                  <td>{formatCurrency(emp.value)}</td>
                  <td style={{ color: "var(--secondary)", fontWeight: 700 }}>{formatCurrency(emp.bonus)}</td>
                  <td>
                    {i === 0 ? "🥇 Gold Partner" : i === 1 ? "🥈 Silver Partner" : "🥉 Bronze Member"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ADD ENQUIRY MODAL */}
      {addEnquiryOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Add New Enquiry</h2>
              <button className={styles.modalClose} onClick={() => setAddEnquiryOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateEnquirySubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Project / Banner Type</label>
                <input
                  type="text"
                  className={styles.formInput}
                  placeholder="e.g. Wall vinyl branding"
                  value={newEnquiryForm.projectName}
                  onChange={e => setNewEnquiryForm({ ...newEnquiryForm, projectName: e.target.value })}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Client / Company Name</label>
                <input
                  type="text"
                  className={styles.formInput}
                  placeholder="e.g. Metro Retailers"
                  value={newEnquiryForm.customerName}
                  onChange={e => setNewEnquiryForm({ ...newEnquiryForm, customerName: e.target.value })}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Email Address</label>
                <input
                  type="email"
                  className={styles.formInput}
                  placeholder="e.g. client@example.com"
                  value={newEnquiryForm.email}
                  onChange={e => setNewEnquiryForm({ ...newEnquiryForm, email: e.target.value })}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>WhatsApp / Phone</label>
                <input
                  type="tel"
                  className={styles.formInput}
                  placeholder="e.g. +91 98765 43210"
                  value={newEnquiryForm.phone}
                  onChange={e => setNewEnquiryForm({ ...newEnquiryForm, phone: e.target.value })}
                  required
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Lead Source</label>
                  <select
                    className={styles.formSelect}
                    value={newEnquiryForm.source}
                    onChange={e => setNewEnquiryForm({ ...newEnquiryForm, source: e.target.value })}
                  >
                    <option value="Website">Website</option>
                    <option value="Reference">Reference</option>
                    <option value="Google Maps">Google Maps</option>
                    <option value="Cold Call">Cold Call</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Est. Budget (INR)</label>
                  <input
                    type="number"
                    className={styles.formInput}
                    value={newEnquiryForm.budget}
                    onChange={e => setNewEnquiryForm({ ...newEnquiryForm, budget: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Enquiry Date</label>
                <input
                  type="date"
                  className={styles.formInput}
                  value={newEnquiryForm.date}
                  onChange={e => setNewEnquiryForm({ ...newEnquiryForm, date: e.target.value })}
                  required
                />
              </div>
              <div className={styles.modalActions}>
                <button type="button" className={styles.btnSecondary} onClick={() => setAddEnquiryOpen(false)}>Cancel</button>
                <button type="submit" className={styles.btnPrimary}>Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSIGN EMPLOYEES MODAL */}
      {assignModalOpen && selectedEnquiryForAssign && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Assign Employees</h2>
              <button className={styles.modalClose} onClick={() => setAssignModalOpen(false)}>✕</button>
            </div>
            <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
              Select team members for {selectedEnquiryForAssign.projectName} ({selectedEnquiryForAssign.id}):
            </p>
            <div className={styles.employeesList}>
              {employees.map(emp => {
                const isChecked = checkedEmployees.includes(emp);
                return (
                  <div
                    key={emp}
                    className={`${styles.employeeCheckItem} ${isChecked ? styles.employeeChecked : ""}`}
                    onClick={() => handleEmployeeCheckbox(emp)}
                  >
                    <input type="checkbox" className={styles.employeeCheckbox} checked={isChecked} readOnly />
                    <span className={styles.employeeName}>{emp}</span>
                  </div>
                );
              })}
            </div>
            <div className={styles.modalActions}>
              <button type="button" className={styles.btnSecondary} onClick={() => setAssignModalOpen(false)}>Cancel</button>
              <button type="button" className={styles.btnPrimary} onClick={handleSaveAssign}>Save Assignments</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
