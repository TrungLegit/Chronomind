"use client";

import React, { useState } from "react";
import {
  Clock,
  CheckCircle2,
  Play,
  Calendar,
  AlertCircle,
  BookOpen,
  Cpu,
  Terminal,
  Package,
  Layers,
  Sparkles,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import confetti from "canvas-confetti";
import { Project, Prerequisite } from "@/types";

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

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "KNOWLEDGE":
        return <BookOpen className="h-4 w-4 text-sky-400" />;
      case "EQUIPMENT":
        return <Cpu className="h-4 w-4 text-amber-400" />;
      case "ENVIRONMENT":
        return <Terminal className="h-4 w-4 text-emerald-400" />;
      case "RESOURCE":
        return <Package className="h-4 w-4 text-purple-400" />;
      default:
        return <Layers className="h-4 w-4 text-slate-400" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "KNOWLEDGE":
        return "Kiến thức / Nghiên cứu";
      case "EQUIPMENT":
        return "Phần cứng / Thiết bị";
      case "ENVIRONMENT":
        return "Môi trường / Cài đặt";
      case "RESOURCE":
        return "Tài nguyên / API";
      default:
        return "Chuẩn bị khác";
    }
  };

  const handleKickoffClick = async () => {
    setKickoffLoading(true);
    try {
      await onKickoff();
      // Fire celebration confetti!
      confetti({
        particleCount: 100,
        spread: 70,
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
      <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/40 via-slate-900/80 to-slate-900 p-6 shadow-xl backdrop-blur-md">
        {/* Banner Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-5 border-b border-indigo-500/20">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="flex h-3 w-3 rounded-full bg-amber-400 animate-ping" />
              <span className="text-xs uppercase font-bold tracking-wider text-amber-400">
                Chế độ chờ chuẩn bị (Preparation Mode)
              </span>
            </div>
            <h3 className="text-xl font-bold text-white">
              Đồng hồ Deadline chưa chạy! Hãy hoàn thành Checklist chuẩn bị
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Hệ thống sẽ không gây áp lực thời gian cho đến khi bạn sẵn sàng. Mua sắm linh kiện, học kiến thức nền, hoặc cài đặt môi trường. Khi xong, bấm &quot;Sẵn sàng bắt đầu&quot; để kích hoạt lịch trình động.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleKickoffClick}
              disabled={kickoffLoading}
              className={`flex items-center gap-2.5 rounded-xl px-5 py-3 text-sm font-bold text-white shadow-lg transition-all ${
                isAllReady
                  ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 shadow-emerald-500/30 animate-bounce"
                  : "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-indigo-500/30"
              }`}
            >
              <Play className="h-4 w-4 fill-white" />
              <span>{kickoffLoading ? "Đang kích hoạt..." : "Sẵn sàng bắt đầu (Kick-off)"}</span>
              <Sparkles className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Prerequisites Checklist */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Checklist Chuẩn bị Tiền Dự Án (Prerequisites)</span>
            </h4>
            <span className="text-xs font-medium text-slate-400">
              Đã hoàn thành:{" "}
              <strong className={isAllReady ? "text-emerald-400" : "text-indigo-400"}>
                {completedPrereqs} / {totalPrereqs}
              </strong>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {project.prerequisites.map((prereq) => (
              <div
                key={prereq.id}
                onClick={() => onTogglePrereq(prereq.id)}
                className={`flex items-start gap-3 rounded-xl border p-3.5 cursor-pointer transition-all ${
                  prereq.is_completed
                    ? "border-emerald-500/30 bg-emerald-950/20 text-slate-300"
                    : "border-slate-800 bg-slate-950/60 hover:border-indigo-500/50 hover:bg-slate-900 text-slate-200"
                }`}
              >
                <input
                  type="checkbox"
                  aria-label={prereq.title}
                  checked={prereq.is_completed}
                  onChange={() => {}}
                  className="mt-1 h-4 w-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {getCategoryIcon(prereq.category)}
                    <span className="text-[10px] uppercase font-semibold text-slate-400">
                      {getCategoryLabel(prereq.category)}
                    </span>
                  </div>
                  <h5 className={`text-sm font-semibold ${prereq.is_completed ? "line-through text-slate-400" : "text-white"}`}>
                    {prereq.title}
                  </h5>
                  {prereq.description && (
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">
                      {prereq.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ACTIVE or COMPLETED state
  return (
    <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-slate-900 via-slate-900/90 to-emerald-950/20 p-5 shadow-xl backdrop-blur-md">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs uppercase font-bold tracking-wider text-emerald-400">
                {project.status === "COMPLETED" ? "Dự án đã hoàn thành!" : "Dự án đang chạy (Active Timeline)"}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-slate-300">
              <span>
                Ngày Kick-off:{" "}
                <strong className="text-white">
                  {project.kick_off_date ? new Date(project.kick_off_date).toLocaleDateString("vi-VN") : "N/A"}
                </strong>
              </span>
              <span>•</span>
              <span>
                Hạn chót dự kiến:{" "}
                <strong className="text-amber-400 font-semibold">
                  {project.estimated_completion_date
                    ? new Date(project.estimated_completion_date).toLocaleDateString("vi-VN")
                    : "N/A"}
                </strong>
              </span>
              {project.extensions.length > 0 && (
                <>
                  <span>•</span>
                  <button
                    onClick={onViewExtensionHistory}
                    className="text-xs text-indigo-400 underline hover:text-indigo-300"
                  >
                    Đã gia hạn {project.extensions.length} lần (+
                    {project.extensions.reduce((acc, e) => acc + e.days_added, 0)} ngày)
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {project.status !== "COMPLETED" && (
            <button
              onClick={onOpenReschedule}
              className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs font-bold text-amber-300 hover:bg-amber-500/20 hover:border-amber-500/50 transition"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Gia hạn Thông minh (Smart Reschedule)</span>
            </button>
          )}

          {project.extensions.length > 0 && (
            <button
              onClick={onViewExtensionHistory}
              className="rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition"
            >
              Lịch sử trễ hạn ({project.extensions.length})
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
