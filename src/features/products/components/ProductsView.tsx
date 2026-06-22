"use client";

import React, { useState, useTransition } from "react";
import {
  Search,
  Plus,
  X,
  Pencil,
  Trash2,
  Package,
  ToggleLeft,
  ToggleRight,
  ChevronDown,
  Tag,
  Ruler,
  Hash,
} from "lucide-react";
import {
  createProduct,
  updateProduct,
  deleteProduct,
} from "../actions/productActions";

type PricingType = "per_unit" | "per_sqft";

interface Product {
  id: string;
  product_id: string;
  name: string;
  description: string | null;
  category: string | null;
  pricing_type: PricingType;
  unit_price: number;
  unit: string;
  is_active: boolean;
  created_at: string;
}

const CATEGORIES = [
  "Flex Banner",
  "ACP Board",
  "LED Signage",
  "Acrylic Letters",
  "Vinyl Wrap",
  "Glow Sign",
  "Metal Sign",
  "Wooden Sign",
  "Other",
];

const PRICING_UNIT_MAP: Record<PricingType, string> = {
  per_unit: "nos",
  per_sqft: "sq ft",
};

function generateProductId(existing: Product[]): string {
  const maxNum = existing.reduce((max, p) => {
    const match = p.product_id?.match(/^PRD-(\d+)$/);
    if (match) return Math.max(max, parseInt(match[1], 10));
    return max;
  }, 0);
  return `PRD-${String(maxNum + 1).padStart(3, "0")}`;
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #e2e8f0",
  borderRadius: "8px",
  fontSize: "13px",
  fontFamily: "inherit",
  outline: "none",
  transition: "border-color 0.15s, box-shadow 0.15s",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: "700",
  color: "#374151",
  marginBottom: "5px",
  display: "block",
  letterSpacing: "0.02em",
};

// ── Drawer ──────────────────────────────────────────────────────────────────

function ProductDrawer({
  open,
  onClose,
  editProduct,
  existingProducts,
}: {
  open: boolean;
  onClose: () => void;
  editProduct: Product | null;
  existingProducts: Product[];
}) {
  const isEdit = !!editProduct;
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    product_id: editProduct?.product_id ?? generateProductId(existingProducts),
    name: editProduct?.name ?? "",
    description: editProduct?.description ?? "",
    category: editProduct?.category ?? "",
    pricing_type: (editProduct?.pricing_type ?? "per_unit") as PricingType,
    unit_price: editProduct?.unit_price?.toString() ?? "",
    unit: editProduct?.unit ?? "nos",
  });

  // Sync unit when pricing_type changes
  const setPricingType = (pt: PricingType) => {
    setForm((f) => ({ ...f, pricing_type: pt, unit: PRICING_UNIT_MAP[pt] }));
  };

  React.useEffect(() => {
    if (open) {
      setError("");
      setForm({
        product_id: editProduct?.product_id ?? generateProductId(existingProducts),
        name: editProduct?.name ?? "",
        description: editProduct?.description ?? "",
        category: editProduct?.category ?? "",
        pricing_type: (editProduct?.pricing_type ?? "per_unit") as PricingType,
        unit_price: editProduct?.unit_price?.toString() ?? "",
        unit: editProduct?.unit ?? "nos",
      });
    }
  }, [open, editProduct]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) { setError("Product name is required."); return; }
    if (!form.product_id.trim()) { setError("Product ID is required."); return; }
    const price = parseFloat(form.unit_price);
    if (isNaN(price) || price < 0) { setError("Enter a valid price."); return; }

    startTransition(async () => {
      try {
        if (isEdit && editProduct) {
          await updateProduct(editProduct.id, {
            name: form.name.trim(),
            description: form.description.trim() || undefined,
            category: form.category || undefined,
            pricing_type: form.pricing_type,
            unit_price: price,
            unit: form.unit.trim(),
          });
        } else {
          await createProduct({
            product_id: form.product_id.trim(),
            name: form.name.trim(),
            description: form.description.trim() || undefined,
            category: form.category || undefined,
            pricing_type: form.pricing_type,
            unit_price: price,
            unit: form.unit.trim(),
          });
        }
        onClose();
      } catch (err: any) {
        setError(err.message || "Something went wrong.");
      }
    });
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)",
          zIndex: 100, backdropFilter: "blur(2px)",
        }}
      />
      {/* Panel */}
      <div
        style={{
          position: "fixed", top: 0, right: 0, bottom: 0,
          width: "420px", background: "white",
          boxShadow: "-8px 0 40px rgba(0,0,0,0.15)",
          zIndex: 101, display: "flex", flexDirection: "column",
          animation: "slideInRight 0.25s ease",
        }}
      >
        {/* Header */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: "17px", fontWeight: "800", color: "#0f172a" }}>
              {isEdit ? "Edit Product" : "Add New Product"}
            </div>
            <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
              {isEdit ? `Editing ${editProduct?.product_id}` : "Fill in the details below"}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ width: 32, height: 32, borderRadius: "8px", border: "1px solid #e2e8f0", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#64748b" }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form id="products-drawer-form" onSubmit={handleSubmit} style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "18px" }}>
          {error && (
            <div style={{ padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", fontSize: "13px", color: "#dc2626", fontWeight: "600" }}>
              {error}
            </div>
          )}

          {/* Product ID */}
          <div>
            <label style={labelStyle}>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <Hash size={12} /> PRODUCT ID
              </span>
            </label>
            <input
              id="product-id"
              style={{ ...inputStyle, background: isEdit ? "#f8fafc" : "white", color: isEdit ? "#64748b" : "#0f172a", fontFamily: "monospace", fontWeight: 700 }}
              value={form.product_id}
              onChange={e => setForm(f => ({ ...f, product_id: e.target.value }))}
              readOnly={isEdit}
              placeholder="PRD-001"
            />
            {!isEdit && (
              <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px" }}>Auto-generated. You can customize it.</div>
            )}
          </div>

          {/* Product Name */}
          <div>
            <label style={labelStyle}>PRODUCT NAME *</label>
            <input
              id="product-name"
              style={inputStyle}
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Flex Banner (Outdoor)"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label style={labelStyle}>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <Tag size={12} /> CATEGORY
              </span>
            </label>
            <div style={{ position: "relative" }}>
              <select
                id="product-category"
                style={{ ...inputStyle, appearance: "none", paddingRight: "36px", cursor: "pointer" }}
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              >
                <option value="">Select category…</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown size={14} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }} />
            </div>
          </div>

          {/* Pricing Type */}
          <div>
            <label style={labelStyle}>PRICING TYPE *</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              {(["per_unit", "per_sqft"] as PricingType[]).map(pt => (
                <button
                  key={pt}
                  type="button"
                  onClick={() => setPricingType(pt)}
                  style={{
                    padding: "12px",
                    borderRadius: "10px",
                    border: `2px solid ${form.pricing_type === pt ? "var(--color-primary, #0f172a)" : "#e2e8f0"}`,
                    background: form.pricing_type === pt ? "#f1f5f9" : "white",
                    cursor: "pointer",
                    transition: "all 0.15s",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: "20px", marginBottom: "4px" }}>{pt === "per_unit" ? "🔢" : "📐"}</div>
                  <div style={{ fontSize: "12px", fontWeight: "700", color: form.pricing_type === pt ? "#0f172a" : "#64748b" }}>
                    {pt === "per_unit" ? "Per Unit (nos)" : "Per Sq Ft"}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Price */}
          <div>
            <label style={labelStyle}>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <Ruler size={12} /> PRICE (₹ per {PRICING_UNIT_MAP[form.pricing_type]}) *
              </span>
            </label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: "13px", color: "#64748b", fontWeight: "700" }}>₹</span>
              <input
                id="product-price"
                type="number"
                min="0"
                step="0.01"
                style={{ ...inputStyle, paddingLeft: "28px" }}
                value={form.unit_price}
                onChange={e => setForm(f => ({ ...f, unit_price: e.target.value }))}
                placeholder="0.00"
                required
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>DESCRIPTION / NOTES</label>
            <textarea
              id="product-description"
              style={{ ...inputStyle, resize: "vertical", minHeight: "80px" }}
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Optional notes about this product…"
            />
          </div>
        </form>

        {/* Footer */}
        <div style={{ padding: "16px 24px", borderTop: "1px solid #e2e8f0", display: "flex", gap: "10px", flexShrink: 0 }}>
          <button
            type="button"
            onClick={onClose}
            style={{ flex: 1, padding: "11px", borderRadius: "8px", border: "1px solid #e2e8f0", background: "white", fontSize: "13px", fontWeight: "600", color: "#64748b", cursor: "pointer" }}
          >
            Cancel
          </button>
          <button
            form="products-drawer-form"
            type="submit"
            disabled={isPending}
            style={{
              flex: 2, padding: "11px", borderRadius: "8px", border: "none",
              background: isPending ? "#94a3b8" : "var(--color-primary, #0f172a)",
              color: "white", fontSize: "13px", fontWeight: "700", cursor: isPending ? "not-allowed" : "pointer",
              transition: "background 0.15s",
            }}
          >
            {isPending ? "Saving…" : isEdit ? "Save Changes" : "Add Product"}
          </button>
        </div>
        <style>{`
          @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
        `}</style>
      </div>
    </>
  );
}

// ── Main View ────────────────────────────────────────────────────────────────

export function ProductsView({ initialProducts }: { initialProducts: Product[] }) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const openAdd = () => { setEditProduct(null); setDrawerOpen(true); };
  const openEdit = (p: Product) => { setEditProduct(p); setDrawerOpen(true); };
  const closeDrawer = () => { setDrawerOpen(false); setEditProduct(null); };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      await deleteProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
      setDeleteConfirm(null);
    });
  };

  const handleToggleActive = (p: Product) => {
    startTransition(async () => {
      await updateProduct(p.id, { is_active: !p.is_active });
      setProducts(prev => prev.map(x => x.id === p.id ? { ...x, is_active: !x.is_active } : x));
    });
  };

  const categories = ["All", ...Array.from(new Set(products.map(p => p.category).filter(Boolean) as string[]))];

  const filtered = products.filter(p => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.product_id.toLowerCase().includes(search.toLowerCase()) ||
      (p.category ?? "").toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCategory === "All" || p.category === filterCategory;
    return matchSearch && matchCat;
  });

  const totalActive = products.filter(p => p.is_active).length;
  const perUnitCount = products.filter(p => p.pricing_type === "per_unit").length;
  const perSqftCount = products.filter(p => p.pricing_type === "per_sqft").length;

  const stats = [
    { label: "TOTAL PRODUCTS", value: products.length.toString(), color: "var(--color-primary, #0f172a)", icon: Package },
    { label: "ACTIVE", value: totalActive.toString(), color: "#22c55e", icon: ToggleRight },
    { label: "PRICED PER UNIT", value: perUnitCount.toString(), color: "#3b82f6", icon: Hash },
    { label: "PRICED PER SQ FT", value: perSqftCount.toString(), color: "#f59e0b", icon: Ruler },
  ];

  return (
    <div style={{ padding: "32px", background: "#f8fafc", minHeight: "100vh" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a", margin: "0 0 6px" }}>
            Products Catalogue
          </h1>
          <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
            Manage signage products, categories, and pricing
          </p>
        </div>
        <button
          id="add-product-btn"
          onClick={openAdd}
          style={{
            display: "flex", alignItems: "center", gap: "8px",
            padding: "10px 18px", background: "var(--color-primary, #0f172a)",
            color: "white", border: "none", borderRadius: "10px",
            fontSize: "13px", fontWeight: "700", cursor: "pointer",
            transition: "opacity 0.15s", boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.85"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
        >
          <Plus size={16} /> Add Product
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "28px" }}>
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                <span style={{ fontSize: "11px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</span>
                <div style={{ width: "32px", height: "32px", background: `${s.color}18`, borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon size={16} style={{ color: s.color }} />
                </div>
              </div>
              <div style={{ fontSize: "30px", fontWeight: "800", color: "#0f172a" }}>{s.value}</div>
            </div>
          );
        })}
      </div>

      {/* Table Card */}
      <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "12px", overflow: "hidden" }}>

        {/* Toolbar */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0", display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: "200px", position: "relative" }}>
            <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
            <input
              type="text"
              placeholder="Search by name, ID, or category…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: "100%", padding: "9px 12px 9px 36px",
                border: "1px solid #e2e8f0", borderRadius: "8px",
                fontSize: "13px", fontFamily: "inherit", outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
          <div style={{ position: "relative" }}>
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              style={{
                padding: "9px 32px 9px 12px", border: "1px solid #e2e8f0",
                borderRadius: "8px", fontSize: "13px", fontFamily: "inherit",
                outline: "none", appearance: "none", cursor: "pointer", background: "white",
              }}
            >
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <ChevronDown size={13} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }} />
          </div>
          <div style={{ fontSize: "12px", color: "#94a3b8", whiteSpace: "nowrap" }}>
            {filtered.length} product{filtered.length !== 1 ? "s" : ""}
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                {["PRODUCT ID", "NAME", "CATEGORY", "PRICING TYPE", "UNIT PRICE", "STATUS", "ACTIONS"].map(col => (
                  <th key={col} style={{ padding: "12px 20px", textAlign: col === "ACTIONS" ? "center" : "left", fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: "60px 20px", textAlign: "center", color: "#94a3b8" }}>
                    <Package size={36} style={{ color: "#e2e8f0", marginBottom: "12px", display: "block", margin: "0 auto 12px" }} />
                    <div style={{ fontSize: "14px", fontWeight: "600" }}>No products found</div>
                    <div style={{ fontSize: "12px", marginTop: "4px" }}>Add your first product using the button above.</div>
                  </td>
                </tr>
              ) : filtered.map(p => (
                <tr
                  key={p.id}
                  style={{ borderBottom: "1px solid #f1f5f9", transition: "background 0.15s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = "#f8fafc"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = "transparent"; }}
                >
                  {/* Product ID */}
                  <td style={{ padding: "14px 20px", whiteSpace: "nowrap" }}>
                    <span style={{
                      fontFamily: "monospace", fontSize: "12px", fontWeight: "700",
                      color: "#0f172a", background: "#f1f5f9", padding: "3px 8px",
                      borderRadius: "5px", border: "1px solid #e2e8f0",
                    }}>
                      {p.product_id}
                    </span>
                  </td>

                  {/* Name */}
                  <td style={{ padding: "14px 20px" }}>
                    <div style={{ fontSize: "13px", fontWeight: "700", color: "#0f172a" }}>{p.name}</div>
                    {p.description && (
                      <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px", maxWidth: "220px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {p.description}
                      </div>
                    )}
                  </td>

                  {/* Category */}
                  <td style={{ padding: "14px 20px" }}>
                    {p.category ? (
                      <span style={{
                        padding: "3px 10px", background: "#eff6ff", color: "#2563eb",
                        borderRadius: "99px", fontSize: "11px", fontWeight: "700",
                        border: "1px solid #bfdbfe", whiteSpace: "nowrap",
                      }}>
                        {p.category}
                      </span>
                    ) : (
                      <span style={{ fontSize: "12px", color: "#cbd5e1" }}>—</span>
                    )}
                  </td>

                  {/* Pricing Type */}
                  <td style={{ padding: "14px 20px", whiteSpace: "nowrap" }}>
                    <span style={{
                      padding: "3px 10px", borderRadius: "99px", fontSize: "11px", fontWeight: "700",
                      background: p.pricing_type === "per_sqft" ? "#fefce8" : "#f0fdf4",
                      color: p.pricing_type === "per_sqft" ? "#854d0e" : "#166534",
                      border: `1px solid ${p.pricing_type === "per_sqft" ? "#fde68a" : "#bbf7d0"}`,
                    }}>
                      {p.pricing_type === "per_sqft" ? "📐 Per Sq Ft" : "🔢 Per Unit"}
                    </span>
                  </td>

                  {/* Unit Price */}
                  <td style={{ padding: "14px 20px", whiteSpace: "nowrap" }}>
                    <span style={{ fontSize: "14px", fontWeight: "800", color: "#0f172a" }}>
                      ₹{Number(p.unit_price).toLocaleString("en-IN")}
                    </span>
                    <span style={{ fontSize: "11px", color: "#94a3b8", marginLeft: "4px" }}>
                      / {p.unit}
                    </span>
                  </td>

                  {/* Status */}
                  <td style={{ padding: "14px 20px" }}>
                    <button
                      onClick={() => handleToggleActive(p)}
                      disabled={isPending}
                      title={p.is_active ? "Click to deactivate" : "Click to activate"}
                      style={{
                        display: "flex", alignItems: "center", gap: "6px",
                        padding: "4px 10px", borderRadius: "99px", fontSize: "11px", fontWeight: "700",
                        border: `1px solid ${p.is_active ? "#bbf7d0" : "#e2e8f0"}`,
                        background: p.is_active ? "#f0fdf4" : "#f8fafc",
                        color: p.is_active ? "#16a34a" : "#94a3b8",
                        cursor: "pointer", transition: "all 0.15s",
                      }}
                    >
                      {p.is_active
                        ? <><ToggleRight size={13} /> Active</>
                        : <><ToggleLeft size={13} /> Inactive</>
                      }
                    </button>
                  </td>

                  {/* Actions */}
                  <td style={{ padding: "14px 20px", textAlign: "center" }}>
                    <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                      <button
                        onClick={() => openEdit(p)}
                        title="Edit"
                        style={{
                          width: 30, height: 30, borderRadius: "7px", border: "1px solid #e2e8f0",
                          background: "white", display: "flex", alignItems: "center", justifyContent: "center",
                          cursor: "pointer", color: "#64748b", transition: "all 0.15s",
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#3b82f6"; (e.currentTarget as HTMLButtonElement).style.color = "#3b82f6"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#e2e8f0"; (e.currentTarget as HTMLButtonElement).style.color = "#64748b"; }}
                      >
                        <Pencil size={13} />
                      </button>
                      {deleteConfirm === p.id ? (
                        <div style={{ display: "flex", gap: "4px" }}>
                          <button
                            onClick={() => handleDelete(p.id)}
                            style={{
                              padding: "4px 10px", borderRadius: "6px", border: "none",
                              background: "#ef4444", color: "white", fontSize: "11px",
                              fontWeight: "700", cursor: "pointer",
                            }}
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            style={{
                              padding: "4px 8px", borderRadius: "6px", border: "1px solid #e2e8f0",
                              background: "white", fontSize: "11px", fontWeight: "700",
                              color: "#64748b", cursor: "pointer",
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(p.id)}
                          title="Delete"
                          style={{
                            width: 30, height: 30, borderRadius: "7px", border: "1px solid #e2e8f0",
                            background: "white", display: "flex", alignItems: "center", justifyContent: "center",
                            cursor: "pointer", color: "#64748b", transition: "all 0.15s",
                          }}
                          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#ef4444"; (e.currentTarget as HTMLButtonElement).style.color = "#ef4444"; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#e2e8f0"; (e.currentTarget as HTMLButtonElement).style.color = "#64748b"; }}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer */}
      <ProductDrawer
        open={drawerOpen}
        onClose={() => { closeDrawer(); window.location.reload(); }}
        editProduct={editProduct}
        existingProducts={products}
      />
    </div>
  );
}
