"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  X, ZoomIn, ZoomOut, Maximize2, Move, Send, CheckCircle2, 
  ShieldCheck, Download, ExternalLink, ArrowLeft, Calendar, 
  MapPin, ClipboardList, Check, Plus, AlertTriangle, AlertOctagon, AlertCircle,
  Clock, User, FileText, CheckSquare, RefreshCw, Printer, Share2, Pencil, Settings, HelpCircle, Ruler,
  LayoutDashboard, Camera, Bell, History
} from "lucide-react";
import { useDashboard, Order, PipelineStage, SiteVisitDetails, QuoteDetails, DesignDetails, ProductionDetails, InstallationDetails } from "@/context/DashboardContext";

interface OrderWorksheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
}

export const OrderWorksheetModal: React.FC<OrderWorksheetModalProps> = ({ isOpen, onClose, order }) => {
  const { 
    updateSiteVisitDetails,
    updateQuoteDetails,
    updateDesignDetails,
    updateProductionDetails,
    updateInstallationDetails,
    requestStageAdvancement,
    adminApproveStage,
    adminRejectStage,
    customers,
    currentUserRole,
    updateOrderStage,
    addChatMessage,
    setActivePage,
    setSelectedOrderForWorksheet,
    addNotification
  } = useDashboard();

  const [zoomLevel, setZoomLevel] = useState(85);
  const [chatInput, setChatInput] = useState("");
  const [rejectNotes, setRejectNotes] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [showAuditHistory, setShowAuditHistory] = useState(false);
  
  // Local state for photo link input simulation
  const [newPhotoUrl, setNewPhotoUrl] = useState("");

  // Stepper definition
  const steps: { stage: PipelineStage; label: string }[] = [
    { stage: "Site Visit", label: "Site Visit Audit" },
    { stage: "Quotation", label: "Product Quote" },
    { stage: "Design", label: "Design Proof" },
    { stage: "Production", label: "Fabrication Checklist" },
    { stage: "Installation", label: "Field Installation" }
  ];

  // Map order.stage to step index
  let currentStageIndex = steps.findIndex(s => s.stage === order.stage);
  if (order.stage === "Enquired") currentStageIndex = 0;
  if (order.stage === "Order Completed") currentStageIndex = 4;

  const [activeStepTab, setActiveStepTab] = useState<number>(currentStageIndex >= 0 ? currentStageIndex : 0);

  // Sync tab with order stage transitions
  useEffect(() => {
    let idx = steps.findIndex(s => s.stage === order.stage);
    if (order.stage === "Enquired") idx = 0;
    if (order.stage === "Order Completed") idx = 4;
    if (idx >= 0) {
      setActiveStepTab(idx);
    }
  }, [order.stage]);

  if (!isOpen) return null;

  const client = customers.find(c => c.id === order.customerId);
  const isEmployee = currentUserRole === "Employee";
  const createdTime = new Date(order.dateCreated).getTime();
  const diffHrs = (new Date().getTime() - createdTime) / (1000 * 60 * 60);
  const isSlaOverdue = order.stage === "Site Visit" && 
    (!order.siteVisitDetails || order.siteVisitDetails.width === 0) &&
    diffHrs > 24;

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const senderName = isEmployee ? "Amit Sharma" : "Rajesh K.";
    addChatMessage(order.id, senderName, chatInput);
    setChatInput("");
  };

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 15, 200));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 15, 50));
  const handleResetZoom = () => setZoomLevel(85);

  // Helper getters for sub-details to prevent undefined errors
  const getSiteVisitDetails = (): SiteVisitDetails => {
    return order.siteVisitDetails || {
      width: 0, height: 0, depth: 0,
      auditDate: "2024-10-24", auditTime: "11:30 AM",
      sitePersonnel: "Amit Sharma", photos: [], completed: false, notes: ""
    };
  };

  const getQuoteDetails = (): QuoteDetails => {
    return order.quoteDetails || {
      signageType: "ACP Panels", width: 120, height: 60, depth: 5,
      material: "Brushed Aluminium (3mm)", mounting: "Standoff Fixings (Satin Chrome)",
      baseACPPrice: 0, hardwarePrice: 0, polishingPrice: 0,
      discount: 0, subtotal: 0, tax: 0, grandTotal: 0
    };
  };

  const getDesignDetails = (): DesignDetails => {
    return order.designDetails || {
      proofUrl: "", status: "Draft"
    };
  };

  const getProductionDetails = (): ProductionDetails => {
    return order.productionDetails || {
      printing: false, cutting: false, fabrication: false, assembly: false
    };
  };

  const getInstallationDetails = (): InstallationDetails => {
    return order.installationDetails || {
      photoUrl: "", customerSignature: "", paymentCode: ""
    };
  };

  const sv = getSiteVisitDetails();
  const qd = getQuoteDetails();
  const dd = getDesignDetails();
  const pd = getProductionDetails();
  const inst = getInstallationDetails();

  // Recalculator helper for Quote Stage
  const handleQuotePriceChange = (field: keyof QuoteDetails, value: number) => {
    const updated = { ...qd, [field]: value };
    const subtotal = (updated.baseACPPrice || 0) + (updated.hardwarePrice || 0) + (updated.polishingPrice || 0) - (updated.discount || 0);
    const tax = Math.round(subtotal * 0.18);
    const grandTotal = subtotal + tax;

    updateQuoteDetails(order.id, {
      [field]: value,
      subtotal,
      tax,
      grandTotal
    });
  };

  // Mock upload handlers
  const handleAddSitePhoto = () => {
    if (!newPhotoUrl.trim()) return;
    const currentPhotos = sv.photos || [];
    updateSiteVisitDetails(order.id, {
      photos: [...currentPhotos, newPhotoUrl]
    });
    setNewPhotoUrl("");
  };

  // Stage Advancement triggers
  const handleRequestAdvancement = () => {
    requestStageAdvancement(order.id);
    addChatMessage(order.id, "System", `${isEmployee ? "Amit Sharma" : "Rajesh K."} requested admin approval to advance this order from the ${order.stage} stage.`);
  };

  const handleAdminApprove = () => {
    adminApproveStage(order.id);
    setShowRejectInput(false);
  };

  const handleAdminReject = () => {
    if (!rejectNotes.trim()) {
      addNotification("Feedback Required", "Please provide revision feedback or reason for rejection.", "warning");
      return;
    }
    adminRejectStage(order.id, rejectNotes);
    setRejectNotes("");
    setShowRejectInput(false);
  };

  // Check if current tab form is completed/ready for advancement
  const isTabReadyForNext = () => {
    switch (activeStepTab) {
      case 0:
        return sv.completed && sv.width > 0 && sv.height > 0;
      case 1:
        return qd.grandTotal > 0 && qd.material !== "";
      case 2:
        return dd.status === "Approved" || dd.proofUrl !== "";
      case 3:
        return pd.printing && pd.cutting && pd.fabrication && pd.assembly;
      case 4:
        return inst.photoUrl !== "" && inst.customerSignature !== "" && inst.paymentCode !== "";
      default:
        return false;
    }
  };

  const renderActiveForm = () => {
    switch (activeStepTab) {
      case 0: // Site Visit Audit
        return (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Site Audit Parameters</h3>
              <span className="text-[10px] font-bold text-slate-400">STAGE 1</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Survey Date</label>
                <input 
                  type="date" 
                  value={sv.auditDate} 
                  onChange={(e) => updateSiteVisitDetails(order.id, { auditDate: e.target.value })}
                  disabled={isEmployee && order.stageStatus?.includes("Pending")}
                  className="w-full px-4 py-2 border border-slate-250 rounded-full text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-1.5 focus:ring-slate-900"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Survey Time</label>
                <input 
                  type="text" 
                  value={sv.auditTime} 
                  onChange={(e) => updateSiteVisitDetails(order.id, { auditTime: e.target.value })}
                  placeholder="e.g. 11:30 AM"
                  disabled={isEmployee && order.stageStatus?.includes("Pending")}
                  className="w-full px-4 py-2 border border-slate-250 rounded-full text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-1.5 focus:ring-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Assigned Personnel</label>
              <input 
                type="text" 
                value={sv.sitePersonnel} 
                onChange={(e) => updateSiteVisitDetails(order.id, { sitePersonnel: e.target.value })}
                disabled={isEmployee && order.stageStatus?.includes("Pending")}
                className="w-full px-4 py-2 border border-slate-250 rounded-full text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-1.5 focus:ring-slate-900"
              />
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-4">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-tight">Physical Signage Dimensions</h4>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Width (in)</label>
                  <input 
                    type="number" 
                    value={sv.width || ""} 
                    onChange={(e) => updateSiteVisitDetails(order.id, { width: parseFloat(e.target.value) || 0 })}
                    placeholder="Width"
                    disabled={isEmployee && order.stageStatus?.includes("Pending")}
                    className="w-full px-4 py-2 border border-slate-250 rounded-full text-xs font-bold font-mono text-slate-700 bg-white focus:outline-none focus:ring-1.5 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Height (in)</label>
                  <input 
                    type="number" 
                    value={sv.height || ""} 
                    onChange={(e) => updateSiteVisitDetails(order.id, { height: parseFloat(e.target.value) || 0 })}
                    placeholder="Height"
                    disabled={isEmployee && order.stageStatus?.includes("Pending")}
                    className="w-full px-4 py-2 border border-slate-250 rounded-full text-xs font-bold font-mono text-slate-700 bg-white focus:outline-none focus:ring-1.5 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Depth (in)</label>
                  <input 
                    type="number" 
                    value={sv.depth || ""} 
                    onChange={(e) => updateSiteVisitDetails(order.id, { depth: parseFloat(e.target.value) || 0 })}
                    placeholder="Depth"
                    disabled={isEmployee && order.stageStatus?.includes("Pending")}
                    className="w-full px-4 py-2 border border-slate-250 rounded-full text-xs font-bold font-mono text-slate-700 bg-white focus:outline-none focus:ring-1.5 focus:ring-slate-900"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Survey Logistics & Obstacles Notes</label>
              <textarea 
                rows={3}
                value={sv.notes || ""} 
                onChange={(e) => updateSiteVisitDetails(order.id, { notes: e.target.value })}
                placeholder="List available electrical outlets, scaffolding requirement details..."
                disabled={isEmployee && order.stageStatus?.includes("Pending")}
                className="w-full px-3 py-2 border border-slate-250 rounded-xl text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-1.5 focus:ring-slate-900"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Site Survey Photos Proof</label>
              <div className="flex flex-wrap gap-2.5">
                {(sv.photos || []).map((photo, i) => (
                  <div key={i} className="w-16 h-16 rounded-xl border border-slate-200 bg-slate-100 overflow-hidden relative group">
                    <img src={photo} alt={`Site proof ${i+1}`} className="w-full h-full object-cover" onError={(e)=>{e.currentTarget.src='https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=100&auto=format&fit=crop';}} />
                    <button 
                      type="button"
                      onClick={() => {
                        const nextPhotos = [...sv.photos];
                        nextPhotos.splice(i, 1);
                        updateSiteVisitDetails(order.id, { photos: nextPhotos });
                      }}
                      className="absolute inset-0 bg-black/60 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <span className="text-[10px] font-bold">Remove</span>
                    </button>
                  </div>
                ))}
                
                <div className="w-16 h-16 rounded-xl border-2 border-dotted border-slate-300 flex items-center justify-center bg-slate-50">
                  <Plus size={16} className="text-slate-400" />
                </div>
              </div>
              
              <div className="flex items-center space-x-2 mt-2">
                <input 
                  type="text" 
                  value={newPhotoUrl}
                  onChange={(e) => setNewPhotoUrl(e.target.value)}
                  placeholder="Paste site photo URL to upload..."
                  disabled={isEmployee && order.stageStatus?.includes("Pending")}
                  className="flex-1 px-3 py-1.5 border border-slate-250 rounded-lg text-[11px] focus:outline-none focus:ring-1"
                />
                <button 
                  type="button"
                  onClick={handleAddSitePhoto}
                  disabled={isEmployee && order.stageStatus?.includes("Pending")}
                  className="px-3 py-1.5 bg-slate-905 hover:bg-slate-800 text-white rounded-lg text-[11px] font-bold"
                >
                  Add
                </button>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center">
              <input 
                type="checkbox" 
                id="svCompleted"
                checked={sv.completed || false} 
                onChange={(e) => updateSiteVisitDetails(order.id, { completed: e.target.checked })}
                disabled={isEmployee && order.stageStatus?.includes("Pending")}
                className="w-4.5 h-4.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 mr-2.5 cursor-pointer"
              />
              <label htmlFor="svCompleted" className="text-xs font-bold text-slate-800 cursor-pointer select-none">
                Mark Site Audit Checklist as Complete
              </label>
            </div>
          </div>
        );

      case 1: // Product Quote Creation
        return (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Invoice Quotation Specifications</h3>
              <span className="text-[10px] font-bold text-slate-400">STAGE 2</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Signage Board Type</label>
                <select 
                  value={qd.signageType}
                  onChange={(e) => updateQuoteDetails(order.id, { signageType: e.target.value as any })}
                  disabled={isEmployee && order.stageStatus?.includes("Pending")}
                  className="w-full px-3 py-2 border border-slate-250 rounded-xl text-xs font-semibold text-slate-700 bg-white focus:outline-none"
                >
                  <option value="ACP Panels">ACP Panels Signage</option>
                  <option value="LED Letters">LED Letters Signage</option>
                  <option value="Vinyl Graphics">Vinyl Graphics Branding</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Primary Material Spec</label>
                <input 
                  type="text" 
                  value={qd.material}
                  onChange={(e) => updateQuoteDetails(order.id, { material: e.target.value })}
                  placeholder="e.g. Brushed Aluminium (3mm)"
                  disabled={isEmployee && order.stageStatus?.includes("Pending")}
                  className="w-full px-3 py-2 border border-slate-250 rounded-xl text-xs font-semibold text-slate-700 bg-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Mounting Support</label>
              <select 
                value={qd.mounting}
                onChange={(e) => updateQuoteDetails(order.id, { mounting: e.target.value })}
                disabled={isEmployee && order.stageStatus?.includes("Pending")}
                className="w-full px-3 py-2 border border-slate-250 rounded-xl text-xs font-semibold text-slate-700 bg-white focus:outline-none"
              >
                <option value="Standoff Fixings (Satin Chrome)">Standoff Fixings (Satin Chrome)</option>
                <option value="Direct Wall Silicon Mounted">Direct Wall Silicon Mounted</option>
                <option value="Hanging Steel Wire Tensioners">Hanging Steel Wire Tensioners</option>
              </select>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-4">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-tight">Financial Quotation Calculator (INR)</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Base Fabrication (₹)</label>
                  <input 
                    type="number" 
                    value={qd.baseACPPrice || ""}
                    onChange={(e) => handleQuotePriceChange("baseACPPrice", parseFloat(e.target.value) || 0)}
                    placeholder="Base Price"
                    disabled={isEmployee && order.stageStatus?.includes("Pending")}
                    className="w-full px-3 py-2 border border-slate-250 rounded-xl text-xs font-bold font-mono text-slate-700 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Hardware & Acrylic (₹)</label>
                  <input 
                    type="number" 
                    value={qd.hardwarePrice || ""}
                    onChange={(e) => handleQuotePriceChange("hardwarePrice", parseFloat(e.target.value) || 0)}
                    placeholder="Hardware Cost"
                    disabled={isEmployee && order.stageStatus?.includes("Pending")}
                    className="w-full px-3 py-2 border border-slate-250 rounded-xl text-xs font-bold font-mono text-slate-700 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Polishing & Finishing (₹)</label>
                  <input 
                    type="number" 
                    value={qd.polishingPrice || ""}
                    onChange={(e) => handleQuotePriceChange("polishingPrice", parseFloat(e.target.value) || 0)}
                    placeholder="Polishing Cost"
                    disabled={isEmployee && order.stageStatus?.includes("Pending")}
                    className="w-full px-3 py-2 border border-slate-250 rounded-xl text-xs font-bold font-mono text-slate-700 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Customer Discount (₹)</label>
                  <input 
                    type="number" 
                    value={qd.discount || ""}
                    onChange={(e) => handleQuotePriceChange("discount", parseFloat(e.target.value) || 0)}
                    placeholder="Discount Value"
                    disabled={isEmployee && order.stageStatus?.includes("Pending")}
                    className="w-full px-3 py-2 border border-slate-250 rounded-xl text-xs font-bold font-mono text-slate-700 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200/80 space-y-2 text-xs font-semibold text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal Price:</span>
                  <span className="font-mono text-slate-800">₹{qd.subtotal?.toLocaleString("en-IN") || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (18% GST):</span>
                  <span className="font-mono text-slate-800">₹{qd.tax?.toLocaleString("en-IN") || 0}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-slate-900 pt-1 border-t border-dashed border-slate-200">
                  <span>Grand Total Price:</span>
                  <span className="font-mono text-emerald-700">₹{qd.grandTotal?.toLocaleString("en-IN") || 0}</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 2: // Design Finalization & Upload
        return (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Blueprint & Proof Mockup</h3>
              <span className="text-[10px] font-bold text-slate-400">STAGE 3</span>
            </div>

            <div className="border border-dashed border-slate-300 rounded-2xl p-5 flex flex-col items-center justify-center bg-slate-50 text-center space-y-3">
              <div className="p-3 bg-white border border-slate-150 rounded-full shadow-xs text-slate-400">
                <FileText size={22} />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-800 block">Drag or select a design file to upload</span>
                <span className="text-[10px] text-slate-400 block mt-1">Accepts high resolution SVG, CAD blueprints, or PDF mockups</span>
              </div>
              <input 
                type="text"
                placeholder="Paste design mockup proof url..."
                value={dd.proofUrl}
                onChange={(e) => updateDesignDetails(order.id, { proofUrl: e.target.value })}
                disabled={isEmployee && order.stageStatus?.includes("Pending")}
                className="w-full max-w-sm px-3 py-1.5 border border-slate-250 rounded-lg text-[11px] focus:outline-none"
              />
            </div>

            {dd.proofUrl && (
              <div className="border border-slate-200 bg-white rounded-2xl overflow-hidden p-4 space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Interactive Mockup Preview</span>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${
                    dd.status === "Approved" 
                      ? "bg-emerald-50 text-emerald-700 border-emerald-250" 
                      : dd.status === "Pending Approval"
                      ? "bg-amber-50 text-amber-600 border-amber-250"
                      : "bg-slate-55/60 text-slate-600 border-slate-200"
                  }`}>
                    {dd.status}
                  </span>
                </div>

                <div className="relative border border-slate-150 rounded-xl bg-slate-900 flex items-center justify-center p-6 overflow-hidden min-h-[220px]">
                  <img 
                    src={dd.proofUrl} 
                    alt="Design proof" 
                    className="max-h-[200px] object-contain transition-all duration-300"
                    style={{ transform: `scale(${zoomLevel / 100})` }}
                    onError={(e)=>{e.currentTarget.src='https://images.unsplash.com/photo-1542744094-3a31f103e35f?w=400&auto=format&fit=crop';}}
                  />
                  
                  {/* Floating Zoom controls */}
                  <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-xs border border-slate-200 rounded-lg p-1.5 flex items-center space-x-1.5 shadow-xs">
                    <button onClick={handleZoomOut} className="p-0.5 text-slate-500 hover:text-slate-800 rounded"><ZoomOut size={12} /></button>
                    <span onClick={handleResetZoom} className="text-[9px] font-black font-mono px-1 select-none cursor-pointer">{zoomLevel}%</span>
                    <button onClick={handleZoomIn} className="p-0.5 text-slate-500 hover:text-slate-800 rounded"><ZoomIn size={12} /></button>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <span className="text-[10px] text-slate-400 font-mono">FILE: lobby_totem_concept.svg</span>
                  
                  {isEmployee ? (
                    dd.status === "Draft" && (
                      <button 
                        type="button"
                        onClick={() => updateDesignDetails(order.id, { status: "Pending Approval" })}
                        className="px-3.5 py-1.5 bg-slate-950 text-white rounded-lg text-xs font-bold"
                      >
                        Request Design Proof Sign-off
                      </button>
                    )
                  ) : (
                    dd.status !== "Approved" && (
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => updateDesignDetails(order.id, { status: "Draft" })}
                          className="px-3 py-1.5 border border-red-200 text-red-600 rounded-lg text-[11px] font-bold hover:bg-red-50"
                        >
                          Reject Proof
                        </button>
                        <button 
                          onClick={() => updateDesignDetails(order.id, { status: "Approved" })}
                          className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-[11px] font-bold hover:bg-emerald-700"
                        >
                          Approve Design
                        </button>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        );

      case 3: // Fabrication Checklist
        return (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Workshop Production Queue</h3>
              <span className="text-[10px] font-bold text-slate-400">STAGE 4</span>
            </div>

            <div className={`p-5 rounded-2xl border ${order.urgent ? "border-amber-400 bg-amber-50/20 ring-2 ring-amber-400/50 animate-pulse" : "border-slate-200 bg-white"} space-y-4`}>
              {order.urgent && (
                <div className="flex items-center space-x-2 text-amber-800 text-xs font-extrabold uppercase">
                  <AlertOctagon size={16} className="text-amber-500 shrink-0" />
                  <span>⚠️ Priority Dispatch: High Urgency Fabrication Queue</span>
                </div>
              )}

              <p className="text-xs text-slate-500 leading-normal">
                Check off critical milestones in the signage assembly pipeline. Fabricators must confirm structural tests before shipping.
              </p>

              <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden bg-white shadow-xs">
                {/* Print Sheet check */}
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <CheckSquare size={16} className={`mr-3 ${pd.printing ? "text-emerald-600" : "text-slate-300"}`} />
                    <span className="text-xs font-bold text-slate-800">1. Print Plotted Sheet Layout & Backing</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={pd.printing || false} 
                    onChange={() => updateProductionDetails(order.id, { printing: !pd.printing })}
                    disabled={isEmployee && order.stageStatus?.includes("Pending")}
                    className="w-4.5 h-4.5 rounded text-emerald-600 cursor-pointer"
                  />
                </div>

                {/* Cutting Check */}
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <CheckSquare size={16} className={`mr-3 ${pd.cutting ? "text-emerald-600" : "text-slate-300"}`} />
                    <span className="text-xs font-bold text-slate-800">2. CNC Router Precision Plotted Cutting & Edges</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={pd.cutting || false} 
                    onChange={() => updateProductionDetails(order.id, { cutting: !pd.cutting })}
                    disabled={isEmployee && order.stageStatus?.includes("Pending")}
                    className="w-4.5 h-4.5 rounded text-emerald-600 cursor-pointer"
                  />
                </div>

                {/* Fabrication Check */}
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <CheckSquare size={16} className={`mr-3 ${pd.fabrication ? "text-emerald-600" : "text-slate-300"}`} />
                    <span className="text-xs font-bold text-slate-800">3. Metal frame welding & ACP backing support</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={pd.fabrication || false} 
                    onChange={() => updateProductionDetails(order.id, { fabrication: !pd.fabrication })}
                    disabled={isEmployee && order.stageStatus?.includes("Pending")}
                    className="w-4.5 h-4.5 rounded text-emerald-600 cursor-pointer"
                  />
                </div>

                {/* Assembly Check */}
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <CheckSquare size={16} className={`mr-3 ${pd.assembly ? "text-emerald-600" : "text-slate-300"}`} />
                    <span className="text-xs font-bold text-slate-800">4. Acrylic Letters Mounting & LED internal wiring test</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={pd.assembly || false} 
                    onChange={() => updateProductionDetails(order.id, { assembly: !pd.assembly })}
                    disabled={isEmployee && order.stageStatus?.includes("Pending")}
                    className="w-4.5 h-4.5 rounded text-emerald-600 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 4: // Field Installation
        return (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Field Installation Sign-off</h3>
              <span className="text-[10px] font-bold text-slate-400">STAGE 5</span>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Installed Signage Proof Photo URL</label>
              <input 
                type="text" 
                value={inst.photoUrl}
                onChange={(e) => updateInstallationDetails(order.id, { photoUrl: e.target.value })}
                placeholder="Paste link to installation completion photo..."
                disabled={isEmployee && order.stageStatus?.includes("Pending")}
                className="w-full px-3 py-2 border border-slate-250 rounded-xl text-xs font-semibold text-slate-700 bg-white focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Client Signature</label>
                <input 
                  type="text" 
                  value={inst.customerSignature}
                  onChange={(e) => updateInstallationDetails(order.id, { customerSignature: e.target.value })}
                  placeholder="Type customer name to sign..."
                  disabled={isEmployee && order.stageStatus?.includes("Pending")}
                  className="w-full px-3 py-2 border border-slate-250 rounded-xl text-xs font-semibold text-slate-700 bg-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Validation Code</label>
                <input 
                  type="text" 
                  value={inst.paymentCode}
                  onChange={(e) => updateInstallationDetails(order.id, { paymentCode: e.target.value })}
                  placeholder="e.g. 9938"
                  disabled={isEmployee && order.stageStatus?.includes("Pending")}
                  className="w-full px-3 py-2 border border-slate-250 rounded-xl text-xs font-semibold text-slate-700 bg-white focus:outline-none"
                />
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center text-xs font-medium text-slate-500">
                <span className="block font-bold text-slate-700 mb-1">Client Sign-Off Box</span>
                <div className="h-24 bg-white border border-slate-150 rounded-lg flex items-center justify-center font-serif text-slate-400 italic">
                  {inst.customerSignature ? inst.customerSignature : "Drawing canvas placeholder (Type signature name above)"}
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex-1 w-full bg-[#f8fafc] flex flex-row min-h-screen text-slate-800 font-sans">
      
      {/* 1. LEFT SIDEBAR */}
      <aside className="w-[240px] bg-[#f0f4f8] border-r border-slate-200 flex flex-col select-none shrink-0">
        
        {/* Logo Section */}
        <div className="p-6 border-b border-slate-200 flex items-center space-x-3">
          <div className="bg-[#003366] text-white p-2 rounded-lg flex items-center justify-center">
            <Printer size={18} />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-[#003366] leading-tight tracking-wider uppercase">PRINTEC</h2>
            <p className="text-[10px] text-slate-500 font-medium">Management Portal</p>
          </div>
        </div>

        {/* Sidebar Navigation Items */}
        <nav className="flex-1 py-6 px-4 space-y-1">
          <button
            onClick={() => {
              setSelectedOrderForWorksheet(null);
              setActivePage("dashboard");
            }}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-200/50 transition-colors"
          >
            <ClipboardList size={16} className="text-slate-400" />
            <span>Enquiries</span>
          </button>

          <button
            onClick={() => {
              setShowAuditHistory(false);
              setActiveStepTab(0);
            }}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-xs font-bold transition-all ${
              activeStepTab === 0 && !showAuditHistory
                ? "bg-[#003366] text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-200/50"
            }`}
          >
            <div className="flex items-center space-x-3">
              <MapPin size={16} className={activeStepTab === 0 && !showAuditHistory ? "text-white" : "text-slate-400"} />
              <span>Site Visits</span>
            </div>
          </button>

          <button
            onClick={() => {
              setShowAuditHistory(false);
              setActiveStepTab(1);
            }}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-xs font-bold transition-all ${
              activeStepTab === 1 && !showAuditHistory
                ? "bg-[#003366] text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-200/50"
            }`}
          >
            <div className="flex items-center space-x-3">
              <FileText size={16} className={activeStepTab === 1 && !showAuditHistory ? "text-white" : "text-slate-400"} />
              <span>Quotations</span>
            </div>
          </button>

          <button
            onClick={() => {
              setShowAuditHistory(false);
              setActiveStepTab(2);
            }}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-xs font-bold transition-all ${
              activeStepTab === 2 && !showAuditHistory
                ? "bg-[#003366] text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-200/50"
            }`}
          >
            <div className="flex items-center space-x-3">
              <LayoutDashboard size={16} className={activeStepTab === 2 && !showAuditHistory ? "text-white" : "text-slate-400"} />
              <span>Design</span>
            </div>
          </button>

          <button
            onClick={() => {
              setShowAuditHistory(false);
              setActiveStepTab(3);
            }}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-xs font-bold transition-all ${
              activeStepTab === 3 && !showAuditHistory
                ? "bg-[#003366] text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-200/50"
            }`}
          >
            <div className="flex items-center space-x-3">
              <CheckSquare size={16} className={activeStepTab === 3 && !showAuditHistory ? "text-white" : "text-slate-400"} />
              <span>Production</span>
            </div>
          </button>

          <button
            onClick={() => {
              setShowAuditHistory(false);
              setActiveStepTab(4);
            }}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-xs font-bold transition-all ${
              activeStepTab === 4 && !showAuditHistory
                ? "bg-[#003366] text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-200/50"
            }`}
          >
            <div className="flex items-center space-x-3">
              <CheckCircle2 size={16} className={activeStepTab === 4 && !showAuditHistory ? "text-white" : "text-slate-400"} />
              <span>Installation</span>
            </div>
          </button>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-200 space-y-1">
          <button
            onClick={() => {
              setSelectedOrderForWorksheet(null);
              setActivePage("settings");
            }}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-200/50 transition-colors"
          >
            <HelpCircle size={16} className="text-slate-400" />
            <span>Support</span>
          </button>
          <button
            onClick={() => {
              setSelectedOrderForWorksheet(null);
              setActivePage("settings");
            }}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-200/50 transition-colors"
          >
            <Settings size={16} className="text-slate-400" />
            <span>Settings</span>
          </button>
        </div>
      </aside>

      {/* 2. RIGHT WORKSPACE CONTENT */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* Workspace Top Header (Notification Bell & User profile) */}
        <header className="h-14 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => {
                setSelectedOrderForWorksheet(null);
                setActivePage("dashboard");
              }}
              className="flex items-center space-x-2 text-xs font-bold text-[#003366] hover:underline"
            >
              <ArrowLeft size={14} />
              <span>Back to Dashboard</span>
            </button>
          </div>
          
          <div className="flex items-center space-x-6">
            <button className="text-slate-400 hover:text-slate-600 transition-colors relative">
              <Bell size={18} />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </button>
            
            <div className="flex items-center space-x-3 border-l border-slate-200 pl-6">
              <div className="w-9 h-9 rounded-full bg-[#003366] text-white flex items-center justify-center font-bold text-xs">
                {isEmployee ? "AS" : "RK"}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-bold leading-none text-slate-800">{isEmployee ? "Amit Sharma" : "Rajesh K."}</p>
                <p className="text-[9px] uppercase font-semibold text-slate-400 mt-1">
                  {isEmployee ? "Field Agent" : "Project Admin"}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Worksheet Main Content Container */}
        <div className="flex-1 p-8 space-y-6">
          
          {/* A. Breadcrumbs & Title Bar */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div>
              {/* Breadcrumbs */}
              <div className="flex items-center space-x-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <span className="hover:text-slate-600 cursor-pointer" onClick={() => { setSelectedOrderForWorksheet(null); setActivePage("dashboard"); }}>Projects</span>
                <span>&gt;</span>
                <span className="hover:text-slate-600 cursor-pointer" onClick={() => { setSelectedOrderForWorksheet(null); setActivePage("dashboard"); }}>Active Orders</span>
                <span>&gt;</span>
                <span className="text-[#003366]">{order.id}</span>
              </div>
              
              <h1 className="text-2xl font-black text-slate-800 mt-1 tracking-tight">
                {order.projectName}
              </h1>
            </div>

            {/* Print & Share buttons */}
            <div className="flex items-center space-x-3 shrink-0">
              <button
                onClick={() => window.print()}
                className="flex items-center space-x-2 px-4 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-600 bg-white hover:bg-slate-50 transition-all shadow-xs"
              >
                <Printer size={14} />
                <span>Print Work Order</span>
              </button>
              <button
                onClick={() => addNotification("Shared", "Project summary shared with team members.", "success")}
                className="flex items-center space-x-2 px-4 py-2 bg-[#107C41] hover:bg-[#0e6b37] text-white rounded-lg text-xs font-bold transition-all shadow-sm"
              >
                <Share2 size={14} />
                <span>Share with Team</span>
              </button>
            </div>
          </div>

          {/* B. Two-Column Content Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* LEFT COLUMN: Stage Form + Internal logs (70% width or 2 cols) */}
            <div className="lg:col-span-2 space-y-6 flex flex-col">
              
              {/* Warning/Banners */}
              {isSlaOverdue && activeStepTab === 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3 text-red-800 animate-pulse">
                  <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={16} />
                  <div className="space-y-1">
                    <span className="text-xs font-bold block">🚨 SLA Overdue Alert</span>
                    <p className="text-[11px] leading-normal text-red-700">
                      Measurements are missing. Please complete the physical audit inputs immediately.
                    </p>
                  </div>
                </div>
              )}

              {order.stageStatus && order.stageStatus !== "Normal" && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-800">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={16} />
                    <div className="space-y-1">
                      <span className="text-xs font-bold block">Advancement Approval Request Pending</span>
                      <p className="text-[11px] leading-normal text-amber-700">
                        {isEmployee 
                          ? "Your request to advance this order is waiting for Administrator authorization."
                          : "Staff has requested advancement for this order. Review details below to proceed."
                        }
                      </p>
                    </div>
                  </div>

                  {!isEmployee && (
                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        onClick={() => setShowRejectInput(!showRejectInput)}
                        className="px-3 py-1.5 border border-amber-300 text-amber-800 hover:bg-amber-100 rounded-lg text-xs font-bold transition-all"
                      >
                        Reject
                      </button>
                      <button
                        onClick={handleAdminApprove}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all flex items-center"
                      >
                        <Check size={14} className="mr-1" /> Approve
                      </button>
                    </div>
                  )}
                </div>
              )}

              {showRejectInput && !isEmployee && (
                <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Advancement Rejection Feedback</label>
                  <textarea
                    rows={2}
                    placeholder="Specify the edits needed..."
                    value={rejectNotes}
                    onChange={(e) => setRejectNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none"
                  />
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => setShowRejectInput(false)}
                      className="px-3 py-1 bg-white border border-slate-200 text-slate-500 rounded-lg text-xs font-bold hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAdminReject}
                      className="px-3 py-1 bg-rose-600 hover:bg-rose-750 text-white rounded-lg text-xs font-bold"
                    >
                      Submit Notes
                    </button>
                  </div>
                </div>
              )}

              {/* CARD 1: STAGE AUDIT FORM CARD */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col">
                
                {/* Custom Card Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#003366] uppercase tracking-wider">
                    {steps[activeStepTab]?.label || "Order Stage Details"}
                  </h3>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    STAGE {activeStepTab + 1} OF 5
                  </span>
                </div>

                {/* Card Body */}
                <div className="p-6 space-y-6">
                  {/* Step Description section matching mockup */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 gap-3">
                    <div>
                      <div className="flex items-center space-x-3">
                        <h2 className="text-lg font-bold text-slate-800">
                          Step {activeStepTab + 1} - {steps[activeStepTab]?.label}
                        </h2>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          order.stage === steps[activeStepTab]?.stage
                            ? "bg-blue-100 text-blue-800 border border-blue-200"
                            : "bg-slate-100 text-slate-400 border border-slate-200"
                        }`}>
                          {order.stage === steps[activeStepTab]?.stage ? "ACTIVE / SCHEDULED" : "COMPLETED"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 leading-normal">
                        {activeStepTab === 0 && "Detailed assessment of the physical location for fabrication planning."}
                        {activeStepTab === 1 && "Prepare the commercial invoice details and calculate pricing matrix."}
                        {activeStepTab === 2 && "Finalize structural dimensions and upload blueprint vector mockups."}
                        {activeStepTab === 3 && "Track factory production checklists and check off fabrication items."}
                        {activeStepTab === 4 && "Log field photos, validation codes, and client signature sign-offs."}
                      </p>
                    </div>

                    <div className="text-left sm:text-right shrink-0">
                      <p className="text-xs font-bold text-slate-700">Due: 24 Oct, 11:30 AM</p>
                      <p className="text-[9px] uppercase font-bold text-slate-400 mt-1">SLA target: 24h response</p>
                    </div>
                  </div>

                  {/* CUSTOM SITE VISIT PARAMETERS ROW FOR STAGE 0 */}
                  {activeStepTab === 0 ? (
                    <div className="space-y-6">
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* 1. DIMENSIONS IN INCHES */}
                        <div className="space-y-3">
                          <h4 className="flex items-center space-x-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <Ruler size={13} className="text-slate-400" />
                            <span>Dimensions (In Inches)</span>
                          </h4>
                          
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Width</label>
                              <input 
                                type="number" 
                                value={sv.width || ""} 
                                onChange={(e) => updateSiteVisitDetails(order.id, { width: parseFloat(e.target.value) || 0 })}
                                placeholder="0.0"
                                disabled={isEmployee && order.stageStatus?.includes("Pending")}
                                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold font-mono text-slate-700 bg-white focus:outline-none focus:ring-1.5 focus:ring-[#003366]"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Height</label>
                              <input 
                                type="number" 
                                value={sv.height || ""} 
                                onChange={(e) => updateSiteVisitDetails(order.id, { height: parseFloat(e.target.value) || 0 })}
                                placeholder="0.0"
                                disabled={isEmployee && order.stageStatus?.includes("Pending")}
                                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold font-mono text-slate-700 bg-white focus:outline-none focus:ring-1.5 focus:ring-[#003366]"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Depth</label>
                              <input 
                                type="number" 
                                value={sv.depth || ""} 
                                onChange={(e) => updateSiteVisitDetails(order.id, { depth: parseFloat(e.target.value) || 0 })}
                                placeholder="0.0"
                                disabled={isEmployee && order.stageStatus?.includes("Pending")}
                                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold font-mono text-slate-700 bg-white focus:outline-none focus:ring-1.5 focus:ring-[#003366]"
                              />
                            </div>
                          </div>

                          {/* Info Warning note box matching mockup */}
                          <div className="bg-blue-50 border-l-4 border-[#003366] rounded-r-lg p-3 text-xs italic text-[#003366]">
                            Note: Check for wall structural integrity and existing electrical conduits.
                          </div>
                        </div>

                        {/* 2. VISIT LOGISTICS */}
                        <div className="space-y-3">
                          <h4 className="flex items-center space-x-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <Calendar size={13} className="text-slate-400" />
                            <span>Visit Logistics</span>
                          </h4>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Audit Date</label>
                              <input 
                                type="text" 
                                value={sv.auditDate} 
                                onChange={(e) => updateSiteVisitDetails(order.id, { auditDate: e.target.value })}
                                placeholder="10/24/2024"
                                disabled={isEmployee && order.stageStatus?.includes("Pending")}
                                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-1.5 focus:ring-[#003366]"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Audit Time</label>
                              <input 
                                type="text" 
                                value={sv.auditTime} 
                                onChange={(e) => updateSiteVisitDetails(order.id, { auditTime: e.target.value })}
                                placeholder="11:30 AM"
                                disabled={isEmployee && order.stageStatus?.includes("Pending")}
                                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-1.5 focus:ring-[#003366]"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Site Access Personnel</label>
                            <input 
                              type="text" 
                              value={sv.sitePersonnel || ""} 
                              onChange={(e) => updateSiteVisitDetails(order.id, { sitePersonnel: e.target.value })}
                              placeholder="Contact Name / Phone"
                              disabled={isEmployee && order.stageStatus?.includes("Pending")}
                              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-1.5 focus:ring-[#003366]"
                            />
                          </div>
                        </div>

                      </div>

                      {/* SITE SURVEY PHOTOS GRID */}
                      <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between">
                          <h4 className="flex items-center space-x-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <FileText size={13} className="text-slate-400" />
                            <span>Site Photos</span>
                          </h4>
                          <button
                            type="button"
                            onClick={() => {
                              const photo = prompt("Enter photo URL to add:");
                              if (photo) {
                                const currentPhotos = sv.photos || [];
                                updateSiteVisitDetails(order.id, { photos: [...currentPhotos, photo] });
                              }
                            }}
                            className="text-xs font-extrabold text-[#107C41] hover:underline"
                          >
                            + Add More
                          </button>
                        </div>

                        {/* Photos Grid matching mockup */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          
                          {/* Slot 1: Front view upload dotted placeholder */}
                          <div className="aspect-video sm:aspect-square bg-slate-50 border-2 border-dashed border-blue-200 rounded-lg flex flex-col items-center justify-center p-3 text-center cursor-pointer hover:bg-blue-50/20 transition-all">
                            <Camera className="text-blue-400 mb-1.5" size={20} />
                            <span className="text-[9px] font-extrabold text-[#003366] uppercase tracking-wider">Front View</span>
                            <span className="text-[8px] text-slate-400 mt-0.5">Click to upload</span>
                          </div>

                          {/* Image Slots with bottom-right overlay badges */}
                          {(() => {
                            const placeholders = [
                              { title: "SIDE ANGLE", fallback: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=200&auto=format&fit=crop" },
                              { title: "WIRING PT.", fallback: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=200&auto=format&fit=crop" },
                              { title: "DISTANCE", fallback: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=200&auto=format&fit=crop" }
                            ];
                            
                            return placeholders.map((pl, idx) => {
                              const photoSrc = sv.photos?.[idx + 1] || pl.fallback;
                              return (
                                <div key={idx} className="aspect-video sm:aspect-square bg-slate-100 border border-slate-200 rounded-lg overflow-hidden relative group shadow-xs">
                                  <img 
                                    src={photoSrc} 
                                    alt={pl.title} 
                                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                    onError={(e) => {
                                      e.currentTarget.src = pl.fallback;
                                    }}
                                  />
                                  <div className="absolute bottom-2 right-2 bg-[#003366] text-white text-[8px] font-black uppercase px-2 py-0.5 rounded tracking-wide">
                                    {pl.title}
                                  </div>
                                </div>
                              );
                            });
                          })()}

                        </div>
                      </div>

                    </div>
                  ) : (
                    renderActiveForm()
                  )}

                </div>

                {/* Card Footer matching completion toggle and Save button */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center space-x-3 select-none">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={activeStepTab === 0 ? (sv.completed || false) : activeStepTab === 1 ? (qd.grandTotal > 0) : activeStepTab === 2 ? (dd.status === "Approved") : activeStepTab === 3 ? (pd.assembly && pd.cutting) : false} 
                        onChange={(e) => {
                          if (activeStepTab === 0) {
                            updateSiteVisitDetails(order.id, { completed: e.target.checked });
                          } else if (activeStepTab === 2) {
                            updateDesignDetails(order.id, { status: e.target.checked ? "Approved" : "Draft" });
                          }
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#003366]"></div>
                      <span className="ml-3 text-xs font-bold text-slate-700">
                        Mark Site Visit as Completed <span className="text-[10px] text-slate-400 font-medium">(Triggers client SMS/Email)</span>
                      </span>
                    </label>
                  </div>

                  <div className="flex items-center space-x-3 self-end sm:self-auto">
                    <button
                      onClick={() => {
                        addNotification("Progress Saved", "Draft details written to worksheet.", "info");
                        // Simulating save
                      }}
                      className="px-6 py-2 bg-[#003366] hover:bg-[#002244] text-white rounded-lg text-xs font-bold transition-all shadow-xs"
                    >
                      Save Progress
                    </button>
                  </div>
                </div>

              </div>

              {/* CARD 2: INTERNAL TEAM LOGS (underneath) */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col">
                <div className="px-6 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Internal Team Logs</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                </div>

                {/* Manoj K comments mockup style */}
                <div className="p-6 space-y-4 flex-1">
                  
                  {/* Mock Comment from Screenshot */}
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs shrink-0">
                      MK
                    </div>
                    
                    <div className="flex-1 space-y-1">
                      <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-slate-700 leading-relaxed max-w-xl">
                        Spoke with client. They need the ACP to have a matte finish, not gloss. Update quotation accordingly.
                      </div>
                      <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider pl-1 mt-1">
                        Manoj K. • 2 Hours Ago
                      </div>
                    </div>
                  </div>

                  {/* Render context chat messages */}
                  {(order.chatHistory || []).map((chat) => {
                    const initials = chat.sender === "System" ? "SYS" : chat.sender.split(" ").map(n => n[0]).join("").toUpperCase();
                    return (
                      <div key={chat.id} className="flex items-start space-x-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                          chat.sender === "System" ? "bg-slate-200 text-slate-700" : "bg-emerald-100 text-emerald-800"
                        }`}>
                          {initials}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className={`border rounded-lg p-3 text-xs leading-relaxed max-w-xl ${
                            chat.sender === "System" 
                              ? "bg-slate-50 text-slate-650 border-slate-200 italic" 
                              : "bg-white text-slate-700 border-slate-200"
                          }`}>
                            {chat.message}
                          </div>
                          <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider pl-1 mt-1">
                            {chat.sender} • {chat.time}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                </div>

                {/* Comment send form */}
                <form onSubmit={handleSendChat} className="p-4 bg-slate-50 border-t border-slate-100 flex items-center space-x-3 shrink-0">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Log internal update comment..."
                    className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#003366]"
                  />
                  <button
                    type="submit"
                    className="p-2 bg-[#003366] hover:bg-[#002244] text-white rounded-lg transition-colors cursor-pointer"
                  >
                    <Send size={14} />
                  </button>
                </form>
              </div>

            </div>

            {/* RIGHT COLUMN: Project Details, Site Location, Quick Actions (30% width or 1 col) */}
            <div className="space-y-6">
              
              {/* CARD 1: PROJECT DETAILS */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col">
                
                {/* Dark Blue Header */}
                <div className="bg-[#003366] px-6 py-4 flex items-center justify-between text-white">
                  <span className="text-[10px] font-black uppercase tracking-widest">Project Details</span>
                  <button className="text-white/80 hover:text-white transition-colors cursor-pointer" title="Edit Details">
                    <Pencil size={13} />
                  </button>
                </div>

                {/* Card Body */}
                <div className="p-6 space-y-4 text-xs font-semibold text-slate-600">
                  
                  {/* CLIENT IDENTITY */}
                  <div className="space-y-2">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Client Identity</span>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-[#0c1a2d] rounded-lg flex items-center justify-center text-white shrink-0 font-bold">
                        H
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-800 text-sm leading-tight">{client?.name || "HDFC Bank Ltd."}</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">Regional HQ, Mumbai</p>
                      </div>
                    </div>
                  </div>

                  <hr className="border-slate-100" />

                  {/* SIGNAGE TYPE & EST BUDGET */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Signage Type</span>
                      <p className="font-extrabold text-slate-800 text-xs">{qd.signageType || "ACP 3D Letters"}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Est. Budget</span>
                      <p className="font-extrabold text-[#107C41] text-xs">₹ {order.budget?.toLocaleString("en-IN") || "2,45,000"}</p>
                    </div>
                  </div>

                  <hr className="border-slate-100" />

                  {/* PRIMARY ASSIGNEE */}
                  <div className="space-y-2">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Primary Assignee</span>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs shrink-0">
                        AS
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-800 text-xs leading-tight">{sv.sitePersonnel || "Amit Sharma"}</h4>
                        <p className="text-[9px] text-slate-400 mt-0.5">Lead Fabrication Engineer</p>
                      </div>
                    </div>
                  </div>

                  <hr className="border-slate-100" />

                  {/* OVERALL PROGRESS */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      <span>Overall Progress</span>
                      <span className="text-[#107C41] font-extrabold">{Math.round(((currentStageIndex + 1) / 5) * 100)}%</span>
                    </div>
                    
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-[#107C41] h-full rounded-full transition-all duration-500" 
                        style={{ width: `${((currentStageIndex + 1) / 5) * 100}%` }}
                      />
                    </div>
                  </div>

                </div>

              </div>

              {/* CARD 2: SITE LOCATION MAP */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center space-x-2">
                  <MapPin size={14} className="text-slate-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Site Location</span>
                </div>

                <div className="p-6 space-y-4">
                  {/* Grayscale map design matching mockup */}
                  <div className="h-32 bg-slate-100 border border-slate-200 rounded-lg overflow-hidden relative flex items-center justify-center">
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(200,200,200,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(200,200,200,0.1)_1px,transparent_1px)] bg-[size:16px_16px]" />
                    <div className="absolute top-1/4 left-1/3 w-24 h-0.5 bg-slate-300 transform -rotate-12" />
                    <div className="absolute top-1/2 left-1/4 w-32 h-0.5 bg-slate-300 transform rotate-45" />
                    <div className="absolute top-2/3 left-1/2 w-20 h-0.5 bg-slate-300 transform -rotate-45" />
                    
                    <div className="flex flex-col items-center z-10 relative">
                      <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center text-white shadow-md animate-bounce">
                        <MapPin size={12} />
                      </div>
                      <span className="bg-white text-slate-800 text-[8px] font-black px-2 py-0.5 rounded shadow-xs border border-slate-100 mt-1 uppercase tracking-wider">
                        MUMBAI BKC HUB
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 leading-normal font-semibold">
                    {client?.shippingAddress || "Plot C-2, G Block, BKC, Bandra (E), Mumbai 400051."}
                  </p>
                </div>

              </div>

              {/* CARD 3: SITE LOGS ACTION BUTTONS */}
              <div className="space-y-3">
                <button
                  onClick={() => setShowAuditHistory(!showAuditHistory)}
                  className="w-full flex items-center justify-center space-x-2 py-3 bg-[#EAF2FA] hover:bg-[#D5E5F5] text-[#003366] rounded-xl text-xs font-bold transition-all border border-[#D5E5F5] shadow-xs"
                >
                  <History size={14} />
                  <span>View Audit History</span>
                </button>
                
                <button
                  onClick={() => addNotification("Exporting", "Downloading Site Brief PDF...", "info")}
                  className="w-full flex items-center justify-center space-x-2 py-3 bg-[#EAF2FA] hover:bg-[#D5E5F5] text-[#003366] rounded-xl text-xs font-bold transition-all border border-[#D5E5F5] shadow-xs"
                >
                  <Download size={14} />
                  <span>Download Site Brief</span>
                </button>
              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
