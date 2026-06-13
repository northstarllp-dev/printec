"use client";

import React, { useState, useEffect } from "react";
import { X, Search, Plus, Trash2 } from "lucide-react";
import { useDashboard, Customer, Order, PipelineStage } from "@/context/DashboardContext";

// Add/Edit Customer Modal
interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerToEdit?: Customer | null;
}

export const CustomerModal: React.FC<CustomerModalProps> = ({ isOpen, onClose, customerToEdit }) => {
  const { addCustomer, updateCustomer, addNotification } = useDashboard();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");

  useEffect(() => {
    if (customerToEdit) {
      setName(customerToEdit.name);
      setPhone(customerToEdit.phone);
      setWhatsapp(customerToEdit.whatsapp);
      setEmail(customerToEdit.email);
      setBillingAddress(customerToEdit.billingAddress);
      setShippingAddress(customerToEdit.shippingAddress);
    } else {
      setName("");
      setPhone("");
      setWhatsapp("");
      setEmail("");
      setBillingAddress("");
      setShippingAddress("");
    }
  }, [customerToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;

    const data = { name, phone, whatsapp: whatsapp || phone, email, billingAddress, shippingAddress };

    if (customerToEdit) {
      updateCustomer({ ...customerToEdit, ...data });
      addNotification("Customer Updated", `${name}'s profile has been updated.`, "success");
    } else {
      addCustomer(data);
      addNotification("Customer Added", `${name} has been added.`, "success");
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white rounded-[var(--radius-xl)] border border-[var(--border)] shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <h2 className="text-base font-bold text-slate-800">
            {customerToEdit ? "Edit Customer Identity" : "Add New Customer"}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-[var(--radius-md)] text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div>
            <label className="block prt-label mb-1.5">Customer / Company Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. TechCorp Global"
              className="prt-input"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block prt-label mb-1.5">Primary Phone Number *</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +91 98765 43210"
                className="prt-input"
              />
            </div>
            <div>
              <label className="block prt-label mb-1.5">WhatsApp Number</label>
              <input
                type="text"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="Same as primary phone if empty"
                className="prt-input"
              />
            </div>
          </div>

          <div>
            <label className="block prt-label mb-1.5">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. procurement@techcorp.com"
              className="prt-input"
            />
          </div>

          <div>
            <label className="block prt-label mb-1.5">Billing Address</label>
            <textarea
              rows={2}
              value={billingAddress}
              onChange={(e) => setBillingAddress(e.target.value)}
              placeholder="Full billing address with GST/tax details"
              className="prt-input resize-none"
            />
          </div>

          <div>
            <label className="block prt-label mb-1.5">Shipping / Installation Address</label>
            <textarea
              rows={2}
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              placeholder="Site details where signage will be installed"
              className="prt-input resize-none"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[var(--border)]">
            <button
              type="button"
              onClick={onClose}
              className="prt-btn prt-btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="prt-btn prt-btn-primary"
            >
              {customerToEdit ? "Save Profile" : "Add Customer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Add/Edit Order Modal
interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderToEdit?: Order | null;
}

export const OrderModal: React.FC<OrderModalProps> = ({ isOpen, onClose, orderToEdit }) => {
  const { customers, addOrder, updateOrder, deleteOrder, addCustomer, addNotification } = useDashboard();
  
  const [orderId, setOrderId] = useState("");
  const [projectName, setProjectName] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [stage, setStage] = useState<PipelineStage>("Site Visit Pending");
  const [budget, setBudget] = useState("");
  const [depositPaid, setDepositPaid] = useState("");
  const [dimensions, setDimensions] = useState("");
  const [notes, setNotes] = useState("");
  const [urgent, setUrgent] = useState(false);
  const [assignedEmployeesString, setAssignedEmployeesString] = useState("");
  const [assignedDesignersString, setAssignedDesignersString] = useState("");
  const [assignedMarketersString, setAssignedMarketersString] = useState("");
  const [deadlineStatus, setDeadlineStatus] = useState<any>("On Track");

  // Customer search inside modal
  const [custSearch, setCustSearch] = useState("");
  const [isCustDropdownOpen, setIsCustDropdownOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [newCustName, setNewCustName] = useState("");
  const [newCustPhone, setNewCustPhone] = useState("");

  useEffect(() => {
    if (orderToEdit) {
      setOrderId(orderToEdit.id);
      setProjectName(orderToEdit.projectName);
      setSelectedCustomerId(orderToEdit.customerId);
      setStage(orderToEdit.stage);
      setBudget(orderToEdit.budget.toString());
      setDepositPaid(orderToEdit.depositPaid.toString());
      setDimensions(orderToEdit.dimensions);
      setNotes(orderToEdit.notes);
      setUrgent(orderToEdit.urgent);
      setAssignedEmployeesString(orderToEdit.assignedEmployees.join(", "));
      setAssignedDesignersString(orderToEdit.assignedDesigners?.join(", ") || "");
      setAssignedMarketersString(orderToEdit.assignedMarketers?.join(", ") || "");
      setDeadlineStatus(orderToEdit.deadlineStatus);
      
      const cust = customers.find(c => c.id === orderToEdit.customerId);
      setCustSearch(cust ? cust.name : "");
    } else {
      setOrderId("");
      setProjectName("");
      setSelectedCustomerId("");
      setStage("Site Visit Pending");
      setBudget("");
      setDepositPaid("");
      setDimensions("");
      setNotes("");
      setUrgent(false);
      setAssignedEmployeesString("");
      setAssignedDesignersString("");
      setAssignedMarketersString("");
      setDeadlineStatus("On Track");
      setCustSearch("");
    }
    setQuickAddOpen(false);
    setIsCustDropdownOpen(false);
  }, [orderToEdit, isOpen, customers]);

  if (!isOpen) return null;

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(custSearch.toLowerCase()) ||
    c.phone.includes(custSearch)
  );

  const handleQuickAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName || !newCustPhone) return;
    const added = await addCustomer({
      name: newCustName,
      phone: newCustPhone,
      whatsapp: newCustPhone,
      email: "",
      billingAddress: "",
      shippingAddress: ""
    });
    setSelectedCustomerId(added.id);
    setCustSearch(added.name);
    setQuickAddOpen(false);
    setNewCustName("");
    setNewCustPhone("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName || !selectedCustomerId) return;

    const designers = assignedDesignersString
      .split(",")
      .map(e => e.trim().toUpperCase())
      .filter(e => e.length > 0);

    const marketers = assignedMarketersString
      .split(",")
      .map(e => e.trim().toUpperCase())
      .filter(e => e.length > 0);

    // Merge both arrays to keep assignedEmployees accurate for role dashboard filtering
    const employees = Array.from(new Set([...designers, ...marketers]));

    const data = {
      id: orderId || undefined,
      projectName,
      customerId: selectedCustomerId,
      stage,
      budget: parseFloat(budget) || 0,
      depositPaid: parseFloat(depositPaid) || 0,
      dimensions,
      notes,
      urgent,
      assignedEmployees: employees,
      assignedDesigners: designers,
      assignedMarketers: marketers,
      deadlineStatus: deadlineStatus || "On Track",
      imageMockup: orderToEdit ? orderToEdit.imageMockup : "Lobby Totem - Main Entrance"
    };

    if (orderToEdit) {
      updateOrder(orderToEdit.id, {
        ...orderToEdit,
        ...data,
        id: orderId || orderToEdit.id
      });
      addNotification("Order Updated", `Order ${orderId || orderToEdit.id} has been successfully updated.`, "success");
    } else {
      addOrder(data);
      addNotification("Order Created", `${projectName} has been successfully created.`, "success");
    }
    onClose();
  };

  const handleDelete = () => {
    if (orderToEdit && window.confirm("Are you absolutely sure you want to delete this order? This action is permanent and cannot be undone.")) {
      deleteOrder(orderToEdit.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-2xl bg-white rounded-[var(--radius-xl)] border border-[var(--border)] shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <h2 className="text-base font-bold text-slate-800">
            {orderToEdit ? `Modify Order Reference: ${orderToEdit.id}` : "+ Initialize New Signage Order"}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-[var(--radius-md)] text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col md:flex-row max-h-[80vh]">
          {/* Main Form Area */}
          <form onSubmit={handleSubmit} className="flex-1 p-6 space-y-4 overflow-y-auto">
            {/* Order No & Project Name */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block prt-label mb-1.5">Order Number (ID)</label>
                <input
                  type="text"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  placeholder="PRJ-XXXXX"
                  className="prt-input font-mono"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block prt-label mb-1.5">Project Name *</label>
                <input
                  type="text"
                  required
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g. 3D Acrylic Board for Lobby"
                  className="prt-input"
                />
              </div>
            </div>

            {/* Customer Searchable Dropdown */}
            <div className="relative">
              <label className="block prt-label mb-1.5">Select Customer Profile *</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={custSearch}
                  onFocus={() => setIsCustDropdownOpen(true)}
                  onChange={(e) => {
                    setCustSearch(e.target.value);
                    setIsCustDropdownOpen(true);
                  }}
                  placeholder="Search by company or phone..."
                  className="prt-input pl-10"
                />
                <Search size={14} className="absolute left-3.5 top-3.5 text-slate-400" />
              </div>

              {/* Dropdown Items */}
              {isCustDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-[var(--border)] rounded-[var(--radius-lg)] shadow-lg max-h-48 overflow-y-auto">
                  {filteredCustomers.map(cust => (
                    <button
                      key={cust.id}
                      type="button"
                      onClick={() => {
                        setSelectedCustomerId(cust.id);
                        setCustSearch(cust.name);
                        setIsCustDropdownOpen(false);
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-50 flex justify-between items-center border-b border-slate-50 last:border-0 cursor-pointer"
                    >
                      <span className="font-semibold text-slate-700">{cust.name}</span>
                      <span className="text-slate-400 text-xs font-mono">{cust.phone}</span>
                    </button>
                  ))}
                  {filteredCustomers.length === 0 && (
                    <div className="px-4 py-3 text-center">
                      <p className="text-xs text-slate-400 mb-2">No matching profiles found</p>
                      <button
                        type="button"
                        onClick={() => {
                          setQuickAddOpen(true);
                          setIsCustDropdownOpen(false);
                        }}
                        className="inline-flex items-center text-xs font-semibold text-[var(--secondary-500)] hover:text-[var(--secondary-600)] hover:underline cursor-pointer"
                      >
                        <Plus size={14} className="mr-1" /> Quick Add Customer Profile
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quick Add Customer Panel inside Modal */}
            {quickAddOpen && (
              <div className="p-4 bg-slate-50 border border-[var(--border)] rounded-[var(--radius-lg)] space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="prt-label">Quick Create Profile</h4>
                  <button type="button" onClick={() => setQuickAddOpen(false)} className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer">Cancel</button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Customer Name"
                    value={newCustName}
                    onChange={(e) => setNewCustName(e.target.value)}
                    className="prt-input bg-white"
                  />
                  <input
                    type="text"
                    placeholder="Phone Number"
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    className="prt-input bg-white"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleQuickAddCustomer}
                  className="prt-btn prt-btn-inverted w-full justify-center"
                >
                  Create & Link Profile
                </button>
              </div>
            )}

            {/* Budget & Deposit Removed - Decided after quotation is confirmed */}

            {/* Workflow notes */}
            <div>
              <label className="block prt-label mb-1.5">Workflow Notes</label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Specifications, custom wiring details, mounting instructions..."
                className="prt-input resize-none"
              />
            </div>

            {/* Urgency Switch */}
            <div className="flex items-center justify-between p-3 bg-red-50/50 border border-red-100 rounded-[var(--radius-lg)]">
              <div>
                <span className="block text-xs font-bold text-red-800 uppercase tracking-wider">Mark as High Priority / Urgent</span>
                <span className="text-[11px] text-red-600/70 mt-0.5 block leading-normal">Will highlight order in the production queue.</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={urgent}
                  onChange={(e) => setUrgent(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--error-text)]"></div>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
              {/* Permanently destructive Delete Order button anchored cleanly away */}
              <div>
                {orderToEdit && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="prt-btn bg-rose-50 text-[var(--error-text)] border border-[var(--error-text)] hover:bg-rose-100"
                  >
                    <Trash2 size={14} /> Delete Order
                  </button>
                )}
              </div>

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="prt-btn prt-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="prt-btn prt-btn-primary"
                >
                  {orderToEdit ? "Apply Modifications" : "Generate Order"}
                </button>
              </div>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
};
