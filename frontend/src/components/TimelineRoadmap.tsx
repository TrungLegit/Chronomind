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
  Layers,
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
  const [activeTab, setActiveTab] = useState<"wbs" | "gantt">("wbs");
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
        return <span className="font-mono text-[9px] px-1.5 py-0.5 rounded border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">DONE</span>;
      case "IN_PROGRESS":
        return <span className="font-mono text-[9px] px-1.5 py-0.5 rounded border border-blue-500/20 bg-blue-500/10 text-blue-400 animate-pulse">RUNNING</span>;
      case "DELAYED":
        return <span className="font-mono text-[9px] px-1.5 py-0.5 rounded border border-rose-500/20 bg-rose-500/10 text-rose-400">DELAYED</span>;
      default:
        return <span className="font-mono text-[9px] px-1.5 py-0.5 rounded border border-slate-700 bg-slate-800 text-slate-400">PENDING</span>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "CRITICAL":
      case "HIGH":
        return <span className="font-mono text-[9px] font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-1 py-0.2 rounded">P1</span>;
      case "MEDIUM":
        return <span className="font-mono text-[9px] font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1 py-0.2 rounded">P2</span>;
      default:
        return <span className="font-mono text-[9px] font-medium text-slate-400 bg-slate-800 border border-slate-700 px-1 py-0.2 rounded">P3</span>;
    }
  };

  return (
    <div className="space-y-3">
      {/* Tab Switcher Header (WBS vs Gantt) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-white/[0.08]">
        <div>
          <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-200">
            Lộ Trình & Tiến Độ Triển Khai
          </h3>
          <p className="text-[11px] text-slate-400">
            {isPreparationMode
              ? "Lịch trình cụ thể sẽ được kích hoạt ngay khi bạn bấm Kick-off."
              : "Tick chọn các task đã hoàn thành để hệ thống cập nhật tiến độ."}
          </p>
        </div>

        {/* View mode toggle */}
        <div className="flex rounded-md border border-white/[0.08] bg-[#0d111a] p-0.5 font-mono text-xs self-start sm:self-auto">
          <button
            onClick={() => setActiveTab("wbs")}
            className={`flex items-center gap-1.5 rounded px-2.5 py-1 transition-colors ${
              activeTab === "wbs" ? "bg-white/[0.1] text-white font-medium" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <ListTodo className="h-3.5 w-3.5" />
            <span>Bảng WBS</span>
          </button>
          <button
            onClick={() => setActiveTab("gantt")}
            className={`flex items-center gap-1.5 rounded px-2.5 py-1 transition-colors ${
              activeTab === "gantt" ? "bg-white/[0.1] text-white font-medium" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <BarChart2 className="h-3.5 w-3.5" />
            <span>Biểu đồ Gantt</span>
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
        /* WBS View (Plane / Linear style) */
        <div className="space-y-3">
          {phases.map((phase) => {
            const isCollapsed = collapsedPhases[phase.id];
            const totalTasks = phase.tasks.length;
            const completedTasks = phase.tasks.filter((t) => t.status === "DONE").length;
            const phaseProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

            return (
              <div
                key={phase.id}
                className={`rounded-lg border transition-colors overflow-hidden ${
                  phase.status === "IN_PROGRESS"
                    ? "border-blue-500/30 bg-[#0d111a]"
                    : phase.status === "COMPLETED"
                    ? "border-emerald-500/20 bg-[#0d111a]"
                    : "border-white/[0.08] bg-[#0d111a]"
                }`}
              >
                {/* Phase Header Bar */}
                <div
                  onClick={() => toggleCollapse(phase.id)}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 cursor-pointer hover:bg-white/[0.02] transition-colors select-none"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-slate-500">
                      {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </span>

                    <span className="font-mono text-xs font-bold text-blue-400">
                      PHASE {phase.phase_number}
                    </span>

                    <span className="text-slate-600">•</span>
                    <h4 className="text-xs font-semibold text-slate-100">{phase.title}</h4>
                    {getStatusBadge(phase.status)}
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 pl-6 sm:pl-0">
                    {phase.planned_start_date && phase.planned_end_date ? (
                      <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-400 bg-[#121824] px-2 py-0.5 rounded border border-white/[0.04]">
                        <Calendar className="h-3 w-3 text-blue-400" />
                        <span>
                          {new Date(phase.planned_start_date).toLocaleDateString("vi-VN", { month: "numeric", day: "numeric" })} -{" "}
                          {new Date(phase.planned_end_date).toLocaleDateString("vi-VN", { month: "numeric", day: "numeric" })}
                        </span>
                      </div>
                    ) : (
                      <span className="font-mono text-[11px] text-slate-500">Ước tính: {phase.estimated_hours}h</span>
                    )}

                    {/* Progress indicator */}
                    <div className="w-20 text-right">
                      <span className="font-mono text-[10px] text-slate-400">
                        {completedTasks}/{totalTasks} ({phaseProgress}%)
                      </span>
                      <div className="w-full bg-slate-800 rounded-full h-1 mt-0.5 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            phaseProgress === 100 ? "bg-emerald-400" : "bg-blue-500"
                          }`}
                          style={{ width: `${phaseProgress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tasks List */}
                {!isCollapsed && (
                  <div className="border-t border-white/[0.04] bg-[#0a0e17]/60 divide-y divide-white/[0.03]">
                    {phase.tasks.map((task, tIdx) => (
                      <div
                        key={task.id}
                        onClick={() => onToggleTask(task.id)}
                        className={`flex items-center justify-between gap-3 px-4 py-2.5 transition-colors cursor-pointer hover:bg-white/[0.02] ${
                          task.status === "DONE" ? "text-slate-500" : "text-slate-200"
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <button
                            type="button"
                            className="shrink-0 focus:outline-none"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleTask(task.id);
                            }}
                          >
                            {task.status === "DONE" ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                            ) : task.status === "IN_PROGRESS" ? (
                              <Clock className="h-4 w-4 text-blue-400 animate-spin" />
                            ) : (
                              <Circle className="h-4 w-4 text-slate-600 hover:text-slate-400" />
                            )}
                          </button>

                          {/* Task ID (BabyAGI style) */}
                          <span className="font-mono text-[10px] text-slate-500 shrink-0">
                            #{phase.phase_number}.{tIdx + 1}
                          </span>

                          <span
                            className={`text-xs font-medium truncate ${
                              task.status === "DONE" ? "line-through text-slate-500" : "text-slate-200"
                            }`}
                          >
                            {task.title}
                          </span>

                          {task.is_milestone && (
                            <span className="inline-flex items-center gap-1 rounded border border-amber-500/20 bg-amber-500/10 px-1.5 py-0.2 font-mono text-[9px] font-semibold text-amber-400">
                              <Star className="h-2.5 w-2.5 fill-amber-400" /> MILESTONE
                            </span>
                          )}

                          {getPriorityBadge(task.priority)}
                        </div>

                        <div className="flex items-center gap-3 shrink-0 font-mono text-[11px] text-slate-400">
                          {task.planned_date && (
                            <span className="hidden sm:inline-block">
                              {new Date(task.planned_date).toLocaleDateString("vi-VN", { month: "numeric", day: "numeric" })}
                            </span>
                          )}
                          <span className="rounded bg-white/[0.04] px-1.5 py-0.5 text-slate-300">
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
