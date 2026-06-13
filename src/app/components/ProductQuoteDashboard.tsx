"use client";

import React, { useState } from "react";
import { ChevronRight, Package, Plus, Eye } from "lucide-react";

interface ProductQuote {
  id: string;
  name: string;
  quantity: number;
  price: number;
  leadTime: string;
  status: "available" | "custom" | "pending";
}

interface ProjectDetail {
  title: string;
  status: "draft" | "active" | "completed";
  totalAmount: number;
  products: ProductQuote[];
}

const mockProducts: ProductQuote[] = [
  {
    id: "1",
    name: "ACP Panels",
    quantity: 12,
    price: 5800,
    leadTime: "5 Working Days",
    status: "available",
  },
  {
    id: "2",
    name: "LED Letters",
    quantity: 8,
    price: 1280,
    leadTime: "7-10 Working Days",
    status: "available",
  },
  {
    id: "3",
    name: "Vinyl Graphics",
    quantity: 3,
    price: 450,
    leadTime: "3-5 Working Days",
    status: "available",
  },
];

export function ProductQuoteDashboard() {
  const [selectedProducts, setSelectedProducts] = useState<ProductQuote[]>([
    mockProducts[0],
    mockProducts[1],
    mockProducts[2],
  ]);

  const totalAmount = selectedProducts.reduce(
    (sum, p) => sum + p.price * p.quantity,
    0
  );

  const removeProduct = (id: string) => {
    setSelectedProducts(selectedProducts.filter((p) => p.id !== id));
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 400px",
        gap: "24px",
        padding: "32px",
        background: "#f8fafc",
        minHeight: "100vh",
      }}
    >
      {/* Left: Product Selection */}
      <div>
        <div style={{ marginBottom: "24px" }}>
          <h1
            style={{
              fontSize: "28px",
              fontWeight: "800",
              color: "#0f172a",
              margin: "0 0 8px",
            }}
          >
            Product Quote Creation
          </h1>
          <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
            Define and scope specifications for the required fabrication
          </p>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: "flex",
            gap: "16px",
            marginBottom: "24px",
            borderBottom: "1px solid #e2e8f0",
          }}
        >
          {["Browse", "My Templates", "Recent"].map((tab) => (
            <button
              key={tab}
              style={{
                padding: "12px 16px",
                background: "none",
                border: "none",
                borderBottom: tab === "Browse" ? "3px solid #018F10" : "none",
                color: tab === "Browse" ? "#018F10" : "#64748b",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: "600",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                if (tab !== "Browse") {
                  e.currentTarget.style.color = "#0f172a";
                }
              }}
              onMouseLeave={(e) => {
                if (tab !== "Browse") {
                  e.currentTarget.style.color = "#64748b";
                }
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "16px",
          }}
        >
          {mockProducts.map((product) => {
            const isSelected = selectedProducts.some((p) => p.id === product.id);
            return (
              <div
                key={product.id}
                style={{
                  background: "white",
                  border: `2px solid ${isSelected ? "#018F10" : "#e2e8f0"}`,
                  borderRadius: "12px",
                  padding: "20px",
                  cursor: "pointer",
                  transition: "all 0.3s",
                  position: "relative",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
                onClick={() => {
                  if (isSelected) {
                    removeProduct(product.id);
                  } else {
                    setSelectedProducts([...selectedProducts, product]);
                  }
                }}
              >
                {/* Status Badge */}
                <div
                  style={{
                    position: "absolute",
                    top: "12px",
                    right: "12px",
                    padding: "4px 10px",
                    background: "#dcfce7",
                    color: "#16a34a",
                    borderRadius: "6px",
                    fontSize: "10px",
                    fontWeight: "700",
                    textTransform: "uppercase",
                  }}
                >
                  {product.status}
                </div>

                {/* Icon */}
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    background: "#f1f5f9",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "12px",
                  }}
                >
                  <Package size={24} color="#018F10" />
                </div>

                {/* Product Name */}
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#0f172a",
                    marginBottom: "8px",
                  }}
                >
                  {product.name}
                </div>

                {/* Details */}
                <div
                  style={{
                    fontSize: "12px",
                    color: "#64748b",
                    marginBottom: "12px",
                    lineHeight: "1.5",
                  }}
                >
                  <div>Quantity: {product.quantity}</div>
                  <div>Price: ₹{product.price.toLocaleString()}</div>
                  <div>Lead Time: {product.leadTime}</div>
                </div>

                {/* Selection Indicator */}
                <div
                  style={{
                    width: "20px",
                    height: "20px",
                    borderRadius: "4px",
                    border: `2px solid ${isSelected ? "#018F10" : "#cbd5e1"}`,
                    background: isSelected ? "#018F10" : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {isSelected && (
                    <span style={{ color: "white", fontSize: "12px" }}>✓</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right: Quote Summary */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          height: "fit-content",
          position: "sticky",
          top: "20px",
        }}
      >
        {/* Summary Card */}
        <div
          style={{
            background: "white",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            padding: "20px",
          }}
        >
          <div
            style={{
              fontSize: "13px",
              fontWeight: "700",
              color: "#64748b",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: "12px",
            }}
          >
            Quote Summary
          </div>

          {/* Selected Products List */}
          <div style={{ marginBottom: "16px" }}>
            {selectedProducts.length === 0 ? (
              <div
                style={{
                  fontSize: "12px",
                  color: "#94a3b8",
                  padding: "16px",
                  background: "#f8fafc",
                  borderRadius: "8px",
                  textAlign: "center",
                }}
              >
                No products selected
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {selectedProducts.map((product) => (
                  <div
                    key={product.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "10px",
                      background: "#f8fafc",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontWeight: "600",
                          color: "#0f172a",
                          marginBottom: "2px",
                        }}
                      >
                        {product.name}
                      </div>
                      <div style={{ color: "#64748b", fontSize: "11px" }}>
                        ₹{product.price.toLocaleString()} x {product.quantity}
                      </div>
                    </div>
                    <button
                      onClick={() => removeProduct(product.id)}
                      style={{
                        background: "#fee2e2",
                        color: "#dc2626",
                        border: "none",
                        borderRadius: "4px",
                        padding: "4px 8px",
                        cursor: "pointer",
                        fontSize: "11px",
                        fontWeight: "600",
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Technical Specifications */}
          <div
            style={{
              borderTop: "1px solid #e2e8f0",
              paddingTop: "16px",
              marginBottom: "16px",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                fontWeight: "700",
                color: "#64748b",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: "10px",
              }}
            >
              Technical Specifications
            </div>
            <div
              style={{
                fontSize: "12px",
                color: "#0f172a",
                lineHeight: "1.6",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748b" }}>Total Units:</span>
                <span style={{ fontWeight: "600" }}>
                  {selectedProducts.reduce((sum, p) => sum + p.quantity, 0)}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748b" }}>Lead Time:</span>
                <span style={{ fontWeight: "600" }}>5-10 Days</span>
              </div>
            </div>
          </div>

          {/* Total */}
          <div
            style={{
              background: "#018F10",
              color: "white",
              padding: "16px",
              borderRadius: "8px",
              marginBottom: "12px",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                fontWeight: "700",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: "4px",
              }}
            >
              Grand Total
            </div>
            <div style={{ fontSize: "24px", fontWeight: "800" }}>
              ₹{totalAmount.toLocaleString()}
            </div>
          </div>

          {/* Buttons */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <button
              style={{
                width: "100%",
                padding: "12px",
                background: "#018F10",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: "700",
                cursor: "pointer",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#01730c";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#018F10";
              }}
            >
              <Plus size={16} /> Send to Customer
            </button>
            <button
              style={{
                width: "100%",
                padding: "12px",
                background: "#f1f5f9",
                color: "#475569",
                border: "1px solid #cbd5e1",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: "700",
                cursor: "pointer",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#e2e8f0";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#f1f5f9";
              }}
            >
              <Eye size={16} /> Preview
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
