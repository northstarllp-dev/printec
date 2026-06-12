"use client";

import React, { createContext, useContext, useState } from "react";

const AppContext = createContext();

export function AppProvider({ children }) {
  // Pre-populated initial Customers
  const [customers, setCustomers] = useState([
    { id: "A102", name: "TechCorp Global" },
    { id: "M504", name: "Metro Retailers" },
    { id: "S302", name: "Swift Logistics" },
    { id: "L911", name: "Luxe Stay Group" },
    { id: "V112", name: "Vogue Apparel" },
    { id: "C403", name: "Creative Co." },
    { id: "I772", name: "Initech Corp" },
    { id: "H223", name: "HealthPlus Clinic" }
  ]);

  // Pre-populated initial Employees
  const [employees] = useState([
    "Rajesh K. (Project Admin)",
    "Amit S. (Production Mgr)",
    "Priya N. (Design Head)",
    "Vikram J. (Installation Lead)",
    "Ananya M. (Sales Associate)"
  ]);

  // Pre-populated initial Enquiries
  const [enquiries, setEnquiries] = useState([
    {
      id: "2026-06-M504-001",
      date: "2026-06-11",
      projectName: "Exterior Pylon Signage",
      customerName: "Metro Retailers",
      customerId: "M504",
      source: "Website",
      budget: 45000,
      status: "Enquired",
      email: "contact@metroretail.com",
      phone: "+91 98765 43210",
      referredBy: "Ananya M. (Sales Associate)"
    },
    {
      id: "2026-06-S302-001",
      date: "2026-06-10",
      projectName: "Vehicle Fleet Branding",
      customerName: "Swift Logistics",
      customerId: "S302",
      source: "Reference",
      budget: 8500,
      status: "Quotation",
      email: "admin@swiftlogistics.com",
      phone: "+91 99112 23344",
      referredBy: "Rajesh K. (Project Admin)"
    },
    {
      id: "2026-06-H223-001",
      date: "2026-06-08",
      projectName: "Directional Signages",
      customerName: "HealthPlus Clinic",
      customerId: "H223",
      source: "Google Maps",
      budget: 18000,
      status: "Enquired",
      email: "info@healthplus.com",
      phone: "+91 91234 56789",
      referredBy: "Vikram J. (Installation Lead)"
    },
    {
      id: "2026-06-I772-001",
      date: "2026-06-05",
      projectName: "Frosted Glass Manifestation",
      customerName: "Initech Corp",
      customerId: "I772",
      source: "Cold Call",
      budget: 9500,
      status: "Enquired",
      email: "hello@initech.com",
      phone: "+91 98877 66554",
      referredBy: "Priya N. (Design Head)"
    }
  ]);

  // Pre-populated initial Orders
  const [orders, setOrders] = useState([
    {
      id: "2026-06-A102-001",
      date: "2026-06-12",
      projectName: "Main Atrium Wayfinding",
      customerName: "TechCorp Global",
      customerId: "A102",
      status: "Site visit",
      budget: 12400,
      assignedEmployees: ["Rajesh K. (Project Admin)"],
      revenueCollected: 8000,
      revenueOutstanding: 4400,
      isUrgent: false,
      designApprovedAt: null,
      installationSchedule: null, // { date, time }
      referredBy: "Ananya M. (Sales Associate)"
    },
    {
      id: "2026-06-M504-001",
      date: "2026-06-11",
      projectName: "Exterior Pylon Signage",
      customerName: "Metro Retailers",
      customerId: "M504",
      status: "Enquired",
      budget: 45000,
      assignedEmployees: [],
      revenueCollected: 0,
      revenueOutstanding: 45000,
      isUrgent: false,
      designApprovedAt: null,
      installationSchedule: null,
      referredBy: "Ananya M. (Sales Associate)"
    },
    {
      id: "2026-06-S302-001",
      date: "2026-06-10",
      projectName: "Vehicle Fleet Branding",
      customerName: "Swift Logistics",
      customerId: "S302",
      status: "Quotation",
      budget: 8500,
      assignedEmployees: [],
      revenueCollected: 0,
      revenueOutstanding: 8500,
      isUrgent: false,
      designApprovedAt: null,
      installationSchedule: null,
      referredBy: "Rajesh K. (Project Admin)"
    },
    {
      id: "2026-06-L911-001",
      date: "2026-06-09",
      projectName: "Hotel Neon Facade",
      customerName: "Luxe Stay Group",
      customerId: "L911",
      status: "Design",
      budget: 110200,
      assignedEmployees: ["Amit S. (Production Mgr)"],
      revenueCollected: 50000,
      revenueOutstanding: 60200,
      isUrgent: true,
      designApprovedAt: null,
      installationSchedule: null,
      referredBy: "Ananya M. (Sales Associate)"
    },
    {
      id: "2026-06-A102-002",
      date: "2026-06-08",
      projectName: "Corporate Vinyl Wall Graphics",
      customerName: "TechCorp Global",
      customerId: "A102",
      status: "Production",
      budget: 15600,
      assignedEmployees: ["Priya N. (Design Head)"],
      revenueCollected: 15600,
      revenueOutstanding: 0,
      isUrgent: false,
      designApprovedAt: "2026-06-11T10:00:00Z", // Approved timestamp for FIFO queue
      installationSchedule: null,
      referredBy: "Priya N. (Design Head)"
    },
    {
      id: "2026-06-V112-001",
      date: "2026-06-07",
      projectName: "Retail Window Display",
      customerName: "Vogue Apparel",
      customerId: "V112",
      status: "Installation",
      budget: 22000,
      assignedEmployees: ["Vikram J. (Installation Lead)"],
      revenueCollected: 10000,
      revenueOutstanding: 12000,
      isUrgent: false,
      designApprovedAt: "2026-06-10T14:30:00Z",
      installationSchedule: { date: "2026-06-15", time: "10:00 AM - 12:00 PM" },
      referredBy: "Ananya M. (Sales Associate)"
    },
    {
      id: "2026-06-C403-001",
      date: "2026-06-06",
      projectName: "Exhibition Banner Standees",
      customerName: "Creative Co.",
      customerId: "C403",
      status: "order completed",
      budget: 5400,
      assignedEmployees: ["Priya N. (Design Head)", "Amit S. (Production Mgr)"],
      revenueCollected: 5400,
      revenueOutstanding: 0,
      isUrgent: false,
      designApprovedAt: "2026-06-07T09:15:00Z",
      installationSchedule: { date: "2026-06-09", time: "02:00 PM - 04:00 PM" },
      referredBy: "Amit S. (Production Mgr)"
    },
    {
      id: "2026-06-L808-001",
      date: "2026-06-04",
      projectName: "lost project",
      customerName: "Lost Customer",
      customerId: "L808",
      status: "lost",
      budget: 31000,
      assignedEmployees: [],
      revenueCollected: 0,
      revenueOutstanding: 0,
      isUrgent: false,
      designApprovedAt: null,
      installationSchedule: null,
      referredBy: "Ananya M. (Sales Associate)"
    }
  ]);

  // Site Measurements Registry
  const [siteMeasurements, setSiteMeasurements] = useState({
    "2026-06-A102-001": {
      height: 12,
      width: 24,
      depth: 6,
      backdrop: "Concrete wall",
      notes: "Power access points are available at the top-left corner. Concrete anchor bolts required."
    },
    "2026-06-V112-001": {
      height: 8,
      width: 16,
      depth: 2,
      backdrop: "Glass facade",
      notes: "Suction cup double-sided mounting system requested to protect structural storefront glazing."
    }
  });

  // Design Mockups Version Control Registry
  const [designVersions, setDesignVersions] = useState({
    "2026-06-A102-001": [
      {
        version: "v1",
        fileName: "atrium_layout_initial_v1.psd",
        uploadedBy: "Priya N. (Design Head)",
        timestamp: "2026-06-12 11:20 AM",
        status: "Pending Feedback",
        comments: [
          { id: 1, text: "Can we use a warmer tone for the directional arrow?", x: 30, y: 45, author: "Customer" }
        ]
      }
    ],
    "2026-06-L911-001": [
      {
        version: "v2",
        fileName: "hotel_neon_facade_v2.ai",
        uploadedBy: "Priya N. (Design Head)",
        timestamp: "2026-06-11 03:45 PM",
        status: "Pending Feedback",
        comments: []
      },
      {
        version: "v1",
        fileName: "hotel_neon_facade_v1.ai",
        uploadedBy: "Priya N. (Design Head)",
        timestamp: "2026-06-09 10:10 AM",
        status: "Rejected",
        comments: [
          { id: 1, text: "Increase spacing of neon letters by 15%", x: 50, y: 50, author: "Customer" }
        ]
      }
    ],
    "2026-06-A102-002": [
      {
        version: "v1",
        fileName: "corporate_wall_graphics_final.png",
        uploadedBy: "Priya N. (Design Head)",
        timestamp: "2026-06-10 02:00 PM",
        status: "Approved",
        comments: []
      }
    ]
  });

  // Support Tickets Registry
  const [supportTickets, setSupportTickets] = useState([
    {
      id: "TCK-402",
      orderId: "2026-06-C403-001",
      customerName: "Creative Co.",
      issueType: "Wiring issue",
      description: "One of the backlit LED strips is flickering when powered on in Section B.",
      status: "Open",
      date: "2026-06-12"
    }
  ]);

  // Quotation Custom Variants Registry (For client comparison)
  const [quoteVariants, setQuoteVariants] = useState({
    "2026-06-S302-001": {
      best: { name: "Best: Premium Acrylic (Glow Sign)", spec: "3D Cast Acrylic, Waterproof Samsung Modules, Aluminum frame profiles", cost: 15500 },
      better: { name: "Better: Standard Acrylic (Lit)", spec: "Acrylic lettering, Tier-2 LED strips, GI frame profiles", cost: 10500 },
      good: { name: "Good: Budget Vinyl Panel (Non-lit)", spec: "Alupanel backing, UV printed vinyl sheet, MS frame", cost: 5500 },
      selected: "better"
    }
  });

  // Notification Logs & Active Toast
  const [notificationLogs, setNotificationLogs] = useState([]);
  const [activeToast, setActiveToast] = useState(null);

  // Masking helpers for Employee & Installation views
  const maskText = (text, visibleStart = 2, visibleEnd = 3) => {
    if (!text) return "";
    if (text.length <= visibleStart + visibleEnd) return text;
    const mid = text.length - visibleStart - visibleEnd;
    return text.substring(0, visibleStart) + "*".repeat(mid) + text.substring(text.length - visibleEnd);
  };

  const maskPhone = (phone) => {
    if (!phone) return "";
    // Mask +91 98765 43210 -> +91 *****-**210
    const clean = phone.replace(/\s+/g, "");
    if (clean.length < 5) return phone;
    return `${clean.substring(0, 3)} *****-**${clean.substring(clean.length - 3)}`;
  };

  // Salt URL Simulation
  const generateSaltedUrl = (orderId) => {
    // Combine ID with a simulated backend secret key (salt)
    const salt = "PRINTEC_SECURE_SALT_2026";
    // Quick hash simulation
    let hash = 0;
    const str = orderId + salt;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
    }
    const token = Math.abs(hash).toString(16) + Math.random().toString(16).substr(2, 6);
    return `/customer?id=${orderId}&token=${token}`;
  };

  // Helper to generate sequential Order ID
  const generateOrderId = (customerId, dateString) => {
    const dateObj = new Date(dateString || "2026-06-12");
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    
    const orderCount = orders.filter(o => o.customerId === customerId).length;
    const enquiryCount = enquiries.filter(e => e.customerId === customerId).length;
    const seq = Math.max(orderCount, enquiryCount) + 1;
    const seqStr = String(seq).padStart(3, "0");

    return `${year}-${month}-${customerId}-${seqStr}`;
  };

  // Ingest Lead
  const createEnquiry = (enquiryData) => {
    const customer = addCustomer(enquiryData.customerName);
    const id = generateOrderId(customer.id, enquiryData.date);
    
    const newEnquiry = {
      ...enquiryData,
      id,
      customerId: customer.id,
      customerName: customer.name,
      status: enquiryData.status || "Enquired"
    };

    setEnquiries(prev => [newEnquiry, ...prev]);

    const newOrder = {
      id,
      date: enquiryData.date,
      projectName: enquiryData.projectName,
      customerName: customer.name,
      customerId: customer.id,
      status: enquiryData.status || "Enquired",
      budget: Number(enquiryData.budget) || 0,
      assignedEmployees: [],
      revenueCollected: 0,
      revenueOutstanding: Number(enquiryData.budget) || 0,
      isUrgent: false,
      designApprovedAt: null,
      installationSchedule: null,
      referredBy: enquiryData.referredBy || "Ananya M. (Sales Associate)"
    };
    setOrders(prev => [newOrder, ...prev]);
    triggerAutomatedNotifications(newEnquiry);
  };

  const addCustomer = (name) => {
    const existing = customers.find(c => c.name.toLowerCase() === name.toLowerCase());
    if (existing) return existing;

    const initials = name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
    const num = Math.floor(100 + Math.random() * 900);
    const id = `${initials || "C"}${num}`;
    const newCustomer = { id, name };
    setCustomers(prev => [...prev, newCustomer]);
    return newCustomer;
  };

  const triggerAutomatedNotifications = (enquiry) => {
    const whatsappMsg = `Hi ${enquiry.customerName}, your enquiry for "${enquiry.projectName}" has been received. Order ID generated: ${enquiry.id}. We'll get started with your order soon! - Printec Team`;
    
    const emailSubject = `Enquiry Received - Printec [${enquiry.id}]`;
    const emailBody = `Dear ${enquiry.customerName},\n\nThank you for contacting Printec. We have received your enquiry for "${enquiry.projectName}".\n\nYour Order ID is: ${enquiry.id}.\n\nOur team is reviewing the details, and we will get back to you shortly.\n\nBest Regards,\nPrintec Admin`;

    const newLogs = [
      {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toLocaleTimeString(),
        type: "whatsapp",
        recipient: enquiry.phone,
        content: whatsappMsg,
        status: "Sent Successfully"
      },
      {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toLocaleTimeString(),
        type: "email",
        recipient: enquiry.email,
        content: `Subject: ${emailSubject}\n\n${emailBody}`,
        status: "Sent Successfully"
      }
    ];

    setNotificationLogs(prev => [newLogs[0], newLogs[1], ...prev]);
    setActiveToast({
      customerName: enquiry.customerName,
      id: enquiry.id,
      phone: enquiry.phone,
      email: enquiry.email
    });
  };

  const triggerStatusWhatsApp = (orderId, newStatus, customerName, phone) => {
    const message = `Update on Order ${orderId}: Your order status has progressed to [${newStatus.toUpperCase()}]. Track live details on your Printec Customer Portal!`;
    const newLog = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      type: "whatsapp",
      recipient: phone || "+91 99887 76655",
      content: message,
      status: "Sent Successfully"
    };
    setNotificationLogs(prev => [newLog, ...prev]);
  };

  const createOrder = (orderData) => {
    const customer = addCustomer(orderData.customerName);
    const id = generateOrderId(customer.id, orderData.date);

    const newOrder = {
      ...orderData,
      id,
      customerId: customer.id,
      customerName: customer.name,
      budget: Number(orderData.budget) || 0,
      assignedEmployees: orderData.assignedEmployees || [],
      revenueCollected: Number(orderData.revenueCollected) || 0,
      revenueOutstanding: Number(orderData.budget) - (Number(orderData.revenueCollected) || 0),
      isUrgent: false,
      designApprovedAt: null,
      installationSchedule: null,
      referredBy: "Ananya M. (Sales Associate)"
    };
    setOrders(prev => [newOrder, ...prev]);
  };

  const assignEmployeeToOrder = (orderId, employeeNames) => {
    setOrders(prev =>
      prev.map(o => (o.id === orderId ? { ...o, assignedEmployees: employeeNames } : o))
    );
  };

  const updateOrderStatus = (orderId, status) => {
    setOrders(prev =>
      prev.map(o => {
        if (o.id === orderId) {
          triggerStatusWhatsApp(orderId, status, o.customerName, null);
          
          let designApprovedAt = o.designApprovedAt;
          if (status.toLowerCase() === "production" && !o.designApprovedAt) {
            designApprovedAt = new Date().toISOString();
          }

          return { ...o, status, designApprovedAt };
        }
        return o;
      })
    );

    setEnquiries(prev =>
      prev.map(e => (e.id === orderId ? { ...e, status } : e))
    );
  };

  const toggleUrgency = (orderId) => {
    setOrders(prev =>
      prev.map(o => (o.id === orderId ? { ...o, isUrgent: !o.isUrgent } : o))
    );
  };

  const addMeasurement = (orderId, measurementData) => {
    setSiteMeasurements(prev => ({
      ...prev,
      [orderId]: measurementData
    }));
  };

  const addDesignVersion = (orderId, designData) => {
    setDesignVersions(prev => {
      const existing = prev[orderId] || [];
      const vNum = `v${existing.length + 1}`;
      const newVer = {
        version: vNum,
        fileName: designData.fileName,
        uploadedBy: designData.uploadedBy || "Priya N. (Design Head)",
        timestamp: new Date().toLocaleString(),
        status: "Pending Feedback",
        comments: []
      };
      return {
        ...prev,
        [orderId]: [newVer, ...existing]
      };
    });
  };

  const addDesignAnnotationComment = (orderId, commentText, x, y) => {
    setDesignVersions(prev => {
      const orderVersions = prev[orderId] || [];
      if (orderVersions.length === 0) return prev;
      const updatedVersions = [...orderVersions];
      // Add comment to the latest version
      const latest = { ...updatedVersions[0] };
      latest.comments = [
        ...latest.comments,
        {
          id: latest.comments.length + 1,
          text: commentText,
          x,
          y,
          author: "Customer"
        }
      ];
      updatedVersions[0] = latest;
      return {
        ...prev,
        [orderId]: updatedVersions
      };
    });
  };

  const approveDesignForProduction = (orderId) => {
    // 1. Approve latest design version
    setDesignVersions(prev => {
      const orderVersions = prev[orderId] || [];
      if (orderVersions.length === 0) return prev;
      const updated = [...orderVersions];
      updated[0] = { ...updated[0], status: "Approved" };
      return { ...prev, [orderId]: updated };
    });

    // 2. Set order status to production, sets designApprovedAt timestamp
    updateOrderStatus(orderId, "Production");
  };

  const submitSupportTicket = (orderId, ticketData) => {
    const order = orders.find(o => o.id === orderId);
    const newTicket = {
      id: `TCK-${Math.floor(100 + Math.random() * 900)}`,
      orderId,
      customerName: order ? order.customerName : "Unknown Client",
      issueType: ticketData.issueType,
      description: ticketData.description,
      status: "Open",
      date: new Date().toISOString().split("T")[0]
    };
    setSupportTickets(prev => [newTicket, ...prev]);
  };

  const updateTicketStatus = (ticketId, status) => {
    setSupportTickets(prev =>
      prev.map(t => (t.id === ticketId ? { ...t, status } : t))
    );
  };

  const updateQuoteSelection = (orderId, selectedVariant) => {
    setQuoteVariants(prev => ({
      ...prev,
      [orderId]: {
        ...prev[orderId],
        selected: selectedVariant
      }
    }));
    
    // Auto-update budget of order to match the selected variant's cost
    const cost = quoteVariants[orderId]?.[selectedVariant]?.cost || 0;
    if (cost > 0) {
      setOrders(prev =>
        prev.map(o => (o.id === orderId ? { ...o, budget: cost, revenueOutstanding: cost - o.revenueCollected } : o))
      );
    }
  };

  const saveQuoteVariants = (orderId, variants) => {
    setQuoteVariants(prev => ({
      ...prev,
      [orderId]: {
        ...variants,
        selected: prev[orderId]?.selected || "better"
      }
    }));

    // Update order budget based on the currently selected variant
    const selectedVariant = quoteVariants[orderId]?.selected || "better";
    const cost = variants[selectedVariant]?.cost || 0;
    if (cost > 0) {
      setOrders(prev =>
        prev.map(o => (o.id === orderId ? { ...o, budget: cost, revenueOutstanding: cost - o.revenueCollected } : o))
      );
    }
  };

  const setInstallationSlot = (orderId, slotData) => {
    setOrders(prev =>
      prev.map(o => {
        if (o.id === orderId) {
          triggerStatusWhatsApp(orderId, "Installation Scheduled", o.customerName, null);
          return {
            ...o,
            installationSchedule: slotData
          };
        }
        return o;
      })
    );
  };

  return (
    <AppContext.Provider
      value={{
        orders,
        enquiries,
        employees,
        customers,
        notificationLogs,
        activeToast,
        siteMeasurements,
        designVersions,
        supportTickets,
        quoteVariants,
        setActiveToast,
        maskText,
        maskPhone,
        generateSaltedUrl,
        createEnquiry,
        createOrder,
        assignEmployeeToOrder,
        updateOrderStatus,
        toggleUrgency,
        addMeasurement,
        addDesignVersion,
        addDesignAnnotationComment,
        approveDesignForProduction,
        submitSupportTicket,
        updateTicketStatus,
        updateQuoteSelection,
        saveQuoteVariants,
        setInstallationSlot
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
