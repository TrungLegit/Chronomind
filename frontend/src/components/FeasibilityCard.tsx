"use client";

import React from "react";
import { AlertTriangle, ShieldCheck, Zap, Info, Clock, Activity, Cpu } from "lucide-react";

interface FeasibilityCardProps {
  score: number;
  explanation?: string;
  blindSpots: string[];
  totalHours: number;
  hoursPerWeek: number;
  skillLevel: string;
}

export const FeasibilityCard: React.FC<FeasibilityCardProps> = ({
  score,
  explanation,
  blindSpots,
  totalHours,
  hoursPerWeek,
  skillLevel,
}) => {
  const getScoreBadge = (val: number) => {
    if (val <= 4.0)
      return {
        tag: "LOW COMPLEXITY",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/20",
        text: "text-emerald-400",
      };
    if (val <= 7.0)
      return {
        tag: "MODERATE DIFFICULTY",
        bg: "bg-amber-500/10",
        border: "border-amber-500/20",
        text: "text-amber-400",
      };
    return {
      tag: "HIGH R&D EFFORT",
      bg: "bg-rose-500/10",
      border: "border-rose-500/20",
      text: "text-rose-400",
    };
  };

  const badge = getScoreBadge(score);

  return (
    <div className="space-y-4">
      {/* Tremor-inspired Metric KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* KPI 1: AI Complexity */}
        <div className="rounded-lg border border-white/[0.08] bg-[#0d111a] p-3.5">
          <div className="flex items-center justify-between mb-1">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Độ khó kỹ thuật
            </span>
            <span className={`font-mono text-[9px] px-1 py-0.5 rounded border ${badge.border} ${badge.bg} ${badge.text}`}>
              {badge.tag}
            </span>
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className={`font-mono text-2xl font-bold tracking-tight tabular-nums ${badge.text}`}>
              {score.toFixed(1)}
            </span>
            <span className="font-mono text-xs text-slate-500">/ 10.0</span>
          </div>
        </div>

        {/* KPI 2: Total Effort */}
        <div className="rounded-lg border border-white/[0.08] bg-[#0d111a] p-3.5">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
            Khối lượng ước tính
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="font-mono text-2xl font-bold tracking-tight text-slate-100 tabular-nums">
              {totalHours}
            </span>
            <span className="font-mono text-xs text-slate-500">giờ làm việc</span>
          </div>
        </div>

        {/* KPI 3: User Weekly Velocity */}
        <div className="rounded-lg border border-white/[0.08] bg-[#0d111a] p-3.5">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
            Năng lực hàng tuần
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="font-mono text-2xl font-bold tracking-tight text-slate-100 tabular-nums">
              {hoursPerWeek}h
            </span>
            <span className="font-mono text-xs text-slate-500">/ tuần • {skillLevel}</span>
          </div>
        </div>

        {/* KPI 4: Blind spots count */}
        <div className="rounded-lg border border-white/[0.08] bg-[#0d111a] p-3.5">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
            Điểm mù phát hiện
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="font-mono text-2xl font-bold tracking-tight text-amber-400 tabular-nums">
              {blindSpots.length}
            </span>
            <span className="font-mono text-xs text-slate-500">rủi ro tiềm ẩn</span>
          </div>
        </div>
      </div>

      {/* Technical Assessment & Blind spots breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Left: AI Assessment (8 cols) */}
        <div className="lg:col-span-7 rounded-lg border border-white/[0.08] bg-[#0d111a] p-4">
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/[0.04]">
            <Cpu className="h-4 w-4 text-blue-400" />
            <h4 className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-200">
              Nhận định kiến trúc & Khả thi
            </h4>
          </div>
          <p className="text-xs leading-relaxed text-slate-300">
            {explanation || "Chưa có nhận định chi tiết."}
          </p>
        </div>

        {/* Right: Blind spots warning (5 cols) */}
        <div className="lg:col-span-5 rounded-lg border border-amber-500/20 bg-amber-500/[0.03] p-4">
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-amber-500/10 text-amber-400">
            <AlertTriangle className="h-4 w-4" />
            <h4 className="font-mono text-xs font-semibold uppercase tracking-wider">
              Điểm mù kỹ thuật (Blind Spots)
            </h4>
          </div>

          <ul className="space-y-2">
            {blindSpots.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs text-slate-300 leading-normal">
                <span className="mt-1 h-1 w-1 rounded-full bg-amber-400 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
