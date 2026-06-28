import React, { useState } from "react";
import { X, MapPin } from "lucide-react";

interface ScheduleVisitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSchedule: (date: string, time: string, location: string, coords: string) => Promise<void>;
  defaultAddress?: string;
}

export const ScheduleVisitModal: React.FC<ScheduleVisitModalProps> = ({ isOpen, onClose, onSchedule, defaultAddress }) => {
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [siteAddress, setSiteAddress] = useState(defaultAddress || "");
  const [gpsCoords, setGpsCoords] = useState("12.9716° N, 77.5946° E");
  const [mapsSearching, setMapsSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const getBusinessDays = () => {
    const days: Date[] = [];
    const cur = new Date();
    while (days.length < 7) {
      cur.setDate(cur.getDate() + 1);
      if (cur.getDay() !== 0) days.push(new Date(cur));
    }
    return days;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !selectedTime || !siteAddress) return;
    setSubmitting(true);
    await onSchedule(selectedDate, selectedTime, siteAddress, gpsCoords);
    setSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-10">
          <h2 className="text-lg font-black text-slate-800">Schedule Site Visit</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-5 overflow-y-auto">
          <form id="schedule-visit-form" onSubmit={handleSubmit} className="space-y-5">
            {/* Date Picker */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                Pick a Date
              </label>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-200">
                {getBusinessDays().map((day, idx) => {
                  const ds = day.toISOString().split("T")[0];
                  const dayName = day.toLocaleDateString("en-US", { weekday: "short" });
                  const monthName = day.toLocaleDateString("en-US", { month: "short" });
                  const selected = selectedDate === ds;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => { setSelectedDate(ds); setSelectedTime(""); }}
                      className={`flex flex-col items-center p-3 rounded-xl border text-center min-w-[64px] transition-all cursor-pointer ${selected
                        ? "bg-[#eff4ff] border-[#1E40AF] text-[#1E40AF] ring-2 ring-blue-100"
                        : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                        }`}
                    >
                      <span className="text-[9px] uppercase tracking-wider text-slate-400">{dayName}</span>
                      <span className="text-sm font-black mt-0.5">{day.getDate()}</span>
                      <span className="text-[9px] text-slate-400">{monthName}</span>
                    </button>
                  );
                })}
              </div>

              {selectedDate && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-3">
                  {["10 AM - 11 AM", "11 AM - 12 PM", "12 PM - 1 PM", "1 PM - 2 PM", "2 PM - 3 PM", "3 PM - 4 PM", "4 PM - 5 PM"].map(slot => {
                    const sel = selectedTime === slot;
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setSelectedTime(slot)}
                        className={`py-2.5 rounded-xl border text-xs font-bold transition-all ${sel 
                            ? "bg-[#eff4ff] border-[#1E40AF] text-[#1E40AF] ring-2 ring-blue-100"
                            : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 cursor-pointer"
                          }`}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Location */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Location
              </label>
              <input
                type="text"
                required
                value={siteAddress}
                onChange={e => setSiteAddress(e.target.value)}
                placeholder="Full address where signage will be installed"
                className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none bg-slate-50 focus:bg-white transition-all"
              />

              {/* Map visual */}
              <div className="mt-2 border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                <div
                  onClick={() => setGpsCoords(`${(12.97 + Math.random() * 0.01).toFixed(4)}° N, ${(77.59 + Math.random() * 0.01).toFixed(4)}° E`)}
                  className="h-28 bg-[#e8edf2] flex flex-col items-center justify-center relative cursor-crosshair group select-none"
                >
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#d1d9e0_1px,transparent_1px),linear-gradient(to_bottom,#d1d9e0_1px,transparent_1px)] bg-[size:20px_20px] opacity-40" />
                  <div className="absolute w-8 h-8 rounded-full bg-blue-400/20 animate-ping" />
                  <MapPin size={28} className="text-[#1E40AF] relative z-10 drop-shadow-md" />
                  <span className="text-[10px] text-slate-500 mt-1.5 relative z-10 font-medium bg-white/90 px-2 py-0.5 rounded-full border border-slate-200">
                    Click to pin location
                  </span>
                </div>
                <div className="px-3 py-2 bg-white border-t border-slate-200 flex items-center justify-between">
                  <span className="text-[10px] font-mono font-semibold text-slate-600">📍 {gpsCoords}</span>
                  <button
                    type="button"
                    onClick={() => { setMapsSearching(true); setTimeout(() => { setGpsCoords("12.9716° N, 77.5946° E"); setMapsSearching(false); }, 600); }}
                    className="flex items-center gap-1 text-[10px] font-bold text-[#1E40AF] hover:underline"
                  >
                    {mapsSearching ? "Detecting..." : "Use Current Location"}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
        <div className="px-5 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200/50 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="schedule-visit-form"
            disabled={!selectedDate || !selectedTime || !siteAddress || submitting}
            className="px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors shadow-sm"
          >
            {submitting ? "Scheduling..." : "Schedule Visit"}
          </button>
        </div>
      </div>
    </div>
  );
};
