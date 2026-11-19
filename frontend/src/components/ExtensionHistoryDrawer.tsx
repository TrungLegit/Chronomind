"use client";

import React from "react";
import { X, Clock, Calendar } from "lucide-react";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-3xl border border-[#e5e7eb] bg-white p-6 shadow-2xl max-h-[85vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-[#5f6368] hover:bg-[#f1f3f4] hover:text-[#1f1f1f] transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-4 pb-3 border-b border-[#f1f3f4]">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#b06000] mb-1">
            <Clock className="h-4 w-4" /> NHẬT KÝ SỰ CỐ & GIA HẠN
          </div>
          <h3 className="text-lg font-bold text-[#1f1f1f]">Lịch Sử Lùi Hạn Chót Dự Án</h3>
          <p className="text-xs text-[#5f6368] mt-0.5">
            Ghi nhận toàn bộ các lần thay đổi lịch trình và lời khuyên khắc phục từ AI.
          </p>
        </div>

        {extensions.length === 0 ? (
          <div className="py-10 text-center text-xs text-[#5f6368]">
            Dự án đang diễn ra rất thuận lợi, chưa có lần gia hạn nào!
          </div>
        ) : (
          <div className="space-y-3.5">
            {extensions.map((ext, idx) => (
              <div
                key={ext.id || idx}
                className="rounded-2xl border border-[#e5e7eb] bg-[#f8fafd] p-4 space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#b06000] bg-[#fef7e0] border border-[#feefc3] px-2.5 py-0.5 rounded-full">
                    +{ext.days_added} NGÀY GIA HẠN
                  </span>
                  <span className="text-[#5f6368] text-[11px]">
                    {new Date(ext.created_at).toLocaleString("vi-VN")}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-[#5f6368] block">
                    GIAI ĐOẠN: {ext.phase_title || "Toàn bộ kế hoạch"}
                  </span>
                  <p className="text-xs text-[#1f1f1f] mt-0.5">
                    <strong>Lý do:</strong> {ext.reason}
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs text-[#5f6368] pt-1.5 border-t border-[#e5e7eb]">
                  <span>Hạn cũ: {ext.previous_deadline ? new Date(ext.previous_deadline).toLocaleDateString("vi-VN") : "N/A"}</span>
                  <span>→</span>
                  <span className="text-[#b06000] font-bold">
                    Hạn mới: {ext.new_deadline ? new Date(ext.new_deadline).toLocaleDateString("vi-VN") : "N/A"}
                  </span>
                </div>

                {ext.ai_analysis && (
                  <div className="rounded-xl border border-[#c2e7ff] bg-[#eaf1fb] p-3 text-xs text-[#001d35]">
                    <span className="font-bold text-[#0b57d0] block mb-0.5">
                      LỜI KHUYÊN TỪ AI:
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
