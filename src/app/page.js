"use client";

import React, { useState } from "react";
import { 
  Plus, Search, Shield, IndianRupee, Layers, Users, Star, 
  AlertTriangle, CheckCircle, Clock, Calendar, Camera, FileText, 
  Check, MapPin, Unlock, Lock, UploadCloud, Eye, EyeOff, 
  ArrowLeft, Download, HelpCircle, UserPlus, Hammer, Truck 
} from "lucide-react";
import { useApp } from "@/app/context/store";
import styles from "./page.module.css";

export default function AdminPage() {
  const {
    orders,
    enquiries,
    employees,
    createOrder,
    assignEmployeeToOrder,
    updateOrderStatus,
    toggleUrgency,
    siteMeasurements,
    designVersions,
    supportTickets,
    quoteVariants,
    maskText,
    maskPhone,
    addMeasurement,
    addDesignVersion,
    addDesignAnnotationComment,
    approveDesignForProduction,
    submitSupportTicket,
    updateTicketStatus,
    updateQuoteSelection,
    saveQuoteVariants,
    setInstallationSlot
  } = useApp();

  const [activeTab, setActiveTab] = useState("orders");

  // Search & Filters state
  const [searchTerm, setSearchTerm] = useState("");
  const [stageFilter, setStageFilter] = useState("All");

  // Modals state
  const [addOrderOpen, setAddOrderOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedOrderForAssign, setSelectedOrderForAssign] = useState(null);
  const [checkedEmployees, setCheckedEmployees] = useState([]);

  // Catalog CRUD state (mock)
  const [catalogItems, setCatalogItems] = useState([
    { id: "1", name: "ACP Sign Board (3D Letters)", baseCost: 450, unit: "sqft" },
    { id: "2", name: "Acrylic Sign Board (LED Lit)", baseCost: 650, unit: "sqft" },
    { id: "3", name: "LED Custom Letter Sign", baseCost: 850, unit: "sqft" },
    { id: "4", name: "Glow Sign Flex Panel Box", baseCost: 150, unit: "sqft" },
    { id: "5", name: "Vinyl Shop Branding", baseCost: 200, unit: "sqft" }
  ]);
  const [newCatalogForm, setNewCatalogForm] = useState({ name: "", baseCost: "", unit: "sqft" });

  // Form state for adding order
  const [newOrderForm, setNewOrderForm] = useState({
    projectName: "",
    customerName: "",
    status: "Site visit",
    budget: "",
    revenueCollected: "",
    date: "2026-06-12"
  });

  // Consolidated Workspace State
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [piiMaskOverride, setPiiMaskOverride] = useState(false);
  const [supportCenterOpen, setSupportCenterOpen] = useState(false);
  const [newTicketForm, setNewTicketForm] = useState({ issueType: "Wiring issue", description: "" });
  const [isEditingQuote, setIsEditingQuote] = useState(true);
  const [customVariants, setCustomVariants] = useState([]);
  const [customVarForm, setCustomVarForm] = useState({ name: "", spec: "", cost: "" });

  // Stage Specific States
  // Site Visit
  const [heightVal, setHeightVal] = useState("");
  const [widthVal, setWidthVal] = useState("");
  const [depthVal, setDepthVal] = useState("");
  const [backdropVal, setBackdropVal] = useState("Concrete wall");
  const [notesVal, setNotesVal] = useState("");
  const [uploadedPhotos, setUploadedPhotos] = useState({
    photos: false,
    wiring: false,
    mounting: false
  });

  // Quotation Calculator States
  const [selectedProductType, setSelectedProductType] = useState("Acrylic Sign Board (LED Lit)");
  const [customBaseCost, setCustomBaseCost] = useState("");
  const [selectedBacking, setSelectedBacking] = useState("None");
  const [selectedFrame, setSelectedFrame] = useState("None");
  const [laborSurcharge, setLaborSurcharge] = useState("0");
  const [discountVal, setDiscountVal] = useState("");
  const [paymentSplit, setPaymentSplit] = useState({
    advance: 40,
    production: 40,
    final: 20
  });
  const [variantCheckboxes, setVariantCheckboxes] = useState({
    premium: true,
    standard: true,
    budget: false
  });

  // Design Annotations & Upload States
  const [mockCommentText, setMockCommentText] = useState("");
  const [annotationCoords, setAnnotationCoords] = useState(null);
  const [newDesignFileName, setNewDesignFileName] = useState("");

  // Production Stage
  const [prodStation, setProdStation] = useState("Frame Fabrication");

  // Installation Stage
  const [addressOverrideUnlocked, setAddressOverrideUnlocked] = useState(false);
  const [selectedInstallDate, setSelectedInstallDate] = useState("2026-06-15");
  const [selectedInstallTime, setSelectedInstallTime] = useState("10:00 AM - 12:00 PM");
  const [uploadedProof, setUploadedProof] = useState(false);

  // Helper to load order detail states
  const handleViewOrder = (orderId) => {
    const o = orders.find(x => x.id === orderId);
    if (!o) return;
    
    setSelectedOrderId(orderId);
    
    // Set appropriate stepper active page based on order's current stage
    const statusMap = ["enquired", "site visit", "quotation", "design", "production", "installation", "order completed", "lost"];
    const statusIdx = statusMap.indexOf(o.status.toLowerCase());
    
    // Default active step inside workspace
    if (statusIdx >= 0 && statusIdx < 6) {
      setActiveStep(statusIdx);
    } else if (statusIdx === 6) {
      setActiveStep(5); // Show installation or complete
    } else {
      setActiveStep(0);
    }

    // Load measurements details
    const measurements = siteMeasurements[orderId];
    if (measurements) {
      setHeightVal(measurements.height || "");
      setWidthVal(measurements.width || "");
      setDepthVal(measurements.depth || "");
      setBackdropVal(measurements.backdrop || "Concrete wall");
      setNotesVal(measurements.notes || "");
      setUploadedPhotos({ photos: true, wiring: true, mounting: true });
    } else {
      setHeightVal("");
      setWidthVal("");
      setDepthVal("");
      setBackdropVal("Concrete wall");
      setNotesVal("");
      setUploadedPhotos({ photos: false, wiring: false, mounting: false });
    }

    // Load Quote Config details
    const variants = quoteVariants[orderId];
    if (variants) {
      setVariantCheckboxes({
        premium: !!variants.best,
        standard: !!variants.better,
        budget: !!variants.good
      });
      setCustomVariants(variants.custom || []);
      if (variants.params) {
        const p = variants.params;
        setSelectedProductType(p.productType || "Acrylic Sign Board (LED Lit)");
        setCustomBaseCost(p.customBaseCost !== undefined ? p.customBaseCost : "");
        setSelectedBacking(p.backing || "None");
        setSelectedFrame(p.frame || "None");
        setLaborSurcharge(p.labor || "0");
        setDiscountVal(p.discount || "");
        setPaymentSplit(p.paymentSplit || { advance: 40, production: 40, final: 20 });
        setVariantCheckboxes(p.variantCheckboxes || { premium: true, standard: true, budget: false });
        setIsEditingQuote(false);
      } else {
        setIsEditingQuote(true);
      }
    } else {
      setSelectedProductType("Acrylic Sign Board (LED Lit)");
      setCustomBaseCost("");
      setSelectedBacking("None");
      setSelectedFrame("None");
      setLaborSurcharge("0");
      setDiscountVal("");
      setPaymentSplit({ advance: 40, production: 40, final: 20 });
      setVariantCheckboxes({ premium: true, standard: true, budget: false });
      setCustomVariants([]);
      setIsEditingQuote(true);
    }

    // Reset temporary states
    setAnnotationCoords(null);
    setMockCommentText("");
    setNewDesignFileName("");
    setAddressOverrideUnlocked(false);
  };

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

  // Employee utilization grid calculations
  const calculateEmployeeUtilization = () => {
    return employees.map(emp => {
      const activeJobs = orders.filter(o => 
        o.assignedEmployees?.includes(emp) && 
        o.status !== "order completed" && 
        o.status !== "lost"
      ).length;
      
      let workload = "Available";
      let workloadColor = "#10B981"; // green
      if (activeJobs > 2) {
        workload = "Overloaded";
        workloadColor = "#EF4444"; // red
      } else if (activeJobs > 0) {
        workload = "Active";
        workloadColor = "#F59E0B"; // orange
      }

      return {
        name: emp,
        activeJobs,
        workload,
        workloadColor
      };
    });
  };

  const employeeUtilization = calculateEmployeeUtilization();

  // Operational alert blocks (stalled orders)
  const calculateStalledOrders = () => {
    return orders.filter(o => 
      (o.status.toLowerCase() === "enquired" || o.status.toLowerCase() === "site visit") && 
      o.assignedEmployees?.length === 0
    );
  };

  const stalledOrders = calculateStalledOrders();

  // Metrics
  const activeCount = orders.filter(o => o.status !== "order completed" && o.status !== "lost").length;
  const enquiriesCount = enquiries.length;
  const siteVisitsCount = orders.filter(o => o.status.toLowerCase() === "site visit").length;
  const quotationsCount = orders.filter(o => o.status.toLowerCase() === "quotation").length;
  const productionCount = orders.filter(o => o.status.toLowerCase() === "production").length;
  const lostCount = orders.filter(o => o.status.toLowerCase() === "lost").length;
  const revenueCollected = orders.reduce((sum, o) => sum + o.revenueCollected, 0);
  const revenueOutstanding = orders.reduce((sum, o) => sum + o.revenueOutstanding, 0);

  // Filter lists
  const filteredOrders = orders.filter(o => {
    const matchSearch = o.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        o.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStage = stageFilter === "All" || o.status.toLowerCase() === stageFilter.toLowerCase();
    return matchSearch && matchStage;
  });

  // Assign modals
  const openAssignModal = (order) => {
    setSelectedOrderForAssign(order);
    setCheckedEmployees(order.assignedEmployees || []);
    setAssignModalOpen(true);
  };

  const handleSaveAssign = () => {
    if (selectedOrderForAssign) {
      assignEmployeeToOrder(selectedOrderForAssign.id, checkedEmployees);
    }
    setAssignModalOpen(false);
    setSelectedOrderForAssign(null);
  };

  const handleEmployeeCheckbox = (name) => {
    setCheckedEmployees(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  // Submit Order
  const handleCreateOrder = (e) => {
    e.preventDefault();
    createOrder({
      projectName: newOrderForm.projectName,
      customerName: newOrderForm.customerName,
      status: newOrderForm.status,
      budget: Number(newOrderForm.budget) || 0,
      revenueCollected: Number(newOrderForm.revenueCollected) || 0,
      date: newOrderForm.date,
      assignedEmployees: []
    });
    setAddOrderOpen(false);
  };

  // Add Catalog Item (mock)
  const handleAddCatalogItem = (e) => {
    e.preventDefault();
    if (!newCatalogForm.name || !newCatalogForm.baseCost) return;
    const newItem = {
      id: Math.random().toString(36).substr(2, 9),
      name: newCatalogForm.name,
      baseCost: Number(newCatalogForm.baseCost),
      unit: newCatalogForm.unit
    };
    setCatalogItems(prev => [...prev, newItem]);
    setNewCatalogForm({ name: "", baseCost: "", unit: "sqft" });
    alert("New product category successfully added to database configuration catalog!");
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val);
  };

  // ORDER PROGRESSION ACTIONS
  const handleSaveSiteMeasurements = (e) => {
    e.preventDefault();
    if (!heightVal || !widthVal) {
      alert("Please enter Height and Width parameters.");
      return;
    }
    addMeasurement(selectedOrderId, {
      height: Number(heightVal),
      width: Number(widthVal),
      depth: Number(depthVal) || 0,
      backdrop: backdropVal,
      notes: notesVal
    });
    // Auto-complete site visit phase and prompt next step
    alert(`Site measurements successfully saved and synchronized across the system! Customer portal updated. Informing Marketing Team.`);
    updateOrderStatus(selectedOrderId, "Quotation");
  };

  const getCalculatedQuoteValues = () => {
    const o = orders.find(x => x.id === selectedOrderId);
    if (!o) return { basePrice: 0, modifications: 0, total: 0, finalNet: 0 };

    const measurements = siteMeasurements[selectedOrderId] || { height: 1, width: 1 };
    const area = (measurements.height || 1) * (measurements.width || 1);

    // Get Base cost
    const selectedItem = catalogItems.find(x => x.name.includes(selectedProductType)) || { baseCost: 650 };
    const baseRate = customBaseCost !== "" ? Number(customBaseCost) : selectedItem.baseCost;
    const basePrice = area * baseRate;

    // Modifiers
    let modifications = 0;
    if (selectedBacking === "Samsung LED Modules (+₹120/sqft)") modifications += 120 * area;
    if (selectedBacking === "IP67 LED Strips (+₹75/sqft)") modifications += 75 * area;
    
    if (selectedFrame === "Aluminum sheet profile (+₹80/sqft)") modifications += 80 * area;
    if (selectedFrame === "GI sheet backing (+₹45/sqft)") modifications += 45 * area;
    if (selectedFrame === "MS Frame (+₹30/sqft)") modifications += 30 * area;

    const total = basePrice + modifications + (Number(laborSurcharge) || 0);

    // Discount
    let net = total;
    if (discountVal) {
      if (discountVal.includes("%")) {
        const pct = Number(discountVal.replace("%", "")) || 0;
        net = total - (total * (pct / 100));
      } else {
        const amt = Number(discountVal) || 0;
        net = total - amt;
      }
    }

    return { basePrice, modifications, total, finalNet: Math.max(0, net) };
  };

  const quoteCalculations = selectedOrderId ? getCalculatedQuoteValues() : { basePrice: 0, modifications: 0, total: 0, finalNet: 0 };

  const handleGenerateQuoteProposal = () => {
    const totalPercentage = Number(paymentSplit.advance) + Number(paymentSplit.production) + Number(paymentSplit.final);
    if (totalPercentage !== 100) {
      alert(`Payment Split percentages must equal 100% (Currently: ${totalPercentage}%).`);
      return;
    }

    // Save customized quote variants
    const netCost = quoteCalculations.finalNet;
    const baseVariants = {
      best: variantCheckboxes.premium ? { name: "Best: Premium Acrylic (Glow Sign)", spec: `${selectedProductType} (Samsung LED Modules, Premium Frame finishes)`, cost: Math.round(netCost * 1.3) } : null,
      better: variantCheckboxes.standard ? { name: "Better: Standard Acrylic (Lit)", spec: `${selectedProductType} (Standard LEDs, Alupanel backing)`, cost: Math.round(netCost) } : null,
      good: variantCheckboxes.budget ? { name: "Good: Budget Vinyl Panel (Non-lit)", spec: `Vinyl Banner on MS structure (Non-lit)`, cost: Math.round(netCost * 0.5) } : null
    };

    const variants = {
      ...baseVariants,
      ...customVariants.reduce((acc, curr, index) => {
        acc[`custom_${index}`] = curr;
        return acc;
      }, {}),
      custom: customVariants,
      params: {
        productType: selectedProductType,
        customBaseCost,
        backing: selectedBacking,
        frame: selectedFrame,
        labor: laborSurcharge,
        discount: discountVal,
        paymentSplit,
        variantCheckboxes
      }
    };

    saveQuoteVariants(selectedOrderId, variants);
    setIsEditingQuote(false);
    
    // Set actual order budget & transition to design phase if currently in quotation
    alert("Quotation proposal generated and variants saved! The customer can now make their selection. The order's base budget has been updated.");
    if (activeOrderObj.status.toLowerCase() === "quotation") {
      updateOrderStatus(selectedOrderId, "Design");
    }
  };

  const handleUploadDesign = (e) => {
    e.preventDefault();
    if (!newDesignFileName) return;
    
    addDesignVersion(selectedOrderId, {
      fileName: newDesignFileName,
      uploadedBy: "Priya N. (Design Head)"
    });
    setNewDesignFileName("");
    alert("Design iteration mock successfully uploaded and queued for approval!");
  };

  const handleMockCanvasClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    setAnnotationCoords({ x, y });
  };

  const handleSaveAnnotation = () => {
    if (!mockCommentText || !annotationCoords) return;
    addDesignAnnotationComment(selectedOrderId, mockCommentText, annotationCoords.x, annotationCoords.y);
    setMockCommentText("");
    setAnnotationCoords(null);
    alert("Coordinate annotation feedback successfully saved directly onto design layout!");
  };

  const handleApproveDesign = () => {
    approveDesignForProduction(selectedOrderId);
    alert("Design approved! Project moved into production. Automated WhatsApp status notification dispatched to client.");
  };

  const handleUpdateProductionStatus = (e) => {
    setProdStation(e.target.value);
    if (e.target.value === "Packed & Ready") {
      updateOrderStatus(selectedOrderId, "Installation");
      alert("Signage marked Packed & Ready! Progression updated to Installation scheduling.");
    }
  };

  const handleScheduleInstallation = () => {
    setInstallationSlot(selectedOrderId, {
      date: selectedInstallDate,
      time: selectedInstallTime
    });
    alert(`Installation scheduled on ${selectedInstallDate} during ${selectedInstallTime}!`);
  };

  const handleMarkOrderCompleted = () => {
    updateOrderStatus(selectedOrderId, "order completed");
    alert("Congratulations! Order has been successfully completed, and full revenue recorded.");
    setSelectedOrderId(null);
  };

  // Support tickets helper
  const handleCreateSupportTicket = (e) => {
    e.preventDefault();
    if (!newTicketForm.description) return;
    submitSupportTicket(selectedOrderId, newTicketForm);
    setNewTicketForm({ issueType: "Wiring issue", description: "" });
    alert("Support ticket successfully registered with operations group!");
  };

  // Context objects for active order
  const activeOrderObj = selectedOrderId ? orders.find(x => x.id === selectedOrderId) : null;
  const activeMeasurementsObj = selectedOrderId ? siteMeasurements[selectedOrderId] : null;
  const activeDesignList = selectedOrderId ? (designVersions[selectedOrderId] || []) : [];
  const activeQuoteObj = selectedOrderId ? quoteVariants[selectedOrderId] : null;
  const activeTickets = selectedOrderId ? supportTickets.filter(t => t.orderId === selectedOrderId) : [];

  // Helper to determine masking
  const shouldMaskPII = () => {
    if (!activeOrderObj) return true;
    if (piiMaskOverride) return false; // Override clicked
    return false; // In admin page, admin has access, but let's offer the masking override to see it masked vs unmasked
  };

  return (
    <div className={styles.container}>
      {/* RENDER DETAILED CONSOLIDATED PROGRESSION WORKSPACE */}
      {selectedOrderId && activeOrderObj ? (
        <div className={styles.workspaceContainer}>
          {/* Header */}
          <div className={styles.workspaceHeader}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <button className={styles.btnSecondary} onClick={() => setSelectedOrderId(null)}>
                <ArrowLeft size={16} /> Back to Orders
              </button>
              <div>
                <h1 className={styles.workspaceTitle}>
                  Order #PRN-{activeOrderObj.id.substring(activeOrderObj.id.length - 8)}
                </h1>
                <p className={styles.workspaceSubtitle}>
                  Client: {shouldMaskPII() ? maskText(activeOrderObj.customerName, 2, 2) : activeOrderObj.customerName} | {activeOrderObj.projectName}
                </p>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              {/* PII Masking toggle for visual testing */}
              <button 
                className={`${styles.maskToggleBtn} ${piiMaskOverride ? styles.maskOverrideActive : ""}`}
                onClick={() => setPiiMaskOverride(!piiMaskOverride)}
                title="Toggle programmatic customer information masking"
              >
                {piiMaskOverride ? <Unlock size={14} /> : <Lock size={14} />}
                <span>{piiMaskOverride ? "PII Unmasked" : "PII Masked"}</span>
              </button>

              <button className={styles.btnSecondary} onClick={() => alert("Quote Proposal PDF generated for downloading!")}>
                <Download size={14} /> Download Proposal
              </button>
              
              <button className={styles.btnPrimary} onClick={() => setSupportCenterOpen(true)}>
                <HelpCircle size={14} /> Support Center ({activeTickets.length})
              </button>
            </div>
          </div>

          {/* Teams / HDFC-like Stepper Navigation */}
          <div className={styles.stepperContainer}>
            <div className={styles.stepperTrack}>
              {["Enquiries", "Site Visit", "Quotations", "Design", "Production", "Installation"].map((step, idx) => {
                const statusMap = ["enquired", "site visit", "quotation", "design", "production", "installation", "order completed"];
                const currentStatusIdx = statusMap.indexOf(activeOrderObj.status.toLowerCase());
                
                let isCompleted = idx < currentStatusIdx || activeOrderObj.status === "order completed";
                let isActive = idx === activeStep;
                
                return (
                  <div 
                    key={idx} 
                    className={`${styles.stepNode} ${isActive ? styles.stepNodeActive : ""} ${isCompleted ? styles.stepNodeCompleted : ""}`}
                    onClick={() => setActiveStep(idx)}
                  >
                    <div className={styles.stepCircle}>
                      {isCompleted ? <Check size={14} strokeWidth={3} /> : idx + 1}
                    </div>
                    <span className={styles.stepLabel}>{step}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Workspace Body */}
          <div className={styles.workspaceBody}>
            {/* Left/Center Main Content Section */}
            <div className={styles.workspaceMainContent}>
              {/* STEP 0: ENQUIRIES SECTION */}
              {activeStep === 0 && (
                <div className={styles.workspaceCard}>
                  <h2 className={styles.sectionTitle}><Users size={18} /> Enquiry Registration & Staff Details</h2>
                  
                  <div className={styles.detailGrid}>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Client Name</span>
                      <span className={styles.detailValue}>
                        {piiMaskOverride ? activeOrderObj.customerName : maskText(activeOrderObj.customerName, 2, 2)}
                      </span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Contact Email</span>
                      <span className={styles.detailValue}>
                        {piiMaskOverride ? "client@example.com" : "cl***@ex***.com"}
                      </span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Contact Phone</span>
                      <span className={styles.detailValue}>
                        {piiMaskOverride ? "+91 98765 43210" : maskPhone("+91 98765 43210")}
                      </span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Enquiry Date</span>
                      <span className={styles.detailValue}>{activeOrderObj.date}</span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Sourced/Referred By</span>
                      <span className={styles.detailValue} style={{ color: "var(--secondary)", fontWeight: "800" }}>
                        {activeOrderObj.referredBy}
                      </span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Assigned Staff</span>
                      <span className={styles.detailValue}>
                        {activeOrderObj.assignedEmployees?.length > 0 
                          ? activeOrderObj.assignedEmployees.join(", ") 
                          : "No staff assigned yet"}
                      </span>
                    </div>
                  </div>

                  <div style={{ marginTop: "24px", display: "flex", gap: "12px" }}>
                    <button className={styles.btnSecondary} onClick={() => openAssignModal(activeOrderObj)}>
                      <UserPlus size={16} /> Manage Assigned Staff
                    </button>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "13px", fontWeight: "700" }}>Modify Order Stage:</span>
                      <select 
                        value={activeOrderObj.status} 
                        onChange={(e) => updateOrderStatus(activeOrderObj.id, e.target.value)}
                        className={styles.formSelect}
                        style={{ width: "160px" }}
                      >
                        <option value="Enquired">Enquired</option>
                        <option value="Site visit">Site Visit</option>
                        <option value="Quotation">Quotation</option>
                        <option value="Design">Design</option>
                        <option value="Production">Production</option>
                        <option value="Installation">Installation</option>
                        <option value="order completed">Completed</option>
                        <option value="lost">Lost</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 1: SITE VISIT SECTION */}
              {activeStep === 1 && (
                <div className={styles.siteVisitContainer}>
                  {/* Teams-like Calendar Component */}
                  <div className={styles.workspaceCard}>
                    <h2 className={styles.sectionTitle}><Calendar size={18} /> Weekly Field Visits Schedule</h2>
                    
                    <div className={styles.teamsCalendar}>
                      <div className={styles.calendarHeaderRow}>
                        <div className={styles.calendarTimeCol}>Time</div>
                        {["Mon 12", "Tue 13", "Wed 14", "Thu 15", "Fri 16"].map((day, dIdx) => (
                          <div key={dIdx} className={styles.calendarDayCol}>{day}</div>
                        ))}
                      </div>

                      <div className={styles.calendarBody}>
                        <div className={styles.calendarTimeSlot}>
                          <div className={styles.timeLabel}>10:00 AM</div>
                          <div className={styles.slotBlock} />
                          <div className={styles.slotBlock}>
                            <div className={styles.calendarEvent} style={{ backgroundColor: "#EFF6FF", borderLeft: "4px solid #3B82F6", color: "#1E40AF" }}>
                              <strong>TechCorp Survey</strong><br/>Rajesh K.
                            </div>
                          </div>
                          <div className={styles.slotBlock} />
                          <div className={styles.slotBlock} />
                          <div className={styles.slotBlock} />
                        </div>
                        <div className={styles.calendarTimeSlot}>
                          <div className={styles.timeLabel}>01:00 PM</div>
                          <div className={styles.slotBlock} />
                          <div className={styles.slotBlock} />
                          <div className={styles.slotBlock} />
                          <div className={styles.slotBlock}>
                            <div className={styles.calendarEvent} style={{ backgroundColor: "#FAF5FF", borderLeft: "4px solid #8B5CF6", color: "#5B21B6" }}>
                              <strong>Atrium Layout Prep</strong><br/>Priya N.
                            </div>
                          </div>
                          <div className={styles.slotBlock} />
                        </div>
                        <div className={styles.calendarTimeSlot}>
                          <div className={styles.timeLabel}>04:00 PM</div>
                          <div className={styles.slotBlock}>
                            <div className={styles.calendarEvent} style={{ backgroundColor: "#ECFDF5", borderLeft: "4px solid #10B981", color: "#065F46" }}>
                              <strong>Vogue Storefront</strong><br/>Vikram J.
                            </div>
                          </div>
                          <div className={styles.slotBlock} />
                          <div className={styles.slotBlock} />
                          <div className={styles.slotBlock} />
                          <div className={styles.slotBlock} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* On-Site Media & Ingestion Matrix */}
                  <div className={styles.workspaceCard}>
                    <h2 className={styles.sectionTitle}><Camera size={18} /> On-Site Measurements & Backdrop Matrix</h2>
                    
                    <form onSubmit={handleSaveSiteMeasurements}>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "16px" }}>
                        <div className={styles.formGroup}>
                          <label className={styles.formLabel}>Height (ft)</label>
                          <input 
                            type="number" 
                            className={styles.formInput} 
                            placeholder="e.g. 12" 
                            value={heightVal}
                            onChange={(e) => setHeightVal(e.target.value)}
                            required
                          />
                        </div>
                        <div className={styles.formGroup}>
                          <label className={styles.formLabel}>Width (ft)</label>
                          <input 
                            type="number" 
                            className={styles.formInput} 
                            placeholder="e.g. 24" 
                            value={widthVal}
                            onChange={(e) => setWidthVal(e.target.value)}
                            required
                          />
                        </div>
                        <div className={styles.formGroup}>
                          <label className={styles.formLabel}>Depth / Thickness (in)</label>
                          <input 
                            type="number" 
                            className={styles.formInput} 
                            placeholder="e.g. 6" 
                            value={depthVal}
                            onChange={(e) => setDepthVal(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className={styles.formGroup} style={{ marginBottom: "16px" }}>
                        <label className={styles.formLabel}>Structural Backdrop Type</label>
                        <select 
                          className={styles.formSelect}
                          value={backdropVal}
                          onChange={(e) => setBackdropVal(e.target.value)}
                        >
                          <option value="Concrete wall">Concrete wall</option>
                          <option value="Glass facade">Glass facade</option>
                          <option value="Composite Panel">Composite Panel (ACP)</option>
                          <option value="Wooden Paneling">Wooden Paneling</option>
                          <option value="Metal Frame Backing">Metal Frame Backing</option>
                        </select>
                      </div>

                      <div className={styles.formGroup} style={{ marginBottom: "20px" }}>
                        <label className={styles.formLabel}>Surveyors Notes & Wiring Access Locations</label>
                        <textarea 
                          className={styles.formInput} 
                          style={{ height: "80px", resize: "none" }}
                          placeholder="Note down mounting surface condition, power outlet distances..."
                          value={notesVal}
                          onChange={(e) => setNotesVal(e.target.value)}
                        />
                      </div>

                      {/* Drag & Drop Upload Matrix */}
                      <h3 style={{ fontSize: "13px", fontWeight: "700", marginBottom: "8px" }}>Media Ingestion Zones (Mobile Responsive)</h3>
                      <div className={styles.mediaUploadMatrix}>
                        <div 
                          className={`${styles.uploadSlot} ${uploadedPhotos.photos ? styles.uploadSlotFilled : ""}`}
                          onClick={() => setUploadedPhotos(prev => ({ ...prev, photos: true }))}
                        >
                          <UploadCloud size={24} className={styles.uploadIcon} />
                          <span><strong>Site Photos</strong></span>
                          <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                            {uploadedPhotos.photos ? "✅ facade_entrance_angle.jpg" : "Drag-and-drop or click"}
                          </span>
                        </div>

                        <div 
                          className={`${styles.uploadSlot} ${uploadedPhotos.wiring ? styles.uploadSlotFilled : ""}`}
                          onClick={() => setUploadedPhotos(prev => ({ ...prev, wiring: true }))}
                        >
                          <UploadCloud size={24} className={styles.uploadIcon} />
                          <span><strong>Wiring access points</strong></span>
                          <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                            {uploadedPhotos.wiring ? "✅ wiring_conduit_marked.png" : "Drag-and-drop or click"}
                          </span>
                        </div>

                        <div 
                          className={`${styles.uploadSlot} ${uploadedPhotos.mounting ? styles.uploadSlotFilled : ""}`}
                          onClick={() => setUploadedPhotos(prev => ({ ...prev, mounting: true }))}
                        >
                          <UploadCloud size={24} className={styles.uploadIcon} />
                          <span><strong>Mounting hardware details</strong></span>
                          <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                            {uploadedPhotos.mounting ? "✅ wall_structural_bolts.jpg" : "Drag-and-drop or click"}
                          </span>
                        </div>
                      </div>

                      <button type="submit" className={styles.btnPrimary} style={{ width: "100%", marginTop: "20px" }}>
                        Save Measurements & Progress Order to Quote
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* STEP 2: QUOTATIONS SECTION */}
              {activeStep === 2 && (
                <div className={styles.workspaceCard}>
                  {activeQuoteObj && !isEditingQuote ? (
                    /* VIEW MODE */
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid var(--neutral-border)", paddingBottom: "10px" }}>
                        <h2 className={styles.sectionTitle} style={{ borderBottom: "none", marginBottom: 0 }}>
                          <IndianRupee size={18} strokeWidth={2.5} style={{ color: "var(--secondary)" }} /> Quotation Dashboard & Client Comparison Variants
                        </h2>
                        <div style={{ display: "flex", gap: "12px" }}>
                          <button 
                            className={styles.btnSecondary} 
                            onClick={() => {
                              if (activeQuoteObj.params) {
                                setSelectedProductType(activeQuoteObj.params.productType || "Acrylic Sign Board (LED Lit)");
                                setCustomBaseCost(activeQuoteObj.params.customBaseCost !== undefined ? activeQuoteObj.params.customBaseCost : "");
                                setSelectedBacking(activeQuoteObj.params.backing || "None");
                                setSelectedFrame(activeQuoteObj.params.frame || "None");
                                setLaborSurcharge(activeQuoteObj.params.labor || "0");
                                setDiscountVal(activeQuoteObj.params.discount || "");
                                setPaymentSplit(activeQuoteObj.params.paymentSplit || { advance: 40, production: 40, final: 20 });
                                setVariantCheckboxes(activeQuoteObj.params.variantCheckboxes || { premium: true, standard: true, budget: false });
                              }
                              setIsEditingQuote(true);
                            }}
                          >
                            Edit Quotation
                          </button>
                          <button 
                            className={styles.btnSecondary}
                            style={{ borderColor: "#EF4444", color: "#EF4444" }}
                            onClick={() => {
                              saveQuoteVariants(selectedOrderId, null);
                              setCustomVariants([]);
                              setIsEditingQuote(true);
                            }}
                          >
                            Reset/Delete Quote
                          </button>
                        </div>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "24px" }}>
                        {/* Variants List & Selector */}
                        <div>
                          <h3 style={{ fontSize: "13px", fontWeight: "800", marginBottom: "12px", color: "var(--primary)" }}>Available Comparison Options</h3>
                          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            {/* Premium Variant */}
                            {activeQuoteObj.best && (
                              <div style={{ border: "1px solid var(--neutral-border)", padding: "12px 16px", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: activeQuoteObj.selected === "best" ? "#F0FDF4" : "white", borderColor: activeQuoteObj.selected === "best" ? "var(--secondary)" : "var(--neutral-border)" }}>
                                <div>
                                  <div style={{ fontWeight: "800", fontSize: "13px" }}>{activeQuoteObj.best.name} {activeQuoteObj.selected === "best" && "🏆"}</div>
                                  <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>{activeQuoteObj.best.spec}</div>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                  <span style={{ fontWeight: "800", fontSize: "14px", color: "var(--secondary)" }}>{formatCurrency(activeQuoteObj.best.cost)}</span>
                                  <button 
                                    className={styles.btnPrimary} 
                                    style={{ padding: "4px 10px", fontSize: "11px", backgroundColor: activeQuoteObj.selected === "best" ? "var(--secondary)" : "var(--primary)" }}
                                    onClick={() => updateQuoteSelection(selectedOrderId, "best")}
                                  >
                                    {activeQuoteObj.selected === "best" ? "Selected" : "Select"}
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Standard Variant */}
                            {activeQuoteObj.better && (
                              <div style={{ border: "1px solid var(--neutral-border)", padding: "12px 16px", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: activeQuoteObj.selected === "better" ? "#F0FDF4" : "white", borderColor: activeQuoteObj.selected === "better" ? "var(--secondary)" : "var(--neutral-border)" }}>
                                <div>
                                  <div style={{ fontWeight: "800", fontSize: "13px" }}>{activeQuoteObj.better.name} {activeQuoteObj.selected === "better" && "🏆"}</div>
                                  <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>{activeQuoteObj.better.spec}</div>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                  <span style={{ fontWeight: "800", fontSize: "14px", color: "var(--secondary)" }}>{formatCurrency(activeQuoteObj.better.cost)}</span>
                                  <button 
                                    className={styles.btnPrimary} 
                                    style={{ padding: "4px 10px", fontSize: "11px", backgroundColor: activeQuoteObj.selected === "better" ? "var(--secondary)" : "var(--primary)" }}
                                    onClick={() => updateQuoteSelection(selectedOrderId, "better")}
                                  >
                                    {activeQuoteObj.selected === "better" ? "Selected" : "Select"}
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Budget Variant */}
                            {activeQuoteObj.good && (
                              <div style={{ border: "1px solid var(--neutral-border)", padding: "12px 16px", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: activeQuoteObj.selected === "good" ? "#F0FDF4" : "white", borderColor: activeQuoteObj.selected === "good" ? "var(--secondary)" : "var(--neutral-border)" }}>
                                <div>
                                  <div style={{ fontWeight: "800", fontSize: "13px" }}>{activeQuoteObj.good.name} {activeQuoteObj.selected === "good" && "🏆"}</div>
                                  <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>{activeQuoteObj.good.spec}</div>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                  <span style={{ fontWeight: "800", fontSize: "14px", color: "var(--secondary)" }}>{formatCurrency(activeQuoteObj.good.cost)}</span>
                                  <button 
                                    className={styles.btnPrimary} 
                                    style={{ padding: "4px 10px", fontSize: "11px", backgroundColor: activeQuoteObj.selected === "good" ? "var(--secondary)" : "var(--primary)" }}
                                    onClick={() => updateQuoteSelection(selectedOrderId, "good")}
                                  >
                                    {activeQuoteObj.selected === "good" ? "Selected" : "Select"}
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Custom Variants list */}
                            {activeQuoteObj.custom?.map((cVar, cIdx) => {
                              const key = `custom_${cIdx}`;
                              const isSel = activeQuoteObj.selected === key;
                              return (
                                <div key={cIdx} style={{ border: "1px solid var(--neutral-border)", padding: "12px 16px", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: isSel ? "#F0FDF4" : "white", borderColor: isSel ? "var(--secondary)" : "var(--neutral-border)" }}>
                                  <div>
                                    <div style={{ fontWeight: "800", fontSize: "13px" }}>{cVar.name} {isSel && "🏆"}</div>
                                    <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>{cVar.spec}</div>
                                  </div>
                                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                    <span style={{ fontWeight: "800", fontSize: "14px", color: "var(--secondary)" }}>{formatCurrency(cVar.cost)}</span>
                                    <button 
                                      className={styles.btnPrimary} 
                                      style={{ padding: "4px 10px", fontSize: "11px", backgroundColor: isSel ? "var(--secondary)" : "var(--primary)" }}
                                      onClick={() => updateQuoteSelection(selectedOrderId, key)}
                                    >
                                      {isSel ? "Selected" : "Select"}
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Inline Add Custom Variant Form */}
                          <div style={{ backgroundColor: "#F8FAFC", border: "1px solid var(--neutral-border)", padding: "16px", borderRadius: "8px", marginTop: "20px" }}>
                            <h4 style={{ fontSize: "12px", fontWeight: "800", marginBottom: "8px", display: "flex", alignItems: "center", gap: "4px" }}><Plus size={14} /> Add Custom Quote Variant</h4>
                            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.5fr 0.8fr auto", gap: "10px", alignItems: "end" }}>
                              <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                                <label className={styles.formLabel} style={{ fontSize: "9px" }}>Variant Name</label>
                                <input 
                                  type="text" 
                                  className={styles.formInput} 
                                  placeholder="e.g. Budget Flex Backlit" 
                                  style={{ padding: "6px" }}
                                  value={customVarForm.name}
                                  onChange={(e) => setCustomVarForm({ ...customVarForm, name: e.target.value })}
                                />
                              </div>
                              <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                                <label className={styles.formLabel} style={{ fontSize: "9px" }}>Specifications</label>
                                <input 
                                  type="text" 
                                  className={styles.formInput} 
                                  placeholder="e.g. 3D Letters, MS structure" 
                                  style={{ padding: "6px" }}
                                  value={customVarForm.spec}
                                  onChange={(e) => setCustomVarForm({ ...customVarForm, spec: e.target.value })}
                                />
                              </div>
                              <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                                <label className={styles.formLabel} style={{ fontSize: "9px" }}>Cost (₹)</label>
                                <input 
                                  type="number" 
                                  className={styles.formInput} 
                                  placeholder="e.g. 15000" 
                                  style={{ padding: "6px" }}
                                  value={customVarForm.cost}
                                  onChange={(e) => setCustomVarForm({ ...customVarForm, cost: e.target.value })}
                                />
                              </div>
                              <button 
                                className={styles.btnPrimary}
                                style={{ padding: "8px 12px", fontSize: "11.5px" }}
                                onClick={() => {
                                  if (!customVarForm.name || !customVarForm.cost) {
                                    alert("Please enter Name and Cost for the custom variant.");
                                    return;
                                  }
                                  const newC = {
                                    name: customVarForm.name,
                                    spec: customVarForm.spec || "Custom spec signage option",
                                    cost: Number(customVarForm.cost) || 0
                                  };
                                  const updatedC = [...(activeQuoteObj.custom || []), newC];
                                  setCustomVariants(updatedC);
                                  
                                  // Save straight to store
                                  const variants = {
                                    ...activeQuoteObj,
                                    ...updatedC.reduce((acc, curr, index) => {
                                      acc[`custom_${index}`] = curr;
                                      return acc;
                                    }, {}),
                                    custom: updatedC
                                  };
                                  saveQuoteVariants(selectedOrderId, variants);
                                  setCustomVarForm({ name: "", spec: "", cost: "" });
                                  alert("Custom quotation variant successfully added!");
                                }}
                              >
                                Add
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Split details summary */}
                        <div style={{ backgroundColor: "#F8FAFC", border: "1px solid var(--neutral-border)", padding: "20px", borderRadius: "12px", display: "flex", flexDirection: "column", justifySelf: "stretch" }}>
                          <h3 style={{ fontSize: "13px", fontWeight: "800", color: "var(--primary)", borderBottom: "1px solid var(--neutral-border)", paddingBottom: "8px", marginBottom: "12px" }}>Financial Milestone Ledger</h3>
                          
                          {(() => {
                            const activeKey = activeQuoteObj.selected || "better";
                            const activeVar = activeQuoteObj[activeKey] || activeQuoteObj.better || { cost: 0 };
                            const params = activeQuoteObj.params || { paymentSplit: { advance: 40, production: 40, final: 20 }, discount: "0" };
                            const split = params.paymentSplit || { advance: 40, production: 40, final: 20 };
                            
                            return (
                              <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                  <span>Active Variant:</span>
                                  <strong>{activeVar.name}</strong>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed #CBD5E1", paddingBottom: "8px" }}>
                                  <span>Variant Cost:</span>
                                  <strong>{formatCurrency(activeVar.cost)}</strong>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                  <span>Advance ({split.advance}%):</span>
                                  <strong>{formatCurrency(activeVar.cost * (Number(split.advance) / 100))}</strong>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                  <span>Production Release ({split.production}%):</span>
                                  <strong>{formatCurrency(activeVar.cost * (Number(split.production) / 100))}</strong>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #CBD5E1", paddingBottom: "8px" }}>
                                  <span>Final Settlement ({split.final}%):</span>
                                  <strong>{formatCurrency(activeVar.cost * (Number(split.final) / 100))}</strong>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "15px", fontWeight: "800", color: "var(--secondary)" }}>
                                  <span>Order Budget Assigned:</span>
                                  <span>{formatCurrency(activeVar.cost)}</span>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* EDIT / CALCULATOR MODE */
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid var(--neutral-border)", paddingBottom: "10px" }}>
                        <h2 className={styles.sectionTitle} style={{ borderBottom: "none", marginBottom: 0 }}>
                          <IndianRupee size={18} strokeWidth={2.5} style={{ color: "var(--secondary)" }} /> Quotation Calculator & Builder
                        </h2>
                        {activeQuoteObj && (
                          <button className={styles.btnSecondary} onClick={() => setIsEditingQuote(false)}>
                            Cancel Edit
                          </button>
                        )}
                      </div>
                      
                      {/* Warning if measurements empty */}
                      {(!heightVal || !widthVal) && (
                        <div style={{ background: "#FFFBEB", border: "1px solid #FCD34D", color: "#92400E", padding: "12px", borderRadius: "8px", fontSize: "12px", marginBottom: "16px", display: "flex", gap: "8px" }}>
                          <AlertTriangle size={16} />
                          <span>Warning: Measurements are missing. Defaulting to standard 10ft x 4ft (40 sqft) for estimation. Go to <strong>Site Visit</strong> step to feed actual dimensions.</span>
                        </div>
                      )}

                      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "24px" }}>
                        {/* Calculator Form */}
                        <div>
                          <div className={styles.formGroup} style={{ marginBottom: "12px" }}>
                            <label className={styles.formLabel}>Select Product Type Category</label>
                            <select 
                              className={styles.formSelect}
                              value={selectedProductType}
                              onChange={(e) => {
                                setSelectedProductType(e.target.value);
                                setCustomBaseCost(""); // reset custom override
                              }}
                            >
                              {catalogItems.map(item => (
                                <option key={item.id} value={item.name}>{item.name} (₹{item.baseCost}/{item.unit})</option>
                              ))}
                            </select>
                          </div>

                          <div className={styles.formGroup} style={{ marginBottom: "12px" }}>
                            <label className={styles.formLabel}>
                              Base Cost per sqft (Generated from Catalog - Completely Editable)
                            </label>
                            <input 
                              type="number" 
                              className={styles.formInput} 
                              placeholder="e.g. 650"
                              value={customBaseCost !== "" ? customBaseCost : (catalogItems.find(x => x.name.includes(selectedProductType))?.baseCost || 650)}
                              onChange={(e) => setCustomBaseCost(e.target.value)}
                            />
                          </div>

                          <div className={styles.formGroup} style={{ marginBottom: "12px" }}>
                            <label className={styles.formLabel}>Illumination / LED Add-ons</label>
                            <select 
                              className={styles.formSelect}
                              value={selectedBacking}
                              onChange={(e) => setSelectedBacking(e.target.value)}
                            >
                              <option value="None">None (Standard illumination)</option>
                              <option value="Samsung LED Modules (+₹120/sqft)">Samsung LED Modules (+₹120/sqft)</option>
                              <option value="IP67 LED Strips (+₹75/sqft)">Waterproof IP67 LED Strips (+₹75/sqft)</option>
                            </select>
                          </div>

                          <div className={styles.formGroup} style={{ marginBottom: "12px" }}>
                            <label className={styles.formLabel}>Finishes & Frame Structure Modifications</label>
                            <select 
                              className={styles.formSelect}
                              value={selectedFrame}
                              onChange={(e) => setSelectedFrame(e.target.value)}
                            >
                              <option value="None">None (Standard frame structures)</option>
                              <option value="Aluminum sheet profile (+₹80/sqft)">Aluminum sheet profile (+₹80/sqft)</option>
                              <option value="GI sheet backing (+₹45/sqft)">Galvanized Iron Sheet Backing (+₹45/sqft)</option>
                              <option value="MS Frame (+₹30/sqft)">Mild Steel (MS) Frame (+₹30/sqft)</option>
                            </select>
                          </div>

                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                            <div className={styles.formGroup}>
                              <label className={styles.formLabel}>Labor & Custom Surcharges (₹)</label>
                              <input 
                                type="number" 
                                className={styles.formInput} 
                                placeholder="e.g. 2500" 
                                value={laborSurcharge}
                                onChange={(e) => setLaborSurcharge(e.target.value)}
                              />
                            </div>

                            <div className={styles.formGroup}>
                              <label className={styles.formLabel} style={{ color: "var(--secondary)", fontWeight: "800" }}>Admin Discount (Notation e.g. 10% or 1500)</label>
                              <input 
                                type="text" 
                                className={styles.formInput} 
                                placeholder="e.g. 10% or 2000" 
                                value={discountVal}
                                onChange={(e) => setDiscountVal(e.target.value)}
                                style={{ borderColor: "var(--secondary)" }}
                              />
                            </div>
                          </div>

                          {/* Payment Split configurator */}
                          <h3 style={{ fontSize: "12px", fontWeight: "700", marginTop: "16px", marginBottom: "8px" }}>Payment Split Configurator (%)</h3>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
                            <div className={styles.formGroup}>
                              <label className={styles.formLabel} style={{ fontSize: "10px" }}>Advance (Pre-Design)</label>
                              <input 
                                type="number" 
                                className={styles.formInput} 
                                value={paymentSplit.advance}
                                onChange={(e) => setPaymentSplit({ ...paymentSplit, advance: e.target.value })}
                              />
                            </div>
                            <div className={styles.formGroup}>
                              <label className={styles.formLabel} style={{ fontSize: "10px" }}>Release (Post-Design)</label>
                              <input 
                                type="number" 
                                className={styles.formInput} 
                                value={paymentSplit.production}
                                onChange={(e) => setPaymentSplit({ ...paymentSplit, production: e.target.value })}
                              />
                            </div>
                            <div className={styles.formGroup}>
                              <label className={styles.formLabel} style={{ fontSize: "10px" }}>Final (Post-Install)</label>
                              <input 
                                type="number" 
                                className={styles.formInput} 
                                value={paymentSplit.final}
                                onChange={(e) => setPaymentSplit({ ...paymentSplit, final: e.target.value })}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Summary Quote Ledger */}
                        <div style={{ backgroundColor: "#F8FAFC", border: "1px solid var(--neutral-border)", padding: "16px", borderRadius: "12px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                          <div>
                            <h3 style={{ fontSize: "13px", fontWeight: "800", color: "var(--primary)", borderBottom: "1px solid var(--neutral-border)", paddingBottom: "8px", marginBottom: "12px" }}>Quote Summary Ledger</h3>
                            
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "12.5px" }}>
                              <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span>Site Dimensions:</span>
                                <strong style={{ fontFamily: "monospace" }}>{heightVal || 10} ft x {widthVal || 4} ft ({(Number(heightVal) || 10) * (Number(widthVal) || 4)} sqft)</strong>
                              </div>
                              <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span>Base Rate:</span>
                                <strong>₹{customBaseCost !== "" ? customBaseCost : (catalogItems.find(x => x.name.includes(selectedProductType))?.baseCost || 650)}/sqft</strong>
                              </div>
                              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed #CBD5E1", paddingBottom: "8px" }}>
                                <span>Base Price:</span>
                                <strong>{formatCurrency(quoteCalculations.basePrice)}</strong>
                              </div>
                              <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span>Modifications Addons:</span>
                                <strong>{formatCurrency(quoteCalculations.modifications)}</strong>
                              </div>
                              <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span>Labor Surcharges:</span>
                                <strong>{formatCurrency(Number(laborSurcharge) || 0)}</strong>
                              </div>
                              <div style={{ display: "flex", justifyContent: "space-between", color: "#DC2626" }}>
                                <span>Discount Deductions:</span>
                                <strong>-{discountVal ? (discountVal.includes("%") ? discountVal : formatCurrency(Number(discountVal) || 0)) : "₹0"}</strong>
                              </div>
                              <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #CBD5E1", paddingTop: "8px", fontSize: "15px", fontWeight: "800", color: "var(--secondary)" }}>
                                <span>Net Total Cost:</span>
                                <span>{formatCurrency(quoteCalculations.finalNet)}</span>
                              </div>
                            </div>

                            {/* Calculated Split Tier display */}
                            <div style={{ borderTop: "1px solid var(--neutral-border)", marginTop: "16px", paddingTop: "12px" }}>
                              <span style={{ fontSize: "10px", fontWeight: "800", textTransform: "uppercase", color: "var(--text-muted)" }}>Payment Milestones Tiers</span>
                              <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "6px", fontSize: "11.5px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                  <span>Advance ({paymentSplit.advance}%):</span>
                                  <strong>{formatCurrency(quoteCalculations.finalNet * (Number(paymentSplit.advance) / 100))}</strong>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                  <span>Production Release ({paymentSplit.production}%):</span>
                                  <strong>{formatCurrency(quoteCalculations.finalNet * (Number(paymentSplit.production) / 100))}</strong>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                  <span>Final Settlement ({paymentSplit.final}%):</span>
                                  <strong>{formatCurrency(quoteCalculations.finalNet * (Number(paymentSplit.final) / 100))}</strong>
                                </div>
                              </div>
                            </div>

                            {/* Variant checkbox list to display side-by-side on customer portal */}
                            <div style={{ borderTop: "1px solid var(--neutral-border)", marginTop: "16px", paddingTop: "12px" }}>
                              <span style={{ fontSize: "11px", fontWeight: "800", color: "var(--primary)" }}>Display Variants in Customer Sandbox Comparison:</span>
                              <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "6px" }}>
                                <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", cursor: "pointer" }}>
                                  <input 
                                    type="checkbox" 
                                    checked={variantCheckboxes.premium} 
                                    onChange={(e) => setVariantCheckboxes({ ...variantCheckboxes, premium: e.target.checked })} 
                                  />
                                  <span>Premium Acrylic Variant (~₹{Math.round(quoteCalculations.finalNet * 1.3)})</span>
                                </label>
                                <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", cursor: "pointer" }}>
                                  <input 
                                    type="checkbox" 
                                    checked={variantCheckboxes.standard} 
                                    onChange={(e) => setVariantCheckboxes({ ...variantCheckboxes, standard: e.target.checked })} 
                                  />
                                  <span>Standard Acrylic Variant (~₹{Math.round(quoteCalculations.finalNet)})</span>
                                </label>
                                <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", cursor: "pointer" }}>
                                  <input 
                                    type="checkbox" 
                                    checked={variantCheckboxes.budget} 
                                    onChange={(e) => setVariantCheckboxes({ ...variantCheckboxes, budget: e.target.checked })} 
                                  />
                                  <span>Budget Flex Variant (~₹{Math.round(quoteCalculations.finalNet * 0.5)})</span>
                                </label>
                              </div>
                            </div>
                          </div>

                          <button 
                            className={styles.btnPrimary} 
                            style={{ width: "100%", marginTop: "16px" }}
                            onClick={handleGenerateQuoteProposal}
                          >
                            Generate & Save Quote Proposal
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 3: DESIGN SECTION */}
              {activeStep === 3 && (
                <div className={styles.workspaceCard}>
                  <h2 className={styles.sectionTitle}><Layers size={18} /> Design Versioning & Collaborative Annotation Node</h2>
                  
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: "24px" }}>
                    {/* Interactive Canvas */}
                    <div>
                      {/* Height/Width displays */}
                      <div style={{ display: "flex", justifyContent: "space-between", backgroundColor: "#F1F5F9", padding: "10px 16px", borderRadius: "8px", fontSize: "12px", marginBottom: "16px" }}>
                        <span>📐 Structural Dimensions: <strong>{heightVal || 12}ft x {widthVal || 24}ft</strong></span>
                        <span>🧱 Backdrop: <strong>{backdropVal || "Concrete"}</strong></span>
                        <span>⚡ Notes: <strong>{notesVal || "Standard Anchor Mounting"}</strong></span>
                      </div>

                      {/* Interactive Canvas Board */}
                      <div className={styles.canvasContainer}>
                        <div className={styles.canvasLabel}>Interactive Design Mockup (Click anywhere to drop comment pin)</div>
                        <div 
                          className={styles.canvasArtboard} 
                          onClick={handleMockCanvasClick}
                        >
                          {/* SVG Mockup representing a Lobby Totem / Shop Signage */}
                          <svg viewBox="0 0 600 240" className={styles.canvasSvg}>
                            {/* Wall backing pattern */}
                            <defs>
                              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                                <rect width="20" height="20" fill="#E2E8F0" />
                                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#CBD5E1" strokeWidth="1" />
                              </pattern>
                            </defs>
                            <rect width="600" height="240" fill="url(#grid)" />
                            
                            {/* Backdrop Mounting Panel */}
                            <rect x="50" y="30" width="500" height="180" rx="10" fill="#1E293B" stroke="#0F172A" strokeWidth="4" />
                            
                            {/* Signage Frame Accent glow */}
                            <rect x="70" y="50" width="460" height="140" rx="8" fill="none" stroke="#22C55E" strokeWidth="2" strokeDasharray="5,5" style={{ opacity: 0.8 }} />

                            {/* Lobby Totem Mock Graphics */}
                            <text x="300" y="110" dominantBaseline="middle" textAnchor="middle" fill="#FFFFFF" fontSize="32" fontWeight="900" letterSpacing="2">
                              PRINTEC
                            </text>
                            
                            <text x="300" y="150" dominantBaseline="middle" textAnchor="middle" fill="#E2E8F0" fontSize="12" fontWeight="700" letterSpacing="4">
                              LOBBY TOTEM MOCKUP
                            </text>

                            {/* Grid/Alignment lines */}
                            <line x1="300" y1="30" x2="300" y2="210" stroke="#EF4444" strokeWidth="1" strokeDasharray="3,3" />
                            <line x1="50" y1="120" x2="550" y2="120" stroke="#EF4444" strokeWidth="1" strokeDasharray="3,3" />
                          </svg>

                          {/* Render Comments coordinate pins */}
                          {activeDesignList[0]?.comments?.map((comment) => (
                            <div 
                              key={comment.id} 
                              className={styles.commentPin} 
                              style={{ left: `${comment.x}%`, top: `${comment.y}%` }}
                              title={`${comment.author}: ${comment.text}`}
                            >
                              {comment.id}
                            </div>
                          ))}

                          {/* Render temporary click pin */}
                          {annotationCoords && (
                            <div 
                              className={styles.commentPinTemp}
                              style={{ left: `${annotationCoords.x}%`, top: `${annotationCoords.y}%` }}
                            >
                              ?
                            </div>
                          )}
                        </div>

                        {/* Annotation Comment Form Popover */}
                        {annotationCoords && (
                          <div className={styles.annotationPopover}>
                            <h4 style={{ fontSize: "12px", fontWeight: "800", marginBottom: "8px" }}>Add Comment at point ({annotationCoords.x}%, {annotationCoords.y}%)</h4>
                            <div style={{ display: "flex", gap: "8px" }}>
                              <input 
                                type="text" 
                                className={styles.formInput} 
                                placeholder="e.g. Center this lettering details..."
                                value={mockCommentText}
                                onChange={(e) => setMockCommentText(e.target.value)}
                              />
                              <button className={styles.btnPrimary} onClick={handleSaveAnnotation}>Pin</button>
                              <button className={styles.btnSecondary} onClick={() => setAnnotationCoords(null)}>X</button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Timeline & Feedback */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                      {/* Upload new design iteration */}
                      <div style={{ backgroundColor: "#F8FAFC", border: "1px solid var(--neutral-border)", padding: "16px", borderRadius: "12px" }}>
                        <h3 style={{ fontSize: "12px", fontWeight: "800", marginBottom: "8px" }}>Upload Design Iteration</h3>
                        <form onSubmit={handleUploadDesign}>
                          <input 
                            type="text" 
                            className={styles.formInput} 
                            placeholder="e.g. atrium_lobby_layout_v2.png" 
                            style={{ marginBottom: "8px" }}
                            value={newDesignFileName}
                            onChange={(e) => setNewDesignFileName(e.target.value)}
                            required
                          />
                          <button type="submit" className={styles.btnPrimary} style={{ width: "100%" }}>
                            Submit New Version
                          </button>
                        </form>
                      </div>

                      {/* Design version timeline history */}
                      <div style={{ flex: 1, backgroundColor: "#F8FAFC", border: "1px solid var(--neutral-border)", padding: "16px", borderRadius: "12px", overflowY: "auto", maxHeight: "300px" }}>
                        <h3 style={{ fontSize: "12px", fontWeight: "800", marginBottom: "12px", borderBottom: "1px solid var(--neutral-border)", paddingBottom: "6px" }}>Version Timeline</h3>
                        
                        {activeDesignList.length === 0 ? (
                          <span style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>No design layouts uploaded.</span>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            {activeDesignList.map((ver, idx) => (
                              <div key={idx} style={{ borderLeft: `3px solid ${ver.status === "Approved" ? "var(--secondary)" : "#CBD5E1"}`, paddingLeft: "8px", fontSize: "12px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "700" }}>
                                  <span>Version {ver.version}</span>
                                  <span style={{ color: ver.status === "Approved" ? "var(--secondary)" : ver.status === "Rejected" ? "#EF4444" : "#F59E0B" }}>
                                    {ver.status}
                                  </span>
                                </div>
                                <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>{ver.fileName}</div>
                                <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>Uploaded: {ver.timestamp}</div>
                                
                                {/* Comments list */}
                                {ver.comments?.length > 0 && (
                                  <div style={{ marginTop: "6px", backgroundColor: "white", padding: "6px", borderRadius: "4px", display: "flex", flexDirection: "column", gap: "4px" }}>
                                    {ver.comments.map((c, cIdx) => (
                                      <div key={cIdx} style={{ fontSize: "10px", borderBottom: cIdx < ver.comments.length - 1 ? "1px solid #F1F5F9" : "none", paddingBottom: "2px" }}>
                                        <strong>#{c.id} {c.author}:</strong> {c.text}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Final Approval to move to Production */}
                      <button 
                        className={styles.btnPrimary} 
                        style={{ width: "100%", backgroundColor: "var(--secondary)" }}
                        onClick={handleApproveDesign}
                      >
                        Approve Layout for Production
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: PRODUCTION SECTION */}
              {activeStep === 4 && (
                <div className={styles.workspaceCard}>
                  <h2 className={styles.sectionTitle}><Shield size={18} /> Shop Floor Production & Quality Line Queue</h2>
                  
                  {/* FIFO placement block */}
                  <div style={{ background: "#EFF6FF", border: "1px solid #93C5FD", color: "#1E40AF", padding: "16px", borderRadius: "12px", marginBottom: "20px" }}>
                    <h3 style={{ fontSize: "13px", fontWeight: "800", display: "flex", alignItems: "center", gap: "6px" }}>
                      <Clock size={16} /> FIFO Scheduling Position: Position #2
                    </h3>
                    <p style={{ fontSize: "12px", marginTop: "4px" }}>
                      This order is sorted based on design approval timestamp (FIFO queue). Priority flag: <strong>{activeOrderObj.isUrgent ? "🚨 URGENT OVERRIDE" : "NORMAL"}</strong>. 
                      Any urgent override will automatically push this project to the top of the queue.
                    </p>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "24px" }}>
                    {/* Specs sheets - strictly data-masked for privacy */}
                    <div>
                      <h3 style={{ fontSize: "13.5px", fontWeight: "800", marginBottom: "12px", borderBottom: "1px solid var(--neutral-border)", paddingBottom: "6px" }}>Technical Specification Sheet</h3>
                      
                      <div className={styles.detailGrid} style={{ marginBottom: "20px" }}>
                        <div className={styles.detailRow}>
                          <span className={styles.detailLabel}>Client Identifier</span>
                          <span className={styles.detailValue} style={{ color: "#EF4444", fontWeight: "800" }}>
                            * CONFIDENTIAL SHOP FLOOR MASK *
                          </span>
                        </div>
                        <div className={styles.detailRow}>
                          <span className={styles.detailLabel}>Signage Line Style</span>
                          <span className={styles.detailValue}>{selectedProductType}</span>
                        </div>
                        <div className={styles.detailRow}>
                          <span className={styles.detailLabel}>Height (ft)</span>
                          <span className={styles.detailValue}>{heightVal || 12} ft</span>
                        </div>
                        <div className={styles.detailRow}>
                          <span className={styles.detailLabel}>Width (ft)</span>
                          <span className={styles.detailValue}>{widthVal || 24} ft</span>
                        </div>
                        <div className={styles.detailRow}>
                          <span className={styles.detailLabel}>Depth (in)</span>
                          <span className={styles.detailValue}>{depthVal || 6} in</span>
                        </div>
                        <div className={styles.detailRow}>
                          <span className={styles.detailLabel}>Backdrop Base</span>
                          <span className={styles.detailValue}>{backdropVal || "Concrete Wall"}</span>
                        </div>
                        <div className={styles.detailRow}>
                          <span className={styles.detailLabel}>Active Approved Layout</span>
                          <span className={styles.detailValue} style={{ fontFamily: "monospace" }}>
                            {activeDesignList[0]?.fileName || "hotel_neon_facade_v2.ai"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status controllers */}
                    <div style={{ backgroundColor: "#F8FAFC", border: "1px solid var(--neutral-border)", padding: "20px", borderRadius: "12px" }}>
                      <h3 style={{ fontSize: "13px", fontWeight: "800", marginBottom: "16px" }}>Update Production Station Status</h3>
                      
                      <div className={styles.formGroup} style={{ marginBottom: "20px" }}>
                        <label className={styles.formLabel}>Sub-station Line Location</label>
                        <select 
                          className={styles.formSelect}
                          value={prodStation}
                          onChange={handleUpdateProductionStatus}
                        >
                          <option value="Frame Fabrication">Frame Fabrication</option>
                          <option value="LED Mounting & Wiring">LED Mounting & Wiring</option>
                          <option value="Acrylic Face Assembly">Acrylic Face & Vinyl Assembly</option>
                          <option value="Quality Check">Quality Inspection & Test</option>
                          <option value="Packed & Ready">Packed & Ready (Dispatches order to install stage)</option>
                        </select>
                      </div>

                      <div style={{ fontSize: "11.5px", color: "var(--text-muted)", background: "white", padding: "10px", borderRadius: "6px", border: "1px solid var(--neutral-border)" }}>
                        💡 Setting status to <strong>"Packed & Ready"</strong> will automatically notify the customer and move this project into the Installation planning tracker.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 5: INSTALLATION SECTION */}
              {activeStep === 5 && (
                <div className={styles.workspaceCard}>
                  <h2 className={styles.sectionTitle}><Truck size={18} /> Installation Logistics & Proof of Work Ingestion</h2>
                  
                  <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "24px" }}>
                    {/* Booking Scheduler & Address details */}
                    <div>
                      <h3 style={{ fontSize: "13px", fontWeight: "800", marginBottom: "12px" }}>Schedule Installation slot (Cal.com simulation)</h3>
                      
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "12px", marginBottom: "20px" }}>
                        <div className={styles.formGroup}>
                          <label className={styles.formLabel}>Setup Date</label>
                          <input 
                            type="date" 
                            className={styles.formInput}
                            value={selectedInstallDate}
                            onChange={(e) => setSelectedInstallDate(e.target.value)}
                          />
                        </div>
                        <div className={styles.formGroup}>
                          <label className={styles.formLabel}>Preferred Hours Slot</label>
                          <select 
                            className={styles.formSelect}
                            value={selectedInstallTime}
                            onChange={(e) => setSelectedInstallTime(e.target.value)}
                          >
                            <option value="10:00 AM - 12:00 PM">10:00 AM - 12:00 PM</option>
                            <option value="01:00 PM - 03:00 PM">01:00 PM - 03:00 PM</option>
                            <option value="04:00 PM - 06:00 PM">04:00 PM - 06:00 PM</option>
                          </select>
                        </div>
                      </div>

                      <button 
                        className={styles.btnSecondary} 
                        style={{ width: "100%", marginBottom: "24px" }}
                        onClick={handleScheduleInstallation}
                      >
                        Confirm Slot & Sync to Crew
                      </button>

                      {/* Locked Address block */}
                      <div style={{ border: "1px solid var(--neutral-border)", padding: "16px", borderRadius: "12px", background: addressOverrideUnlocked ? "#F0FDF4" : "#FEF2F2" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: "13px", fontWeight: "800", display: "flex", alignItems: "center", gap: "6px" }}>
                            {addressOverrideUnlocked ? <Unlock size={16} style={{ color: "var(--secondary)" }} /> : <Lock size={16} style={{ color: "#EF4444" }} />}
                            Site Address & Client Contact
                          </span>
                          <button 
                            className={styles.btnSecondary} 
                            style={{ padding: "2px 8px", fontSize: "10px" }}
                            onClick={() => setAddressOverrideUnlocked(!addressOverrideUnlocked)}
                          >
                            {addressOverrideUnlocked ? "Lock Details" : "Admin Unlock"}
                          </button>
                        </div>

                        {addressOverrideUnlocked ? (
                          <div style={{ fontSize: "12.5px", marginTop: "12px", display: "flex", flexDirection: "column", gap: "4px" }}>
                            <div>📍 <strong>Address:</strong> Sector 5, Atrium Block B, Technology Office Complex.</div>
                            <div>📞 <strong>Site Manager Phone:</strong> +91 98765 43210 (Unmasked for installation crew on site day)</div>
                          </div>
                        ) : (
                          <p style={{ fontSize: "11.5px", color: "#991B1B", marginTop: "8px" }}>
                            🔒 Site address maps and phone details are locked. These details automatically decrypt and unlock on the day of installation (scheduled June 15, 2026).
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Proof of installation uploads & completion */}
                    <div style={{ backgroundColor: "#F8FAFC", border: "1px solid var(--neutral-border)", padding: "20px", borderRadius: "12px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                      <div>
                        <h3 style={{ fontSize: "13px", fontWeight: "800", marginBottom: "12px" }}>Proof of Work (Installation Photos)</h3>
                        
                        <div 
                          className={`${styles.uploadSlot} ${uploadedProof ? styles.uploadSlotFilled : ""}`}
                          style={{ height: "100px" }}
                          onClick={() => setUploadedProof(true)}
                        >
                          <UploadCloud size={24} className={styles.uploadIcon} />
                          <span>Drag and drop final setup photo</span>
                          <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                            {uploadedProof ? "✅ final_installed_facade.jpg" : "Click to select"}
                          </span>
                        </div>
                      </div>

                      <div style={{ marginTop: "20px" }}>
                        <button 
                          className={styles.btnPrimary} 
                          style={{ width: "100%", backgroundColor: "var(--secondary)", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                          onClick={handleMarkOrderCompleted}
                        >
                          <CheckCircle size={16} /> Mark Project Fully Completed
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Sidebar Context Summary Panel */}
            <div className={styles.workspaceSidebar}>
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {/* Overall Progress Progress Bar */}
                <div style={{ backgroundColor: "#FFFFFF", border: "1px solid var(--neutral-border)", padding: "16px", borderRadius: "12px" }}>
                  <span style={{ fontSize: "11px", fontWeight: "800", color: "var(--text-muted)", textTransform: "uppercase" }}>Overall Completion</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "8px" }}>
                    <div style={{ flex: 1, backgroundColor: "#E2E8F0", height: "8px", borderRadius: "4px", overflow: "hidden" }}>
                      <div 
                        style={{ 
                          width: `${
                            activeStep === 0 ? 10 :
                            activeStep === 1 ? 25 :
                            activeStep === 2 ? 45 :
                            activeStep === 3 ? 65 :
                            activeStep === 4 ? 85 : 100
                          }%`, 
                          backgroundColor: "var(--secondary)", 
                          height: "100%", 
                          transition: "width 0.3s ease" 
                        }} 
                      />
                    </div>
                    <span style={{ fontSize: "13px", fontWeight: "800" }}>
                      {
                        activeStep === 0 ? "10%" :
                        activeStep === 1 ? "25%" :
                        activeStep === 2 ? "45%" :
                        activeStep === 3 ? "65%" :
                        activeStep === 4 ? "85%" : "100%"
                      }
                    </span>
                  </div>
                </div>

                {/* Signage Parameters */}
                <div style={{ backgroundColor: "#FFFFFF", border: "1px solid var(--neutral-border)", padding: "16px", borderRadius: "12px" }}>
                  <h3 style={{ fontSize: "12px", fontWeight: "800", color: "var(--primary)", borderBottom: "1px solid var(--neutral-border)", paddingBottom: "6px", marginBottom: "10px" }}>Signage Parameters</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Type:</span>
                      <strong>{selectedProductType}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Size Area:</span>
                      <strong>📐 {(Number(heightVal) || 12) * (Number(widthVal) || 24)} sqft</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Thickness:</span>
                      <strong>{depthVal || 6} inches</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Backdrop Surface:</span>
                      <strong>{backdropVal}</strong>
                    </div>
                  </div>
                </div>

                {/* Budget Summary Ledger */}
                <div style={{ backgroundColor: "#FFFFFF", border: "1px solid var(--neutral-border)", padding: "16px", borderRadius: "12px" }}>
                  <h3 style={{ fontSize: "12px", fontWeight: "800", color: "var(--primary)", borderBottom: "1px solid var(--neutral-border)", paddingBottom: "6px", marginBottom: "10px" }}>Financial Status Summary</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Agreed Budget:</span>
                      <strong>{formatCurrency(activeOrderObj.budget)}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", color: "var(--secondary)" }}>
                      <span>Paid Milestone:</span>
                      <strong>{formatCurrency(activeOrderObj.revenueCollected)}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", color: "#F97316" }}>
                      <span>Outstanding Balance:</span>
                      <strong>{formatCurrency(activeOrderObj.revenueOutstanding)}</strong>
                    </div>
                  </div>
                </div>

                {/* Map Location mock pin */}
                <div style={{ backgroundColor: "#FFFFFF", border: "1px solid var(--neutral-border)", padding: "16px", borderRadius: "12px" }}>
                  <h3 style={{ fontSize: "12px", fontWeight: "800", color: "var(--primary)", borderBottom: "1px solid var(--neutral-border)", paddingBottom: "6px", marginBottom: "10px" }}>Site Map Coordinates</h3>
                  
                  <div style={{ height: "120px", backgroundColor: "#E2E8F0", borderRadius: "8px", position: "relative", overflow: "hidden", border: "1px solid #CBD5E1" }}>
                    {/* Simulated Google map layout */}
                    <div style={{ width: "100%", height: "100%", background: "radial-gradient(circle at 70% 40%, #E8F5E9 0%, #C8E6C9 100%)", opacity: 0.8 }} />
                    <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <MapPin size={24} style={{ color: "#EF4444" }} fill="#FEE2E2" />
                      <div style={{ backgroundColor: "rgba(15, 23, 42, 0.8)", color: "white", padding: "2px 6px", borderRadius: "4px", fontSize: "9px", marginTop: "2px", fontWeight: "700" }}>TechCorp HQ</div>
                    </div>
                    
                    {/* Map paths */}
                    <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
                      <line x1="0" y1="20" x2="200" y2="100" stroke="#FFFFFF" strokeWidth="4" />
                      <line x1="80" y1="0" x2="80" y2="120" stroke="#FFFFFF" strokeWidth="4" />
                      <line x1="0" y1="70" x2="200" y2="70" stroke="#FFFFFF" strokeWidth="2" strokeDasharray="4,4" />
                    </svg>
                  </div>
                  <span style={{ fontSize: "10.5px", color: "var(--text-muted)", marginTop: "6px", display: "inline-block", textAlign: "center", width: "100%" }}>
                    📍 Coordinates matched with surveyor geo-location
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* RENDER MAIN ADMIN DASHBOARD OVERVIEW */
        <>
          {/* Top Banner */}
          <div className={styles.topBar}>
            <div className={styles.titleContainer}>
              <h1 className={styles.title}>Orders Management Hub</h1>
              <p className={styles.subtitle}>
                Printec Global Operations & Analytics Dashboard
              </p>
            </div>
            <div className={styles.actionButtons}>
              <button className={styles.btnPrimary} onClick={() => setAddOrderOpen(true)}>
                <Plus size={16} /> Add Order
              </button>
            </div>
          </div>

          {/* Operational alert blocks for stalled orders */}
          {stalledOrders.length > 0 && (
            <div className={styles.stalledAlertsContainer} style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: "12px", padding: "16px", marginBottom: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#B91C1C", fontWeight: "800", fontSize: "14px", marginBottom: "8px" }}>
                <AlertTriangle size={18} />
                <span>Operational Alert: Stalled / Unassigned Orders Requires Attention ({stalledOrders.length})</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {stalledOrders.slice(0, 2).map(o => (
                  <div key={o.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px", color: "#7F1D1D", background: "white", padding: "8px 12px", borderRadius: "6px", border: "1px solid #FEE2E2" }}>
                    <span>⚠️ Order <strong>#ORD-{o.id.substring(o.id.length - 8)}</strong> ({o.projectName}) for <strong>{o.customerName}</strong> is stalled in <strong>[{o.status.toUpperCase()}]</strong> stage with zero assigned staff.</span>
                    <span style={{ textDecoration: "underline", cursor: "pointer", fontWeight: "700" }} onClick={() => openAssignModal(o)}>Assign Employee Now</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className={styles.tabsContainer}>
            <button
              className={`${styles.tabButton} ${activeTab === "orders" ? styles.activeTabButton : ""}`}
              onClick={() => { setActiveTab("orders"); setSearchTerm(""); }}
            >
              Orders Ledger
            </button>
            <button
              className={`${styles.tabButton} ${activeTab === "utilization" ? styles.activeTabButton : ""}`}
              onClick={() => setActiveTab("utilization")}
            >
              Staff Utilization Grid
            </button>
            <button
              className={`${styles.tabButton} ${activeTab === "catalog" ? styles.activeTabButton : ""}`}
              onClick={() => setActiveTab("catalog")}
            >
              Product Configuration Catalog
            </button>
            <button
              className={`${styles.tabButton} ${activeTab === "referrals" ? styles.activeTabButton : ""}`}
              onClick={() => setActiveTab("referrals")}
            >
              Referral Commissions
            </button>
          </div>

          {/* ORDERS LEDGER TAB */}
          {activeTab === "orders" && (
            <>
              {/* Key Metrics */}
              <div className={styles.metricsGrid}>
                <div className={styles.metricCard}>
                  <div className={styles.metricHeader}>
                    <span className={styles.metricLabel}>Total Active Orders</span>
                    <span className={styles.metricIcon} style={{ color: "var(--secondary)", backgroundColor: "#ECFDF5" }}>
                      <Shield size={18} />
                    </span>
                  </div>
                  <div className={styles.metricValue}>{activeCount}</div>
                </div>
                <div className={styles.metricCard}>
                  <div className={styles.metricHeader}>
                    <span className={styles.metricLabel}>Quotes Pending Approval</span>
                    <span className={styles.metricIcon} style={{ color: "#F97316", backgroundColor: "#FFF7ED" }}>
                      <Layers size={18} />
                    </span>
                  </div>
                  <div className={styles.metricValue}>{quotationsCount}</div>
                </div>
                <div className={styles.metricCard}>
                  <div className={styles.metricHeader}>
                    <span className={styles.metricLabel}>Total Enquiries</span>
                    <span className={styles.metricIcon} style={{ color: "#2563EB", backgroundColor: "#EFF6FF" }}>
                      <Users size={18} />
                    </span>
                  </div>
                  <div className={styles.metricValue}>{enquiriesCount}</div>
                </div>
                <div className={styles.metricCard}>
                  <div className={styles.metricHeader}>
                    <span className={styles.metricLabel}>Revenue Collected vs Outstanding</span>
                    <span className={styles.metricIcon} style={{ color: "var(--secondary)", backgroundColor: "#ECFDF5" }}>
                      <IndianRupee size={18} />
                    </span>
                  </div>
                  <div className={styles.revenueSplit}>
                    <div className={styles.revCol}>
                      <span className={styles.revTitle}>Collected</span>
                      <span className={`${styles.revVal} ${styles.revValCollected}`}>{formatCurrency(revenueCollected)}</span>
                    </div>
                    <div style={{ width: "1.5px", backgroundColor: "#E2E8F0" }} />
                    <div className={styles.revCol}>
                      <span className={styles.revTitle}>Outstanding</span>
                      <span className={`${styles.revVal} ${styles.revValOutstanding}`}>{formatCurrency(revenueOutstanding)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Secondary Stats Ribbon */}
              <div className={styles.subMetricsBar}>
                <div className={styles.subMetric}>
                  <div className={styles.subMetricVal} style={{ color: "#7E22CE" }}>{siteVisitsCount}</div>
                  <div className={styles.subMetricLabel}>Active Site Visits</div>
                </div>
                <div className={styles.subMetric}>
                  <div className={styles.subMetricVal} style={{ color: "#15803D" }}>{productionCount}</div>
                  <div className={styles.subMetricLabel}>In Production</div>
                </div>
                <div className={styles.subMetric}>
                  <div className={styles.subMetricVal} style={{ color: "#991B1B" }}>{lostCount}</div>
                  <div className={styles.subMetricLabel}>Left us after Quotation</div>
                </div>
              </div>

              {/* Table Controls */}
              <div className={styles.controlsSection}>
                <div className={styles.searchWrapper}>
                  <Search size={16} className={styles.searchIcon} />
                  <input
                    type="text"
                    className={styles.searchInput}
                    placeholder="Search by project name, customer..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
                <select
                  className={styles.filterSelect}
                  value={stageFilter}
                  onChange={e => setStageFilter(e.target.value)}
                >
                  <option value="All">All Stages</option>
                  <option value="Enquired">Enquired</option>
                  <option value="Site visit">Site Visit</option>
                  <option value="Quotation">Quotation</option>
                  <option value="Design">Design</option>
                  <option value="Production">Production</option>
                  <option value="Installation">Installation</option>
                  <option value="order completed">Completed</option>
                  <option value="lost">Lost</option>
                </select>
              </div>

              {/* Table List */}
              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Project Name</th>
                      <th>Customer (Contact Info)</th>
                      <th>Queue Urgency</th>
                      <th>Status</th>
                      <th>Budget</th>
                      <th>Assigned Employees</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map(o => (
                      <tr key={o.id}>
                        <td>{o.date}</td>
                        <td>
                          <div className={styles.projectNameCol}>
                            <span className={styles.projectName}>{o.projectName}</span>
                            <span className={styles.projectId}>ID: {o.id}</span>
                          </div>
                        </td>
                        <td>
                          <div className={styles.contactDetails}>
                            <span className={styles.contactUnmasked}>{o.customerName}</span>
                            <span>Email: client@example.com</span>
                            <span>Phone: +91 98765 43210</span>
                          </div>
                        </td>
                        <td>
                          <span
                            className={`${styles.urgencyTag} ${o.isUrgent ? styles.urgentActive : styles.urgentNormal}`}
                            onClick={() => toggleUrgency(o.id)}
                            title="Click to toggle priority status"
                          >
                            {o.isUrgent ? "🚨 Urgent" : "Normal"}
                          </span>
                        </td>
                        <td>
                          <select
                            value={o.status}
                            onChange={e => updateOrderStatus(o.id, e.target.value)}
                            className={`badge ${
                              o.status.toLowerCase() === "enquired" ? "badge-enquiry" :
                              o.status.toLowerCase() === "site visit" ? "badge-site-visit" :
                              o.status.toLowerCase() === "quotation" ? "badge-quotation" :
                              o.status.toLowerCase() === "design" ? "badge-design" :
                              o.status.toLowerCase() === "production" ? "badge-production" :
                              o.status.toLowerCase() === "installation" ? "badge-installation" :
                              o.status.toLowerCase() === "order completed" ? "badge-completed" : "badge-lost"
                            }`}
                            style={{ border: "1px solid", padding: "4px 8px", cursor: "pointer", appearance: "none" }}
                          >
                            <option value="Enquired">Enquired</option>
                            <option value="Site visit">Site Visit</option>
                            <option value="Quotation">Quotation</option>
                            <option value="Design">Design</option>
                            <option value="Production">Production</option>
                            <option value="Installation">Installation</option>
                            <option value="order completed">Completed</option>
                            <option value="lost">Lost</option>
                          </select>
                        </td>
                        <td style={{ fontWeight: 700 }}>{formatCurrency(o.budget)}</td>
                        <td>
                          <div className={styles.employeeInitials}>
                            {o.assignedEmployees?.map((emp, i) => (
                              <span key={i} className={styles.initialCircle} title={emp}>
                                {emp.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td>
                          <button 
                            className={styles.viewBtn} 
                            onClick={() => handleViewOrder(o.id)}
                          >
                            View Order
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* STAFF UTILIZATION GRID */}
          {activeTab === "utilization" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px", marginBottom: "32px" }}>
              {employeeUtilization.map((emp, idx) => (
                <div key={idx} className={styles.metricCard} style={{ borderLeft: `4px solid ${emp.workloadColor}` }}>
                  <div className={styles.metricHeader}>
                    <span className={styles.metricLabel}>{emp.name}</span>
                    <span style={{ fontSize: "11px", fontWeight: "800", color: emp.workloadColor }}>
                      ● {emp.workload}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: "8px" }}>
                    <span className={styles.metricValue}>{emp.activeJobs}</span>
                    <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "600" }}>Active Assignments</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* PRODUCT CONFIG TAB */}
          {activeTab === "catalog" && (
            <div className={styles.catalogGrid}>
              {/* Signage Style CRUD Editor */}
              <div className={styles.catalogCard}>
                <h2 className={styles.catalogTitle}>
                  <Layers size={18} /> Master Catalog Configurations
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px", maxHeight: "250px", overflowY: "auto" }}>
                  {catalogItems.map(item => (
                    <div key={item.id} className={styles.attributeItem}>
                      <span className={styles.attributeName}>{item.name}</span>
                      <span className={styles.attributeValue}>₹{item.baseCost} / {item.unit}</span>
                    </div>
                  ))}
                </div>

                {/* Add Catalog Item form */}
                <form onSubmit={handleAddCatalogItem} style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "16px", borderTop: "1px solid #E2E8F0", paddingTop: "16px" }}>
                  <span style={{ fontSize: "12px", fontWeight: "800", color: "var(--primary)" }}>Configure New Product Line</span>
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "8px" }}>
                    <input
                      type="text"
                      placeholder="Product Name"
                      className={styles.formInput}
                      value={newCatalogForm.name}
                      onChange={e => setNewCatalogForm({ ...newCatalogForm, name: e.target.value })}
                      required
                    />
                    <input
                      type="number"
                      placeholder="Cost / sqft"
                      className={styles.formInput}
                      value={newCatalogForm.baseCost}
                      onChange={e => setNewCatalogForm({ ...newCatalogForm, baseCost: e.target.value })}
                      required
                    />
                  </div>
                  <button type="submit" className={styles.btnPrimary} style={{ width: "100%", padding: "8px" }}>
                    + Add Product Class to Estimator
                  </button>
                </form>
              </div>

              {/* Nested Sub-Attributes Config */}
              <div className={styles.catalogCard}>
                <h2 className={styles.catalogTitle}>
                  <Plus size={18} /> Nested Sub-Attribute Fields
                </h2>
                <h3 style={{ fontSize: "13px", fontWeight: "700", marginTop: "4px", color: "var(--primary)" }}>Sides & Frame Elements</h3>
                <div className={styles.attributeItem}>
                  <span className={styles.attributeName}>Aluminum Sheet Profile</span>
                  <span className={styles.attributeValue}>+₹80 / sqft</span>
                </div>
                <div className={styles.attributeItem}>
                  <span className={styles.attributeName}>Galvanized Iron Sheet Backing</span>
                  <span className={styles.attributeValue}>+₹45 / sqft</span>
                </div>
                <div className={styles.attributeItem}>
                  <span className={styles.attributeName}>Mild Steel (MS) Frame</span>
                  <span className={styles.attributeValue}>+₹30 / sqft</span>
                </div>

                <h3 style={{ fontSize: "13px", fontWeight: "700", marginTop: "12px", color: "var(--primary)" }}>LEDs & Illumination Kits</h3>
                <div className={styles.attributeItem}>
                  <span className={styles.attributeName}>Samsung LED Waterproof Modules</span>
                  <span className={styles.attributeValue}>+₹120 / sqft</span>
                </div>
                <div className={styles.attributeItem}>
                  <span className={styles.attributeName}>Waterproof IP67 illumination strips</span>
                  <span className={styles.attributeValue}>+₹75 / sqft</span>
                </div>
              </div>
            </div>
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
        </>
      )}

      {/* SUPPORT CENTER TICKET POPUP */}
      {supportCenterOpen && activeOrderObj && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ maxWidth: "600px" }}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Support Ticket Center - #{activeOrderObj.id.substring(activeOrderObj.id.length - 8)}</h2>
              <button className={styles.modalClose} onClick={() => setSupportCenterOpen(false)}>✕</button>
            </div>
            
            {/* Existing tickets list */}
            <h3 style={{ fontSize: "13px", fontWeight: "800", marginBottom: "8px" }}>Active Tickets</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "150px", overflowY: "auto", marginBottom: "20px" }}>
              {activeTickets.length === 0 ? (
                <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>No tickets logged for this project.</p>
              ) : (
                activeTickets.map(ticket => (
                  <div key={ticket.id} style={{ border: "1px solid var(--neutral-border)", padding: "10px", borderRadius: "8px", fontSize: "12px", background: "#F8FAFC" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "700" }}>
                      <span>{ticket.id} - {ticket.issueType}</span>
                      <span style={{ color: ticket.status === "Open" ? "#EF4444" : "#10B981" }}>{ticket.status}</span>
                    </div>
                    <p style={{ marginTop: "4px", color: "#475569" }}>{ticket.description}</p>
                    <div style={{ display: "flex", justifySelf: "end", gap: "8px", marginTop: "8px" }}>
                      {ticket.status === "Open" && (
                        <button 
                          className={styles.btnSecondary} 
                          style={{ padding: "2px 6px", fontSize: "10px" }}
                          onClick={() => updateTicketStatus(ticket.id, "Resolved")}
                        >
                          Mark Resolved
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Create ticket form */}
            <form onSubmit={handleCreateSupportTicket} style={{ borderTop: "1px solid var(--neutral-border)", paddingTop: "16px" }}>
              <h3 style={{ fontSize: "13px", fontWeight: "800", marginBottom: "12px" }}>File Operational/Warranty Issue Ticket</h3>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Issue Category</label>
                <select 
                  className={styles.formSelect}
                  value={newTicketForm.issueType}
                  onChange={(e) => setNewTicketForm({ ...newTicketForm, issueType: e.target.value })}
                >
                  <option value="Wiring issue">Wiring / Illumination flickering</option>
                  <option value="Mounting issue">Mounting bracket misalignment</option>
                  <option value="Vinyl peel">Vinyl graphics peeling off</option>
                  <option value="Color fade">Color fading / Acrylic defects</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Detailed Description</label>
                <textarea 
                  className={styles.formInput}
                  placeholder="Provide precise details of structural/wiring failure..."
                  style={{ height: "60px", resize: "none" }}
                  value={newTicketForm.description}
                  onChange={(e) => setNewTicketForm({ ...newTicketForm, description: e.target.value })}
                  required
                />
              </div>
              <div className={styles.modalActions}>
                <button type="button" className={styles.btnSecondary} onClick={() => setSupportCenterOpen(false)}>Close</button>
                <button type="submit" className={styles.btnPrimary}>File Ticket</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD ORDER MODAL */}
      {addOrderOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Add Order</h2>
              <button className={styles.modalClose} onClick={() => setAddOrderOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateOrder}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Project Name</label>
                <input
                  type="text"
                  className={styles.formInput}
                  placeholder="e.g. Backlit Reception Sign"
                  value={newOrderForm.projectName}
                  onChange={e => setNewOrderForm({ ...newOrderForm, projectName: e.target.value })}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Customer Name</label>
                <input
                  type="text"
                  className={styles.formInput}
                  placeholder="e.g. FitLife Gym"
                  value={newOrderForm.customerName}
                  onChange={e => setNewOrderForm({ ...newOrderForm, customerName: e.target.value })}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Budget (INR)</label>
                <input
                  type="number"
                  className={styles.formInput}
                  value={newOrderForm.budget}
                  onChange={e => setNewOrderForm({ ...newOrderForm, budget: e.target.value })}
                  required
                />
              </div>
              <div className={styles.modalActions}>
                <button type="button" className={styles.btnSecondary} onClick={() => setAddOrderOpen(false)}>Cancel</button>
                <button type="submit" className={styles.btnPrimary}>Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSIGN EMPLOYEES MODAL */}
      {assignModalOpen && selectedOrderForAssign && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Assign Employees</h2>
              <button className={styles.modalClose} onClick={() => setAssignModalOpen(false)}>✕</button>
            </div>
            <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
              Select team members for {selectedOrderForAssign.projectName} ({selectedOrderForAssign.id}):
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
