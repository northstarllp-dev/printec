import React from "react";
import { redirect } from "next/navigation";
import { getOrderById } from "@/app/actions/orderActions";
import { getCustomers } from "@/app/actions/customerActions";
import { getEmployees } from "@/app/actions/employeeActions";
import { getCurrentUser } from "@/app/actions/authActions";
import { OrderDetailPageClient } from "@/app/admin/orders/[id]/OrderDetailPageClient";

export default async function StaffOrderDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const profile = await getCurrentUser();
  if (!profile || profile.role !== "staff") {
    redirect("/staff/login");
  }

  const order = await getOrderById(id);
  if (!order) {
    redirect("/staff/orders");
  }

  const customersData = await getCustomers();
  const employeesData = await getEmployees();

  const mappedOrder = {
    id: order.id,
    projectName: order.project_name,
    customerId: order.customer_id,
    stage: order.stage,
    budget: order.budget,
    depositPaid: order.deposit_paid,
    dimensions: order.dimensions,
    notes: order.notes,
    urgent: order.urgent,
    assignedEmployees: order.assigned_employees || [],
    assignedDesigners: order.assigned_designers || [],
    assignedMarketers: order.assigned_marketers || [],
    dateCreated: order.date_created,
    deadlineStatus: order.deadline_status,
    imageMockup: order.image_mockup,
    versionHistory: order.version_history || [],
    chatHistory: order.chat_history || [],
    siteVisitDetails: order.site_visit_details,
    quoteDetails: order.quote_details,
    designDetails: order.design_details,
    productionDetails: order.production_details,
    installationDetails: order.installation_details,
    stageStatus: order.stage_status,
    stageAdminNotes: order.stage_admin_notes,
    customerName: order.customer_name || "",
    orderCode: order.order_id || order.id,
    orderId: order.order_id || order.id
  };

  const mappedCustomers = customersData?.map(c => ({
    id: c.id,
    name: c.name,
    phone: c.phone || "",
    whatsapp: c.whatsapp || "",
    email: c.email || "",
    billingAddress: c.billing_address || "",
    shippingAddress: c.shipping_address || "",
    status: c.status || "Active",
    customerCode: c.customer_id || c.id,
    customerId: c.customer_id || c.id
  })) || [];

  const mappedEmployees = employeesData?.map(e => ({
    id: e.id,
    name: e.name,
    role: e.staff_role || "",
    phone: e.phone || "",
    email: e.email || "",
    status: e.status || "Active",
    rating: Number(e.rating) || 5.0,
    workload: Number(e.workload) || 0
  })) || [];

  const currentEmployee = mappedEmployees.find(e => e.id === profile.id) || {
    id: profile.id,
    name: profile.name,
    role: profile.staff_role || "Field Agent",
    phone: profile.phone || "",
    email: profile.email || "",
    status: profile.status || "Active",
    rating: Number(profile.rating) || 5.0,
    workload: Number(profile.workload) || 0
  };

  return (
    <OrderDetailPageClient 
      order={mappedOrder}
      customers={mappedCustomers}
      employees={mappedEmployees}
      role="Employee"
      currentEmployee={currentEmployee}
    />
  );
}
