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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-md rounded-lg border border-white/[0.1] bg-[#0d111a] p-5 shadow-xl">
        <button
          onClick={onClose}
          disabled={submitting}
          className="absolute right-3.5 top-3.5 rounded p-1 text-slate-400 hover:bg-white/[0.06] hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-4 pb-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-amber-400 font-semibold mb-1">
            <RefreshCw className="h-3.5 w-3.5" /> SMART RESCHEDULING ENGINE
          </div>
          <h3 className="text-base font-bold text-slate-100">Yêu Cầu Gia Hạn Lịch Trình</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            AI sẽ tự động tính toán lại và tịnh tiến các giai đoạn phía sau để kế hoạch không bị đổ vỡ.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block font-mono text-[11px] font-semibold text-slate-300 mb-1">
              GIAI ĐOẠN BỊ CHẬM
            </label>
            <select
              value={selectedPhaseId}
              onChange={(e) => setSelectedPhaseId(e.target.value)}
              className="h-8.5 w-full rounded-md border border-white/[0.08] bg-[#121824] px-2.5 text-xs text-slate-100 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/40"
            >
              <option value="">Giai đoạn đang chạy hiện tại (Tự động)</option>
              {phases.map((p) => (
                <option key={p.id} value={p.id}>
                  Phase {p.phase_number}: {p.title} ({p.status})
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-mono text-[11px] font-semibold text-slate-300">
                SỐ NGÀY GIA HẠN THÊM
              </label>
              <span className="font-mono text-[11px] font-bold text-amber-400 tabular-nums">
                +{daysToAdd} ngày
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={21}
              value={daysToAdd}
              onChange={(e) => setDaysToAdd(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          <div>
            <label className="block font-mono text-[11px] font-semibold text-slate-300 mb-1">
              LÝ DO TRỄ TIẾN ĐỘ / SỰ CỐ <span className="text-rose-400">*</span>
            </label>
            <textarea
              required
              rows={3}
              placeholder="VD: Chờ giao linh kiện mạch từ nhà cung cấp hoặc sửa lỗi kết nối WebSocket..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-md border border-white/[0.08] bg-[#121824] p-3 text-xs text-slate-100 placeholder:text-slate-500 shadow-xs focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/40"
            />
          </div>

          <div className="flex items-center gap-2 rounded border border-white/[0.06] bg-[#090d16] p-2.5 text-xs text-slate-300">
            <input
              type="checkbox"
              id="ai-recalc-opt"
              checked={useAI}
              onChange={(e) => setUseAI(e.target.checked)}
              className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="ai-recalc-opt" className="font-mono text-[11px] cursor-pointer">
              Bật AI đánh giá rủi ro & đề xuất phương án khắc phục
            </label>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="h-8 rounded-md px-3 text-xs font-mono text-slate-400 hover:bg-white/[0.06] hover:text-white transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-8 items-center gap-1.5 rounded-md bg-amber-600 px-3.5 text-xs font-medium text-white shadow-xs hover:bg-amber-500 transition-colors"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Đang tính lại...</span>
                </>
              ) : (
                <>
                  <span>Áp dụng Gia Hạn</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
