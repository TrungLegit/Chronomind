"use client";

import React, { useState } from "react";
import { X, RefreshCw, Loader2, ArrowRight } from "lucide-react";
import { Phase, ExtensionInput } from "@/types";

interface RescheduleModalProps {
  isOpen: boolean;
  phases: Phase[];
  onClose: () => void;
  onSubmit: (data: ExtensionInput) => Promise<void>;
}

export const RescheduleModal: React.FC<RescheduleModalProps> = ({
  isOpen,
  phases,
  onClose,
  onSubmit,
}) => {
  const [selectedPhaseId, setSelectedPhaseId] = useState<string>("");
  const [daysToAdd, setDaysToAdd] = useState<number>(3);
  const [reason, setReason] = useState<string>("");
  const [useAI, setUseAI] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    setSubmitting(true);
    try {
      await onSubmit({
        phase_id: selectedPhaseId || undefined,
        days_to_add: daysToAdd,
        reason,
        use_ai_analysis: useAI,
      });
      onClose();
    } catch (err: any) {
      alert(err.message || "Không thể gia hạn dự án.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-md rounded-3xl border border-[#e5e7eb] bg-white p-6 shadow-2xl">
        <button
          onClick={onClose}
          disabled={submitting}
          className="absolute right-4 top-4 rounded-full p-2 text-[#5f6368] hover:bg-[#f1f3f4] hover:text-[#1f1f1f] transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-4 pb-3 border-b border-[#f1f3f4]">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#b06000] mb-1">
            <RefreshCw className="h-3.5 w-3.5" /> SMART RESCHEDULING
          </div>
          <h3 className="text-lg font-bold text-[#1f1f1f]">Yêu Cầu Gia Hạn Lịch Trình</h3>
          <p className="text-xs text-[#5f6368] mt-0.5">
            AI sẽ tự động tính toán lại và tịnh tiến các giai đoạn phía sau để kế hoạch không bị đổ vỡ.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#1f1f1f] mb-1">
              Giai đoạn bị chậm tiến độ
            </label>
            <select
              value={selectedPhaseId}
              onChange={(e) => setSelectedPhaseId(e.target.value)}
              className="w-full h-10 rounded-xl border border-[#dadce0] bg-white px-3 text-sm text-[#1f1f1f] focus:border-[#0b57d0] focus:outline-none focus:ring-2 focus:ring-[#0b57d0]/20 transition-all"
            >
              <option value="">Giai đoạn đang làm hiện tại (Tự động)</option>
              {phases.map((p) => (
                <option key={p.id} value={p.id}>
                  Phase {p.phase_number}: {p.title} ({p.status})
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-[#1f1f1f]">
                Số ngày cần gia hạn thêm
              </label>
              <span className="text-xs font-bold text-[#b06000] bg-[#fef7e0] px-2.5 py-0.5 rounded-full">
                +{daysToAdd} ngày
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={21}
              value={daysToAdd}
              onChange={(e) => setDaysToAdd(Number(e.target.value))}
              className="w-full accent-[#b06000] cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1f1f1f] mb-1">
              Lý do chậm trễ / Khó khăn phát sinh <span className="text-[#ea4335]">*</span>
            </label>
            <textarea
              required
              rows={3}
              placeholder="VD: Chờ giao linh kiện mạch từ nhà cung cấp hoặc xử lý sự cố mạng..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-xl border border-[#dadce0] bg-white p-3.5 text-sm text-[#1f1f1f] placeholder-[#80868b] focus:border-[#0b57d0] focus:outline-none focus:ring-2 focus:ring-[#0b57d0]/20 transition-all"
            />
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-[#e5e7eb] bg-[#f8fafd] p-3 text-xs text-[#3c4043]">
            <input
              type="checkbox"
              id="ai-recalc-opt"
              checked={useAI}
              onChange={(e) => setUseAI(e.target.checked)}
              className="rounded border-[#dadce0] text-[#0b57d0] focus:ring-[#0b57d0]"
            />
            <label htmlFor="ai-recalc-opt" className="cursor-pointer font-medium">
              Bật AI đánh giá tác động & đề xuất phương án giảm rủi ro
            </label>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#f1f3f4]">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-full px-4 py-2 text-xs font-semibold text-[#5f6368] hover:bg-[#f1f3f4] transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-full bg-[#0b57d0] hover:bg-[#0842a0] px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:shadow-md transition-all"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Đang tính lại lịch...</span>
                </>
              ) : (
                <>
                  <span>Áp dụng Gia Hạn</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
