"use client";

import React from "react";
import { AlertTriangle, ShieldCheck, Zap, Info, CheckCircle2 } from "lucide-react";

interface FeasibilityCardProps {
  score: number;
  explanation?: string;
  blindSpots: string[];
}

export const FeasibilityCard: React.FC<FeasibilityCardProps> = ({
  score,
  explanation,
  blindSpots,
}) => {
  // Score color calculation
  const getScoreColor = (val: number) => {
    if (val <= 4.0) return { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30", label: "Độ khó Thấp (Khả thi cao)" };
    if (val <= 7.0) return { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/30", label: "Độ khó Trung Bình (Cần tập trung)" };
    return { bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/30", label: "Độ khó Cao (R&D / Đầy thử thách)" };
  };

  const badge = getScoreColor(score);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* Score & Explanation */}
      <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className={`flex h-14 w-14 items-center justify-center rounded-2xl border ${badge.border} ${badge.bg}`}>
              <span className={`text-2xl font-black ${badge.text}`}>{score.toFixed(1)}</span>
            </div>
            <div>
              <span className="text-xs uppercase font-semibold tracking-wider text-slate-400 block">
                Đánh giá độ phức tạp & khả thi
              </span>
              <h3 className={`text-base font-bold ${badge.text}`}>{badge.label}</h3>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
            <Info className="h-4 w-4 text-indigo-400" />
            <span>Thang điểm 1.0 (Dễ) → 10.0 (Rất khó)</span>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Zap className="h-4 w-4 text-amber-400" /> Nhận định của AI Project Manager
          </h4>
          <p className="text-sm leading-relaxed text-slate-300 bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/60">
            {explanation || "Chưa có giải thích đánh giá."}
          </p>
        </div>
      </div>

      {/* Blind Spots Callout */}
      <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-950/20 to-slate-900/60 p-5 backdrop-blur-sm">
        <div className="flex items-center gap-2 text-amber-400 font-bold text-sm mb-3">
          <AlertTriangle className="h-4 w-4" />
          <span>Điểm mù cần lưu ý (Blind Spots)</span>
        </div>
        <p className="text-xs text-slate-400 mb-3">
          Những hạng mục quan trọng mà bạn thường chưa tính tới khi lên kế hoạch:
        </p>

        {blindSpots.length === 0 ? (
          <p className="text-xs text-slate-500 italic">Không có điểm mù đặc biệt được ghi nhận.</p>
        ) : (
          <ul className="space-y-2.5">
            {blindSpots.map((spot, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-300 leading-normal">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
                <span>{spot}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
