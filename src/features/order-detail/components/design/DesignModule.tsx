"use client";

import React, { useState, useRef, useEffect } from "react";
import { FileText, ZoomIn, ZoomOut, UploadCloud, MessageSquare, CheckCircle, Upload, X, Trash, RefreshCw } from "lucide-react";
import { Order, DesignDetails, DesignVersion, DesignComment, DesignResource } from "@/types";
import { createClient } from "@/utils/supabase/client";
import { updateOrderStageAction } from "@/features/orders/actions/orderActions";

interface DesignModuleProps {
  order: Order;
  isEmployee: boolean;
  updateDesignDetails: (orderId: string, details: Partial<DesignDetails>) => Promise<void>;
}

export const DesignModule: React.FC<DesignModuleProps> = ({
  order,
  isEmployee,
  updateDesignDetails,
}) => {
  const supabase = createClient();
  const dd: DesignDetails = order.designDetails || {
    resources: [],
    versions: [],
    currentVersion: 0,
    paymentVerified: false,
  };

  const [zoomLevel, setZoomLevel] = useState(100);
  const [uploading, setUploading] = useState(false);
  const [movingToProduction, setMovingToProduction] = useState(false);
  const [localVersions, setLocalVersions] = useState<DesignVersion[]>(dd.versions || []);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);

  useEffect(() => {
    setLocalVersions(order.designDetails?.versions || []);
  }, [order.designDetails?.versions]);

  const activeVersion = localVersions.find(v => v.id === selectedVersionId) || localVersions[localVersions.length - 1];

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 20, 200));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 20, 50));
  const handleResetZoom = () => setZoomLevel(100);

  const uploadFile = async (file: File) => {
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${order.id}/designs/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage
      .from("site-visit-photos")
      .upload(path, file, { upsert: false, contentType: file.type });
    if (error) throw error;
    const { data } = supabase.storage.from("site-visit-photos").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleDesignerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadFile(file);
      const newVersion: DesignVersion = {
        id: crypto.randomUUID(),
        versionNumber: localVersions.length + 1,
        proofUrl: url,
        fileName: file.name,
        status: "Draft",
        comments: [],
        createdAt: new Date().toISOString()
      };
      const newVersions = [...localVersions, newVersion];
      setLocalVersions(newVersions);
      setSelectedVersionId(newVersion.id);
      await updateDesignDetails(order.id, { versions: newVersions, currentVersion: newVersion.versionNumber });
    } catch (err: any) {
      alert("Upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateVersionStatus = async (versionId: string, newStatus: DesignVersion["status"]) => {
    const newVersions = localVersions.map(v => v.id === versionId ? { ...v, status: newStatus } : v);
    setLocalVersions(newVersions);
    await updateDesignDetails(order.id, { versions: newVersions });
  };

  const handlePaymentReceived = async () => {
    setMovingToProduction(true);
    try {
      await updateDesignDetails(order.id, { paymentVerified: true });
      await updateOrderStageAction(order.id, "Production");
      window.location.reload();
    } catch (error) {
      console.error(error);
      alert("Failed to update status");
    } finally {
      setMovingToProduction(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
          Design Workflow
        </h3>
        <span className="text-[10px] font-bold text-slate-400">STAGE 3</span>
      </div>

      {/* Customer Resources Section */}
      <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
        <h4 className="text-xs font-bold text-slate-600 uppercase">Customer Resources</h4>
        {(!dd.resources || dd.resources.length === 0) ? (
          <p className="text-xs text-slate-400 italic">No resources uploaded by customer yet.</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {dd.resources.map(res => (
              <a key={res.id} href={res.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 bg-white border border-slate-200 rounded-lg shadow-sm hover:border-blue-400">
                {res.type === 'file' ? <FileText size={16} className="text-blue-500" /> : <UploadCloud size={16} className="text-slate-500" />}
                <span className="text-xs text-slate-700 font-medium truncate max-w-[150px]">{res.name}</span>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Design Versions Viewer */}
      {localVersions.length > 0 && (
        <div className="border border-slate-200 bg-white rounded-2xl overflow-hidden p-4 space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <div className="flex gap-2">
              {localVersions.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVersionId(v.id)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg border ${activeVersion?.id === v.id ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}
                >
                  V{v.versionNumber}
                </button>
              ))}
            </div>
            
            {activeVersion && (
              <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${
                activeVersion.status === "Approved" ? "bg-emerald-50 text-emerald-700 border-emerald-255" :
                activeVersion.status === "Sent to Customer" ? "bg-blue-50 text-blue-600 border-blue-200" :
                activeVersion.status === "Changes Requested" ? "bg-red-50 text-red-600 border-red-200" :
                "bg-slate-55/60 text-slate-600 border-slate-200"
              }`}>
                {activeVersion.status}
              </span>
            )}
          </div>

          {activeVersion && (
            <div className="space-y-4">
              <div className="relative border border-slate-150 rounded-xl bg-slate-900 flex items-center justify-center p-6 overflow-hidden min-h-[300px]">
                <div className="relative" style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'center' }}>
                  <img src={activeVersion.proofUrl} alt={`Version ${activeVersion.versionNumber}`} className="max-h-[400px] object-contain transition-all duration-300" />
                  
                  {/* Render Comments/Pins */}
                  {activeVersion.comments?.map((comment) => (
                    !comment.isGeneral && (
                      <div key={comment.id} className="absolute z-10 hover:z-50 w-0 h-0 group" style={{ left: `${comment.x}%`, top: `${comment.y}%` }}>
                        <div className="absolute w-6 h-6 bg-red-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold cursor-pointer -translate-x-1/2 -translate-y-1/2">
                          !
                        </div>
                        <div className={`hidden group-hover:block absolute w-48 p-2 bg-white rounded-lg shadow-xl border border-slate-200 text-xs text-slate-800 z-20 
                          ${comment.x < 20 ? 'left-0 ml-3' : comment.x > 80 ? 'right-0 mr-3' : '-translate-x-1/2'}
                          ${comment.y > 50 ? 'bottom-full mb-3' : 'top-full mt-3'}
                        `}>
                          <span className="font-bold block mb-1 text-[10px] text-slate-400">{comment.author}</span>
                          {comment.content}
                        </div>
                      </div>
                    )
                  ))}
                </div>

                {/* Floating Zoom controls */}
                <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-xs border border-slate-200 rounded-lg p-1.5 flex items-center space-x-1.5 shadow-xs">
                  <button onClick={handleZoomOut} className="p-0.5 text-slate-500 hover:text-slate-800 rounded"><ZoomOut size={12} /></button>
                  <span onClick={handleResetZoom} className="text-[9px] font-black font-mono px-1 select-none cursor-pointer">{zoomLevel}%</span>
                  <button onClick={handleZoomIn} className="p-0.5 text-slate-500 hover:text-slate-800 rounded"><ZoomIn size={12} /></button>
                </div>
              </div>

              {/* Action Bar for Active Version */}
              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-xs text-slate-500 font-mono flex items-center gap-2">
                  <FileText size={14} /> {activeVersion.fileName}
                </span>

                <div className="flex gap-2">
                  {isEmployee && activeVersion.status === "Draft" && (
                    <button type="button" onClick={() => handleUpdateVersionStatus(activeVersion.id, "Pending Admin")} className="px-3 py-1.5 bg-slate-950 text-white rounded-lg text-xs font-bold hover:bg-slate-800">
                      Send to Admin
                    </button>
                  )}
                  {!isEmployee && activeVersion.status === "Pending Admin" && (
                    <button type="button" onClick={() => handleUpdateVersionStatus(activeVersion.id, "Sent to Customer")} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700">
                      Approve & Publish to Customer
                    </button>
                  )}
                </div>
              </div>
                {/* Display General Feedback History */}
                {activeVersion.comments?.some((c: any) => c.isGeneral) && (
                  <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <h4 className="text-xs font-bold text-slate-800 uppercase">General Feedback</h4>
                    {activeVersion.comments.filter((c: any) => c.isGeneral).map((comment: any) => (
                      <div key={comment.id} className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-slate-800">{comment.author}</span>
                          <span className="text-[10px] text-slate-500">{new Date(comment.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-slate-600 whitespace-pre-wrap">{comment.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
        </div>
      )}

      {/* Upload New Proof (Designers) */}
      {isEmployee && (
        <div className="border border-dashed border-slate-300 rounded-2xl p-6 flex flex-col items-center justify-center bg-white text-center space-y-3 cursor-pointer hover:bg-slate-50 transition-colors relative">
          <input type="file" onChange={handleDesignerUpload} accept="image/*,.pdf" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" disabled={uploading} />
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-full text-blue-500">
            {uploading ? <RefreshCw className="animate-spin" size={22} /> : <Upload size={22} />}
          </div>
          <div>
            <span className="text-xs font-bold text-slate-800 block">
              {uploading ? "Uploading proof..." : "Upload New Design Proof"}
            </span>
            <span className="text-[10px] text-slate-400 block mt-1">
              Supports JPG, PNG, PDF
            </span>
          </div>
        </div>
      )}

      {/* Payment Received -> Production Transition */}
      {activeVersion?.status === "Approved" && (
        <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-xl flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-emerald-800">Design Approved by Customer!</h4>
            <p className="text-xs text-emerald-600 mt-1">Verify payment to proceed to fabrication.</p>
          </div>
          <button
            onClick={handlePaymentReceived}
            disabled={movingToProduction}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2 shadow-sm"
          >
            <CheckCircle size={14} /> 
            {movingToProduction ? "Moving..." : "Payment Received - Move to Production"}
          </button>
        </div>
      )}
    </div>
  );
};
