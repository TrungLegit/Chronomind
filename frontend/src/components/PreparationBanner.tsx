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
  CheckCircle2,
  Circle,
  Sparkles,
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
        return <span className="text-[11px] font-semibold text-[#1a73e8] bg-[#e8f0fe] px-2 py-0.5 rounded-full">Kiến thức</span>;
      case "EQUIPMENT":
        return <span className="text-[11px] font-semibold text-[#b06000] bg-[#fef7e0] px-2 py-0.5 rounded-full">Phần cứng</span>;
      case "ENVIRONMENT":
        return <span className="text-[11px] font-semibold text-[#137333] bg-[#e6f4ea] px-2 py-0.5 rounded-full">Môi trường</span>;
      case "RESOURCE":
        return <span className="text-[11px] font-semibold text-[#9333ea] bg-[#f3e8fd] px-2 py-0.5 rounded-full">Tài nguyên</span>;
      default:
        return <span className="text-[11px] font-semibold text-[#5f6368] bg-[#f1f3f4] px-2 py-0.5 rounded-full">Khác</span>;
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
      <div className="rounded-2xl border border-[#feefc3] bg-white p-5 shadow-xs">
        {/* Banner Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-4 border-b border-[#f1f3f4]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="h-2 w-2 rounded-full bg-[#fbbc04] animate-ping" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#b06000]">
                Chế độ Chuẩn Bị (Preparation Mode)
              </span>
            </div>
            <h3 className="text-base font-bold text-[#1f1f1f]">
              Đồng hồ Deadline chưa chạy! Hãy hoàn thành Checklist chuẩn bị
            </h3>
            <p className="text-xs text-[#5f6368] mt-0.5 max-w-2xl">
              Hệ thống không gây áp lực thời gian. Hãy mua sắm linh kiện, học kiến thức nền hoặc cài đặt môi trường. Khi bạn sẵn sàng, bấm &quot;Bắt đầu dự án&quot; để chính thức tính lịch trình.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs font-medium text-[#5f6368]">
              Đã chuẩn bị:{" "}
              <strong className={isAllReady ? "text-[#137333]" : "text-[#b06000]"}>
                {completedPrereqs}/{totalPrereqs}
              </strong>
            </span>

            <button
              onClick={handleKickoffClick}
              disabled={kickoffLoading}
              className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:shadow-md transition-all ${
                isAllReady
                  ? "bg-[#137333] hover:bg-[#0f5b28]"
                  : "bg-[#0b57d0] hover:bg-[#0842a0]"
              }`}
            >
              <Play className="h-3.5 w-3.5 fill-white" />
              <span>{kickoffLoading ? "Đang khởi động..." : "Sẵn sàng Bắt đầu (Kick-off)"}</span>
              <Sparkles className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Google Tasks style Checklist */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {project.prerequisites.map((prereq) => (
            <div
              key={prereq.id}
              onClick={() => onTogglePrereq(prereq.id)}
              className={`flex items-start gap-3 rounded-xl border p-3.5 cursor-pointer transition-all ${
                prereq.is_completed
                  ? "border-[#ceead6] bg-[#e6f4ea]/40 text-[#5f6368]"
                  : "border-[#e5e7eb] bg-[#f8fafd] hover:bg-[#f0f4f9] hover:border-[#dadce0] text-[#1f1f1f]"
              }`}
            >
              <button type="button" className="mt-0.5 shrink-0 focus:outline-none">
                {prereq.is_completed ? (
                  <CheckCircle2 className="h-4 w-4 text-[#137333]" />
                ) : (
                  <Circle className="h-4 w-4 text-[#5f6368]" />
                )}
              </button>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {getCategoryBadge(prereq.category)}
                  <span
                    className={`text-xs font-semibold truncate ${
                      prereq.is_completed ? "line-through text-[#5f6368]" : "text-[#1f1f1f]"
                    }`}
                  >
                    {prereq.title}
                  </span>
                </div>
                {prereq.description && (
                  <p className="text-xs text-[#5f6368] line-clamp-1">
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

  // ACTIVE or COMPLETED state (Google Calendar Event card)
  return (
    <div className="rounded-2xl border border-[#ceead6] bg-white p-4.5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex items-center gap-3.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e6f4ea] text-[#137333] border border-[#ceead6]">
          <Clock className="h-5 w-5" />
        </div>

        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="h-2 w-2 rounded-full bg-[#137333] animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#137333]">
              {project.status === "COMPLETED" ? "Dự án đã hoàn tất!" : "Đang thực hiện theo lịch trình"}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#5f6368]">
            <span>
              Bắt đầu:{" "}
              <strong className="text-[#1f1f1f]">
                {project.kick_off_date ? new Date(project.kick_off_date).toLocaleDateString("vi-VN") : "N/A"}
              </strong>
            </span>
            <span>•</span>
            <span>
              Hạn chót:{" "}
              <strong className="text-[#b06000] font-semibold">
                {project.estimated_completion_date
                  ? new Date(project.estimated_completion_date).toLocaleDateString("vi-VN")
                  : "N/A"}
              </strong>
            </span>
            {project.extensions.length > 0 && (
              <>
                <span>•</span>
                <span className="text-[#0b57d0] font-medium">
                  Đã gia hạn {project.extensions.length} lần (+
                  {project.extensions.reduce((acc, e) => acc + e.days_added, 0)} ngày)
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        {project.status !== "COMPLETED" && (
          <button
            onClick={onOpenReschedule}
            className="flex items-center gap-1.5 rounded-full border border-[#feefc3] bg-[#fef7e0] px-4 py-2 text-xs font-semibold text-[#b06000] hover:bg-[#feefc3] transition-all shadow-xs"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Xin gia hạn (+days)</span>
          </button>
        )}

        {project.extensions.length > 0 && (
          <button
            onClick={onViewExtensionHistory}
            className="rounded-full border border-[#dadce0] bg-white px-3.5 py-2 text-xs font-medium text-[#3c4043] hover:bg-[#f8fafd] transition-all"
          >
            Lịch sử gia hạn ({project.extensions.length})
          </button>
        )}
      </div>
    </div>
  );
};
