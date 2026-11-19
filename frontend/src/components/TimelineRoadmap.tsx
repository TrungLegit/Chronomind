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
  AlertCircle,
  Flag,
} from "lucide-react";
import { Phase, Task } from "@/types";

interface TimelineRoadmapProps {
  phases: Phase[];
  isPreparationMode: boolean;
  onToggleTask: (taskId: string) => Promise<void>;
}

export const TimelineRoadmap: React.FC<TimelineRoadmapProps> = ({
  phases,
  isPreparationMode,
  onToggleTask,
}) => {
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
        return <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">Hoàn thành</span>;
      case "IN_PROGRESS":
        return <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-400 border border-blue-500/20 animate-pulse">Đang thực hiện</span>;
      case "DELAYED":
        return <span className="rounded-full bg-rose-500/10 px-2.5 py-0.5 text-xs font-semibold text-rose-400 border border-rose-500/20">Trễ tiến độ</span>;
      default:
        return <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-medium text-slate-400">Chờ đến lượt</span>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "HIGH":
      case "CRITICAL":
        return <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded">Ưu tiên cao</span>;
      case "MEDIUM":
        return <span className="text-[10px] font-medium text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">Trung bình</span>;
      default:
        return <span className="text-[10px] font-medium text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">Thấp</span>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">Lộ Trình Triển Khai (Phased Roadmap & WBS)</h3>
          <p className="text-xs text-slate-400">
            {isPreparationMode
              ? "Lịch trình cụ thể sẽ được kích hoạt ngay khi bạn bấm Kick-off."
              : "Tick chọn các task đã hoàn thành để hệ thống cập nhật tiến độ."}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {phases.map((phase) => {
          const isCollapsed = collapsedPhases[phase.id];
          const totalTasks = phase.tasks.length;
          const completedTasks = phase.tasks.filter((t) => t.status === "DONE").length;
          const phaseProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

          return (
            <div
              key={phase.id}
              className={`rounded-2xl border transition-all overflow-hidden ${
                phase.status === "IN_PROGRESS"
                  ? "border-indigo-500/40 bg-slate-900/90 shadow-lg shadow-indigo-500/5"
                  : phase.status === "COMPLETED"
                  ? "border-emerald-500/30 bg-slate-900/50"
                  : "border-slate-800 bg-slate-900/40"
              }`}
            >
              {/* Phase Header Bar */}
              <div
                onClick={() => toggleCollapse(phase.id)}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 cursor-pointer hover:bg-slate-800/40 transition select-none"
              >
                <div className="flex items-start sm:items-center gap-3">
                  <div className="mt-0.5 sm:mt-0 text-slate-400">
                    {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                        Phase {phase.phase_number}
                      </span>
                      <span>•</span>
                      {getStatusBadge(phase.status)}
                    </div>
                    <h4 className="text-base font-bold text-white">{phase.title}</h4>
                    {phase.description && (
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{phase.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 pl-8 sm:pl-0">
                  {/* Timeline range */}
                  {phase.planned_start_date && phase.planned_end_date ? (
                    <div className="flex items-center gap-1.5 text-xs text-slate-300 bg-slate-950/60 px-2.5 py-1 rounded-lg border border-slate-800">
                      <Calendar className="h-3.5 w-3.5 text-indigo-400" />
                      <span>
                        {new Date(phase.planned_start_date).toLocaleDateString("vi-VN", { month: "numeric", day: "numeric" })} -{" "}
                        {new Date(phase.planned_end_date).toLocaleDateString("vi-VN", { month: "numeric", day: "numeric" })}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-500">Ước tính: {phase.estimated_hours}h</span>
                  )}

                  {/* Mini Progress */}
                  <div className="w-24 text-right">
                    <span className="text-xs font-bold text-slate-300">
                      {completedTasks}/{totalTasks} task
                    </span>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 mt-1 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          phaseProgress === 100 ? "bg-emerald-400" : "bg-indigo-500"
                        }`}
                        style={{ width: `${phaseProgress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Tasks List */}
              {!isCollapsed && (
                <div className="border-t border-slate-800/80 bg-slate-950/40 p-4 space-y-2.5">
                  {phase.tasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => onToggleTask(task.id)}
                      className={`flex items-start justify-between gap-3 p-3 rounded-xl border transition cursor-pointer ${
                        task.status === "DONE"
                          ? "border-emerald-500/20 bg-emerald-950/10 text-slate-400"
                          : task.status === "IN_PROGRESS"
                          ? "border-indigo-500/30 bg-indigo-950/20 text-white"
                          : "border-slate-800/80 bg-slate-900/60 hover:border-slate-700 text-slate-200"
                      }`}
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <button
                          type="button"
                          className="mt-0.5 shrink-0 focus:outline-none"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleTask(task.id);
                          }}
                        >
                          {task.status === "DONE" ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                          ) : task.status === "IN_PROGRESS" ? (
                            <Clock className="h-5 w-5 text-blue-400 animate-spin" />
                          ) : (
                            <Circle className="h-5 w-5 text-slate-600 hover:text-slate-400" />
                          )}
                        </button>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-sm font-medium ${
                                task.status === "DONE" ? "line-through text-slate-500" : "text-white"
                              }`}
                            >
                              {task.title}
                            </span>
                            {task.is_milestone && (
                              <span className="flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/20">
                                <Star className="h-3 w-3 fill-amber-400" /> Milestone
                              </span>
                            )}
                            {getPriorityBadge(task.priority)}
                          </div>
                          {task.description && (
                            <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                              {task.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 text-xs text-slate-400">
                        {task.planned_date && (
                          <span className="hidden sm:inline-block">
                            {new Date(task.planned_date).toLocaleDateString("vi-VN", { month: "numeric", day: "numeric" })}
                          </span>
                        )}
                        <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-[11px] text-slate-300">
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
    </div>
  );
};
