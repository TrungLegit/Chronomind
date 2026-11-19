"use client";

import React from "react";
import { X, Clock, Terminal } from "lucide-react";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-lg border border-white/[0.1] bg-[#0d111a] p-5 shadow-xl max-h-[85vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-3.5 top-3.5 rounded p-1 text-slate-400 hover:bg-white/[0.06] hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-4 pb-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-amber-400 font-semibold mb-1">
            <Clock className="h-3.5 w-3.5" /> INCIDENT & EXTENSION LOGS
          </div>
          <h3 className="text-base font-bold text-slate-100">Lịch Sử Gia Hạn & Sự Cố Phát Sinh</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Ghi nhận toàn bộ các lần lùi hạn chót và phân tích giảm thiểu rủi ro từ AI.
          </p>
        </div>

        {extensions.length === 0 ? (
          <div className="py-8 text-center font-mono text-xs text-slate-500">
            Dự án đang bám sát tiến độ gốc, chưa có sự cố trễ hạn nào.
          </div>
        ) : (
          <div className="space-y-3">
            {extensions.map((ext, idx) => (
              <div
                key={ext.id || idx}
                className="rounded border border-white/[0.06] bg-[#090d16] p-3 space-y-2"
              >
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                    +{ext.days_added} NGÀY GIA HẠN
                  </span>
                  <span className="text-slate-500 text-[10px]">
                    {new Date(ext.created_at).toLocaleString("vi-VN")}
                  </span>
                </div>

                <div>
                  <span className="font-mono text-[10px] text-slate-400 block">
                    GIAI ĐOẠN: {ext.phase_title || "Toàn bộ kế hoạch"}
                  </span>
                  <p className="text-xs text-slate-200 mt-0.5">
                    <strong>Lý do:</strong> {ext.reason}
                  </p>
                </div>

                <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400 pt-1 border-t border-white/[0.04]">
                  <span>Hạn cũ: {ext.previous_deadline ? new Date(ext.previous_deadline).toLocaleDateString("vi-VN") : "N/A"}</span>
                  <span>→</span>
                  <span className="text-amber-400 font-semibold">
                    Hạn mới: {ext.new_deadline ? new Date(ext.new_deadline).toLocaleDateString("vi-VN") : "N/A"}
                  </span>
                </div>

                {ext.ai_analysis && (
                  <div className="rounded border border-blue-500/20 bg-blue-500/[0.04] p-2 text-xs text-blue-300">
                    <span className="font-mono text-[10px] font-bold text-blue-400 block mb-0.5">
                      AI MITIGATION ADVICE:
                    </span>
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
