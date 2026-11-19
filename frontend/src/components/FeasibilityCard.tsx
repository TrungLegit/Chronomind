"use client";

import React from "react";
import { AlertTriangle, Sparkles, Clock, Zap, BookOpen } from "lucide-react";

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
  const getScoreTheme = (val: number) => {
    if (val <= 4.0)
      return {
        label: "Độ khó thấp • Rất khả thi",
        bg: "bg-[#e6f4ea]",
        text: "text-[#137333]",
        border: "border-[#ceead6]",
      };
    if (val <= 7.0)
      return {
        label: "Độ khó trung bình • Cần tập trung",
        bg: "bg-[#fef7e0]",
        text: "text-[#b06000]",
        border: "border-[#feefc3]",
      };
    return {
      label: "Độ khó cao • R&D / Thử thách",
      bg: "bg-[#fce8e6]",
      text: "text-[#c5221f]",
      border: "border-[#fad2cf]",
    };
  };

  const theme = getScoreTheme(score);

  return (
    <div className="space-y-4">
      {/* 4 Clean Metric Cards (Google Workspace Style) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* KPI 1 */}
        <div className="rounded-2xl border border-[#e5e7eb] bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-[#5f6368]">
              Đánh giá độ khó AI
            </span>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${theme.bg} ${theme.text} ${theme.border}`}>
              {score <= 4.0 ? "DỄ" : score <= 7.0 ? "VỪA" : "KHÓ"}
            </span>
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className={`text-2xl font-bold tracking-tight ${theme.text}`}>
              {score.toFixed(1)}
            </span>
            <span className="text-xs text-[#5f6368]">/ 10</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="rounded-2xl border border-[#e5e7eb] bg-white p-4 shadow-xs">
          <span className="text-xs font-medium text-[#5f6368] block mb-1.5">
            Khối lượng dự án
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-bold tracking-tight text-[#1f1f1f]">
              {totalHours}
            </span>
            <span className="text-xs text-[#5f6368]">giờ làm việc</span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="rounded-2xl border border-[#e5e7eb] bg-white p-4 shadow-xs">
          <span className="text-xs font-medium text-[#5f6368] block mb-1.5">
            Thời gian rảnh của bạn
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-bold tracking-tight text-[#1f1f1f]">
              {hoursPerWeek}h
            </span>
            <span className="text-xs text-[#5f6368]">/ tuần ({skillLevel})</span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="rounded-2xl border border-[#e5e7eb] bg-white p-4 shadow-xs">
          <span className="text-xs font-medium text-[#5f6368] block mb-1.5">
            Điểm mù phát hiện
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-bold tracking-tight text-[#b06000]">
              {blindSpots.length}
            </span>
            <span className="text-xs text-[#5f6368]">rủi ro cần chú ý</span>
          </div>
        </div>
      </div>

      {/* Detail Breakdown: AI Advice & Blind Spots */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Gemini AI Assistant Assessment */}
        <div className="lg:col-span-7 rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#f1f3f4]">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#eaf1fb] text-[#0b57d0]">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-[#1f1f1f]">
                Nhận định từ AI Project Manager
              </h4>
              <span className={`text-xs font-medium ${theme.text}`}>{theme.label}</span>
            </div>
          </div>
          <p className="text-xs sm:text-sm leading-relaxed text-[#444746]">
            {explanation || "Chưa có nhận định chi tiết."}
          </p>
        </div>

        {/* Right: Blind Spots Callout */}
        <div className="lg:col-span-5 rounded-2xl border border-[#feefc3] bg-[#fef7e0]/60 p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#feefc3] text-[#b06000]">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <h4 className="text-sm font-bold">
              Điểm mù cần lưu ý (Blind Spots)
            </h4>
          </div>

          <ul className="space-y-2">
            {blindSpots.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs text-[#593d00] leading-relaxed">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#b06000] shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
