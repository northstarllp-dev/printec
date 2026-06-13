"use client";

import React, { useState } from "react";
import { Plus, Search, MapPin, Mail, Phone, MessageSquare, Edit2 } from "lucide-react";
import { useDashboard, Customer } from "@/context/DashboardContext";

interface CustomersViewProps {
  onOpenAddCustomer: () => void;
  onOpenEditCustomer: (customer: Customer) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({ onOpenAddCustomer, onOpenEditCustomer }) => {
  const { customers, searchQuery } = useDashboard();

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.billingAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.shippingAddress.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 md:p-8 w-full max-w-[1440px] mx-auto font-sans">
      
      {/* Top Header Area */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center space-y-4 sm:space-y-0 mb-8">
        <div>
          <h1 className="text-display-lg text-[var(--color-primary)]">Customer Profiles</h1>
          <p className="text-body-md text-[var(--color-on-surface-variant)] mt-1">
            Browse and manage customer database entries and address mappings.
          </p>
        </div>

        <button
          onClick={onOpenAddCustomer}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary-container)] text-white rounded-lg font-semibold hover:opacity-90 active:scale-95 transition-all shadow-md"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span className="text-body-md">Add Customer Profile</span>
        </button>
      </div>

      {/* Customers Data Table */}
      <div className="prt-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="prt-table">
            <thead>
              <tr>
                <th>Customer ID</th>
                <th>Customer / Company Name</th>
                <th>Contact Info</th>
                <th>Billing Address</th>
                <th>Shipping / Site Address</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((cust, idx) => (
                <tr key={cust.id} className="prt-animate-in" style={{ animationDelay: `${idx * 0.05}s` }}>
                  {/* Customer ID */}
                  <td style={{ whiteSpace: "nowrap" }}>
                    <span className="font-data-tabular text-body-md text-[var(--color-on-surface)] bg-[var(--color-surface-container-high)] border border-[var(--color-outline-variant)] rounded px-2 py-1">
                      {cust.id}
                    </span>
                  </td>

                  {/* Customer / Company Name */}
                  <td>
                    <span className="text-body-md font-bold text-[var(--color-primary)] block">
                      {cust.name}
                    </span>
                  </td>

                  {/* Contact Info */}
                  <td style={{ whiteSpace: "nowrap" }} className="space-y-1">
                    <div className="flex items-center space-x-1.5">
                      <span className="material-symbols-outlined text-[14px] text-[var(--color-on-surface-variant)]">call</span>
                      <span className="font-data-tabular text-body-md text-[var(--color-on-surface)]">{cust.phone}</span>
                    </div>
                    
                    {cust.whatsapp && (
                      <div className="flex items-center space-x-1.5">
                        <span className="material-symbols-outlined text-[14px] text-emerald-500">chat</span>
                        <span className="font-data-tabular text-body-md text-emerald-700">{cust.whatsapp}</span>
                      </div>
                    )}

                    {cust.email && (
                      <div className="flex items-center space-x-1.5">
                        <span className="material-symbols-outlined text-[14px] text-[var(--color-on-surface-variant)]">mail</span>
                        <span className="font-data-tabular text-body-md text-[var(--color-on-surface-variant)]">{cust.email}</span>
                      </div>
                    )}
                  </td>

                  {/* Billing Address */}
                  <td style={{ maxWidth: 220 }}>
                    {cust.billingAddress ? (
                      <div className="flex items-start text-body-md text-[var(--color-on-surface)]">
                        <span className="material-symbols-outlined text-[16px] mr-1 text-[var(--color-on-surface-variant)] shrink-0">location_on</span>
                        <span className="leading-relaxed">{cust.billingAddress}</span>
                      </div>
                    ) : (
                      <span className="text-body-md text-[var(--color-on-surface-variant)] italic">No billing address recorded</span>
                    )}
                  </td>

                  {/* Shipping / Site Address */}
                  <td style={{ maxWidth: 220 }}>
                    {cust.shippingAddress ? (
                      <div className="flex items-start text-body-md text-[var(--color-on-surface)]">
                        <span className="material-symbols-outlined text-[16px] mr-1 text-[var(--color-on-surface-variant)] shrink-0">local_shipping</span>
                        <span className="leading-relaxed">{cust.shippingAddress}</span>
                      </div>
                    ) : (
                      <span className="text-body-md text-[var(--color-on-surface-variant)] italic">No installation address recorded</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td style={{ textAlign: "right" }}>
                    <button
                      onClick={() => onOpenEditCustomer(cust)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] text-[var(--color-on-surface-variant)] rounded text-body-md font-semibold hover:bg-[var(--color-surface-container-low)] transition-colors"
                    >
                      <span className="material-symbols-outlined text-[14px]">edit</span> Edit
                    </button>
                  </td>
                </tr>
              ))}
              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: 24, textAlign: "center" }} className="text-slate-400 text-sm font-medium">
                    No customer profiles found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
