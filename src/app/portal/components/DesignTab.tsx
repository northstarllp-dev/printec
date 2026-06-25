"use client";

import React, { useState } from "react";
import {
  UploadCloud,
  FileCheck,
  CheckCircle,
  Layout,
  ZoomOut,
  ZoomIn,
  Loader2
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";

interface Customer {
  id: string;
  name: string;
  phone: string;
  whatsapp: string;
  email: string;
  city?: string;
  billingAddress: string;
  shippingAddress: string;
  status?: string;
  customerCode?: string;
  customerId?: string;
}

interface Order {
  id: string;
  orderId?: string;
  designDetails?: any;
  [key: string]: any;
}

export interface DesignTabProps {
  order: Order;
  customer: Customer;
}

export function DesignTab({ order, customer }: DesignTabProps) {
  const dd = order.designDetails || { resources: [], versions: [], currentVersion: 0 };
  const [zoomLevel, setZoomLevel] = useState(100);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [commentingOn, setCommentingOn] = useState<{x: number, y: number} | null>(null);
  const [commentText, setCommentText] = useState("");
  const supabase = createClient();

  const activeVersion = (dd.versions || []).find((v: any) => v.id === selectedVersionId) || (dd.versions || [])[(dd.versions || []).length - 1];

  const handleResourceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${order.id}/resources/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("site-visit-photos").upload(path, file, { contentType: file.type });
      if (error) throw error;
      const { data } = supabase.storage.from("site-visit-photos").getPublicUrl(path);
      
      const newResource = {
        id: (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36),
        url: data.publicUrl,
        name: file.name,
        type: "file",
        uploadedBy: "Customer",
        createdAt: new Date().toISOString()
      };
      const updatedDetails = { ...dd, resources: [...(dd.resources || []), newResource] };
      const { error: updateError } = await supabase.from("orders").update({ design_details: updatedDetails }).eq("id", order.id);
      if (updateError) throw updateError;
    } catch (err: any) {
      console.error("Upload error:", err);
      alert("Upload failed: " + (err.message || JSON.stringify(err)));
    } finally {
      setUploading(false);
    }
  };

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!activeVersion || activeVersion.status === "Approved") return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setCommentingOn({ x, y });
  };

  const handleAddComment = async () => {
    if (!commentingOn || !commentText.trim() || !activeVersion) return;
    const newComment = {
      id: (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36),
      x: commentingOn.x,
      y: commentingOn.y,
      content: commentText,
      author: customer.name,
      createdAt: new Date().toISOString()
    };
    
    const updatedVersions = dd.versions.map((v: any) => 
      v.id === activeVersion.id ? { ...v, comments: [...(v.comments || []), newComment], status: "Changes Requested" } : v
    );
    const updatedDetails = { ...dd, versions: updatedVersions };
    await supabase.from("orders").update({ design_details: updatedDetails, stage: "Design In Progress" }).eq("id", order.id);
    await supabase.from("order_messages").insert({ order_id: order.orderId || order.id, tab: "customer", sender_name: customer.name, sender_role: "Customer", content: `Added feedback on design proof. Notes: ${commentText}` });
    
    setCommentingOn(null);
    setCommentText("");
  };

  const handleApproveDesign = async () => {
    if (!activeVersion) return;
    const updatedVersions = dd.versions.map((v: any) => 
      v.id === activeVersion.id ? { ...v, status: "Approved" } : v
    );
    const updatedDetails = { ...dd, versions: updatedVersions };
    await supabase.from("orders").update({ design_details: updatedDetails, stage: "Design Approved" }).eq("id", order.id);
    await supabase.from("order_messages").insert({ order_id: order.orderId || order.id, tab: "timeline", sender_name: "System", sender_role: "System", content: "Client approved the design proof layout." });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-extrabold text-gray-900">Design Preview</h2>
        </div>
        
        {/* Resources Upload */}
        <div className="mb-6 p-4 border border-gray-200 rounded-xl bg-gray-50 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-gray-800">Add Inspiration & Logos</h4>
            <p className="text-xs text-gray-500 mt-1">Upload your brand assets or reference designs to help us.</p>
          </div>
          <label className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-xs font-bold cursor-pointer hover:bg-gray-100 flex items-center gap-2">
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
            {uploading ? "Uploading..." : "Upload File"}
            <input type="file" onChange={handleResourceUpload} className="hidden" disabled={uploading} />
          </label>
        </div>

        {dd.resources && dd.resources.length > 0 && (
          <div className="mb-6 flex gap-3 flex-wrap">
            {dd.resources.map((res: any) => (
              <a key={res.id} href={res.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-100 rounded-lg text-blue-700 hover:underline">
                <FileCheck size={14} />
                <span className="text-xs font-medium truncate max-w-[150px]">{res.name}</span>
              </a>
            ))}
          </div>
        )}

        {/* Version Selector */}
        {dd.versions && dd.versions.length > 0 ? (
          <>
            <div className="flex gap-2 mb-4">
              {dd.versions.map((v: any) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVersionId(v.id)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeVersion?.id === v.id ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  Version {v.versionNumber}
                </button>
              ))}
              
              {activeVersion && (
                <span className={`ml-auto px-3 py-1 rounded-full text-xs font-bold border ${
                  activeVersion.status === "Approved" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                  activeVersion.status === "Sent to Customer" ? "bg-blue-50 text-blue-700 border-blue-200" :
                  activeVersion.status === "Changes Requested" ? "bg-amber-50 text-amber-700 border-amber-200" :
                  "bg-gray-100 text-gray-600 border-gray-200"
                }`}>
                  {activeVersion.status === "Sent to Customer" ? "Action Required" : activeVersion.status}
                </span>
              )}
            </div>

            <div className="aspect-video bg-[#0b1c30] rounded-xl flex items-center justify-center mb-6 relative overflow-hidden group border border-gray-200 shadow-inner">
              <div className="relative" style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'center' }}>
                <img
                  src={activeVersion.proofUrl}
                  alt="Design Proof"
                  className="max-h-[60vh] object-contain transition-all"
                  onClick={handleImageClick}
                  style={{ cursor: activeVersion.status !== "Approved" ? "crosshair" : "default" }}
                />
                
                {/* Render Existing Comments */}
                {activeVersion.comments?.map((comment: any) => (
                  <div key={comment.id} className="absolute flex flex-col items-center group/pin z-10" style={{ left: `${comment.x}%`, top: `${comment.y}%`, transform: 'translate(-50%, -50%)' }}>
                    <div className="w-6 h-6 bg-red-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold cursor-pointer">!</div>
                    <div className="mt-2 hidden group-hover/pin:block w-48 p-2 bg-white rounded-lg shadow-xl border border-gray-200 text-xs text-gray-800 z-20">
                      <span className="font-bold block mb-1 text-[10px] text-gray-400">{comment.author}</span>
                      {comment.content}
                    </div>
                  </div>
                ))}
                
                {/* New Comment Input Box */}
                {commentingOn && (
                  <div className="absolute z-30" style={{ left: `${commentingOn.x}%`, top: `${commentingOn.y}%`, transform: 'translate(-50%, -50%)' }}>
                    <div className="w-6 h-6 bg-blue-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold mb-2 mx-auto animate-bounce">+</div>
                    <div className="bg-white p-3 rounded-lg shadow-2xl border border-gray-200 w-56 transform -translate-x-1/2">
                      <textarea
                        autoFocus
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Type feedback here..."
                        className="w-full text-xs p-2 border border-gray-200 rounded focus:outline-none mb-2"
                        rows={2}
                      />
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setCommentingOn(null)} className="px-2 py-1 text-[10px] font-bold text-gray-500 hover:bg-gray-100 rounded">Cancel</button>
                        <button onClick={handleAddComment} className="px-2 py-1 text-[10px] font-bold text-white bg-blue-600 rounded">Add Comment</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur border border-slate-200 rounded-lg p-1.5 flex items-center gap-2 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => setZoomLevel(v => Math.max(v - 20, 50))} className="p-1 text-slate-500 hover:text-slate-800 bg-gray-100 rounded"><ZoomOut size={14} /></button>
                <span className="text-[10px] font-mono font-black select-none w-8 text-center">{zoomLevel}%</span>
                <button onClick={() => setZoomLevel(v => Math.min(v + 20, 200))} className="p-1 text-slate-500 hover:text-slate-800 bg-gray-100 rounded"><ZoomIn size={14} /></button>
              </div>
            </div>

            <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-200">
              <span className="text-xs text-gray-500">
                {activeVersion.status === "Approved" ? "Design approved for production." : "Click anywhere on the design to leave pinpoint feedback."}
              </span>
              {activeVersion.status !== "Approved" && (
                <button
                  onClick={handleApproveDesign}
                  className="px-6 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 flex items-center gap-2 shadow-sm"
                >
                  <CheckCircle size={16} /> Approve Design
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="text-center bg-gray-50 rounded-xl border border-dashed border-gray-300 p-12 flex flex-col items-center">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-gray-100">
              <Layout size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-700">Awaiting Initial Design</h3>
            <p className="text-sm text-gray-500 mt-2 max-w-sm">Our designers are currently working on your proof. You will receive an email once it is ready for your review.</p>
          </div>
        )}
      </div>
    </div>
  );
}
