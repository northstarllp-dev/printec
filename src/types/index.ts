export interface Customer {
  id: string;
  name: string;
  phone: string;
  whatsapp: string;
  email: string;
  city?: string;
  billingAddress: string;
  shippingAddress: string;
  status?: string;
  customerCode?: string;
  customerId?: string;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  status?: string;
  rating?: number;
  workload?: number;
}

export type PipelineStage =
  | "Site Visit Pending"
  | "Site Visit Scheduled"
  | "Site Visit Completed"
  | "Quotation In Progress"
  | "Quotation Sent"
  | "Quotation Negotiation"
  | "Quotation Approved"
  | "Design In Progress"
  | "Design Approved"
  | "Production"
  | "Ready For Installation"
  | "Installation Scheduled"
  | "Completed"
  | "Closed";

export interface VersionItem {
  version: string;
  date: string;
  notes: string;
  active?: boolean;
}

export interface ChatMessage {
  id: string;
  sender: string;
  time: string;
  message: string;
  verified?: boolean;
}

// New Sign Location type
export interface SignLocation {
  id: string;
  name: string;
  width?: number;
  height?: number;
  depth?: number;
  groundClearance?: number;
  notes?: string;
  photos: string[];
}

// Site Photo Categories
export interface SitePhotoCategories {
  front: string[];
  installationArea: string[];
  powerSource: string[];
  measurementReference: string[];
  additional: string[];
}

// Extended Site Visit Details
export interface SiteVisitDetails {
  completed: boolean;
  
  // Stage 1: Pending & Details
  customerAddress?: string;
  landmark?: string;
  preferredDate?: string;
  preferredTime?: string;
  gpsLocation?: string; // e.g. "12.9716° N, 77.5946° E"
  customerContact?: string;

  // Stage 2: Scheduling & Booking
  sitePersonnel?: string; // Employee assigned
  auditDate?: string;     // Booked date
  auditTime?: string;     // Booked time
  availableSlots?: string[]; // e.g. ["2026-06-15 10:00 AM", "2026-06-15 02:00 PM"]

  // Stage 3: In Progress Check-In
  checkedIn?: boolean;
  checkInTime?: string;
  checkInGps?: string;
  checkInTimerStart?: string; // ISO Timestamp
  elapsedDuration?: string;   // e.g. "42 mins 10 secs"

  // Staff execution details
  visitStarted?: boolean;
  visitStartTimestamp?: string;
  startGpsLocation?: string;
  startDeviceInfo?: string;
  locations?: SignLocation[]; // Updated to use new SignLocation type
  distanceToPowerSource?: number;
  distanceToPowerSourceUnit?: string;
  electricalNotes?: string;
  audioNoteUrl?: string;
  surfaceCondition?: string;
  obstacles?: string[];
  customerBudget?: number;
  expectedTimeline?: string;
  customerPreferences?: string;
  competitorReferences?: string;
  suggestedProductType?: string;
  additionalObservations?: string;

  // New Visit Information Section
  visitDate?: string;
  visitTime?: string;
  siteAddress?: string;
  siteType?: string;
  contactPerson?: string;
  contactNumber?: string;
  specialInstructions?: string;

  // Electrical Assessment
  powerAvailable?: boolean;
  electricalPhotos?: string[];

  // Structural Assessment
  wallType?: "Concrete" | "ACP Cladding" | "Glass" | "Tile" | "Metal" | "Wood" | "Composite Panel";
  mountingMethod?: "Direct Mount" | "Frame Mount" | "Hanging" | "Pole Mounted";
  structuralNotes?: string;

  // Internal Notes (Admin only)
  internalNotes?: {
    customerPreferences?: string;
    budgetNotes?: string;
    suggestedProductType?: string;
    competitorReferences?: string;
    specialInstallationNotes?: string;
    voiceNotes?: string[];
  };

  // Photo Categories
  photoCategories?: SitePhotoCategories;

  // Legacy Fields for backward compatibility
  width: number;
  height: number;
  depth: number;
  installationHeight?: number;
  powerAvailableLegacy?: string;
  existingSignage?: string;
  complexity?: string;
  photos: string[]; // Front, Side, Area, Electrical, Competitor
  legacyPhotoCategories?: {
    front?: string;
    side?: string;
    area?: string;
    electrical?: string;
    competitor?: string;
  };
  notes?: string; // General notes
  customerNotes?: {
    budget?: string;
    preferences?: string;
    urgency?: string;
  };

  // Stage 5: Review & Statuses
  reviewStatus?: "Approved" | "Revisit" | "MoreInfo" | "Pending" | "Pending Admin Approval" | "Draft" | "Needs Revision" | "Rejected" | "Staff Approved";
  reviewNotes?: string;
  auditTrail?: Array<{
    event: string;
    user: string;
    timestamp: string;
    details?: string;
  }>;
}

export interface QuoteItem {
  id: string;
  productId?: string;          // links to products.id
  description: string;
  quantity: number;
  pricingType?: "per_unit" | "per_sqft";
  unit?: string;               // "nos" | "sq ft"
  unitPrice: number;           // base rate from catalogue (editable)
  totalSqFt?: number;          // only for per_sqft items
  gstRate: number;             // 0 | 5 | 12 | 18 | 28
}

export interface QuoteDetails {
  items: QuoteItem[];
  discount: number;
  subtotal: number;
  tax: number;
  grandTotal: number;
  status?: "Draft" | "Sent" | "Approved" | "Rejected";
  notes?: string;
  terms?: string;
  validUntil?: string;
  quotationId?: string;        // e.g. "QT-001"
}

export interface DesignDetails {
  proofUrl: string;
  status: "Draft" | "Pending Approval" | "Approved";
}

export interface ProductionDetails {
  printing: boolean;
  cutting: boolean;
  fabrication: boolean;
  assembly: boolean;
}

export interface InstallationDetails {
  photoUrl: string;
  customerSignature: string;
  paymentCode: string;
}

export interface Order {
  id: string;
  projectName: string;
  customerId: string;
  customerName?: string;
  stage: PipelineStage;
  productType?: string;
  requirements?: string;
  assignedEmployees: string[];
  dateCreated: string;
  versionHistory: VersionItem[];
  chatHistory: ChatMessage[];
  siteVisitDetails?: SiteVisitDetails;
  designDetails?: DesignDetails;
  productionDetails?: ProductionDetails;
  installationDetails?: InstallationDetails;
  stageStatus?: "Normal" | "Pending Admin Approval: Quote Stage" | "Pending Admin Approval: Quote Approval" | "Pending Admin Approval: Design Approval" | "Pending Admin Approval: Production Ready" | "Pending Admin Approval: Job Done";
  stageAdminNotes?: string;
  orderCode?: string;
  health?: string;
  lost_reason?: string;
  orderId?: string;
}

export type EnquirySource = "Website" | "Phone Call" | "WhatsApp";

export interface Enquiry {
  id: string;
  dateReceived: string; // ISO format
  leadName: string;
  phone: string;
  whatsapp: string;
  email: string;
  source: EnquirySource;
  status: "Pending" | "Converted";
  notes?: string;
  primaryCommunicationMode: "MAIL" | "WHATSAPP";
  location: string;
  enquireId?: string;
  customerId?: string;
  orderId?: string;
}


export interface Activity {
  id: string;
  timestamp: string;
  user: string;
  description: string;
  originalOrdersState: Order[];
}
