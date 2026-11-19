"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  Circle,
  Clock,
  Star,
  ChevronDown,
  ChevronRight,
  Calendar,
  BarChart2,
  ListTodo,
} from "lucide-react";
import { Phase, ExtensionLog } from "@/types";
import { GanttChart } from "@/components/GanttChart";

interface TimelineRoadmapProps {
  phases: Phase[];
  isPreparationMode: boolean;
  kickoffDate?: string;
  completionDate?: string;
  extensions: ExtensionLog[];
  onToggleTask: (taskId: string) => Promise<void>;
}

export const TimelineRoadmap: React.FC<TimelineRoadmapProps> = ({
  phases,
  isPreparationMode,
  kickoffDate,
  completionDate,
  extensions,
  onToggleTask,
}) => {
  const [activeTab, setActiveTab] = useState<"gantt" | "wbs">("gantt");
  const [collapsedPhases, setCollapsedPhases] = useState<Record<string, boolean>>({});

  const toggleCollapse = (phaseId: string) => {
    setCollapsedPhases((prev) => ({
      ...prev,
      [phaseId]: !prev[phaseId],
    }));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full border border-[#ceead6] bg-[#e6f4ea] text-[#137333]">ĐÃ XONG</span>;
      case "IN_PROGRESS":
        return <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full border border-[#c2e7ff] bg-[#e8f0fe] text-[#1a73e8] animate-pulse">ĐANG THỰC HIỆN</span>;
      case "DELAYED":
        return <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full border border-[#fad2cf] bg-[#fce8e6] text-[#c5221f]">TRỄ HẠN</span>;
      default:
        return <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full border border-[#dadce0] bg-[#f1f3f4] text-[#5f6368]">CHỜ ĐẾN LƯỢT</span>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "CRITICAL":
      case "HIGH":
        return <span className="text-[10px] font-semibold text-[#c5221f] bg-[#fce8e6] px-2 py-0.5 rounded-full">Gấp (P1)</span>;
      case "MEDIUM":
        return <span className="text-[10px] font-semibold text-[#b06000] bg-[#fef7e0] px-2 py-0.5 rounded-full">Vừa (P2)</span>;
      default:
        return <span className="text-[10px] font-semibold text-[#5f6368] bg-[#f1f3f4] px-2 py-0.5 rounded-full">Thấp (P3)</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Tab Switcher Header (Google Calendar vs Google Tasks style) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#e5e7eb]">
        <div>
          <h3 className="text-base font-bold text-[#1f1f1f]">
            Lộ Trình Triển Khai Dự Án
          </h3>
          <p className="text-xs text-[#5f6368]">
            {isPreparationMode
              ? "Lịch trình cụ thể sẽ được kích hoạt ngay khi bạn bấm Bắt đầu (Kick-off)."
              : "Tick chọn các công việc hoàn tất để hệ thống cập nhật tiến độ."}
          </p>
        </div>

        {/* View mode toggle */}
        <div className="flex rounded-full border border-[#dadce0] bg-white p-1 text-xs font-medium shadow-xs self-start sm:self-auto">
          <button
            onClick={() => setActiveTab("gantt")}
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 transition-all ${
              activeTab === "gantt"
                ? "bg-[#c2e7ff] text-[#001d35] font-semibold shadow-xs"
                : "text-[#5f6368] hover:text-[#1f1f1f]"
            }`}
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>Biểu đồ Gantt (Google Calendar)</span>
          </button>

          <button
            onClick={() => setActiveTab("wbs")}
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 transition-all ${
              activeTab === "wbs"
                ? "bg-[#c2e7ff] text-[#001d35] font-semibold shadow-xs"
                : "text-[#5f6368] hover:text-[#1f1f1f]"
            }`}
          >
            <ListTodo className="h-3.5 w-3.5" />
            <span>Danh sách công việc (Tasks)</span>
          </button>
        </div>
      </div>

      {/* Render Active View */}
      {activeTab === "gantt" ? (
        <GanttChart
          phases={phases}
          kickoffDate={kickoffDate}
          completionDate={completionDate}
          extensions={extensions}
        />
      ) : (
        /* WBS View (Google Tasks Style) */
        <div className="space-y-3.5">
          {phases.map((phase) => {
            const isCollapsed = collapsedPhases[phase.id];
            const totalTasks = phase.tasks.length;
            const completedTasks = phase.tasks.filter((t) => t.status === "DONE").length;
            const phaseProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

            return (
              <div
                key={phase.id}
                className={`rounded-2xl border transition-all overflow-hidden bg-white shadow-xs ${
                  phase.status === "IN_PROGRESS"
                    ? "border-[#c2e7ff]"
                    : phase.status === "COMPLETED"
                    ? "border-[#ceead6]"
                    : "border-[#e5e7eb]"
                }`}
              >
                {/* Phase Header Bar */}
                <div
                  onClick={() => toggleCollapse(phase.id)}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 cursor-pointer hover:bg-[#f8fafd] transition-colors select-none"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[#5f6368]">
                      {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </span>

                    <span className="text-xs font-bold text-[#0b57d0]">
                      Phase {phase.phase_number}
                    </span>

                    <span className="text-gray-300">•</span>
                    <h4 className="text-sm font-semibold text-[#1f1f1f]">{phase.title}</h4>
                    {getStatusBadge(phase.status)}
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 pl-7 sm:pl-0">
                    {phase.planned_start_date && phase.planned_end_date ? (
                      <div className="flex items-center gap-1.5 text-xs text-[#5f6368] bg-[#f8fafd] px-3 py-1 rounded-full border border-[#e5e7eb]">
                        <Calendar className="h-3 w-3 text-[#1a73e8]" />
                        <span>
                          {new Date(phase.planned_start_date).toLocaleDateString("vi-VN", { month: "numeric", day: "numeric" })} -{" "}
                          {new Date(phase.planned_end_date).toLocaleDateString("vi-VN", { month: "numeric", day: "numeric" })}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-[#5f6368]">Ước tính: {phase.estimated_hours}h</span>
                    )}

                    {/* Progress Bar */}
                    <div className="w-24 text-right">
                      <span className="text-[11px] font-semibold text-[#5f6368]">
                        {completedTasks}/{totalTasks} ({phaseProgress}%)
                      </span>
                      <div className="w-full bg-[#f1f3f4] rounded-full h-1.5 mt-1 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            phaseProgress === 100 ? "bg-[#137333]" : "bg-[#0b57d0]"
                          }`}
                          style={{ width: `${phaseProgress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tasks List (Google Tasks look & feel) */}
                {!isCollapsed && (
                  <div className="border-t border-[#f1f3f4] bg-[#fdfdfd] divide-y divide-[#f1f3f4]">
                    {phase.tasks.map((task, tIdx) => (
                      <div
                        key={task.id}
                        onClick={() => onToggleTask(task.id)}
                        className={`flex items-center justify-between gap-3 px-5 py-3 transition-colors cursor-pointer hover:bg-[#f8fafd] ${
                          task.status === "DONE" ? "text-[#80868b]" : "text-[#1f1f1f]"
                        }`}
                      >
                        <div className="flex items-center gap-3.5 flex-1 min-w-0">
                          <button
                            type="button"
                            className="shrink-0 focus:outline-none"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleTask(task.id);
                            }}
                          >
                            {task.status === "DONE" ? (
                              <CheckCircle2 className="h-5 w-5 text-[#137333]" />
                            ) : task.status === "IN_PROGRESS" ? (
                              <Clock className="h-5 w-5 text-[#0b57d0] animate-spin" />
                            ) : (
                              <Circle className="h-5 w-5 text-[#80868b] hover:text-[#1f1f1f]" />
                            )}
                          </button>

                          <span className="text-xs text-[#80868b] shrink-0 font-mono">
                            #{phase.phase_number}.{tIdx + 1}
                          </span>

                          <span
                            className={`text-sm font-medium truncate ${
                              task.status === "DONE" ? "line-through text-[#80868b]" : "text-[#1f1f1f]"
                            }`}
                          >
                            {task.title}
                          </span>

                          {task.is_milestone && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-[#feefc3] bg-[#fef7e0] px-2 py-0.5 text-[10px] font-bold text-[#b06000]">
                              <Star className="h-3 w-3 fill-[#b06000]" /> CỘT MỐC
                            </span>
                          )}

                          {getPriorityBadge(task.priority)}
                        </div>

                        <div className="flex items-center gap-3 shrink-0 text-xs text-[#5f6368]">
                          {task.planned_date && (
                            <span className="hidden sm:inline-block">
                              {new Date(task.planned_date).toLocaleDateString("vi-VN", { month: "numeric", day: "numeric" })}
                            </span>
                          )}
                          <span className="rounded-full bg-[#f1f3f4] px-2.5 py-0.5 font-medium text-[#3c4043]">
                            {task.estimated_hours}h
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
