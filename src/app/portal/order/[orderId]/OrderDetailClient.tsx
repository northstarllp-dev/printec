"use client";

import React, { useState } from "react";
import { 
  ArrowLeft, 
  MapPin, 
  FileCheck, 
  Layout, 
  CreditCard, 
  MessageSquare,
  CheckCircle,
  Clock,
  Calendar,
  User
} from "lucide-react";
import { OrderCommunicationCenter } from "@/components/communication/OrderCommunicationCenter";

interface Customer {
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
}

interface Order {
  id: string;
  projectName: string;
  customerId: string;
  customerName?: string;
  stage: string;
  budget: number;
  depositPaid: number;
  dimensions: string;
  notes: string;
  urgent: boolean;
  assignedEmployees: string[];
  assignedDesigners?: string[];
  assignedMarketers?: string[];
  dateCreated: string;
  deadlineStatus: string;
  imageMockup: string;
  versionHistory: any[];
  chatHistory: any[];
  siteVisitDetails?: any;
  quoteDetails?: any;
  designDetails?: any;
  productionDetails?: any;
  installationDetails?: any;
  stageStatus?: string;
  stageAdminNotes?: string;
  orderCode?: string;
}

interface OrderDetailClientProps {
  customer: Customer;
  order: Order;
  token: string;
}

const tabs = [
  { id: "site-visit", label: "Site Visit", icon: MapPin },
  { id: "quotation", label: "Quotation", icon: FileCheck },
  { id: "design", label: "Design", icon: Layout },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "chat", label: "Chat", icon: MessageSquare }
];

export function OrderDetailClient({ customer, order, token }: OrderDetailClientProps) {
  const [activeTab, setActiveTab] = useState("site-visit");

  const stages = ["Quotation", "Design", "In Production", "Installation", "Completed"];
  const currentStageIndex = stages.indexOf(order.stage) !== -1 ? stages.indexOf(order.stage) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                const url = new URL("/portal", window.location.origin);
                url.searchParams.set("customer_id", customer.customerCode || customer.id);
                url.searchParams.set("token", token);
                window.location.href = url.toString();
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900">{order.projectName}</h1>
              <p className="text-sm text-gray-500">Order {order.orderCode || order.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              currentStageIndex >= 2 
                ? "bg-green-50 text-green-700 border border-green-200" 
                : "bg-blue-50 text-blue-700 border border-blue-200"
            }`}>
              {order.stage}
            </span>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            {stages.map((stage, idx) => {
              const isCompleted = idx < currentStageIndex;
              const isActive = idx === currentStageIndex;
              const Icon = idx === 0 ? FileCheck : idx === 1 ? Layout : idx === 2 ? CheckCircle : idx === 3 ? MapPin : CheckCircle;
              
              return (
                <React.Fragment key={idx}>
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        isCompleted 
                          ? "bg-green-500 text-white" 
                          : isActive 
                            ? "bg-blue-500 text-white" 
                            : "bg-gray-200 text-gray-400"
                      }`}
                    >
                      <Icon size={20} />
                    </div>
                    <span
                      className={`text-sm font-semibold ${
                        isCompleted 
                          ? "text-green-600" 
                          : isActive 
                            ? "text-blue-600" 
                            : "text-gray-500"
                      }`}
                    >
                      {stage}
                    </span>
                  </div>
                  {idx < stages.length - 1 && (
                    <div className={`flex-1 h-1 mx-4 rounded-full ${
                      idx < currentStageIndex ? "bg-green-500" : "bg-gray-200"
                    }`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-2 overflow-x-auto py-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-5 py-3 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                    activeTab === tab.id 
                      ? "bg-blue-50 text-blue-600 border border-blue-200" 
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === "site-visit" && <SiteVisitTab order={order} />}
        {activeTab === "quotation" && <QuotationTab order={order} />}
        {activeTab === "design" && <DesignTab order={order} />}
        {activeTab === "billing" && <BillingTab order={order} />}
        {activeTab === "chat" && <ChatTab order={order} customer={customer} />}
      </main>
    </div>
  );
}

function SiteVisitTab({ order }: { order: Order }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Status Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Site Visit Status</h3>
              <p className="text-sm text-gray-500 mt-1">Scheduled for next week</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
              <Calendar size={24} className="text-blue-600" />
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Clock size={16} className="text-gray-500" />
              <span>10:00 AM - 11:00 AM</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <MapPin size={16} className="text-gray-500" />
              <span>{order.dimensions || "123 Main Street, City"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <User size={16} className="text-gray-500" />
              <span>John Doe (Site Engineer)</span>
            </div>
          </div>
        </div>

        {/* Location Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 md:col-span-2">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Location Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Address</label>
              <p className="text-sm text-gray-900 mt-1">
                {order.dimensions || "123 Main St, City Center, 123456"}
              </p>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Site Type</label>
              <p className="text-sm text-gray-900 mt-1">
                Commercial Building
              </p>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Contact Person</label>
              <p className="text-sm text-gray-900 mt-1">
                {order.customerName || "Customer Name"}
              </p>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Contact Number</label>
              <p className="text-sm text-gray-900 mt-1">
                +91 9876543210
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Photos Preview */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Site Photos</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((idx) => (
            <div
              key={idx}
              className="aspect-square bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center"
            >
              <span className="text-gray-500 text-sm">Photo {idx}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function QuotationTab({ order }: { order: Order }) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900">Quotation</h2>
            <p className="text-sm text-gray-500 mt-2">Valid for 7 days</p>
          </div>
          <span className="px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-full text-sm font-bold">
            Pending Approval
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 text-xs font-bold text-gray-500 uppercase">Description</th>
                <th className="text-right py-3 text-xs font-bold text-gray-500 uppercase">Quantity</th>
                <th className="text-right py-3 text-xs font-bold text-gray-500 uppercase">Rate</th>
                <th className="text-right py-3 text-xs font-bold text-gray-500 uppercase">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="py-4 text-sm text-gray-900">ACP Sign Board (8x3 ft)</td>
                <td className="py-4 text-sm text-gray-600 text-right">1</td>
                <td className="py-4 text-sm text-gray-600 text-right">₹15,000</td>
                <td className="py-4 text-sm text-gray-900 font-semibold text-right">₹15,000</td>
              </tr>
              <tr>
                <td className="py-4 text-sm text-gray-900">LED Channel Letters (6 inch)</td>
                <td className="py-4 text-sm text-gray-600 text-right">8</td>
                <td className="py-4 text-sm text-gray-600 text-right">₹2,500</td>
                <td className="py-4 text-sm text-gray-900 font-semibold text-right">₹20,000</td>
              </tr>
              <tr>
                <td className="py-4 text-sm text-gray-900">Installation & Wiring</td>
                <td className="py-4 text-sm text-gray-600 text-right">1</td>
                <td className="py-4 text-sm text-gray-600 text-right">₹5,000</td>
                <td className="py-4 text-sm text-gray-900 font-semibold text-right">₹5,000</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Subtotal</span>
            <span className="text-sm font-semibold text-gray-900">₹40,000</span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">GST (18%)</span>
            <span className="text-sm font-semibold text-gray-900">₹7,200</span>
          </div>
          <div className="flex items-center justify-between py-4 border-t border-gray-200 mt-4">
            <span className="text-lg font-bold text-gray-900">Total</span>
            <span className="text-2xl font-extrabold text-blue-600">
              ₹{(order.budget || 47200).toLocaleString("en-IN")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function DesignTab({ order }: { order: Order }) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <h2 className="text-2xl font-extrabold text-gray-900 mb-6">Design Preview</h2>
        
        <div className="aspect-video bg-gray-100 rounded-xl flex items-center justify-center mb-6">
          <div className="text-center">
            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Layout size={48} className="text-gray-400" />
            </div>
            <p className="text-gray-500">Design preview will appear here</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors">
            Approve Design
          </button>
          <button className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors">
            Request Changes
          </button>
        </div>
      </div>
    </div>
  );
}

function BillingTab({ order }: { order: Order }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Payment Summary</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Total Amount</span>
              <span className="text-xl font-bold text-gray-900">
                ₹{(order.budget || 47200).toLocaleString("en-IN")}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Paid Amount</span>
              <span className="text-xl font-bold text-green-600">
                ₹{(order.depositPaid || 0).toLocaleString("en-IN")}
              </span>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <span className="text-gray-900 font-bold">Balance</span>
              <span className="text-2xl font-extrabold text-orange-600">
                ₹{(order.budget - order.depositPaid || 47200).toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Payment Options</h3>
          
          <div className="space-y-3">
            <button className="w-full px-4 py-3 border border-blue-500 text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-colors">
              Pay via UPI
            </button>
            <button className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors">
              Bank Transfer
            </button>
            <button className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors">
              Cash on Delivery
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChatTab({ order, customer }: { order: Order; customer: Customer }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 h-[550px] flex flex-col overflow-hidden">
      <OrderCommunicationCenter
        orderId={order.orderCode || order.id}
        currentUserRole="Customer"
        currentUserName={customer.name}
        employees={[]}
        customers={[customer]}
        defaultTab="customer"
      />
    </div>
  );
}
