"use client";

import React, { useState, useEffect, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { 
  X, 
  Plus, 
  Camera, 
  MapPin, 
  Calendar, 
  Clock, 
  User, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp,
  MessageSquare,
  Save,
  Send,
  ArrowLeft,
  Phone,
  Mail,
  Eye,
  Download,
  Trash,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { 
  Order, 
  Customer, 
  Employee, 
  SiteVisitDetails, 
  SignLocation, 
  SitePhotoCategories 
} from "@/types";
import { ScheduleVisitModal } from "./ScheduleVisitModal";
import { scheduleSiteVisitAction } from "@/features/orders/actions/orderActions";

export interface ExtendedSignLocation {
  id: string;
  name: string;
  width?: number;
  height?: number;
  depth?: number;
  groundClearance?: number;
  notes?: string;
  photos?: string[];
  photoCategories?: SitePhotoCategories;
  powerAvailable?: boolean;
  distanceToPowerSource?: number;
  distanceToPowerSourceUnit?: string;
  electricalNotes?: string;
  wallType?: string;
  mountingMethod?: string;
  surfaceCondition?: string;
  obstacles?: string[];
  structuralNotes?: string;
  internalNotes?: {
    customerPreferences?: string;
    budgetNotes?: string;
    suggestedProductType?: string;
    competitorReferences?: string;
    specialInstallationNotes?: string;
  };
}

interface SiteVisitModuleProps {
  order: Order;
  customers: Customer[];
  employees: Employee[];
  currentUserRole: "Admin" | "Employee";
  currentEmployee: Employee | null;
  onClose: () => void;
  onUpdate: (details: Partial<SiteVisitDetails>) => Promise<void>;
  onSubmitForApproval?: () => Promise<void>;
  onAdminApprove?: () => Promise<void>;
  onAdminRequestChanges?: (notes: string) => Promise<void>;
  onStaffApproveVisit?: () => Promise<void>;
  actionsNode?: React.ReactNode;
}

// Default initial data
const defaultPhotoCategories: SitePhotoCategories = {
  front: [],
  installationArea: [],
  powerSource: [],
  measurementReference: [],
  additional: []
};

const defaultSignLocation: Omit<SignLocation, "id"> = {
  name: "",
  photos: []
};

export const SiteVisitModule: React.FC<SiteVisitModuleProps> = ({
  order,
  customers,
  employees,
  currentUserRole,
  currentEmployee,
  onClose,
  onUpdate,
  onSubmitForApproval,
  onAdminApprove,
  onAdminRequestChanges,
  onStaffApproveVisit,
  actionsNode
}) => {
  // Current client
  const client = customers.find(c => c.id === order.customerId);
  
  // State for collapsed sections
  const [collapsed, setCollapsed] = useState({
    visitInfo: false,
    measurements: false,
    sitePhotos: false,
    electrical: false,
    structural: false,
    internalNotes: false
  });
  
  // State for expanded sign locations
  const [expandedLocations, setExpandedLocations] = useState<string[]>([]);
  
  // Local state for site visit details (optimistic UI)
  const [siteVisit, setSiteVisit] = useState<SiteVisitDetails>(() => {
    const baseDetails = (order.siteVisitDetails || {}) as Partial<SiteVisitDetails>;
    return {
      completed: false,
      width: 0,
      height: 0,
      depth: 0,
      photos: [],
      ...baseDetails,
      locations: (baseDetails.locations || []).map(loc => ({
        ...loc,
        photos: loc.photos || []
      })),
      photoCategories: baseDetails.photoCategories || defaultPhotoCategories
    };
  });
  
  // State for chat panel
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);

  // State for manual scheduling
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  // Site photo upload state
  const [sitePhotoUrls, setSitePhotoUrls] = useState<string[]>(
    () => (order.siteVisitDetails as any)?.photoCategories?.additional || []
  );
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  // Photo viewer state
  const [viewerPhotos, setViewerPhotos] = useState<string[]>([]);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  const openViewer = (photosArray: string[], index: number) => {
    setViewerPhotos(photosArray);
    setViewerIndex(index);
  };

  const uploadSitePhoto = async (file: File) => {
    const supabase = createClient();
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${order.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage
      .from("site-visit-photos")
      .upload(path, file, { upsert: false, contentType: file.type });
    if (error) throw error;
    const { data } = supabase.storage.from("site-visit-photos").getPublicUrl(path);
    return data.publicUrl;
  };

  const handlePhotoFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadingPhotos(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        const url = await uploadSitePhoto(file);
        urls.push(url);
      }
      const newUrls = [...sitePhotoUrls, ...urls];
      setSitePhotoUrls(newUrls);
      
      // Update local state AND notify parent
      const updatedDetails = {
        ...siteVisit,
        photoCategories: {
          ...(siteVisit.photoCategories || defaultPhotoCategories),
          additional: newUrls
        }
      };
      setSiteVisit(updatedDetails);
      onUpdate(updatedDetails);
    } catch (err: any) {
      alert("Upload failed: " + (err?.message || "Unknown error"));
    } finally {
      setUploadingPhotos(false);
    }
  };

  const removeSitePhoto = async (url: string) => {
    const supabase = createClient();
    // Extract path from public URL
    const path = url.split("/site-visit-photos/").pop();
    if (path) await supabase.storage.from("site-visit-photos").remove([path]);
    const newUrls = sitePhotoUrls.filter(u => u !== url);
    setSitePhotoUrls(newUrls);
    
    const updatedDetails = {
      ...siteVisit,
      photoCategories: {
        ...(siteVisit.photoCategories || defaultPhotoCategories),
        additional: newUrls
      }
    };
    setSiteVisit(updatedDetails);
    onUpdate(updatedDetails);
  };

  useEffect(() => {
    const baseDetails = (order.siteVisitDetails || {}) as Partial<SiteVisitDetails>;
    setSiteVisit({
      completed: false,
      width: 0,
      height: 0,
      depth: 0,
      photos: [],
      ...baseDetails,
      locations: (baseDetails.locations || []).map(loc => ({
        ...loc,
        photos: loc.photos || []
      })),
      photoCategories: baseDetails.photoCategories || defaultPhotoCategories
    });

    const locs = baseDetails.locations || [];
    if (locs.length > 0) {
      setSelectedLocationId(prev => prev || locs[0].id);
    }
  }, [order.siteVisitDetails]);
  
  // State for selected sign location tab
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(() => {
    const baseDetails = (order.siteVisitDetails || {}) as Partial<SiteVisitDetails>;
    const locs = baseDetails.locations || [];
    return locs.length > 0 ? locs[0].id : null;
  });
  
  // State for admin reject notes
  const [rejectNotes, setRejectNotes] = useState("");
  
  // Helper to toggle section collapse
  const toggleSection = (section: keyof typeof collapsed) => {
    setCollapsed(prev => ({ ...prev, [section]: !prev[section] }));
  };
  
  // Helper to toggle location expand (No longer needed, kept for compatibility if needed)
  const toggleLocation = (id: string) => {
    setExpandedLocations(prev => 
      prev.includes(id) ? prev.filter(lid => lid !== id) : [...prev, id]
    );
  };
  
  // Add a new sign location
  const addSignLocation = () => {
    const nextNum = (siteVisit.locations?.length || 0) + 1;
    const newLocation: SignLocation = {
      id: Date.now().toString(),
      ...defaultSignLocation,
      name: `Item-${nextNum}`
    };
    
    const updatedLocations = [...(siteVisit.locations || []), newLocation];
    const updatedDetails = { ...siteVisit, locations: updatedLocations };
    setSiteVisit(updatedDetails);
    setSelectedLocationId(newLocation.id);
    onUpdate(updatedDetails);
  };
  
  // Update a sign location
  const updateSignLocation = (id: string, updates: Partial<SignLocation>) => {
    const updatedLocations = (siteVisit.locations || []).map(loc => 
      loc.id === id ? { ...loc, ...updates } : loc
    );
    const updatedDetails = { ...siteVisit, locations: updatedLocations };
    setSiteVisit(updatedDetails);
    onUpdate(updatedDetails);
  };
  
  // Remove a sign location
  const removeSignLocation = (id: string) => {
    const updatedLocations = (siteVisit.locations || []).filter(loc => loc.id !== id);
    const updatedDetails = { ...siteVisit, locations: updatedLocations };
    setSiteVisit(updatedDetails);
    onUpdate(updatedDetails);
    if (selectedLocationId === id) {
      setSelectedLocationId(updatedLocations.length > 0 ? updatedLocations[0].id : null);
    }
  };
  
  // Add a photo to a category
  const addPhotoToCategory = (category: keyof SitePhotoCategories, url: string) => {
    if (!selectedLocationId) return;
    const updatedLocations = (siteVisit.locations || []).map(loc => {
      if (loc.id === selectedLocationId) {
        const currentCats = (loc as any).photoCategories || defaultPhotoCategories;
        return {
          ...loc,
          photoCategories: {
            ...currentCats,
            [category]: [...(currentCats[category] || []), url]
          }
        };
      }
      return loc;
    });
    const updatedDetails = { ...siteVisit, locations: updatedLocations };
    setSiteVisit(updatedDetails);
    onUpdate(updatedDetails);
  };
  
  // Remove a photo from a category
  const removePhotoFromCategory = (category: keyof SitePhotoCategories, index: number) => {
    if (!selectedLocationId) return;
    const updatedLocations = (siteVisit.locations || []).map(loc => {
      if (loc.id === selectedLocationId) {
        const currentCats = (loc as any).photoCategories || defaultPhotoCategories;
        return {
          ...loc,
          photoCategories: {
            ...currentCats,
            [category]: (currentCats[category] || []).filter((_: string, i: number) => i !== index)
          }
        };
      }
      return loc;
    });
    const updatedDetails = { ...siteVisit, locations: updatedLocations };
    setSiteVisit(updatedDetails);
    onUpdate(updatedDetails);
  };
  
  const activeLoc = (siteVisit.locations || []).find(l => l.id === selectedLocationId) as ExtendedSignLocation | undefined;

  const updateActiveLocationFields = (updates: Partial<ExtendedSignLocation>) => {
    if (!selectedLocationId) return;
    const updatedLocations = (siteVisit.locations || []).map(loc => 
      loc.id === selectedLocationId ? { ...loc, ...updates } : loc
    );
    const updatedDetails = { ...siteVisit, locations: updatedLocations };
    setSiteVisit(updatedDetails);
    onUpdate(updatedDetails);
  };

  const updateRootFields = (updates: Partial<SiteVisitDetails>) => {
    const updatedDetails = { ...siteVisit, ...updates };
    setSiteVisit(updatedDetails);
    onUpdate(updatedDetails);
  };

  const scheduledDate = siteVisit.auditDate || siteVisit.preferredDate || siteVisit.visitDate;
  const scheduledTime = siteVisit.auditTime || siteVisit.preferredTime || siteVisit.visitTime;
  const scheduledAddress = siteVisit.customerAddress || siteVisit.siteAddress;

  return (
    <div className="space-y-6 text-slate-800">
      
      {/* ── SCHEDULED VISIT DETAILS (from customer portal) ── */}
      {scheduledDate || scheduledAddress ? (
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-indigo-600" />
              <h3 className="text-sm font-extrabold text-indigo-900 uppercase tracking-wider">
                Scheduled Site Visit
              </h3>
            </div>
            {order.stage === "Site Visit Pending" && siteVisit.reviewStatus === "Pending" && currentUserRole === "Employee" && onStaffApproveVisit && (
              <button
                onClick={async () => {
                  try {
                    await onStaffApproveVisit();
                  } catch (e) {
                    console.error(e);
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all shadow-sm"
              >
                <CheckCircle2 size={14} />
                Approve Date & Time
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Date & Time */}
            {(scheduledDate || scheduledTime) && (
              <div className="bg-white rounded-xl p-4 border border-indigo-100 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Clock size={14} className="text-indigo-500" />
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                    Visit Schedule
                  </span>
                </div>
                <p className="text-sm font-extrabold text-indigo-900">
                  {scheduledDate && !isNaN(Date.parse(scheduledDate)) ? new Date(scheduledDate).toLocaleDateString('en-IN', { 
                    weekday: 'short', 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  }) : scheduledDate}
                </p>
                {scheduledTime && (
                  <p className="text-xs font-semibold text-indigo-700 mt-1">
                    At {scheduledTime}
                  </p>
                )}
              </div>
            )}

            {/* Address */}
            {scheduledAddress && (
              <div className="bg-white rounded-xl p-4 border border-indigo-100 shadow-sm md:col-span-2">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin size={14} className="text-indigo-500" />
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                    Site Address
                  </span>
                </div>
                <p className="text-sm font-semibold text-slate-800">
                  {scheduledAddress}
                </p>
                {siteVisit.landmark && (
                  <p className="text-xs text-slate-500 mt-1">
                    Near: {siteVisit.landmark}
                  </p>
                )}
                {siteVisit.gpsLocation && (
                  <p className="text-xs text-slate-400 mt-1 font-mono">
                    GPS: {siteVisit.gpsLocation}
                  </p>
                )}
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(siteVisit.gpsLocation || scheduledAddress)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-2.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg transition-colors border border-indigo-100"
                >
                  <MapPin size={12} />
                  View Map Location
                </a>
              </div>
            )}

            {/* Contact Person */}
            {siteVisit.contactPerson && (
              <div className="bg-white rounded-xl p-4 border border-indigo-100 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <User size={14} className="text-indigo-500" />
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                    Contact Person
                  </span>
                </div>
                <p className="text-sm font-extrabold text-slate-800">
                  {siteVisit.contactPerson}
                </p>
                {siteVisit.customerContact && (
                  <p className="text-xs font-semibold text-indigo-700 mt-1">
                    {siteVisit.customerContact}
                  </p>
                )}
              </div>
            )}

            {/* Site Type & Instructions */}
            {(siteVisit.siteType || siteVisit.notes) && (
              <div className="bg-white rounded-xl p-4 border border-indigo-100 shadow-sm md:col-span-2">
                {siteVisit.siteType && (
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                      Site Type: {siteVisit.siteType}
                    </span>
                  </div>
                )}
                {siteVisit.notes && (
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Special Instructions
                    </span>
                    <p className="text-xs text-slate-600">
                      {siteVisit.notes}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-4 justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
              <Calendar size={18} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800">No Site Visit Scheduled Yet</h4>
              <p className="text-xs text-slate-500 mt-0.5">The client has not yet scheduled their site visit date, time, and location from the customer portal.</p>
            </div>
          </div>
          <button 
            onClick={() => setIsScheduleModalOpen(true)}
            className="px-4 py-2 bg-emerald-600 text-white font-semibold text-xs rounded-lg whitespace-nowrap hover:bg-emerald-700 transition-colors shadow-sm"
          >
            Schedule by yourself
          </button>
        </div>
      )}

      <ScheduleVisitModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        defaultAddress={client?.shippingAddress}
        onSchedule={async (date, time, location, coords) => {
          try {
            await scheduleSiteVisitAction(order.id, {
              auditDate: date,
              auditTime: time,
              customerAddress: location,
              gpsLocation: coords
            });
            await onUpdate({
              auditDate: date,
              auditTime: time,
              customerAddress: location,
              gpsLocation: coords
            });
            setSiteVisit(prev => ({
              ...prev,
              auditDate: date,
              auditTime: time,
              customerAddress: location,
              gpsLocation: coords
            }));
          } catch (err) {
            console.error("Failed to schedule site visit", err);
            alert("Failed to schedule site visit. Please try again.");
          }
        }}
      />
      
      {/* ── TOP TOGGLABLE BAR & READY CHECKBOX ── */}
      <div className="bg-gradient-to-r from-slate-50 to-slate-100/50 border border-slate-200/80 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-300">
        
        {/* Horizontal scrollable tab list */}
        <div 
          className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent flex-1"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {(siteVisit.locations || []).map((loc, idx) => {
            const isSelected = loc.id === selectedLocationId;
            return (
              <div key={loc.id} className={`flex items-center flex-shrink-0 border rounded-full pl-3 pr-1 py-1 transition-all ${isSelected ? "bg-[var(--color-secondary)]/10 border-[var(--color-secondary)]" : "bg-white border-slate-200 hover:bg-slate-50"}`}>
                <button
                  onClick={() => setSelectedLocationId(loc.id)}
                  className={`text-xs font-bold transition-all focus:outline-none ${isSelected ? "text-[var(--color-secondary)] font-extrabold" : "text-slate-500"}`}
                >
                  {loc.name || `Item-${idx + 1}`}
                </button>
                <button
                  onClick={() => removeSignLocation(loc.id)}
                  className={`ml-2 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors focus:outline-none ${isSelected ? "text-[var(--color-secondary)] hover:text-red-650 hover:bg-red-50" : "text-slate-400 hover:text-red-550 hover:bg-red-50"}`}
                  title="Remove item"
                >
                  ×
                </button>
              </div>
            );
          })}
          
          {/* New Item Button */}
          <button
            onClick={addSignLocation}
            className="flex items-center gap-1 px-3.5 py-1.5 bg-white border border-dashed border-[var(--color-secondary)] text-[var(--color-secondary)] hover:bg-[var(--color-secondary)]/5 rounded-full text-xs font-bold transition-all flex-shrink-0 focus:outline-none"
          >
            <Plus size={12} /> New Item
          </button>
        </div>

        {actionsNode && (
          <div className="flex items-center gap-3 flex-shrink-0">
            {actionsNode}
          </div>
        )}
      </div>

      {!activeLoc ? (
        <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl bg-slate-50/30 flex flex-col items-center justify-center p-6">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
            <MapPin size={20} className="text-slate-400" />
          </div>
          <p className="text-sm font-semibold text-slate-700">No items added yet</p>
          <p className="text-xs text-slate-500 mt-1 max-w-xs">Create a new item using the "New Item" button at the top to start auditing.</p>
        </div>
      ) : (
        <>
          {/* ── MEASUREMENT ITEMS SECTION ── */}
          <div className="bg-white border border-slate-200/70 rounded-2xl shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-secondary)]" />
                Measurement Details
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Specify sizes, ground clearance, and upload reference photos for {activeLoc.name}</p>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">Item Label / Name</label>
                <input
                  type="text"
                  value={activeLoc.name}
                  onChange={(e) => updateSignLocation(activeLoc.id, { name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--color-secondary)]/20 focus:border-[var(--color-secondary)] bg-white transition-all"
                  placeholder="e.g. Front Entrance Main Signage"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">Width</label>
                  <input
                    type="number"
                    value={activeLoc.width || ""}
                    onChange={(e) => updateSignLocation(activeLoc.id, { width: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--color-secondary)]/20 focus:border-[var(--color-secondary)] bg-white transition-all"
                    placeholder="ft / m"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">Height</label>
                  <input
                    type="number"
                    value={activeLoc.height || ""}
                    onChange={(e) => updateSignLocation(activeLoc.id, { height: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--color-secondary)]/20 focus:border-[var(--color-secondary)] bg-white transition-all"
                    placeholder="ft / m"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">Depth</label>
                  <input
                    type="number"
                    value={activeLoc.depth || ""}
                    onChange={(e) => updateSignLocation(activeLoc.id, { depth: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--color-secondary)]/20 focus:border-[var(--color-secondary)] bg-white transition-all"
                    placeholder="ft / m"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">Ground Clearance</label>
                  <input
                    type="number"
                    value={activeLoc.groundClearance || ""}
                    onChange={(e) => updateSignLocation(activeLoc.id, { groundClearance: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--color-secondary)]/20 focus:border-[var(--color-secondary)] bg-white transition-all"
                    placeholder="ft / m"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">Location / Surface Specific Notes</label>
                <textarea
                  value={activeLoc.notes || ""}
                  onChange={(e) => updateSignLocation(activeLoc.id, { notes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--color-secondary)]/20 focus:border-[var(--color-secondary)] bg-white transition-all resize-none"
                  placeholder="Details on wall conditions, accessibility barriers..."
                />
              </div>
            </div>
          </div>

          {/* ── SITE PHOTOS ── */}
          <SectionCard
            title="Site Photos"
            icon="📸"
            isCollapsed={collapsed.sitePhotos}
            onToggle={() => toggleSection("sitePhotos")}
          >
            <SitePhotoUploader
              photos={sitePhotoUrls}
              uploading={uploadingPhotos}
              onFiles={handlePhotoFiles}
              onRemove={removeSitePhoto}
              onView={(idx) => openViewer(sitePhotoUrls, idx)}
            />
          </SectionCard>

          {/* ── ELECTRICAL ASSESSMENT ── */}
          <SectionCard
            title="Electrical Assessment"
            icon="⚡"
            isCollapsed={collapsed.electrical}
            onToggle={() => toggleSection("electrical")}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Power Source Available?</label>
                <div className="flex gap-3">
                  {[true, false].map(option => (
                    <label
                      key={String(option)}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border rounded-xl cursor-pointer transition-all ${
                        siteVisit.powerAvailable === option 
                          ? "border-[var(--color-secondary)] bg-[var(--color-secondary)]/5 text-[var(--color-secondary)] font-bold shadow-xs" 
                          : "border-slate-200 text-slate-650 hover:bg-slate-50 font-medium"
                      }`}
                    >
                      <input
                        type="radio"
                        name="powerAvailable"
                        checked={siteVisit.powerAvailable === option}
                        onChange={() => updateRootFields({ powerAvailable: option })}
                        className="accent-[var(--color-secondary)]"
                      />
                      <span className="text-xs">{option ? "Yes, Available" : "No Power"}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Distance to Power Source</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={siteVisit.distanceToPowerSource || ""}
                    onChange={(e) => updateRootFields({ distanceToPowerSource: parseFloat(e.target.value) || 0 })}
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--color-secondary)]/20 focus:border-[var(--color-secondary)] bg-white transition-all"
                    placeholder="e.g. 5"
                  />
                  <select
                    value={siteVisit.distanceToPowerSourceUnit || "meters"}
                    onChange={(e) => updateRootFields({ distanceToPowerSourceUnit: e.target.value })}
                    className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--color-secondary)]/20 focus:border-[var(--color-secondary)] bg-white transition-all"
                  >
                    <option value="meters">meters</option>
                    <option value="feet">feet</option>
                  </select>
                </div>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Electrical Assessment Notes</label>
                <textarea
                  value={siteVisit.electricalNotes || ""}
                  onChange={(e) => updateRootFields({ electricalNotes: e.target.value })}
                  rows={3}
                  placeholder="Detail power source details, availability of sockets, switchboards, cabling paths..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--color-secondary)]/20 focus:border-[var(--color-secondary)] bg-white transition-all resize-none"
                />
              </div>
            </div>
          </SectionCard>

          {/* ── STRUCTURAL ASSESSMENT ── */}
          <SectionCard
            title="Structural Assessment"
            icon="🏗️"
            isCollapsed={collapsed.structural}
            onToggle={() => toggleSection("structural")}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Wall / Surface Type</label>
                <select
                  value={siteVisit.wallType || ""}
                  onChange={(e) => updateRootFields({ wallType: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--color-secondary)]/20 focus:border-[var(--color-secondary)] bg-white transition-all"
                >
                  <option value="">Select Wall Type</option>
                  <option value="Concrete">Concrete Wall</option>
                  <option value="ACP Cladding">ACP Cladding</option>
                  <option value="Glass">Glass facade</option>
                  <option value="Tile">Tile surface</option>
                  <option value="Metal">Iron / Metal framing</option>
                  <option value="Wood">Wood / MDF paneling</option>
                  <option value="Composite Panel">Composite board</option>
                </select>
              </div>
              
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Proposed Mounting Method</label>
                <select
                  value={siteVisit.mountingMethod || ""}
                  onChange={(e) => updateRootFields({ mountingMethod: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--color-secondary)]/20 focus:border-[var(--color-secondary)] bg-white transition-all"
                >
                  <option value="">Select Mounting Method</option>
                  <option value="Direct Mount">Direct Anchor Mounting</option>
                  <option value="Frame Mount">Metal Support Framing</option>
                  <option value="Hanging">Suspended / Cable Mount</option>
                  <option value="Pole Mounted">Pylon / Pole Mounting</option>
                </select>
              </div>
              
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Surface Quality / Condition</label>
                <input
                  type="text"
                  value={siteVisit.surfaceCondition || ""}
                  onChange={(e) => updateRootFields({ surfaceCondition: e.target.value })}
                  placeholder="e.g. Robust concrete, brittle ACP sheets..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--color-secondary)]/20 focus:border-[var(--color-secondary)] bg-white transition-all"
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Physical Obstacles</label>
                <input
                  type="text"
                  value={siteVisit.obstacles?.join(", ") || ""}
                  onChange={(e) => updateRootFields({ obstacles: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--color-secondary)]/20 focus:border-[var(--color-secondary)] bg-white transition-all"
                  placeholder="e.g. Tree branches, security cams, pipes (comma separated)"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Structural Reinforcements / Special Instructions</label>
                <textarea
                  value={siteVisit.structuralNotes || ""}
                  onChange={(e) => updateRootFields({ structuralNotes: e.target.value })}
                  rows={3}
                  placeholder="Detail scaffolding needs, anchor size specifications, framing reinforcements..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--color-secondary)]/20 focus:border-[var(--color-secondary)] bg-white transition-all resize-none"
                />
              </div>
            </div>
          </SectionCard>

          {/* ── INTERNAL NOTES REMOVED ── */}
        </>
      )}

      {/* ── PHOTO VIEWER MODAL ── */}
      {viewerIndex !== null && viewerPhotos.length > 0 && (
        <div 
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center backdrop-blur-sm"
          onClick={() => setViewerIndex(null)}
        >
          {/* Close button */}
          <button 
            className="absolute top-6 right-6 text-white/70 hover:text-white bg-black/50 hover:bg-black/80 rounded-full p-2 transition-all focus:outline-none"
            onClick={() => setViewerIndex(null)}
          >
            <X size={24} />
          </button>
          
          {/* Main Image */}
          <div className="relative max-w-4xl max-h-[85vh] w-full h-full flex items-center justify-center p-4">
            <img 
              src={viewerPhotos[viewerIndex]} 
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              alt="Viewed full size"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          
          {/* Previous button */}
          {viewerIndex > 0 && (
            <button
              className="absolute left-6 top-1/2 -translate-y-1/2 text-white/70 hover:text-white bg-black/50 hover:bg-black/80 rounded-full p-3 transition-all focus:outline-none"
              onClick={(e) => { e.stopPropagation(); setViewerIndex(viewerIndex - 1); }}
            >
              <ChevronLeft size={32} />
            </button>
          )}
          
          {/* Next button */}
          {viewerIndex < viewerPhotos.length - 1 && (
            <button
              className="absolute right-6 top-1/2 -translate-y-1/2 text-white/70 hover:text-white bg-black/50 hover:bg-black/80 rounded-full p-3 transition-all focus:outline-none"
              onClick={(e) => { e.stopPropagation(); setViewerIndex(viewerIndex + 1); }}
            >
              <ChevronRight size={32} />
            </button>
          )}
          
          {/* Image Counter */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 text-white text-sm font-medium px-4 py-1.5 rounded-full backdrop-blur-md">
            {viewerIndex + 1} / {viewerPhotos.length}
          </div>
        </div>
      )}
    </div>
  );
};

// ── SECTION CARD WRAPPER COMPONENT ──
const SectionCard: React.FC<{
  title: string;
  icon?: string;
  children: React.ReactNode;
  isCollapsed: boolean;
  onToggle: () => void;
  extra?: React.ReactNode;
}> = ({ title, icon, children, isCollapsed, onToggle, extra }) => (
  <div className="bg-white border border-slate-200/70 rounded-2xl shadow-xs overflow-hidden transition-all duration-200 hover:border-slate-300/80">
    <div className="w-full px-5 py-4 flex items-center justify-between bg-slate-50/30 hover:bg-slate-50/70 border-b border-slate-100 transition-colors">
      <button
        onClick={onToggle}
        className="flex-1 text-left flex items-center justify-between focus:outline-none"
      >
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          {icon && <span className="text-base">{icon}</span>}
          {title}
        </h3>
        {!extra && (
          isCollapsed ? <ChevronDown size={18} className="text-slate-400 transition-transform duration-200" /> : <ChevronUp size={18} className="text-slate-400 transition-transform duration-200" />
        )}
      </button>
      {extra && (
        <div className="flex items-center gap-3">
          {extra}
          <button onClick={onToggle} className="focus:outline-none">
            {isCollapsed ? <ChevronDown size={18} className="text-slate-400" /> : <ChevronUp size={18} className="text-slate-400" />}
          </button>
        </div>
      )}
    </div>
    {!isCollapsed && (
      <div className="px-5 pb-5">
        {children}
      </div>
    )}
  </div>
);

// ── SELECTED LOCATION FORM COMPONENT ──
const SelectedLocationForm: React.FC<{
  location: SignLocation;
  onUpdate: (id: string, updates: Partial<SignLocation>) => void;
  onView: (idx: number) => void;
}> = ({ location, onUpdate, onView }) => {
  const [tempPhotoUrl, setTempPhotoUrl] = useState("");
  const photos = location.photos || [];
  
  return (
    <div className="space-y-4 pt-2">
      <div>
        <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">Location Label</label>
        <input
          type="text"
          value={location.name}
          onChange={(e) => onUpdate(location.id, { name: e.target.value })}
          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--color-secondary)]/20 focus:border-[var(--color-secondary)] bg-white transition-all"
          placeholder="e.g. Front Entrance Main Signage"
        />
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">Width</label>
          <input
            type="number"
            value={location.width || ""}
            onChange={(e) => onUpdate(location.id, { width: parseFloat(e.target.value) || 0 })}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--color-secondary)]/20 focus:border-[var(--color-secondary)] bg-white transition-all"
            placeholder="ft / m"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">Height</label>
          <input
            type="number"
            value={location.height || ""}
            onChange={(e) => onUpdate(location.id, { height: parseFloat(e.target.value) || 0 })}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--color-secondary)]/20 focus:border-[var(--color-secondary)] bg-white transition-all"
            placeholder="ft / m"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">Depth</label>
          <input
            type="number"
            value={location.depth || ""}
            onChange={(e) => onUpdate(location.id, { depth: parseFloat(e.target.value) || 0 })}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--color-secondary)]/20 focus:border-[var(--color-secondary)] bg-white transition-all"
            placeholder="ft / m"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">Ground Clearance</label>
          <input
            type="number"
            value={location.groundClearance || ""}
            onChange={(e) => onUpdate(location.id, { groundClearance: parseFloat(e.target.value) || 0 })}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--color-secondary)]/20 focus:border-[var(--color-secondary)] bg-white transition-all"
            placeholder="ft / m"
          />
        </div>
      </div>
      
      <div>
        <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">Location / Surface Specific Notes</label>
        <textarea
          value={location.notes || ""}
          onChange={(e) => onUpdate(location.id, { notes: e.target.value })}
          rows={2}
          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--color-secondary)]/20 focus:border-[var(--color-secondary)] bg-white transition-all resize-none"
          placeholder="Details on wall conditions, accessibility barriers..."
        />
      </div>
      
      <div className="border-t border-slate-100 pt-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
          <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Location Reference Photos</label>
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              placeholder="Paste photo URL..."
              value={tempPhotoUrl}
              onChange={(e) => setTempPhotoUrl(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-[11px] focus:outline-none focus:ring-2 focus:ring-[var(--color-secondary)]/20 focus:border-[var(--color-secondary)] w-48 bg-white"
            />
            <button
              onClick={() => {
                if (tempPhotoUrl) {
                  onUpdate(location.id, { 
                    photos: [...(location.photos || []), tempPhotoUrl] 
                  });
                  setTempPhotoUrl("");
                }
              }}
              className="px-3 py-1.5 bg-[var(--color-secondary)] text-white rounded-lg text-[11px] font-bold hover:bg-[#4338ca]"
            >
              Add Photo
            </button>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3">
          {photos.map((photo, idx) => (
            <div key={idx} className="relative group w-20 h-20 rounded-xl overflow-hidden border border-slate-200 shadow-3xs">
              <img
                src={photo}
                alt={`Location photo ${idx + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=200&auto=format&fit=crop";
                }}
              />
              <div className="absolute inset-0 bg-slate-900/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                <button
                  onClick={(e) => { e.stopPropagation(); onView(idx); }}
                  className="w-6 h-6 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-white transition-colors"
                  title="View"
                >
                  <Eye size={12} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); window.open(`${photo}?download=`, '_blank'); }}
                  className="w-6 h-6 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-white transition-colors"
                  title="Download"
                >
                  <Download size={12} />
                </button>
                <button
                  onClick={(e) => { 
                    e.stopPropagation();
                    onUpdate(location.id, { 
                      photos: photos.filter((_, i) => i !== idx) 
                    });
                  }}
                  className="w-6 h-6 rounded-full bg-red-500/80 hover:bg-red-500 flex items-center justify-center text-white transition-colors"
                  title="Remove"
                >
                  <Trash size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── SITE PHOTO UPLOADER ──
const SitePhotoUploader: React.FC<{
  photos: string[];
  uploading: boolean;
  onFiles: (files: FileList | null) => void;
  onRemove: (url: string) => void;
  onView: (idx: number) => void;
}> = ({ photos, uploading, onFiles, onRemove, onView }) => {
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  return (
    <div className="pt-4 space-y-4">
      {/* Upload buttons */}
      <div className="flex gap-3">
        <input ref={galleryRef} type="file" accept="image/*" multiple className="hidden" onChange={e => onFiles(e.target.files)} />
        <button
          onClick={() => galleryRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-4 py-2.5 bg-[var(--color-secondary)] text-white rounded-xl text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          <Camera size={14} />
          Add Photos
        </button>

        {uploading && (
          <span className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
            <span className="w-3 h-3 border-2 border-slate-300 border-t-[var(--color-secondary)] rounded-full animate-spin" />
            Uploading…
          </span>
        )}
      </div>

      {/* Photo grid */}
      {photos.length > 0 ? (
        <div className="flex flex-wrap gap-3">
          {photos.map((url, idx) => (
            <div key={url} className="relative group w-24 h-24 rounded-xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <img src={url} alt={`Site photo ${idx + 1}`} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-slate-900/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); onView(idx); }}
                  className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-white transition-colors"
                  title="View"
                >
                  <Eye size={14} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); window.open(`${url}?download=`, '_blank'); }}
                  className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-white transition-colors"
                  title="Download"
                >
                  <Download size={14} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onRemove(url); }}
                  className="w-7 h-7 rounded-full bg-red-500/80 hover:bg-red-500 flex items-center justify-center text-white transition-colors"
                  title="Remove"
                >
                  <Trash size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 cursor-pointer hover:border-[var(--color-secondary)] hover:bg-slate-100/50 transition-colors"
          onClick={() => galleryRef.current?.click()}
        >
          <Camera size={28} className="text-slate-300 mb-2" />
          <p className="text-xs font-bold text-slate-400">No photos yet</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Tap "Take Photo" or "Choose from Gallery"</p>
        </div>
      )}
    </div>
  );
};

