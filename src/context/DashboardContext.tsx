"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

// Types
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
  employees: Employee[];
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
  isAuthLoading: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => void;
  changePassword: (newPass: string) => Promise<{ success: boolean; message: string }>;
  
  // Role & Scoped Access
  currentUserRole: "Admin" | "Employee";
  currentEmployee: Employee | null;
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
  addCustomer: (customer: Omit<Customer, "id">) => Promise<Customer>;
  updateCustomer: (customer: Customer) => void | Promise<void>;
  deleteCustomer: (id: string) => void | Promise<void>;

  // Employees Actions
  addEmployee: (employee: Omit<Employee, "id">) => void | Promise<void>;
  updateEmployee: (employee: Employee) => void | Promise<void>;
  deleteEmployee: (id: string) => void | Promise<void>;
  
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
    const stages: PipelineStage[] = [
      "Site Visit Pending",
      "Site Visit Scheduled",
      "Site Visit Completed",
      "Quotation In Progress",
      "Quotation Sent",
      "Quotation Negotiation",
      "Quotation Approved",
      "Design In Progress",
      "Design Approved",
      "Production",
      "Ready For Installation",
      "Installation Scheduled",
      "Completed",
      "Closed"
    ];
    return stages.indexOf(s) < stages.indexOf(stage);
  };

  return {
    siteVisitDetails: {
      width: isCompleted("Site Visit Scheduled") ? 120 : 0,
      height: isCompleted("Site Visit Scheduled") ? 60 : 0,
      depth: isCompleted("Site Visit Scheduled") ? 5 : 0,
      auditDate: "2026-06-13",
      auditTime: "11:30 AM",
      sitePersonnel: "Akshay Kumar M",
      photos: ["/front_view.png", "/side_angle.png", "/wiring_pt.png", "/distance.png"],
      completed: isCompleted("Site Visit Scheduled")
    },
    quoteDetails: {
      signageType: (orderId.includes("A004") ? "LED Letters" : "ACP Panels") as "ACP Panels" | "LED Letters" | "Vinyl Graphics",
      width: isCompleted("Quotation Negotiation") ? 1200 : 0,
      height: isCompleted("Quotation Negotiation") ? 600 : 0,
      depth: isCompleted("Quotation Negotiation") ? 50 : 0,
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
      proofUrl: isCompleted("Design In Progress") ? "/lobby_totem_concept.png" : "",
      status: (isCompleted("Design In Progress") ? "Approved" : "Draft") as "Draft" | "Pending Approval" | "Approved"
    },
    productionDetails: {
      printing: isCompleted("Production"),
      cutting: isCompleted("Production"),
      fabrication: isCompleted("Production"),
      assembly: isCompleted("Production")
    },
    installationDetails: {
      photoUrl: isCompleted("Installation Scheduled") ? "/installed_photo.png" : "",
      customerSignature: isCompleted("Installation Scheduled") ? "Customer Sign" : "",
      paymentCode: isCompleted("Installation Scheduled") ? "9938" : ""
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
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState<"Admin" | "Employee">("Admin");
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    const checkUserSession = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
          let profile = null;
          try {
            const { data, error } = await supabase
              .from('users')
              .select('*')
              .eq('email', user.email.toLowerCase())
              .single();
            if (!error && data) {
              profile = data;
            }
          } catch (profileErr) {
            console.error("Error fetching profile in session check:", profileErr);
          }

          if (profile) {
            setIsAuthenticated(true);
            if (profile.role === 'admin') {
              setCurrentUserRole("Admin");
              setCurrentEmployee(null);
            } else {
              setCurrentUserRole("Employee");
              setCurrentEmployee({
                id: profile.id,
                name: profile.name,
                role: profile.staff_role || "",
                phone: profile.phone,
                email: profile.email || "",
                status: profile.status || "Active",
                rating: Number(profile.rating) || 5.0,
                workload: Number(profile.workload) || 0
              });
            }
          } else {
            // Fallback safety logic for active session without db profile (e.g. staff@printec.com demo account)
            setIsAuthenticated(true);
            const userEmail = user.email.toLowerCase();
            if (userEmail === "admin@printec.com") {
              setCurrentUserRole("Admin");
              setCurrentEmployee(null);
            } else {
              setCurrentUserRole("Employee");
              const matchingEmp = employees.find(e => e.email.toLowerCase() === userEmail);
              setCurrentEmployee(matchingEmp || {
                id: "EMP-FALLBACK",
                name: userEmail.split("@")[0].split(".").map(n => n.charAt(0).toUpperCase() + n.slice(1)).join(" "),
                role: "Staff Member",
                phone: "1234567890",
                email: userEmail,
                status: "Active",
                rating: 5.0,
                workload: 0
              });
            }
          }
        }
      } catch (err) {
        console.error("Session check error:", err);
      } finally {
        setIsAuthLoading(false);
      }
    };

    checkUserSession();
  }, []);

  const toggleUserRole = () => {
    setCurrentUserRole(prev => prev === "Admin" ? "Employee" : "Admin");
  };

  const login = async (email: string, pass: string) => {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: pass
    });

    if (error) {
      console.error("Auth sign in error:", error.message);
      return false;
    }

    if (data?.user) {
      // Fetch user role dynamically from the database users table
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email.toLowerCase())
        .single();

      if (profileError || !profile) {
        console.error("Error fetching user profile from public.users:", profileError);
        // Fallback safety logic
        setIsAuthenticated(true);
        if (email.toLowerCase() === "admin@printec.com") {
          setCurrentUserRole("Admin");
          setCurrentEmployee(null);
        } else {
          setCurrentUserRole("Employee");
          const matchingEmp = employees.find(e => e.email.toLowerCase() === email.toLowerCase());
          setCurrentEmployee(matchingEmp || {
            id: "EMP-FALLBACK",
            name: email.split("@")[0].split(".").map(n => n.charAt(0).toUpperCase() + n.slice(1)).join(" "),
            role: "Staff Member",
            phone: "1234567890",
            email: email.toLowerCase(),
            status: "Active",
            rating: 5.0,
            workload: 0
          });
        }
        return true;
      }

      setIsAuthenticated(true);
      if (profile.role === 'admin') {
        setCurrentUserRole("Admin");
        setCurrentEmployee(null);
      } else {
        setCurrentUserRole("Employee");
        const mappedEmployee: Employee = {
          id: profile.id,
          name: profile.name,
          role: profile.staff_role || "", // Map staff_role to frontend Employee.role
          phone: profile.phone,
          email: profile.email || "",
          status: profile.status || "Active",
          rating: Number(profile.rating) || 5.0,
          workload: Number(profile.workload) || 0
        };
        setCurrentEmployee(mappedEmployee);
      }
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setCurrentEmployee(null);
    setActivePage("dashboard");
    const supabase = createClient();
    supabase.auth.signOut().catch(err => console.error("SignOut error:", err));
  };

  const changePassword = async (newPass: string) => {
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPass });
    if (error) {
      console.error("Change password error:", error.message);
      return { success: false, message: error.message };
    }
    return { success: true, message: "Password updated successfully!" };
  };

  useEffect(() => {
    const fetchCustomers = async () => {
      const supabase = createClient();
      const { data, error } = await supabase.from('customers').select('*');
      if (error) {
        console.error('Error fetching customers:', error);
        return;
      }
      if (data) {
        setCustomers(data.map(c => ({
          id: c.id,
          name: c.name,
          phone: c.phone,
          whatsapp: c.whatsapp,
          email: c.email,
          city: c.city || "",
          billingAddress: c.billing_address || "",
          shippingAddress: c.shipping_address || "",
          status: c.status || "Active"
        })));
      }
    };
    
    const fetchEmployees = async () => {
      const supabase = createClient();
      const { data, error } = await supabase.from('users').select('*');
      if (error) {
        console.error('Error fetching employees:', error);
        return;
      }
      if (data) {
        // Only list users whose role is 'staff' in the staff directory
        setEmployees(data.filter(e => e.role === 'staff').map(e => ({
          id: e.id,
          name: e.name,
          role: e.staff_role || "", // Map database staff_role column to frontend Employee.role
          phone: e.phone,
          email: e.email || "",
          status: e.status || "Active",
          rating: Number(e.rating) || 5.0,
          workload: Number(e.workload) || 0
        })));
      }
    };

    fetchCustomers();
    fetchEmployees();
  }, []);

  // Orders State
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const fetchOrders = async () => {
      const supabase = createClient();
      const { data, error } = await supabase.from('orders').select('*');
      
      if (error) {
        console.error('Error fetching orders:', error);
        return;
      }

      if (data) {
        const mappedOrders: Order[] = data.map(o => ({
          id: o.id,
          projectName: o.project_name,
          customerId: o.customer_id,
          stage: o.stage as PipelineStage,
          budget: o.budget,
          depositPaid: o.deposit_paid,
          dimensions: o.dimensions,
          notes: o.notes,
          urgent: o.urgent,
          assignedEmployees: o.assigned_employees || [],
          assignedDesigners: o.assigned_designers || [],
          assignedMarketers: o.assigned_marketers || [],
          dateCreated: o.date_created,
          deadlineStatus: o.deadline_status as any,
          imageMockup: o.image_mockup,
          versionHistory: o.version_history || [],
          chatHistory: o.chat_history || [],
          siteVisitDetails: o.site_visit_details,
          quoteDetails: o.quote_details,
          designDetails: o.design_details,
          productionDetails: o.production_details,
          installationDetails: o.installation_details,
          stageStatus: o.stage_status,
          stageAdminNotes: o.stage_admin_notes,
          customerName: o.customer_name || ""
        }));
        // Sort by date_created descending
        mappedOrders.sort((a, b) => new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime());
        setOrders(mappedOrders);
      }
    };
    
    fetchOrders();
  }, []);

  // Enquiries State
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);

  useEffect(() => {
    const fetchEnquiries = async () => {
      const supabase = createClient();
      const { data, error } = await supabase.from('enquiries').select('*');
      
      if (error) {
        console.error('Error fetching enquiries:', error);
        return;
      }

      if (data) {
        const mappedEnquiries: Enquiry[] = data.map(e => ({
          id: e.id,
          dateReceived: e.date_received,
          leadName: e.lead_name,
          phone: e.phone,
          whatsapp: e.whatsapp,
          email: e.email,
          source: e.source as EnquirySource,
          status: e.status as "Pending" | "Converted",
          notes: e.notes,
          primaryCommunicationMode: e.primary_communication_mode as "MAIL" | "WHATSAPP",
          location: e.location
        }));
        mappedEnquiries.sort((a, b) => new Date(b.dateReceived).getTime() - new Date(a.dateReceived).getTime());
        setEnquiries(mappedEnquiries);
      }
    };
    
    fetchEnquiries();
  }, []);

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
      user: currentUserRole === "Admin" ? "Rajesh K. (Admin)" : `${currentEmployee?.name || "Amit Sharma"} (Staff)`,
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
  const addCustomer = async (custData: Omit<Customer, "id">) => {
    const newCust: Customer = {
      ...custData,
      id: crypto.randomUUID()
    };
    setCustomers(prev => [newCust, ...prev]);
    
    const supabase = createClient();
    const { error } = await supabase.from('customers').insert([{
      id: newCust.id,
      name: newCust.name,
      phone: newCust.phone,
      whatsapp: newCust.whatsapp,
      email: newCust.email,
      city: newCust.city,
      billing_address: newCust.billingAddress,
      shipping_address: newCust.shippingAddress,
      status: newCust.status || "Active"
    }]);

    if (error) console.error("Error inserting customer:", error);

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

  const updateCustomer = async (updatedCust: Customer) => {
    setCustomers(prev => prev.map(c => c.id === updatedCust.id ? updatedCust : c));
    
    const supabase = createClient();
    const { error } = await supabase.from('customers').update({
      name: updatedCust.name,
      phone: updatedCust.phone,
      whatsapp: updatedCust.whatsapp,
      email: updatedCust.email,
      city: updatedCust.city,
      billing_address: updatedCust.billingAddress,
      shipping_address: updatedCust.shippingAddress,
      status: updatedCust.status
    }).eq('id', updatedCust.id);

    if (error) console.error("Error updating customer:", error);
  };

  const deleteCustomer = async (id: string) => {
    setCustomers(prev => prev.filter(c => c.id !== id));
    
    const supabase = createClient();
    const { error } = await supabase.from('customers').delete().eq('id', id);
    if (error) console.error("Error deleting customer:", error);
  };

  // Employees Actions
  const addEmployee = async (empData: Omit<Employee, "id">) => {
    const newEmp: Employee = {
      ...empData,
      id: crypto.randomUUID()
    };
    setEmployees(prev => [newEmp, ...prev]);

    const supabase = createClient();
    const { error } = await supabase.from('users').insert([{
      id: newEmp.id,
      name: newEmp.name,
      role: 'staff',
      staff_role: newEmp.role, // Map local role (job title) to database staff_role
      phone: newEmp.phone,
      email: newEmp.email
    }]);

    if (error) console.error("Error inserting employee:", error);

    setNotifications(prev => [
      {
        id: `NOT-${Date.now()}`,
        title: "Employee Added",
        message: `Added ${newEmp.name} to directory.`,
        time: "Just now",
        type: "success",
        read: false
      },
      ...prev
    ]);
  };

  const updateEmployee = async (updatedEmp: Employee) => {
    setEmployees(prev => prev.map(e => e.id === updatedEmp.id ? updatedEmp : e));
    
    const supabase = createClient();
    const { error } = await supabase.from('users').update({
      name: updatedEmp.name,
      staff_role: updatedEmp.role, // Map local role (job title) to database staff_role
      phone: updatedEmp.phone,
      email: updatedEmp.email
    }).eq('id', updatedEmp.id);

    if (error) console.error("Error updating employee:", error);
  };

  const deleteEmployee = async (id: string) => {
    setEmployees(prev => prev.filter(e => e.id !== id));
    
    const supabase = createClient();
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) console.error("Error deleting employee:", error);
  };

  // Orders Actions
  const addOrder = async (orderData: Omit<Order, "id" | "dateCreated" | "versionHistory" | "chatHistory"> & { id?: string }) => {
    let newId = orderData.id;
    if (!newId) {
      newId = crypto.randomUUID();
    }
    
    let customerName = orderData.customerName;
    if (!customerName) {
      const customer = customers.find(c => c.id === orderData.customerId);
      customerName = customer?.name || "";
    }

    logActionBeforeUpdate(`Initialized Order #${newId} ("${orderData.projectName}")`, orders);
    const newOrder: Order = {
      ...orderData,
      id: newId,
      customerName,
      dateCreated: new Date().toISOString(),
      versionHistory: [
        { version: "v1.0", date: new Date().toLocaleDateString(), notes: "Order initialized." }
      ],
      chatHistory: [
        { id: "1", sender: "System", time: "Just now", message: "Order created successfully." }
      ]
    };
    
    setOrders(prev => [newOrder, ...prev]);

    // Insert into Supabase
    const supabase = createClient();
    const { error } = await supabase.from('orders').insert([{
      id: newOrder.id,
      project_name: newOrder.projectName,
      customer_id: newOrder.customerId,
      stage: newOrder.stage,
      budget: newOrder.budget,
      deposit_paid: newOrder.depositPaid,
      dimensions: newOrder.dimensions,
      notes: newOrder.notes,
      urgent: newOrder.urgent,
      assigned_employees: newOrder.assignedEmployees,
      assigned_designers: newOrder.assignedDesigners,
      assigned_marketers: newOrder.assignedMarketers,
      date_created: newOrder.dateCreated,
      deadline_status: newOrder.deadlineStatus,
      image_mockup: newOrder.imageMockup,
      version_history: newOrder.versionHistory,
      chat_history: newOrder.chatHistory,
      site_visit_details: newOrder.siteVisitDetails,
      quote_details: newOrder.quoteDetails,
      design_details: newOrder.designDetails,
      production_details: newOrder.productionDetails,
      installation_details: newOrder.installationDetails,
      stage_status: newOrder.stageStatus,
      stage_admin_notes: newOrder.stageAdminNotes,
      customer_name: newOrder.customerName
    }]);

    if (error) {
      console.error("Error inserting order into Supabase:", error);
    }
    
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

  const updateOrder = async (originalId: string, updatedOrder: Order) => {
    logActionBeforeUpdate(`Modified order specs for Order #${originalId}`, orders);
    setOrders(prev => prev.map(o => o.id === originalId ? updatedOrder : o));
    if (selectedOrderForWorksheet?.id === originalId) {
      setSelectedOrderForWorksheet(updatedOrder);
    }

    // Update in Supabase
    const supabase = createClient();
    const { error } = await supabase.from('orders').update({
      project_name: updatedOrder.projectName,
      customer_id: updatedOrder.customerId,
      stage: updatedOrder.stage,
      budget: updatedOrder.budget,
      deposit_paid: updatedOrder.depositPaid,
      dimensions: updatedOrder.dimensions,
      notes: updatedOrder.notes,
      urgent: updatedOrder.urgent,
      assigned_employees: updatedOrder.assignedEmployees,
      assigned_designers: updatedOrder.assignedDesigners,
      assigned_marketers: updatedOrder.assignedMarketers,
      deadline_status: updatedOrder.deadlineStatus,
      image_mockup: updatedOrder.imageMockup,
      version_history: updatedOrder.versionHistory,
      chat_history: updatedOrder.chatHistory,
      site_visit_details: updatedOrder.siteVisitDetails,
      quote_details: updatedOrder.quoteDetails,
      design_details: updatedOrder.designDetails,
      production_details: updatedOrder.productionDetails,
      installation_details: updatedOrder.installationDetails,
      stage_status: updatedOrder.stageStatus,
      stage_admin_notes: updatedOrder.stageAdminNotes,
      customer_name: updatedOrder.customerName
    }).eq('id', originalId);

    if (error) {
      console.error("Error updating order in Supabase:", error);
    }
  };

  const deleteOrder = async (id: string) => {
    logActionBeforeUpdate(`Deleted Order #${id}`, orders);
    setOrders(prev => prev.map(o => o.id === id ? { ...o, deleted: true } : o).filter(o => o.id !== id));
    // Actually filter from state
    setOrders(prev => prev.filter(o => o.id !== id));
    
    if (selectedOrderForWorksheet?.id === id) {
      setSelectedOrderForWorksheet(null);
    }

    // Delete from Supabase
    const supabase = createClient();
    const { error } = await supabase.from('orders').delete().eq('id', id);
    if (error) {
      console.error("Error deleting order from Supabase:", error);
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
        if (o.stage === "Site Visit Pending" || o.stage === "Site Visit Scheduled" || o.stage === "Site Visit Completed") {
          nextStatus = "Pending Admin Approval: Quote Stage";
        } else if (o.stage === "Quotation In Progress" || o.stage === "Quotation Sent" || o.stage === "Quotation Negotiation") {
          nextStatus = "Pending Admin Approval: Quote Approval";
        } else if (o.stage === "Quotation Approved" || o.stage === "Design In Progress") {
          nextStatus = "Pending Admin Approval: Design Approval";
        } else if (o.stage === "Design Approved" || o.stage === "Production") {
          nextStatus = "Pending Admin Approval: Production Ready";
        } else if (o.stage === "Ready For Installation" || o.stage === "Installation Scheduled") {
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
    // Sequential 14-stage pipeline advancement map
    const nextStageMap: Partial<Record<PipelineStage, PipelineStage>> = {
      "Site Visit Pending":    "Site Visit Scheduled",
      "Site Visit Scheduled":  "Site Visit Completed",
      "Site Visit Completed":  "Quotation In Progress",
      "Quotation In Progress": "Quotation Sent",
      "Quotation Sent":        "Quotation Negotiation",
      "Quotation Negotiation": "Quotation Approved",
      "Quotation Approved":    "Design In Progress",
      "Design In Progress":    "Design Approved",
      "Design Approved":       "Production",
      "Production":            "Ready For Installation",
      "Ready For Installation":"Installation Scheduled",
      "Installation Scheduled":"Completed",
      "Completed":             "Closed",
    };

    const o = orders.find(x => x.id === orderId);
    if (o) {
      const nextStage = nextStageMap[o.stage] || o.stage;
      logActionBeforeUpdate(`Approved stage gate: moved Order #${orderId} to ${nextStage}`, orders);
    }
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        const nextStage: PipelineStage = nextStageMap[o.stage] || o.stage;
        const logMsg = `Admin approved stage progression from "${o.stage}" to "${nextStage}".`;

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
  const addEnquiry = async (enquiryData: Omit<Enquiry, "id" | "dateReceived" | "status">) => {
    const newEnq: Enquiry = {
      ...enquiryData,
      id: crypto.randomUUID(),
      dateReceived: new Date().toISOString(),
      status: "Pending"
    };
    
    setEnquiries(prev => [newEnq, ...prev]);

    // Insert to Supabase
    const supabase = createClient();
    const { error } = await supabase.from('enquiries').insert([{
      id: newEnq.id,
      date_received: newEnq.dateReceived,
      lead_name: newEnq.leadName,
      phone: newEnq.phone,
      whatsapp: newEnq.whatsapp,
      email: newEnq.email,
      source: newEnq.source,
      status: newEnq.status,
      notes: newEnq.notes,
      primary_communication_mode: newEnq.primaryCommunicationMode,
      location: newEnq.location
    }]);

    if (error) {
      console.error("Error inserting enquiry:", error);
    }
    
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

  const convertEnquiryToOrder = async (enquiryId: string, assignedEmployees: string[], projectName: string, budget: number) => {
    const enq = enquiries.find(e => e.id === enquiryId);
    if (!enq) return;

    // 1. Create customer profile if doesn't exist
    let customer = customers.find(c => c.phone === enq.phone);
    if (!customer) {
      customer = await addCustomer({
        name: enq.leadName,
        phone: enq.phone,
        whatsapp: enq.whatsapp,
        email: enq.email,
        billingAddress: "Address Details Pending Intake",
        shippingAddress: "Installation Address Pending Survey"
      });
    }

    if (!customer) {
      console.error("Failed to retrieve or create customer");
      return;
    }

    // 2. Initialize Order
    addOrder({
      projectName,
      customerId: customer.id,
      stage: "Site Visit Pending", // Start of the 14-stage pipeline
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

    // Update in Supabase
    const supabase = createClient();
    const { error } = await supabase.from('enquiries').update({
      status: "Converted"
    }).eq('id', enquiryId);

    if (error) {
      console.error("Error converting enquiry:", error);
    }
  };

  // Webhook Simulation (Simulates inbound static website submission)
  const simulateWebhookEnquiry = (leadName: string, phone: string, email: string, source: EnquirySource, notes?: string) => {
    const newEnq: Enquiry = {
      id: `ENQ${String(enquiries.length + 1).padStart(3, "0")}`,
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

  const assignEmployeesToOrder = async (orderId: string, employees: string[]) => {
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

    const supabase = createClient();
    const { error } = await supabase
      .from('orders')
      .update({ assigned_employees: employees })
      .eq('id', orderId);

    if (error) {
      console.error("Error updating staff assignments in Supabase:", error);
    }
  };

  return (
    <DashboardContext.Provider
      value={{
        isAuthenticated,
        isAuthLoading,
        login,
        logout,
        changePassword,
        currentUserRole,
        currentEmployee,
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
        employees,
        addEmployee,
        updateEmployee,
        deleteEmployee,
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
