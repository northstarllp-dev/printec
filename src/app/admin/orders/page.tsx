import { OrdersManagementDashboard } from "@/app/components/OrdersManagementDashboard";
import { getOrders } from "@/app/actions/orderActions";
import { getCustomers } from "@/app/actions/customerActions";
import { getEnquiries } from "@/app/actions/enquiryActions";
import { getUserSession } from "@/app/actions/authActions";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export default async function OrdersPage() {
  // Fetch data on the server
  const orders = await getOrders();
  const customers = await getCustomers();
  const enquiries = await getEnquiries();
  const user = await getUserSession();
  
  // We need to fetch employees manually here since we don't have an employeeAction yet
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll() {}
      }
    }
  );
  
  const { data: employeesData } = await supabase.from("users").select("*").eq("role", "staff");
  
  // Map database structures to frontend structures
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
    customerName: o.customer_name || ""
  })) || [];

  const mappedCustomers = customers?.map(c => ({
    id: c.id,
    name: c.name,
    phone: c.phone
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
      userRole="Admin"
      currentEmployeeName=""
    />
  );
}
