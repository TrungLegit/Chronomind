"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  Terminal,
  Calendar,
  Layers,
  TrendingUp,
  Activity,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { ProjectWizardModal } from "@/components/ProjectWizardModal";
import { FeasibilityCard } from "@/components/FeasibilityCard";
import { PreparationBanner } from "@/components/PreparationBanner";
import { TimelineRoadmap } from "@/components/TimelineRoadmap";
import { RescheduleModal } from "@/components/RescheduleModal";
import { ExtensionHistoryDrawer } from "@/components/ExtensionHistoryDrawer";
import { ExportMenu } from "@/components/ExportMenu";
import { api } from "@/services/api";
import { Project, ProjectSummary, ProjectCreateInput, ExtensionInput } from "@/types";

export default function Home() {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isWizardOpen, setIsWizardOpen] = useState<boolean>(false);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);

  // Load project list
  const loadProjects = async (selectId?: string) => {
    try {
      const list = await api.getProjects();
      setProjects(list);
      if (list.length > 0) {
        const idToLoad = selectId || (currentProject ? currentProject.id : list[0].id);
        const exists = list.some((p) => p.id === idToLoad);
        loadProjectDetail(exists ? idToLoad : list[0].id);
      } else {
        setCurrentProject(null);
      }
    } catch (err) {
      console.error("Error loading projects:", err);
    } finally {
      setLoading(false);
    }
  };

  // Load specific project details
  const loadProjectDetail = async (id: string) => {
    try {
      const detail = await api.getProject(id);
      setCurrentProject(detail);
    } catch (err) {
      console.error("Error loading project detail:", err);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleCreateProject = async (data: ProjectCreateInput) => {
    const newProj = await api.createProject(data);
    await loadProjects(newProj.id);
  };

  const handleTogglePrereq = async (prereqId: string) => {
    if (!currentProject) return;
    try {
      await api.togglePrerequisite(prereqId);
      await loadProjectDetail(currentProject.id);
    } catch (err) {
      console.error("Error toggling prerequisite:", err);
    }
  };

  const handleToggleTask = async (taskId: string) => {
    if (!currentProject) return;
    try {
      await api.toggleTask(taskId);
      await loadProjectDetail(currentProject.id);
    } catch (err) {
      console.error("Error toggling task:", err);
    }
  };

  const handleKickoff = async () => {
    if (!currentProject) return;
    try {
      const updated = await api.kickoffProject(currentProject.id);
      setCurrentProject(updated);
      await loadProjects(currentProject.id);
    } catch (err) {
      console.error("Error kicking off project:", err);
    }
  };

  const handleReschedule = async (data: ExtensionInput) => {
    if (!currentProject) return;
    try {
      await api.extendProject(currentProject.id, data);
      await loadProjectDetail(currentProject.id);
      await loadProjects(currentProject.id);
    } catch (err) {
      console.error("Error extending project:", err);
    }
  };

  const handleDeleteProject = async () => {
    if (!currentProject) return;
    if (!confirm(`Bạn có chắc muốn xóa dự án "${currentProject.title}"?`)) return;
    try {
      await api.deleteProject(currentProject.id);
      await loadProjects();
    } catch (err) {
      alert("Không thể xóa dự án.");
    }
  };

  return (
    <div className="min-h-screen bg-[#080b11] text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Navbar */}
      <Navbar
        projects={projects}
        selectedProjectId={currentProject?.id || null}
        onSelectProject={(id) => loadProjectDetail(id)}
        onOpenNewProject={() => setIsWizardOpen(true)}
      />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 py-6 space-y-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-500 space-y-3 font-mono text-xs">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            <span>CONNECTING TO CHRONOMIND ENGINE...</span>
          </div>
        ) : !currentProject ? (
          /* Empty Launchpad / Welcoming Workbench */
          <div className="py-16 text-center max-w-2xl mx-auto space-y-6">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg border border-white/[0.1] bg-[#121824] text-blue-400">
              <Terminal className="h-7 w-7" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight">
                Chronomind • Dynamic Project & Deadline Planner
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Hệ thống AI Project Manager: Phân rã ý tưởng thành WBS, tính toán độ khó kỹ thuật, thiết lập checklist tiền dự án, kích hoạt Deadline động và hiển thị biểu đồ Gantt.
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setIsWizardOpen(true)}
                className="inline-flex h-9 items-center gap-2 rounded-md bg-blue-600 px-4 text-xs font-medium text-white shadow-xs hover:bg-blue-500 transition-colors"
              >
                <span>Bắt đầu Lập Kế Hoạch Bằng AI</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Asymmetrical Feature Matrix */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 text-left">
              <div className="rounded-lg border border-white/[0.08] bg-[#0d111a] p-3.5">
                <span className="font-mono text-[10px] font-semibold uppercase text-blue-400 block mb-1">
                  01 // ANALYZER
                </span>
                <h4 className="text-xs font-semibold text-slate-200 mb-1">AI Feasibility & Blind Spots</h4>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Chấm điểm độ khó 1-10 và liệt kê các điểm mù người dùng thường bỏ quên.
                </p>
              </div>

              <div className="rounded-lg border border-white/[0.08] bg-[#0d111a] p-3.5">
                <span className="font-mono text-[10px] font-semibold uppercase text-amber-400 block mb-1">
                  02 // DYNAMIC CLOCK
                </span>
                <h4 className="text-xs font-semibold text-slate-200 mb-1">Smart Trigger & Gantt</h4>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Chế độ Preparation không tính giờ. Tự động dời lịch khi xin gia hạn.
                </p>
              </div>

              <div className="rounded-lg border border-white/[0.08] bg-[#0d111a] p-3.5">
                <span className="font-mono text-[10px] font-semibold uppercase text-emerald-400 block mb-1">
                  03 // EXPORTER
                </span>
                <h4 className="text-xs font-semibold text-slate-200 mb-1">Excel WBS & Word Report</h4>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Xuất file `.xlsx` định dạng màu chuẩn và `.docx` báo cáo tiến độ hoàn chỉnh.
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Active Project Workspace */
          <div className="space-y-6">
            {/* Top Engineering Context Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-blue-400 font-semibold">
                    PROJECT WORKSPACE
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="font-mono text-[10px] text-slate-400">
                    ID: #{currentProject.id.slice(0, 8)}
                  </span>
                </div>

                <h1 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight">
                  {currentProject.title}
                </h1>

                {currentProject.target_goal && (
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5 font-mono">
                    <span className="text-slate-500">Mục tiêu:</span> {currentProject.target_goal}
                  </p>
                )}
              </div>

              {/* Header Action Tools */}
              <div className="flex items-center gap-2 shrink-0">
                <ExportMenu projectId={currentProject.id} projectTitle={currentProject.title} />

                <button
                  onClick={handleDeleteProject}
                  title="Xóa dự án này"
                  className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-white/[0.08] bg-[#121824] text-slate-400 hover:border-rose-500/40 hover:text-rose-400 transition-colors shadow-xs"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Core Feature 1: Feasibility Card (Tremor KPI Row + Blind Spots) */}
            <FeasibilityCard
              score={currentProject.complexity_score}
              explanation={currentProject.complexity_explanation}
              blindSpots={currentProject.blind_spots}
              totalHours={currentProject.total_estimated_hours}
              hoursPerWeek={currentProject.available_hours_per_week}
              skillLevel={currentProject.skill_level}
            />

            {/* Core Feature 2: Smart Trigger (Preparation Checklist vs Active Timeline) */}
            <PreparationBanner
              project={currentProject}
              onTogglePrereq={handleTogglePrereq}
              onKickoff={handleKickoff}
              onOpenReschedule={() => setIsRescheduleOpen(true)}
              onViewExtensionHistory={() => setIsHistoryOpen(true)}
            />

            {/* Overall Progress Minimal Bar */}
            <div className="rounded-lg border border-white/[0.08] bg-[#0d111a] px-4 py-3">
              <div className="flex justify-between items-center font-mono text-[11px] mb-1.5">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-blue-400" />
                  <span>TIẾN ĐỘ THỰC HIỆN TỔNG THỂ</span>
                </span>
                <span className="font-bold text-slate-200 tabular-nums">
                  {currentProject.progress_percentage}% HOÀN TẤT
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-blue-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${currentProject.progress_percentage}%` }}
                />
              </div>
            </div>

            {/* Core Feature 2 & 3: WBS Roadmap & Gantt Chart View */}
            <TimelineRoadmap
              phases={currentProject.phases}
              isPreparationMode={currentProject.status === "PREPARATION"}
              kickoffDate={currentProject.kick_off_date}
              completionDate={currentProject.estimated_completion_date}
              extensions={currentProject.extensions}
              onToggleTask={handleToggleTask}
            />
          </div>
        )}
      </main>

      {/* Modals & Drawers */}
      <ProjectWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onSubmit={handleCreateProject}
      />

      {currentProject && (
        <>
          <RescheduleModal
            isOpen={isRescheduleOpen}
            phases={currentProject.phases}
            onClose={() => setIsRescheduleOpen(false)}
            onSubmit={handleReschedule}
          />

          <ExtensionHistoryDrawer
            isOpen={isHistoryOpen}
            extensions={currentProject.extensions}
            onClose={() => setIsHistoryOpen(false)}
          />
        </>
      )}

      {/* Clean Technical Footer */}
      <footer className="border-t border-white/[0.08] py-4 text-center font-mono text-[11px] text-slate-500">
        CHRONOMIND • PRECISION ENGINEERING PROJECT PLANNER © 2026
      </footer>
    </div>
  );
}
