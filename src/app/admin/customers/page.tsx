import { CustomersViewNew } from "@/app/components/CustomersViewNew";
import { getCustomers } from "@/app/actions/customerActions";

export default async function CustomersPage() {
  const customers = await getCustomers();
  
  const mappedCustomers = customers?.map(c => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    whatsapp: c.whatsapp,
    email: c.email,
    city: c.city || "",
    billingAddress: c.billing_address || "",
    shippingAddress: c.shipping_address || "",
    status: c.status || "Active"
  })) || [];

  return <CustomersViewNew initialCustomers={mappedCustomers} />;
}
