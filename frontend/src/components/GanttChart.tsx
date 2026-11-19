"use client";

import React, { useState, useMemo } from "react";
import { Phase, ExtensionLog } from "@/types";
import { Calendar, ChevronLeft, ChevronRight, Clock, Star, AlertCircle } from "lucide-react";

interface GanttChartProps {
  phases: Phase[];
  kickoffDate?: string;
  completionDate?: string;
  extensions: ExtensionLog[];
}

export const GanttChart: React.FC<GanttChartProps> = ({
  phases,
  kickoffDate,
  completionDate,
  extensions,
}) => {
  const [viewMode, setViewMode] = useState<"days" | "weeks">("days");

  // Determine global timeline boundaries
  const { startDate, endDate, totalDays, datesList } = useMemo(() => {
    let minT = kickoffDate ? new Date(kickoffDate).getTime() : Date.now();
    let maxT = completionDate ? new Date(completionDate).getTime() : minT + 30 * 86400000;

    phases.forEach((p) => {
      if (p.planned_start_date) {
        const t = new Date(p.planned_start_date).getTime();
        if (t < minT) minT = t;
      }
      if (p.planned_end_date) {
        const t = new Date(p.planned_end_date).getTime();
        if (t > maxT) maxT = t;
      }
    });

    // Add 2 days buffer before and 5 days after
    const start = new Date(minT - 2 * 86400000);
    start.setHours(0, 0, 0, 0);

    const end = new Date(maxT + 5 * 86400000);
    end.setHours(23, 59, 59, 999);

    const diffDays = Math.max(Math.ceil((end.getTime() - start.getTime()) / 86400000), 14);

    const list: Date[] = [];
    for (let i = 0; i < diffDays; i++) {
      list.push(new Date(start.getTime() + i * 86400000));
    }

    return { startDate: start, endDate: end, totalDays: diffDays, datesList: list };
  }, [phases, kickoffDate, completionDate]);

  // Pixel calculation
  const dayColWidth = viewMode === "days" ? 38 : 18;
  const chartWidth = totalDays * dayColWidth;

  // Calculate position of a date
  const getX = (dateStr?: string) => {
    if (!dateStr) return 0;
    const t = new Date(dateStr).getTime();
    const diff = (t - startDate.getTime()) / 86400000;
    return Math.max(0, diff * dayColWidth);
  };

  const todayX = useMemo(() => {
    const diff = (Date.now() - startDate.getTime()) / 86400000;
    if (diff < 0 || diff > totalDays) return null;
    return diff * dayColWidth;
  }, [startDate, totalDays, dayColWidth]);

  return (
    <div className="rounded-lg border border-white/[0.08] bg-[#0d111a] overflow-hidden">
      {/* Gantt Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 border-b border-white/[0.06] bg-[#0a0e17]">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-blue-400" />
          <span className="font-mono text-xs font-semibold text-slate-200">
            TIMELINE GANTT (DYNAMIC SCHEDULE)
          </span>
          <span className="text-[11px] text-slate-500 font-mono">
            {totalDays} ngày tổng thể
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Legend */}
          <div className="hidden sm:flex items-center gap-3 text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-blue-500/80" />
              <span>Kế hoạch</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
              <span>Hoàn thành</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-amber-500/80 border border-amber-400/50" />
              <span>Gia hạn (+days)</span>
            </span>
          </div>

          {/* View mode toggle */}
          <div className="flex rounded-md border border-white/[0.08] bg-[#121824] p-0.5 font-mono text-[11px]">
            <button
              onClick={() => setViewMode("days")}
              className={`rounded px-2 py-0.5 transition-colors ${
                viewMode === "days" ? "bg-white/[0.1] text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Ngày
            </button>
            <button
              onClick={() => setViewMode("weeks")}
              className={`rounded px-2 py-0.5 transition-colors ${
                viewMode === "weeks" ? "bg-white/[0.1] text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Thu nhỏ
            </button>
          </div>
        </div>
      </div>

      {/* Main Gantt Body */}
      <div className="overflow-x-auto">
        <div style={{ minWidth: chartWidth + 240 }} className="relative select-none">
          {/* Timeline Header Row */}
          <div className="flex border-b border-white/[0.06] bg-[#0a0e17]/80 text-[10px] font-mono text-slate-400">
            <div className="w-60 shrink-0 px-3 py-2 border-r border-white/[0.06] font-semibold text-slate-300">
              Giai đoạn & Mốc (Phase)
            </div>
            <div className="flex-1 flex relative h-9">
              {datesList.map((d, idx) => {
                const isFirstOfMonth = d.getDate() === 1 || idx === 0;
                const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                return (
                  <div
                    key={idx}
                    style={{ width: dayColWidth }}
                    className={`shrink-0 border-r border-white/[0.03] text-center flex flex-col justify-center ${
                      isWeekend ? "bg-white/[0.015]" : ""
                    }`}
                  >
                    {isFirstOfMonth && (
                      <span className="text-[9px] font-bold text-blue-400 block -mt-1 leading-none">
                        T{d.getMonth() + 1}
                      </span>
                    )}
                    <span className={`text-[10px] ${isWeekend ? "text-slate-500" : "text-slate-300"}`}>
                      {d.getDate()}
                    </span>
                  </div>
                );
              })}

              {/* Today line marker in header */}
              {todayX !== null && (
                <div
                  style={{ left: todayX }}
                  className="absolute top-0 bottom-0 w-px bg-rose-500 z-20 pointer-events-none"
                >
                  <span className="absolute -top-1 -left-4 rounded bg-rose-500 text-[8px] font-bold text-white px-1 leading-tight">
                    Hôm nay
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Phase Rows */}
          {phases.map((phase) => {
            const hasDates = phase.planned_start_date && phase.planned_end_date;
            const startX = hasDates ? getX(phase.planned_start_date) : 0;
            const endX = hasDates ? getX(phase.planned_end_date) : 0;
            const barWidth = Math.max(endX - startX, dayColWidth * 2);

            const totalTasks = phase.tasks.length;
            const completedTasks = phase.tasks.filter((t) => t.status === "DONE").length;
            const progressPct = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

            // Check if this phase had extensions logged
            const phaseExtensions = extensions.filter((e) => e.phase_id === phase.id);
            const totalExtendedDays = phaseExtensions.reduce((acc, e) => acc + e.days_added, 0);

            return (
              <div
                key={phase.id}
                className="flex border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors group h-12 items-center"
              >
                {/* Left label column */}
                <div className="w-60 shrink-0 px-3 py-1.5 border-r border-white/[0.06] flex items-center justify-between">
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[10px] font-semibold text-blue-400">
                        P{phase.phase_number}
                      </span>
                      <span className="text-xs font-medium text-slate-200 truncate block">
                        {phase.title}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-slate-500">
                      {completedTasks}/{totalTasks} tasks • {phase.estimated_hours}h
                    </span>
                  </div>

                  <span
                    className={`font-mono text-[9px] px-1.5 py-0.5 rounded border shrink-0 ${
                      phase.status === "COMPLETED"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : phase.status === "IN_PROGRESS"
                        ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                        : "bg-slate-800 text-slate-400 border-slate-700"
                    }`}
                  >
                    {phase.status === "IN_PROGRESS" ? "RUNNING" : phase.status}
                  </span>
                </div>

                {/* Right timeline bars column */}
                <div className="flex-1 relative h-full flex items-center">
                  {/* Grid background vertical lines */}
                  <div className="absolute inset-0 flex pointer-events-none">
                    {datesList.map((d, idx) => (
                      <div
                        key={idx}
                        style={{ width: dayColWidth }}
                        className={`shrink-0 border-r border-white/[0.02] h-full ${
                          d.getDay() === 0 || d.getDay() === 6 ? "bg-white/[0.01]" : ""
                        }`}
                      />
                    ))}
                  </div>

                  {/* Today vertical line */}
                  {todayX !== null && (
                    <div
                      style={{ left: todayX }}
                      className="absolute top-0 bottom-0 w-px bg-rose-500/70 z-10 pointer-events-none"
                    />
                  )}

                  {/* The Gantt Bar */}
                  {hasDates ? (
                    <div
                      style={{ left: startX, width: barWidth }}
                      className="absolute h-6 rounded border border-white/[0.1] bg-[#1a2333] overflow-hidden flex items-center transition-all group-hover:border-blue-500/50 shadow-xs"
                    >
                      {/* Completed progress fill */}
                      <div
                        style={{ width: `${progressPct}%` }}
                        className={`h-full transition-all duration-300 ${
                          phase.status === "COMPLETED" ? "bg-emerald-500/80" : "bg-blue-600/80"
                        }`}
                      />

                      {/* Extended days stripe pattern if rescheduled */}
                      {totalExtendedDays > 0 && (
                        <div
                          style={{ width: totalExtendedDays * dayColWidth }}
                          title={`Giai đoạn đã gia hạn thêm ${totalExtendedDays} ngày`}
                          className="absolute right-0 top-0 bottom-0 bg-amber-500/20 border-l border-amber-400/50"
                        />
                      )}

                      {/* Label on bar */}
                      <span className="absolute left-2 text-[10px] font-mono text-white/90 whitespace-nowrap pointer-events-none font-medium truncate pr-2">
                        {phase.title} ({Math.round(progressPct)}%)
                      </span>

                      {/* Milestone diamonds */}
                      {phase.tasks
                        .filter((t) => t.is_milestone)
                        .map((m, mIdx) => (
                          <div
                            key={m.id || mIdx}
                            title={`Milestone: ${m.title}`}
                            className="absolute -right-1 top-1/2 -translate-y-1/2 text-amber-400 z-10"
                          >
                            <Star className="h-3 w-3 fill-amber-400" />
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="px-4 text-[11px] font-mono text-slate-500 italic">
                      Lịch trình sẽ được ấn định sau khi bấm Kick-off
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
