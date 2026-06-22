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
    unit_price: Number(p.unit_price),
    unit: p.unit,
    is_active: p.is_active,
    created_at: p.created_at,
  }));

  return <ProductsView initialProducts={products} />;
}
