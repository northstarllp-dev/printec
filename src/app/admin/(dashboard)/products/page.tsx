import { getProducts } from "@/features/products/actions/productActions";
import { ProductsView } from "@/features/products/components/ProductsView";

export default async function ProductsPage() {
  const data = await getProducts().catch(() => []);

  const products = (data || []).map((p: any) => ({
    id: p.id,
    product_id: p.product_id,
    name: p.name,
    description: p.description ?? null,
    category: p.category ?? null,
    pricing_type: p.pricing_type,
    is_active: p.is_active,
    created_at: p.created_at,
    price_per_sqft: p.price_per_sqft != null ? Number(p.price_per_sqft) : null,
    price_per_unit: p.price_per_unit != null ? Number(p.price_per_unit) : null,
    price_per_running_ft: p.price_per_running_ft != null ? Number(p.price_per_running_ft) : null,
    images: Array.isArray(p.images) ? p.images : [],
  }));

  return <ProductsView initialProducts={products} />;
}
