import { CustomersViewNew } from "@/app/components/CustomersViewNew";
import { getCustomers } from "@/app/actions/customerActions";
import { getOrders } from "@/app/actions/orderActions";

export default async function CustomersPage() {
  const customers = await getCustomers();
  const orders = await getOrders();
  
  const mappedCustomers = customers?.map(c => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    whatsapp: c.whatsapp,
    email: c.email,
    city: c.city || "",
    billingAddress: c.billing_address || "",
    shippingAddress: c.shipping_address || "",
    status: c.status || "Active",
    customerCode: c.customer_id || c.id,
    customerId: c.customer_id || c.id
  })) || [];

  const mappedOrders = orders?.map(o => ({
    id: o.id,
    projectName: o.project_name,
    customerId: o.customer_id,
    stage: o.stage,
    health: o.health || "Active",
    budget: o.budget || 0,
    dateCreated: o.date_created,
    orderCode: o.order_id || o.id,
    orderId: o.order_id || o.id
  })) || [];

  return <CustomersViewNew initialCustomers={mappedCustomers} initialOrders={mappedOrders} />;
}
