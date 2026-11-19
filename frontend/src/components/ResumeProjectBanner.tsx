"use client";

import React from "react";
import { Clock, Play, ArrowRight, CheckCircle2, History, X, Sparkles } from "lucide-react";

interface ResumeProjectBannerProps {
  recentData: {
    project: {
      id: string;
      title: string;
      description?: string;
      status: string;
      progress_percentage: number;
      total_tasks: number;
      completed_tasks: number;
      updated_at?: string;
    };
    next_task?: {
      id: string;
      title: string;
      phase_title: string;
      phase_number: number;
      estimated_hours: number;
    } | null;
  };
  currentProjectId?: string | null;
  onResume: (projectId: string) => void;
  onDismiss: () => void;
}

export const ResumeProjectBanner: React.FC<ResumeProjectBannerProps> = ({
  recentData,
  currentProjectId,
  onResume,
  onDismiss,
}) => {
  const { project, next_task } = recentData;

  // Don't show banner if user is already actively viewing this project
  if (currentProjectId === project.id) return null;

  return (
    <div className="rounded-2xl border border-[#c2e7ff] bg-gradient-to-r from-[#eaf1fb] to-[#f0f4f9] p-5 shadow-xs transition-all relative overflow-hidden">
      {/* Subtle Google colored decorative bar at top */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#4285f4] via-[#34a853] via-[#fbbc05] to-[#ea4335]" />

      <button
        onClick={onDismiss}
        title="Đóng thông báo này"
        className="absolute right-3.5 top-3.5 rounded-full p-1.5 text-[#5f6368] hover:bg-white/80 hover:text-[#1f1f1f] transition-colors"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-[#0b57d0] animate-ping" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#0b57d0]">
              GHI NHỚ PHIÊN LÀM VIỆC GẦN NHẤT
            </span>
            <span className="text-xs text-[#5f6368]">•</span>
            <span className="text-xs text-[#5f6368]">
              {project.updated_at
                ? `Cập nhật lúc: ${new Date(project.updated_at).toLocaleTimeString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })} ngày ${new Date(project.updated_at).toLocaleDateString("vi-VN")}`
                : "Gần đây"}
            </span>
          </div>

          <h3 className="text-base font-bold text-[#1f1f1f]">
            Bạn có muốn tiếp tục dự án &quot;{project.title}&quot;?
          </h3>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#444746]">
            <span>
              Tiến độ: <strong className="text-[#0b57d0]">{project.progress_percentage}%</strong> (
              {project.completed_tasks}/{project.total_tasks} công việc)
            </span>
            {next_task && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1 font-medium text-[#1f1f1f]">
                  📌 Việc cần làm tiếp theo:{" "}
                  <span className="text-[#0b57d0] underline">
                    {next_task.title}
                  </span>{" "}
                  ({next_task.phase_title})
                </span>
              </>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => onResume(project.id)}
            className="flex items-center gap-2 rounded-full bg-[#0b57d0] hover:bg-[#0842a0] text-white px-5 py-2.5 text-xs font-semibold shadow-xs hover:shadow-md transition-all"
          >
            <Play className="h-3.5 w-3.5 fill-white" />
            <span>Tiếp tục dự án này</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
