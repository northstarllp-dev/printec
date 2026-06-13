"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

// Types
export interface Customer {
  id: string;
  name: string;
  phone: string;
  whatsapp: string;
  email: string;
  billingAddress: string;
  shippingAddress: string;
}

export type PipelineStage =
  | "Enquired"
  | "Site Visit"
  | "Quotation"
  | "Design"
  | "Production"
  | "Installation"
  | "Order Completed";

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
  width: number;
  height: number;
  depth: number;
  auditDate: string;
  auditTime: string;
  sitePersonnel: string;
  photos: string[];
  completed: boolean;
  notes?: string;
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
}

export interface Activity {
  id: string;
  timestamp: string;
  user: string;
  description: string;
  originalOrdersState: Order[];
}

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
}

interface DashboardContextType {
  customers: Customer[];
  orders: Order[];
  enquiries: Enquiry[];
  notifications: Notification[];
  activePage: "dashboard" | "enquiries" | "customers" | "settings" | "worksheet" | "employees";
  selectedOrderForWorksheet: Order | null;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  setActivePage: (page: "dashboard" | "enquiries" | "customers" | "settings" | "worksheet" | "employees") => void;
  setSelectedOrderForWorksheet: (order: Order | null) => void;
  
  // Authentication Actions
  isAuthenticated: boolean;
  login: (email: string, pass: string) => boolean;
  logout: () => void;
  
  // Role & Scoped Access
  currentUserRole: "Admin" | "Employee";
  toggleUserRole: () => void;

  // Workflow Actions
  updateSiteVisitDetails: (orderId: string, details: Partial<SiteVisitDetails>) => void;
  updateQuoteDetails: (orderId: string, details: Partial<QuoteDetails>) => void;
  updateDesignDetails: (orderId: string, details: Partial<DesignDetails>) => void;
  updateProductionDetails: (orderId: string, details: Partial<ProductionDetails>) => void;
  updateInstallationDetails: (orderId: string, details: Partial<InstallationDetails>) => void;
  requestStageAdvancement: (orderId: string) => void;
  adminApproveStage: (orderId: string) => void;
  adminRejectStage: (orderId: string, notes: string) => void;
  
  // Customers Actions
  addCustomer: (customer: Omit<Customer, "id">) => Customer;
  updateCustomer: (customer: Customer) => void;
  deleteCustomer: (id: string) => void;
  
  // Orders Actions
  addOrder: (order: Omit<Order, "id" | "dateCreated" | "versionHistory" | "chatHistory"> & { id?: string }) => void;
  updateOrder: (originalId: string, order: Order) => void;
  deleteOrder: (id: string) => void;
  updateOrderStage: (id: string, stage: PipelineStage) => void;
  addChatMessage: (orderId: string, sender: string, message: string) => void;
  
  // Enquiries Actions
  addEnquiry: (enquiry: Omit<Enquiry, "id" | "dateReceived" | "status">) => void;
  convertEnquiryToOrder: (enquiryId: string, assignedEmployees: string[], projectName: string, budget: number) => void;
  
  // Webhook Simulation
  simulateWebhookEnquiry: (leadName: string, phone: string, email: string, source: EnquirySource, notes?: string) => void;
  
  // Notifications Actions
  markAllNotificationsRead: () => void;
  clearNotifications: () => void;
  addNotification: (title: string, message: string, type: "info" | "success" | "warning" | "error") => void;

  // Activities Actions
  activities: Activity[];
  undoActivity: (activityId: string) => void;

  // Additional Order actions
  assignEmployeesToOrder: (orderId: string, employees: string[]) => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

// Helper for date checks
const getHoursDifference = (isoString: string) => {
  const diffMs = new Date().getTime() - new Date(isoString).getTime();
  return diffMs / (1000 * 60 * 60);
};

const createDefaultWorkflowDetails = (orderId: string, stage: PipelineStage, budget: number) => {
  const isCompleted = (s: PipelineStage) => {
    const stages: PipelineStage[] = ["Enquired", "Site Visit", "Quotation", "Design", "Production", "Installation", "Order Completed"];
    return stages.indexOf(s) < stages.indexOf(stage);
  };

  return {
    siteVisitDetails: {
      width: isCompleted("Site Visit") ? 120 : 0,
      height: isCompleted("Site Visit") ? 60 : 0,
      depth: isCompleted("Site Visit") ? 5 : 0,
      auditDate: "2024-10-24",
      auditTime: "11:30 AM",
      sitePersonnel: "Amit Sharma",
      photos: ["/front_view.png", "/side_angle.png", "/wiring_pt.png", "/distance.png"],
      completed: isCompleted("Site Visit")
    },
    quoteDetails: {
      signageType: (orderId === "2023-10-C004-001" ? "LED Letters" : "ACP Panels") as "ACP Panels" | "LED Letters" | "Vinyl Graphics",
      width: isCompleted("Quotation") ? 1200 : 0,
      height: isCompleted("Quotation") ? 600 : 0,
      depth: isCompleted("Quotation") ? 50 : 0,
      material: "Brushed Aluminium (3mm)",
      mounting: "Standoff Fixings (Satin Chrome)",
      baseACPPrice: Math.round(budget * 0.7),
      hardwarePrice: Math.round(budget * 0.1),
      polishingPrice: Math.round(budget * 0.05),
      discount: Math.round(budget * 0.05),
      subtotal: Math.round(budget * 0.8),
      tax: Math.round(budget * 0.16),
      grandTotal: budget
    },
    designDetails: {
      proofUrl: isCompleted("Design") ? "/lobby_totem_concept.png" : "",
      status: (isCompleted("Design") ? "Approved" : "Draft") as "Draft" | "Pending Approval" | "Approved"
    },
    productionDetails: {
      printing: isCompleted("Production"),
      cutting: isCompleted("Production"),
      fabrication: isCompleted("Production"),
      assembly: isCompleted("Production")
    },
    installationDetails: {
      photoUrl: isCompleted("Installation") ? "/installed_photo.png" : "",
      customerSignature: isCompleted("Installation") ? "Customer Sign" : "",
      paymentCode: isCompleted("Installation") ? "9938" : ""
    },
    stageStatus: "Normal" as const,
    stageAdminNotes: ""
  };
};

export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activePage, setActivePage] = useState<"dashboard" | "enquiries" | "customers" | "settings" | "worksheet" | "employees">("dashboard");
  const [selectedOrderForWorksheet, setSelectedOrderForWorksheet] = useState<Order | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<"Admin" | "Employee">("Admin");

  const toggleUserRole = () => {
    setCurrentUserRole(prev => prev === "Admin" ? "Employee" : "Admin");
  };

  const login = (email: string, pass: string) => {
    if (email === "admin@printec.com" && pass === "adminpass") {
      setIsAuthenticated(true);
      setCurrentUserRole("Admin");
      return true;
    }
    if (email === "staff@printec.com" && pass === "staffpass") {
      setIsAuthenticated(true);
      setCurrentUserRole("Employee");
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setActivePage("dashboard");
  };

  // Seed Customers
  const [customers, setCustomers] = useState<Customer[]>([
    {
      id: "CUST-1",
      name: "TechCorp Global",
      phone: "+91 98765 43210",
      whatsapp: "+91 98765 43210",
      email: "info@techcorpglobal.com",
      billingAddress: "TechCorp Tower, Sector 62, Noida, UP - 201301",
      shippingAddress: "TechCorp Global R&D Lab, Ground Floor, Sector 62, Noida, UP"
    },
    {
      id: "CUST-2",
      name: "Metro Retailers",
      phone: "+91 99887 76655",
      whatsapp: "+91 99887 76655",
      email: "operations@metroretail.in",
      billingAddress: "Metro Retail Plaza, Connaught Place, New Delhi - 110001",
      shippingAddress: "Metro Hypermarket, Rajouri Garden, New Delhi"
    },
    {
      id: "CUST-3",
      name: "Swift Logistics",
      phone: "+91 91234 56789",
      whatsapp: "+91 91234 56789",
      email: "logistics@swiftcargo.com",
      billingAddress: "Cargo House, Okhla Phase 3, New Delhi - 110020",
      shippingAddress: "Swift Logistics Warehouse, NH-8, Gurgaon, Haryana"
    },
    {
      id: "CUST-4",
      name: "Luxe Stay Group",
      phone: "+91 97776 65544",
      whatsapp: "+91 97776 65544",
      email: "procurement@luxestay.com",
      billingAddress: "Luxe Corporate Park, DLF Phase 5, Gurgaon - 122002",
      shippingAddress: "Luxe Grand Palace Hotel Lobby, Golf Course Road, Gurgaon"
    }
  ]);

  // Seed Orders
  const [orders, setOrders] = useState<Order[]>([
    {
      id: "2023-10-C001-001",
      projectName: "Main Atrium Wayfinding",
      customerId: "CUST-1",
      stage: "Site Visit",
      budget: 12400,
      depositPaid: 5000,
      dimensions: "Various sizes (3ft x 2ft panels)",
      notes: "Acrylic sheets with LED backlighting. Requires high precision routing.",
      urgent: false,
      assignedEmployees: ["SK", "RM"],
      assignedDesigners: ["SK"],
      assignedMarketers: ["RM"],
      dateCreated: "2023-10-24T10:00:00Z",
      deadlineStatus: "Missed Measurement", // Simulating measurement delay
      imageMockup: "Lobby Totem - Main Entrance",
      versionHistory: [
        { version: "v1.0", date: "2023-10-24", notes: "Initial concept submission for Wayfinding." }
      ],
      chatHistory: [
        { id: "1", sender: "Sarah Mitchell", time: "1 day ago", message: "Initial site dimensions submitted. Site visit scheduled but measuring tape was offset." }
      ],
      ...createDefaultWorkflowDetails("2023-10-C001-001", "Site Visit", 12400)
    },
    {
      id: "2023-10-C002-001",
      projectName: "Exterior Pylon Signage",
      customerId: "CUST-2",
      stage: "Enquired",
      budget: 45000,
      depositPaid: 0,
      dimensions: "15ft Height x 4ft Width",
      notes: "Double-sided metal pylon structure with 3D acrylic letters and internal lighting.",
      urgent: true,
      assignedEmployees: ["AK"],
      assignedDesigners: ["AK"],
      assignedMarketers: ["AM"],
      dateCreated: "2023-10-23T08:00:00Z",
      deadlineStatus: "On Track",
      imageMockup: "Lobby Totem - Main Entrance",
      versionHistory: [
        { version: "v1.0", date: "2023-10-23", notes: "Awaiting site visit feedback to start mockup." }
      ],
      chatHistory: [
        { id: "1", sender: "System", time: "5 hours ago", message: "Order initialized from manual entry." }
      ],
      ...createDefaultWorkflowDetails("2023-10-C002-001", "Enquired", 45000)
    },
    {
      id: "2023-10-C003-001",
      projectName: "Vehicle Fleet Branding",
      customerId: "CUST-3",
      stage: "Quotation",
      budget: 8500,
      depositPaid: 4250,
      dimensions: "Fits Tata Ace fleet sides",
      notes: "High grade 3M vinyl wrapping. 5 vehicles total.",
      urgent: false,
      assignedEmployees: [],
      assignedDesigners: [],
      assignedMarketers: [],
      dateCreated: "2023-10-22T12:00:00Z",
      deadlineStatus: "On Track",
      imageMockup: "Lobby Totem - Main Entrance",
      versionHistory: [
        { version: "v1.0", date: "2023-10-22", notes: "Initial print layout designed." }
      ],
      chatHistory: [
        { id: "1", sender: "Marcus Chen", time: "2 days ago", message: "Quote submitted to procurement. Awaiting confirmation." }
      ],
      ...createDefaultWorkflowDetails("2023-10-C003-001", "Quotation", 8500)
    },
    {
      id: "2023-10-C004-001",
      projectName: "Hotel Neon Facade",
      customerId: "CUST-4",
      stage: "Design",
      budget: 110200,
      depositPaid: 60000,
      dimensions: "45ft x 8ft Facade Area",
      notes: "Custom glass neon tubes, warm amber tone. High voltage setup.",
      urgent: true,
      assignedEmployees: ["RM", "SK", "AK"],
      assignedDesigners: ["RM", "SK"],
      assignedMarketers: ["AK"],
      dateCreated: "2023-10-21T09:00:00Z",
      deadlineStatus: "On Track",
      imageMockup: "Lobby Totem - Main Entrance",
      versionHistory: [
        { version: "v3.0", date: "Today", notes: "Adjusted lighting on logo panel and corrected material textures.", active: true },
        { version: "v2.1", date: "Oct 12", notes: "Revised height as per structural engineering feedback." },
        { version: "v1.0", date: "Oct 08", notes: "Initial concept submission for Lobby Totem." }
      ],
      chatHistory: [
        { id: "1", sender: "Sarah Mitchell", time: "3h ago", message: "The illumination at the base seems a bit too intense for the lobby lighting. Can we tone it down by 15%?" },
        { id: "2", sender: "Marcus Chen", time: "1h ago", message: "Structural check passed for these dimensions. Wind loading isn't an issue indoors.", verified: true },
        { id: "3", sender: "You", time: "45m ago", message: "I like the current finish. Let's wait for client feedback on the light levels." }
      ],
      ...createDefaultWorkflowDetails("2023-10-C004-001", "Design", 110200)
    }
  ]);

  // Seed Enquiries
  const [enquiries, setEnquiries] = useState<Enquiry[]>([
    {
      id: "ENQ-1001",
      dateReceived: new Date(new Date().getTime() - 25 * 60 * 60 * 1000).toISOString(), // 25 hours ago
      leadName: "Amit Sharma (Deluxe Bakers)",
      phone: "+91 94443 32211",
      whatsapp: "+91 94443 32211",
      email: "amit@deluxebakers.in",
      source: "Website",
      status: "Pending",
      notes: "Requested quotation for a backlit shopfront board.",
      primaryCommunicationMode: "WHATSAPP",
      location: "JP Nagar"
    },
    {
      id: "ENQ-1002",
      dateReceived: new Date(new Date().getTime() - 50 * 60 * 60 * 1000).toISOString(), // 50 hours ago
      leadName: "Rohan Varma",
      phone: "+91 93332 21100",
      whatsapp: "+91 93332 21100",
      email: "rohan.v@outlook.com",
      source: "Phone Call",
      status: "Pending",
      notes: "Enquired about custom metal letters for villa entrance.",
      primaryCommunicationMode: "MAIL",
      location: "Whitefield"
    },
    {
      id: "ENQ-1003",
      dateReceived: new Date(new Date().getTime() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
      leadName: "Vikram Malhotra (Blue Sky Cafe)",
      phone: "+91 92221 10099",
      whatsapp: "+91 92221 10099",
      email: "malhotra.vikram@gmail.com",
      source: "WhatsApp",
      status: "Pending",
      notes: "Interested in glowing neon signboard for outdoor seating area.",
      primaryCommunicationMode: "WHATSAPP",
      location: "JP Nagar"
    },
    {
      id: "ENQ-1004",
      dateReceived: new Date(new Date().getTime() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
      leadName: "Sneha Reddy",
      phone: "+91 91110 09988",
      whatsapp: "+91 91110 09988",
      email: "sneha.reddy@corpcorp.co",
      source: "WhatsApp",
      status: "Pending",
      notes: "Office lobby frosting and branding requirements.",
      primaryCommunicationMode: "MAIL",
      location: "Whitefield"
    }
  ]);

  // Seed Notifications
  const [notifications, setNotifications] = useState<Notification[]>([
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

  const [activities, setActivities] = useState<Activity[]>([]);

  const logActionBeforeUpdate = (description: string, currentOrdersState: Order[]) => {
    const newActivity: Activity = {
      id: `ACT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      user: currentUserRole === "Admin" ? "Rajesh K. (Admin)" : "Amit Sharma (Staff)",
      description,
      originalOrdersState: JSON.parse(JSON.stringify(currentOrdersState))
    };
    setActivities(prev => [newActivity, ...prev]);
  };

  const undoActivity = (activityId: string) => {
    setActivities(prev => {
      const activity = prev.find(a => a.id === activityId);
      if (activity) {
        setOrders(activity.originalOrdersState);
        setNotifications(n => [
          {
            id: `NOT-${Date.now()}`,
            title: "Action Undone",
            message: `Undid: "${activity.description}"`,
            time: "Just now",
            type: "info",
            read: false
          },
          ...n
        ]);
      }
      return prev.filter(a => a.id !== activityId);
    });
  };

  // Sync worksheet order selection if details update
  useEffect(() => {
    if (selectedOrderForWorksheet) {
      const updated = orders.find(o => o.id === selectedOrderForWorksheet.id);
      setSelectedOrderForWorksheet(updated || null);
    }
  }, [orders]);

  // Customers Actions
  const addCustomer = (custData: Omit<Customer, "id">) => {
    const newCust: Customer = {
      ...custData,
      id: `CUST-${customers.length + 1}`
    };
    setCustomers(prev => [newCust, ...prev]);
    
    setNotifications(prev => [
      {
        id: `NOT-${Date.now()}`,
        title: "New Customer Added",
        message: `Profile created for ${newCust.name}.`,
        time: "Just now",
        type: "success",
        read: false
      },
      ...prev
    ]);
    return newCust;
  };

  const updateCustomer = (updatedCust: Customer) => {
    setCustomers(prev => prev.map(c => c.id === updatedCust.id ? updatedCust : c));
  };

  const deleteCustomer = (id: string) => {
    setCustomers(prev => prev.filter(c => c.id !== id));
  };

  // Orders Actions
  const addOrder = (orderData: Omit<Order, "id" | "dateCreated" | "versionHistory" | "chatHistory"> & { id?: string }) => {
    let newId = orderData.id;
    if (!newId) {
      const year = new Date().getFullYear();
      const month = String(new Date().getMonth() + 1).padStart(2, "0");
      
      // Clean Customer ID to Code (e.g. CUST-1 -> C001, CUST-10 -> C010)
      let custCode = orderData.customerId;
      const numMatch = orderData.customerId.match(/\d+/);
      if (numMatch) {
        custCode = `C${numMatch[0].padStart(3, "0")}`;
      } else {
        custCode = orderData.customerId.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
      }

      // Sequential order number for that specific customer
      const custOrders = orders.filter(o => o.customerId === orderData.customerId);
      const seqNum = String(custOrders.length + 1).padStart(3, "0");

      newId = `${year}-${month}-${custCode}-${seqNum}`;
    }
    
    logActionBeforeUpdate(`Initialized Order #${newId} ("${orderData.projectName}")`, orders);
    const newOrder: Order = {
      ...orderData,
      id: newId,
      dateCreated: new Date().toISOString(),
      versionHistory: [
        { version: "v1.0", date: new Date().toLocaleDateString(), notes: "Order initialized." }
      ],
      chatHistory: [
        { id: "1", sender: "System", time: "Just now", message: "Order created successfully." }
      ]
    };
    setOrders(prev => [newOrder, ...prev]);
    
    setNotifications(prev => [
      {
        id: `NOT-${Date.now()}`,
        title: "Order Placed",
        message: `Order ${newId} initialized for ${orderData.projectName}.`,
        time: "Just now",
        type: "success",
        read: false
      },
      ...prev
    ]);
  };

  const updateOrder = (originalId: string, updatedOrder: Order) => {
    logActionBeforeUpdate(`Modified order specs for Order #${originalId}`, orders);
    setOrders(prev => prev.map(o => o.id === originalId ? updatedOrder : o));
    if (selectedOrderForWorksheet?.id === originalId) {
      setSelectedOrderForWorksheet(updatedOrder);
    }
  };

  const deleteOrder = (id: string) => {
    logActionBeforeUpdate(`Deleted Order #${id}`, orders);
    setOrders(prev => prev.filter(o => o.id !== id));
    if (selectedOrderForWorksheet?.id === id) {
      setSelectedOrderForWorksheet(null);
    }
    setNotifications(prev => [
      {
        id: `NOT-${Date.now()}`,
        title: "Order Deleted",
        message: `Order ${id} was permanently removed.`,
        time: "Just now",
        type: "info",
        read: false
      },
      ...prev
    ]);
  };

  const updateOrderStage = (id: string, stage: PipelineStage) => {
    logActionBeforeUpdate(`Moved Order #${id} to ${stage} stage`, orders);
    setOrders(prev => prev.map(o => {
      if (o.id === id) {
        const updatedHistory = [...o.versionHistory];
        // If we transitioned to a key milestone, log it in version history
        if (stage !== o.stage) {
          const vNum = (parseFloat(o.versionHistory[0]?.version.replace("v", "") || "1.0") + 0.5).toFixed(1);
          updatedHistory.unshift({
            version: `v${vNum}`,
            date: "Today",
            notes: `Project status shifted from ${o.stage} to ${stage}.`
          });
        }
        return {
          ...o,
          stage,
          versionHistory: updatedHistory
        };
      }
      return o;
    }));
  };

  const addChatMessage = (orderId: string, sender: string, message: string) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          chatHistory: [
            ...o.chatHistory,
            {
              id: Date.now().toString(),
              sender,
              time: "Just now",
              message
            }
          ]
        };
      }
      return o;
    }));
  };

  // Workflow Detail Updaters
  const updateSiteVisitDetails = (orderId: string, details: Partial<SiteVisitDetails>) => {
    logActionBeforeUpdate(`Updated Site Visit details for Order #${orderId}`, orders);
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          siteVisitDetails: {
            ...o.siteVisitDetails,
            ...details
          } as SiteVisitDetails
        };
      }
      return o;
    }));
  };

  const updateQuoteDetails = (orderId: string, details: Partial<QuoteDetails>) => {
    logActionBeforeUpdate(`Updated Quotation parameters for Order #${orderId}`, orders);
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          quoteDetails: {
            ...o.quoteDetails,
            ...details
          } as QuoteDetails
        };
      }
      return o;
    }));
  };

  const updateDesignDetails = (orderId: string, details: Partial<DesignDetails>) => {
    logActionBeforeUpdate(`Updated Design proof for Order #${orderId}`, orders);
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          designDetails: {
            ...o.designDetails,
            ...details
          } as DesignDetails
        };
      }
      return o;
    }));
  };

  const updateProductionDetails = (orderId: string, details: Partial<ProductionDetails>) => {
    logActionBeforeUpdate(`Updated Production check-off for Order #${orderId}`, orders);
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          productionDetails: {
            ...o.productionDetails,
            ...details
          } as ProductionDetails
        };
      }
      return o;
    }));
  };

  const updateInstallationDetails = (orderId: string, details: Partial<InstallationDetails>) => {
    logActionBeforeUpdate(`Updated Installation proof for Order #${orderId}`, orders);
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          installationDetails: {
            ...o.installationDetails,
            ...details
          } as InstallationDetails
        };
      }
      return o;
    }));
  };

  // Stage advancement triggers
  const requestStageAdvancement = (orderId: string) => {
    logActionBeforeUpdate(`Requested stage advancement for Order #${orderId}`, orders);
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        let nextStatus: Order["stageStatus"] = "Normal";
        if (o.stage === "Enquired" || o.stage === "Site Visit") {
          nextStatus = "Pending Admin Approval: Quote Stage";
        } else if (o.stage === "Quotation") {
          nextStatus = "Pending Admin Approval: Quote Approval";
        } else if (o.stage === "Design") {
          nextStatus = "Pending Admin Approval: Design Approval";
        } else if (o.stage === "Production") {
          nextStatus = "Pending Admin Approval: Production Ready";
        } else if (o.stage === "Installation") {
          nextStatus = "Pending Admin Approval: Job Done";
        }
        
        return {
          ...o,
          stageStatus: nextStatus,
          stageAdminNotes: ""
        };
      }
      return o;
    }));
  };

  const adminApproveStage = (orderId: string) => {
    const o = orders.find(x => x.id === orderId);
    if (o) {
      let nextStage: PipelineStage = o.stage;
      if (o.stage === "Enquired" || o.stage === "Site Visit") nextStage = "Quotation";
      else if (o.stage === "Quotation") nextStage = "Design";
      else if (o.stage === "Design") nextStage = "Production";
      else if (o.stage === "Production") nextStage = "Installation";
      else if (o.stage === "Installation") nextStage = "Order Completed";
      logActionBeforeUpdate(`Approved stage gate: moved Order #${orderId} to ${nextStage}`, orders);
    }
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        let nextStage: PipelineStage = o.stage;
        let logMsg = "";
        
        if (o.stage === "Enquired" || o.stage === "Site Visit") {
          nextStage = "Quotation";
          logMsg = "Site survey details approved by Administrator. Project moved to Quotation phase.";
        } else if (o.stage === "Quotation") {
          nextStage = "Design";
          logMsg = "Quotation pricing and invoice parameters approved. Project moved to Design phase.";
        } else if (o.stage === "Design") {
          nextStage = "Production";
          logMsg = "Design layout and blueprints approved. Project moved to Workshop Fabrication.";
        } else if (o.stage === "Production") {
          nextStage = "Installation";
          logMsg = "Fabrication completed and inspected. Project dispatched for Field Installation.";
        } else if (o.stage === "Installation") {
          nextStage = "Order Completed";
          logMsg = "Signage installation photo and completion checklist approved. Order permanently finalized and closed.";
        }

        const updatedHistory = [...o.versionHistory];
        const vNum = (parseFloat(o.versionHistory[0]?.version.replace("v", "") || "1.0") + 0.5).toFixed(1);
        updatedHistory.unshift({
          version: `v${vNum}`,
          date: new Date().toLocaleDateString(),
          notes: logMsg
        });

        // Trigger Notification
        setNotifications(prevNotifs => [
          {
            id: `NOT-${Date.now()}`,
            title: "Stage Gate Cleared",
            message: `Order #${o.id} progressed to ${nextStage}.`,
            time: "Just now",
            type: "success",
            read: false
          },
          ...prevNotifs
        ]);

        return {
          ...o,
          stage: nextStage,
          stageStatus: "Normal",
          stageAdminNotes: "",
          versionHistory: updatedHistory,
          chatHistory: [
            ...o.chatHistory,
            {
              id: Date.now().toString(),
              sender: "System",
              time: "Just now",
              message: logMsg
            }
          ]
        };
      }
      return o;
    }));
  };

  const adminRejectStage = (orderId: string, notes: string) => {
    logActionBeforeUpdate(`Returned stage gate request for Order #${orderId}`, orders);
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        const logMsg = `Admin sent back stage progression request: ${notes}`;
        
        // Trigger Notification
        setNotifications(prevNotifs => [
          {
            id: `NOT-${Date.now()}`,
            title: "Advancement Request Returned",
            message: `Order #${o.id} requires revision notes.`,
            time: "Just now",
            type: "warning",
            read: false
          },
          ...prevNotifs
        ]);

        return {
          ...o,
          stageStatus: "Normal",
          stageAdminNotes: notes,
          chatHistory: [
            ...o.chatHistory,
            {
              id: Date.now().toString(),
              sender: "System",
              time: "Just now",
              message: logMsg
            }
          ]
        };
      }
      return o;
    }));
  };

  // Enquiries Actions
  const addEnquiry = (enquiryData: Omit<Enquiry, "id" | "dateReceived" | "status">) => {
    const newEnq: Enquiry = {
      ...enquiryData,
      id: `ENQ-${enquiries.length + 1001}`,
      dateReceived: new Date().toISOString(),
      status: "Pending"
    };
    
    // TRIGGER: Send Automated WA/Email: Enquiry Received
    console.log(`// TRIGGER: Send Automated WA/Email: Enquiry Received for ${newEnq.leadName} (${newEnq.phone})`);
    
    setEnquiries(prev => [newEnq, ...prev]);
    
    setNotifications(prev => [
      {
        id: `NOT-${Date.now()}`,
        title: "New Enquiry Logged",
        message: `Inbound enquiry from ${newEnq.leadName} (${newEnq.source}).`,
        time: "Just now",
        type: "info",
        read: false
      },
      ...prev
    ]);
  };

  const convertEnquiryToOrder = (enquiryId: string, assignedEmployees: string[], projectName: string, budget: number) => {
    const enq = enquiries.find(e => e.id === enquiryId);
    if (!enq) return;

    // 1. Create customer profile if doesn't exist
    let customer = customers.find(c => c.phone === enq.phone);
    if (!customer) {
      customer = addCustomer({
        name: enq.leadName,
        phone: enq.phone,
        whatsapp: enq.whatsapp,
        email: enq.email,
        billingAddress: "Address Details Pending Intake",
        shippingAddress: "Installation Address Pending Survey"
      });
    }

    // 2. Initialize Order
    addOrder({
      projectName,
      customerId: customer.id,
      stage: "Site Visit", // Start stage transitions to Site Visit
      budget,
      depositPaid: 0,
      dimensions: "Dimensions Pending Site Visit Survey",
      notes: enq.notes || "Imported from Enquiries.",
      urgent: false,
      assignedEmployees,
      deadlineStatus: "On Track",
      imageMockup: "Lobby Totem - Main Entrance"
    });

    // 3. Mark Enquiry as Converted
    setEnquiries(prev => prev.map(e => e.id === enquiryId ? { ...e, status: "Converted" } : e));
  };

  // Webhook Simulation (Simulates inbound static website submission)
  const simulateWebhookEnquiry = (leadName: string, phone: string, email: string, source: EnquirySource, notes?: string) => {
    const newEnq: Enquiry = {
      id: `ENQ-${enquiries.length + 1001}`,
      dateReceived: new Date().toISOString(),
      leadName,
      phone,
      whatsapp: phone, // Assume same
      email,
      source,
      status: "Pending",
      notes: notes || "Submitted via static web webhook.",
      primaryCommunicationMode: "MAIL",
      location: "Whitefield"
    };

    // TRIGGER: Send Automated WA/Email: Enquiry Received
    console.log(`// TRIGGER: Send Automated WA/Email: Webhook Enquiry Received for ${leadName}`);

    setEnquiries(prev => [newEnq, ...prev]);

    setNotifications(prev => [
      {
        id: `NOT-${Date.now()}`,
        title: "Webhook Form Submission",
        message: `New client lead "${leadName}" submitted via ${source} form.`,
        time: "Just now",
        type: "success",
        read: false
      },
      ...prev
    ]);
  };

  // Notifications Actions
  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const addNotification = (title: string, message: string, type: "info" | "success" | "warning" | "error") => {
    setNotifications(prev => [
      {
        id: `NOT-${Date.now()}`,
        title,
        message,
        time: "Just now",
        type,
        read: false
      },
      ...prev
    ]);
  };

  const assignEmployeesToOrder = (orderId: string, employees: string[]) => {
    logActionBeforeUpdate(`Updated staff assignments for Order #${orderId}`, orders);
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          assignedEmployees: employees
        };
      }
      return o;
    }));
  };

  return (
    <DashboardContext.Provider
      value={{
        isAuthenticated,
        login,
        logout,
        currentUserRole,
        toggleUserRole,
        updateSiteVisitDetails,
        updateQuoteDetails,
        updateDesignDetails,
        updateProductionDetails,
        updateInstallationDetails,
        requestStageAdvancement,
        adminApproveStage,
        adminRejectStage,
        customers,
        orders,
        enquiries,
        notifications,
        activePage,
        selectedOrderForWorksheet,
        searchQuery,
        setSearchQuery,
        setActivePage,
        setSelectedOrderForWorksheet,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        addOrder,
        updateOrder,
        deleteOrder,
        updateOrderStage,
        addChatMessage,
        addEnquiry,
        convertEnquiryToOrder,
        simulateWebhookEnquiry,
        markAllNotificationsRead,
        clearNotifications,
        addNotification,
        activities,
        undoActivity,
        assignEmployeesToOrder
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
};
