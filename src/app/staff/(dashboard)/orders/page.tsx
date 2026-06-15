import { OrdersManagementDashboard } from "@/features/orders/components/OrdersManagementDashboard";
import { getOrders } from "@/features/orders/actions/orderActions";
import { getCustomers } from "@/features/customers/actions/customerActions";
import { getEnquiries } from "@/features/enquiries/actions/enquiryActions";
import { getUserSession } from "@/features/auth/actions/authActions";
import { getEmployees } from "@/features/employees/actions/employeeActions";

export default async function StaffOrdersPage() {
  const orders = await getOrders();
  const customers = await getCustomers();
  const enquiries = await getEnquiries();
  const user = await getUserSession();
  const employeesData = await getEmployees();
  
  // Find current employee info
  const currentEmployee = employeesData?.find(e => e.id === user?.id);
  
  const mappedOrders = orders?.map(o => ({
    id: o.id,
    projectName: o.project_name,
    customerId: o.customer_id,
    stage: o.stage,
    budget: o.budget,
    depositPaid: o.deposit_paid,
    dimensions: o.dimensions,
    notes: o.notes,
    urgent: o.urgent,
    assignedEmployees: o.assigned_employees || [],
    dateCreated: o.date_created,
    deadlineStatus: o.deadline_status,
    customerName: o.customer_name || "",
    orderCode: o.order_id || o.id,
    orderId: o.order_id || o.id
  })) || [];

  const mappedCustomers = customers?.map(c => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    customerCode: c.customer_id || c.id,
    customerId: c.customer_id || c.id
  })) || [];

  const mappedEmployees = employeesData?.map(e => ({
    id: e.id,
    name: e.name,
    role: e.staff_role,
    email: e.email
  })) || [];

  const mappedEnquiries = enquiries?.map(e => ({
    id: e.id,
    source: e.source,
    status: e.status
  })) || [];

  return (
    <OrdersManagementDashboard 
      initialOrders={mappedOrders}
      initialCustomers={mappedCustomers}
      initialEmployees={mappedEmployees}
      initialEnquiries={mappedEnquiries}
      userRole="Employee"
      currentEmployeeName={currentEmployee?.name || ""}
    />
  );
}
