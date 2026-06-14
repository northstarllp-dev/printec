import { EnquiriesViewNew } from "@/app/components/EnquiriesViewNew";
import { getEnquiries } from "@/app/actions/enquiryActions";
import { getCustomers } from "@/app/actions/customerActions";

export default async function EnquirePage() {
  const enquiries = await getEnquiries();
  const customers = await getCustomers();
  
  const mappedEnquiries = enquiries?.map(e => ({
    id: e.id,
    dateReceived: e.date_received,
    leadName: e.lead_name,
    phone: e.phone,
    whatsapp: e.whatsapp,
    email: e.email,
    source: e.source,
    status: e.status,
    notes: e.notes,
    primaryCommunicationMode: e.primary_communication_mode,
    location: e.location
  })) || [];

  const mappedCustomers = customers?.map(c => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    whatsapp: c.whatsapp,
    email: c.email
  })) || [];

  return <EnquiriesViewNew initialEnquiries={mappedEnquiries} initialCustomers={mappedCustomers} />;
}
