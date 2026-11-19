"use client";

import React, { useState } from "react";
import {
  Clock,
  Play,
  Calendar,
  BookOpen,
  Cpu,
  Terminal,
  Package,
  Layers,
  RefreshCw,
  CheckSquare,
  Square,
  AlertCircle,
} from "lucide-react";
import confetti from "canvas-confetti";
import { Project } from "@/types";

interface PreparationBannerProps {
  project: Project;
  onTogglePrereq: (id: string) => Promise<void>;
  onKickoff: () => Promise<void>;
  onOpenReschedule: () => void;
  onViewExtensionHistory: () => void;
}

export const PreparationBanner: React.FC<PreparationBannerProps> = ({
  project,
  onTogglePrereq,
  onKickoff,
  onOpenReschedule,
  onViewExtensionHistory,
}) => {
  const [kickoffLoading, setKickoffLoading] = useState(false);

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case "KNOWLEDGE":
        return <span className="text-[10px] font-mono text-sky-400 bg-sky-500/10 border border-sky-500/20 px-1.5 py-0.5 rounded">KNOWLEDGE</span>;
      case "EQUIPMENT":
        return <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">HARDWARE</span>;
      case "ENVIRONMENT":
        return <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">DEV-ENV</span>;
      case "RESOURCE":
        return <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 rounded">RESOURCE</span>;
      default:
        return <span className="text-[10px] font-mono text-slate-400 bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded">OTHER</span>;
    }
  };

  const handleKickoffClick = async () => {
    setKickoffLoading(true);
    try {
      await onKickoff();
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch (err: any) {
      alert(err.message || "Không thể kích hoạt dự án.");
    } finally {
      setKickoffLoading(false);
    }
  };

  const completedPrereqs = project.prerequisites.filter((p) => p.is_completed).length;
  const totalPrereqs = project.prerequisites.length;
  const isAllReady = totalPrereqs > 0 && completedPrereqs === totalPrereqs;

  if (project.status === "PREPARATION") {
    return (
      <div className="rounded-lg border border-amber-500/30 bg-[#0d111a] p-4.5">
        {/* Banner Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-4 border-b border-white/[0.06]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping" />
              <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-amber-400">
                CHẾ ĐỘ CHỜ CHUẨN BỊ (PREPARATION MODE)
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl">
              Đồng hồ deadline <strong>CHƯA</strong> chạy. Hãy tick hoàn thành các mục chuẩn bị (mua sắm linh kiện, học kiến thức nền). Khi sẵn sàng, bấm Kick-off để kích hoạt lịch động.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="font-mono text-xs text-slate-400">
              Đã xong:{" "}
              <strong className={isAllReady ? "text-emerald-400" : "text-amber-400"}>
                {completedPrereqs}/{totalPrereqs}
              </strong>
            </span>

            <button
              onClick={handleKickoffClick}
              disabled={kickoffLoading}
              className={`inline-flex h-8 items-center gap-1.5 rounded-md px-3.5 text-xs font-medium text-white shadow-xs transition-colors ${
                isAllReady
                  ? "bg-emerald-600 hover:bg-emerald-500 focus-visible:ring-emerald-500/50"
                  : "bg-blue-600 hover:bg-blue-500 focus-visible:ring-blue-500/50"
              }`}
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>{kickoffLoading ? "Đang kích hoạt..." : "Sẵn sàng Kick-off"}</span>
            </button>
          </div>
        </div>

        {/* Prerequisites Checklist Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {project.prerequisites.map((prereq) => (
            <div
              key={prereq.id}
              onClick={() => onTogglePrereq(prereq.id)}
              className={`flex items-start gap-3 rounded-md border p-3 cursor-pointer transition-colors ${
                prereq.is_completed
                  ? "border-emerald-500/20 bg-emerald-500/[0.03] text-slate-400"
                  : "border-white/[0.06] bg-[#121824] hover:border-white/[0.15] text-slate-200"
              }`}
            >
              <button type="button" className="mt-0.5 shrink-0 text-slate-400">
                {prereq.is_completed ? (
                  <CheckSquare className="h-4 w-4 text-emerald-400" />
                ) : (
                  <Square className="h-4 w-4 text-slate-500" />
                )}
              </button>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {getCategoryBadge(prereq.category)}
                  <span
                    className={`text-xs font-medium truncate ${
                      prereq.is_completed ? "line-through text-slate-500" : "text-slate-100"
                    }`}
                  >
                    {prereq.title}
                  </span>
                </div>
                {prereq.description && (
                  <p className="text-[11px] text-slate-400 line-clamp-1 leading-normal">
                    {prereq.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ACTIVE or COMPLETED state
  return (
    <div className="rounded-lg border border-white/[0.08] bg-[#0d111a] px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-md border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
          <Clock className="h-4 w-4" />
        </div>

        <div>
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="font-semibold text-emerald-400">
              {project.status === "COMPLETED" ? "DỰ ÁN ĐÃ HOÀN TẤT" : "ĐANG CHẠY THEO LỊCH TRÌNH ĐỘNG"}
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400">
              Kick-off:{" "}
              <strong className="text-slate-200 tabular-nums">
                {project.kick_off_date ? new Date(project.kick_off_date).toLocaleDateString("vi-VN") : "N/A"}
              </strong>
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400">
              Hạn chót:{" "}
              <strong className="text-amber-400 tabular-nums">
                {project.estimated_completion_date
                  ? new Date(project.estimated_completion_date).toLocaleDateString("vi-VN")
                  : "N/A"}
              </strong>
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {project.status !== "COMPLETED" && (
          <button
            onClick={onOpenReschedule}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 text-xs font-mono text-amber-300 hover:bg-amber-500/20 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Gia hạn (+days)</span>
          </button>
        )}

        {project.extensions.length > 0 && (
          <button
            onClick={onViewExtensionHistory}
            className="inline-flex h-8 items-center rounded-md border border-white/[0.08] bg-[#121824] px-3 font-mono text-xs text-slate-300 hover:bg-white/[0.06] transition-colors"
          >
            Lịch sử trễ hạn ({project.extensions.length})
          </button>
        )}
      </div>
    </div>
  );
};
