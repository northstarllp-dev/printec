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

export interface SiteVisitDetails {
  completed: boolean;
  
  // Stage 1: Pending & Details
  customerAddress?: string;
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
  locations?: any[];
  distanceToPowerSource?: number;
  distanceToPowerSourceUnit?: string;
  electricalNotes?: string;
  audioNoteUrl?: string;
  mountingMethod?: string;
  surfaceCondition?: string;
  obstacles?: string[];
  customerBudget?: number;
  expectedTimeline?: string;
  customerPreferences?: string;
  competitorReferences?: string;
  suggestedProductType?: string;
  additionalObservations?: string;

  // Stage 4: Completed Form Details
  width: number;
  height: number;
  depth: number;
  installationHeight?: number;
  wallType?: string;
  powerAvailable?: string;
  existingSignage?: string;
  complexity?: string;
  photos: string[]; // Front, Side, Area, Electrical, Competitor
  photoCategories?: {
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
  reviewStatus?: "Approved" | "Revisit" | "MoreInfo" | "Pending" | "Pending Admin Approval" | "Draft" | "Needs Revision" | "Rejected";
  reviewNotes?: string;
  auditTrail?: Array<{
    event: string;
    user: string;
    timestamp: string;
    details?: string;
  }>;
}

export interface QuoteDetails {
  signageType: "ACP Panels" | "LED Letters" | "Vinyl Graphics";
  width: number;
  height: number;
  depth: number;
  material: string;
  mounting: string;
  baseACPPrice: number;
  hardwarePrice: number;
  polishingPrice: number;
  discount: number;
  subtotal: number;
  tax: number;
  grandTotal: number;
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
  budget: number;
  depositPaid: number;
  dimensions: string;
  notes: string;
  urgent: boolean;
  assignedEmployees: string[];
  assignedDesigners?: string[];
  assignedMarketers?: string[];
  dateCreated: string;
  deadlineStatus: "Missed Measurement" | "On Track" | "Delayed" | "Action Required" | "None";
  imageMockup: string;
  versionHistory: VersionItem[];
  chatHistory: ChatMessage[];
  siteVisitDetails?: SiteVisitDetails;
  quoteDetails?: QuoteDetails;
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
