"use client";

import React, { useState, useMemo } from "react";
import { Phase, ExtensionLog } from "@/types";
import { Calendar, ChevronLeft, ChevronRight, Star, Clock } from "lucide-react";

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

  // Determine timeline boundaries
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

    const start = new Date(minT - 2 * 86400000);
    start.setHours(0, 0, 0, 0);

    const end = new Date(maxT + 4 * 86400000);
    end.setHours(23, 59, 59, 999);

    const diffDays = Math.max(Math.ceil((end.getTime() - start.getTime()) / 86400000), 14);

    const list: Date[] = [];
    for (let i = 0; i < diffDays; i++) {
      list.push(new Date(start.getTime() + i * 86400000));
    }

    return { startDate: start, endDate: end, totalDays: diffDays, datesList: list };
  }, [phases, kickoffDate, completionDate]);

  const dayColWidth = viewMode === "days" ? 42 : 22;
  const chartWidth = totalDays * dayColWidth;

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
    <div className="rounded-2xl border border-[#e5e7eb] bg-white overflow-hidden shadow-xs">
      {/* Mobile Swipe Hint */}
      <div className="sm:hidden flex items-center justify-between px-4 py-1.5 bg-[#f0f4f9] border-b border-[#dadce0] text-[11px] text-[#5f6368]">
        <span>👉 Vuốt ngang để xem toàn bộ lịch trình</span>
        <span className="font-semibold text-[#0b57d0]">Tổng {totalDays} ngày</span>
      </div>

      {/* Calendar Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-[#f1f3f4] bg-[#f8fafd]">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#eaf1fb] text-[#0b57d0]">
            <Calendar className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#1f1f1f]">
              LỊCH BIỂU TIẾN ĐỘ (GOOGLE CALENDAR VIEW)
            </h4>
            <span className="text-[11px] text-[#5f6368]">
              Tổng thời lượng: {totalDays} ngày
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Legend */}
          <div className="hidden sm:flex items-center gap-3 text-xs text-[#5f6368]">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#1a73e8]" />
              <span>Kế hoạch</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#137333]" />
              <span>Hoàn tất</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#fbbc04]" />
              <span>Gia hạn (+days)</span>
            </span>
          </div>

          {/* View mode toggle */}
          <div className="flex rounded-full border border-[#dadce0] bg-white p-0.5 text-xs font-medium">
            <button
              onClick={() => setViewMode("days")}
              className={`rounded-full px-3 py-1 transition-all ${
                viewMode === "days" ? "bg-[#c2e7ff] text-[#001d35] font-semibold" : "text-[#5f6368] hover:text-[#1f1f1f]"
              }`}
            >
              Theo ngày
            </button>
            <button
              onClick={() => setViewMode("weeks")}
              className={`rounded-full px-3 py-1 transition-all ${
                viewMode === "weeks" ? "bg-[#c2e7ff] text-[#001d35] font-semibold" : "text-[#5f6368] hover:text-[#1f1f1f]"
              }`}
            >
              Thu nhỏ
            </button>
          </div>
        </div>
      </div>

      {/* Main Gantt Body */}
      <div className="overflow-x-auto">
        <div style={{ minWidth: chartWidth + 260 }} className="relative select-none">
          {/* Timeline Days Header */}
          <div className="flex border-b border-[#e5e7eb] bg-[#f8fafd] text-xs font-medium text-[#5f6368]">
            <div className="w-64 shrink-0 px-4 py-2.5 border-r border-[#e5e7eb] font-semibold text-[#1f1f1f]">
              Giai đoạn thực hiện (Phase)
            </div>
            <div className="flex-1 flex relative h-10">
              {datesList.map((d, idx) => {
                const isFirstOfMonth = d.getDate() === 1 || idx === 0;
                const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                return (
                  <div
                    key={idx}
                    style={{ width: dayColWidth }}
                    className={`shrink-0 border-r border-[#f1f3f4] text-center flex flex-col justify-center ${
                      isWeekend ? "bg-[#f1f3f4]/50" : ""
                    }`}
                  >
                    {isFirstOfMonth && (
                      <span className="text-[9px] font-bold text-[#1a73e8] block leading-none">
                        T{d.getMonth() + 1}
                      </span>
                    )}
                    <span className={`text-[11px] font-medium ${isWeekend ? "text-[#80868b]" : "text-[#1f1f1f]"}`}>
                      {d.getDate()}
                    </span>
                  </div>
                );
              })}

              {/* Today line marker */}
              {todayX !== null && (
                <div
                  style={{ left: todayX }}
                  className="absolute top-0 bottom-0 w-0.5 bg-[#ea4335] z-20 pointer-events-none"
                >
                  <span className="absolute -top-1 -left-5 rounded-full bg-[#ea4335] text-[9px] font-bold text-white px-1.5 py-0.2 shadow-xs leading-tight">
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

            const phaseExtensions = extensions.filter((e) => e.phase_id === phase.id);
            const totalExtendedDays = phaseExtensions.reduce((acc, e) => acc + e.days_added, 0);

            return (
              <div
                key={phase.id}
                className="flex border-b border-[#f1f3f4] hover:bg-[#f8fafd] transition-colors h-14 items-center group"
              >
                {/* Left Phase Column */}
                <div className="w-64 shrink-0 px-4 py-2 border-r border-[#e5e7eb] flex items-center justify-between">
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-[#0b57d0]">
                        Phase {phase.phase_number}
                      </span>
                      <span className="text-xs font-medium text-[#1f1f1f] truncate block">
                        {phase.title}
                      </span>
                    </div>
                    <span className="text-[11px] text-[#5f6368]">
                      {completedTasks}/{totalTasks} việc • {phase.estimated_hours}h
                    </span>
                  </div>

                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 border ${
                      phase.status === "COMPLETED"
                        ? "bg-[#e6f4ea] text-[#137333] border-[#ceead6]"
                        : phase.status === "IN_PROGRESS"
                        ? "bg-[#e8f0fe] text-[#1a73e8] border-[#c2e7ff]"
                        : "bg-[#f1f3f4] text-[#5f6368] border-[#dadce0]"
                    }`}
                  >
                    {phase.status === "IN_PROGRESS" ? "ĐANG LÀM" : phase.status === "COMPLETED" ? "XONG" : "CHỜ"}
                  </span>
                </div>

                {/* Right Calendar Event Bars */}
                <div className="flex-1 relative h-full flex items-center">
                  {/* Grid Lines */}
                  <div className="absolute inset-0 flex pointer-events-none">
                    {datesList.map((d, idx) => (
                      <div
                        key={idx}
                        style={{ width: dayColWidth }}
                        className={`shrink-0 border-r border-[#f1f3f4] h-full ${
                          d.getDay() === 0 || d.getDay() === 6 ? "bg-[#f1f3f4]/20" : ""
                        }`}
                      />
                    ))}
                  </div>

                  {todayX !== null && (
                    <div
                      style={{ left: todayX }}
                      className="absolute top-0 bottom-0 w-0.5 bg-[#ea4335]/70 z-10 pointer-events-none"
                    />
                  )}

                  {/* Google Calendar Event Bar */}
                  {hasDates ? (
                    <div
                      style={{ left: startX, width: barWidth }}
                      className={`absolute h-7 rounded-xl border flex items-center px-2.5 transition-all shadow-xs group-hover:shadow-sm ${
                        phase.status === "COMPLETED"
                          ? "bg-[#e6f4ea] border-[#ceead6] text-[#137333]"
                          : "bg-[#c2e7ff] border-[#7fcfff] text-[#001d35]"
                      }`}
                    >
                      {/* Completed progress fill bar */}
                      <div
                        style={{ width: `${progressPct}%` }}
                        className={`absolute left-0 top-0 bottom-0 rounded-l-xl opacity-30 ${
                          phase.status === "COMPLETED" ? "bg-[#137333]" : "bg-[#0b57d0]"
                        }`}
                      />

                      {/* Extended days highlight */}
                      {totalExtendedDays > 0 && (
                        <div
                          style={{ width: totalExtendedDays * dayColWidth }}
                          title={`Giai đoạn này đã gia hạn thêm ${totalExtendedDays} ngày`}
                          className="absolute right-0 top-0 bottom-0 bg-[#fef7e0] border-l border-[#fbbc04] rounded-r-xl"
                        />
                      )}

                      {/* Bar Content */}
                      <span className="relative z-10 text-xs font-semibold truncate pr-2">
                        {phase.title} ({Math.round(progressPct)}%)
                      </span>

                      {/* Milestone Stars */}
                      {phase.tasks
                        .filter((t) => t.is_milestone)
                        .map((m, mIdx) => (
                          <div
                            key={m.id || mIdx}
                            title={`Cột mốc: ${m.title}`}
                            className="absolute -right-2 top-1/2 -translate-y-1/2 text-[#fbbc04] z-10 bg-white rounded-full p-0.5 shadow-xs"
                          >
                            <Star className="h-3.5 w-3.5 fill-[#fbbc04]" />
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="px-5 text-xs text-[#5f6368] italic">
                      Lịch trình sẽ xuất hiện sau khi bấm Bắt đầu (Kick-off)
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
