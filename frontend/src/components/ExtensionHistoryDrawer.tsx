"use client";

import React from "react";
import { X, Clock, Calendar, Sparkles, AlertTriangle } from "lucide-react";
import { ExtensionLog } from "@/types";

interface ExtensionHistoryDrawerProps {
  isOpen: boolean;
  extensions: ExtensionLog[];
  onClose: () => void;
}

export const ExtensionHistoryDrawer: React.FC<ExtensionHistoryDrawerProps> = ({
  isOpen,
  extensions,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl max-h-[85vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-5 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Clock className="h-4 w-4" /> Incident & Extension Log
          </div>
          <h3 className="text-xl font-bold text-white">Lịch Sử Gia Hạn & Sự Cố Phát Sinh</h3>
          <p className="text-xs text-slate-400 mt-1">
            Ghi nhận toàn bộ các lần lùi lịch, lý do thực tế và đánh giá tác động từ AI.
          </p>
        </div>

        {extensions.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-sm">
            Chưa có lần gia hạn nào. Dự án đang bám sát tiến độ gốc!
          </div>
        ) : (
          <div className="space-y-4">
            {extensions.map((ext, idx) => (
              <div
                key={ext.id || idx}
                className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-2.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                    +{ext.days_added} ngày gia hạn
                  </span>
                  <span className="text-slate-500">
                    {new Date(ext.created_at).toLocaleString("vi-VN")}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] uppercase font-semibold text-slate-400 block">
                    Giai đoạn: {ext.phase_title || "Toàn bộ dự án"}
                  </span>
                  <p className="text-sm text-slate-200 mt-0.5">
                    <strong>Lý do:</strong> {ext.reason}
                  </p>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-400 pt-1 border-t border-slate-800/60">
                  <span>Hạn cũ: {ext.previous_deadline ? new Date(ext.previous_deadline).toLocaleDateString("vi-VN") : "N/A"}</span>
                  <span>→</span>
                  <span className="text-amber-400 font-semibold">
                    Hạn mới: {ext.new_deadline ? new Date(ext.new_deadline).toLocaleDateString("vi-VN") : "N/A"}
                  </span>
                </div>

                {ext.ai_analysis && (
                  <div className="rounded-lg bg-indigo-950/30 border border-indigo-500/20 p-2.5 text-xs text-indigo-300">
                    <div className="flex items-center gap-1.5 font-bold mb-1 text-indigo-400">
                      <Sparkles className="h-3.5 w-3.5" /> AI Project Manager nhận xét:
                    </div>
                    <p className="leading-relaxed">{ext.ai_analysis}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
