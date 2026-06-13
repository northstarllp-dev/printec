"use client";

import React, { useState } from "react";
import { Users, Phone, Shield, Star, Plus } from "lucide-react";
import { useDashboard } from "@/context/DashboardContext";

interface Employee {
  initials: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  status: "Active" | "On Site" | "Off Duty";
  rating: number;
}

export const EmployeesView: React.FC = () => {
  const { orders, addNotification } = useDashboard();
  const [employees, setEmployees] = useState<Employee[]>([
    {
      initials: "SK",
      name: "Suresh Kumar",
      role: "Senior Lead Fabricator",
      phone: "+91 98765 11111",
      email: "suresh@printec.com",
      status: "Active",
      rating: 4.9
    },
    {
      initials: "RM",
      name: "Rajesh Mishra",
      role: "Installation Supervisor",
      phone: "+91 98765 22222",
      email: "mishra.r@printec.com",
      status: "On Site",
      rating: 4.8
    },
    {
      initials: "AK",
      name: "Amit Khan",
      role: "Design & Vector Artist",
      phone: "+91 98765 33333",
      email: "amit.k@printec.com",
      status: "Active",
      rating: 4.7
    },
    {
      initials: "JS",
      name: "Jagdish Singh",
      role: "Structural Engineer",
      phone: "+91 98765 44444",
      email: "j.singh@printec.com",
      status: "Off Duty",
      rating: 5.0
    }
  ]);

  // Helper to calculate active task load for each employee from orders state
  const getActiveTaskCount = (initials: string) => {
    return orders.filter(
      o => o.assignedEmployees.includes(initials) && o.stage !== "Order Completed"
    ).length;
  };

  const getStatusBadgeClass = (status: Employee["status"]): string => {
    switch (status) {
      case "Active":
        return "prt-badge prt-badge-completed border uppercase";
      case "On Site":
        return "prt-badge prt-badge-quote-pending border uppercase";
      case "Off Duty":
        return "prt-badge prt-badge-enquired border uppercase";
    }
  };

  return (
    <div className="p-6 md:p-8 w-full max-w-[1440px] mx-auto font-sans">
      {/* Top Header Area */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center space-y-4 sm:space-y-0 mb-8">
        <div>
          <h2 className="text-display-lg text-[var(--color-primary)]">
            Employees Directory
          </h2>
          <p className="text-body-md text-[var(--color-on-surface-variant)] mt-1">
            Monitor workloads, assigned project loads, and current field statuses
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button 
            onClick={() => addNotification("Export Started", "Downloading employees log...", "success")}
            className="prt-btn prt-btn-secondary"
          >
            <Plus size={13} className="mr-1.5 rotate-45" /> Export CSV
          </button>
          
          <button 
            onClick={() => addNotification("Coming Soon", "Add Employee form will be available in the next release.", "info")}
            className="prt-btn prt-btn-primary"
          >
            <Plus size={13} className="mr-1.5" /> Add Employee
          </button>
        </div>
      </div>

      {/* Directory Table */}
      <div className="prt-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="prt-table">
            <thead>
              <tr>
                <th>Initials</th>
                <th>Full Name</th>
                <th>Designation / Role</th>
                <th>Contact Info</th>
                <th>Workload (Active Projects)</th>
                <th>Current Status</th>
                <th style={{ textAlign: "right" }}>Performance</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp, idx) => (
                <tr key={emp.initials} className="prt-animate-in" style={{ animationDelay: `${idx * 0.05}s` }}>
                  {/* Initials badge */}
                  <td>
                    <div className="w-10 h-10 rounded-full border-2 border-[var(--color-primary-container)] bg-[var(--color-surface-container-high)] flex items-center justify-center font-bold text-[var(--color-primary)]">
                      {emp.initials}
                    </div>
                  </td>

                  {/* Full Name */}
                  <td>
                    <span className="text-body-md font-bold text-[var(--color-primary)] leading-tight block">
                      {emp.name}
                    </span>
                    <span className="text-label-caps text-[var(--color-on-surface-variant)] mt-1 block">
                      {emp.email}
                    </span>
                  </td>

                  {/* Role */}
                  <td>
                    <span className="inline-flex items-center text-xs font-semibold text-[var(--color-on-surface-variant)] bg-[var(--color-surface-container-low)] px-2.5 py-1 rounded-[var(--radius-md)] border border-[var(--color-outline-variant)]">
                      <span className="material-symbols-outlined text-[14px] mr-1">shield</span>
                      {emp.role}
                    </span>
                  </td>

                  {/* Phone */}
                  <td>
                    <span className="font-data-tabular text-body-md text-[var(--color-on-surface-variant)] flex items-center">
                      <span className="material-symbols-outlined text-[14px] mr-1">call</span>
                      {emp.phone}
                    </span>
                  </td>

                  {/* Task Count */}
                  <td>
                    <div className="flex items-center space-x-2">
                      <span className="font-data-tabular text-body-md font-bold text-[var(--color-on-surface)]">
                        {getActiveTaskCount(emp.initials)}
                      </span>
                      <span className="text-label-caps text-[var(--color-on-surface-variant)]">
                        active tasks
                      </span>
                    </div>
                  </td>

                  {/* Status */}
                  <td>
                    <span className={getStatusBadgeClass(emp.status)}>
                      {emp.status}
                    </span>
                  </td>

                  {/* Performance */}
                  <td style={{ textAlign: "right" }}>
                    <div className="flex items-center justify-end space-x-1">
                      <span className="material-symbols-outlined text-[16px] text-amber-500" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                      <span className="font-data-tabular text-body-md font-bold text-[var(--color-on-surface)]">{emp.rating}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
