"use client";

import React, { useState } from "react";
import { X, RefreshCw, Sparkles, Clock, AlertCircle, Loader2 } from "lucide-react";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <button
          onClick={onClose}
          disabled={submitting}
          className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-5">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <RefreshCw className="h-4 w-4" /> Smart Rescheduling Engine
          </div>
          <h3 className="text-xl font-bold text-white">Yêu Cầu Gia Hạn Thông Minh</h3>
          <p className="text-xs text-slate-400 mt-1">
            Gặp sự cố hoặc trễ tiến độ? AI sẽ tự động phân tích lý do và tịnh tiến các Phase phía sau mà không làm vỡ cấu trúc dự án.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Giai đoạn bị chậm tiến độ
            </label>
            <select
              value={selectedPhaseId}
              onChange={(e) => setSelectedPhaseId(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
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
              <label className="text-xs font-semibold text-slate-300">
                Số ngày cần gia hạn thêm
              </label>
              <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
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
            <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
              <span>1 ngày</span>
              <span>7 ngày</span>
              <span>14 ngày</span>
              <span>21 ngày</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Lý do chậm trễ / Khó khăn gặp phải <span className="text-pink-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              placeholder="VD: Chờ giao linh kiện từ Shopee mất thêm 3 ngày, hoặc gặp bug kết nối Bluetooth chưa gỡ được..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-indigo-950/30 border border-indigo-500/20 p-3">
            <input
              type="checkbox"
              id="ai-analysis-check"
              checked={useAI}
              onChange={(e) => setUseAI(e.target.checked)}
              className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="ai-analysis-check" className="text-xs text-slate-300 cursor-pointer">
              Bật AI phân tích rủi ro & đưa ra lời khuyên khắc phục tiến độ
            </label>
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-lg px-4 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-amber-500/20 hover:from-amber-500 hover:to-orange-500 transition"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>AI đang tính lại lịch...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Áp dụng Gia hạn & Tính lại Deadline</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
