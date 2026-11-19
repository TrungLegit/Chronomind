"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Plus,
  Calendar,
  Clock,
  Layers,
  CheckCircle2,
  AlertTriangle,
  FolderKanban,
  Trash2,
  ChevronRight,
  TrendingUp,
  BrainCircuit,
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

  // Handle Project Creation via AI
  const handleCreateProject = async (data: ProjectCreateInput) => {
    const newProj = await api.createProject(data);
    await loadProjects(newProj.id);
  };

  // Handle Prerequisite Toggle
  const handleTogglePrereq = async (prereqId: string) => {
    if (!currentProject) return;
    try {
      await api.togglePrerequisite(prereqId);
      await loadProjectDetail(currentProject.id);
    } catch (err) {
      console.error("Error toggling prerequisite:", err);
    }
  };

  // Handle Task Toggle
  const handleToggleTask = async (taskId: string) => {
    if (!currentProject) return;
    try {
      await api.toggleTask(taskId);
      await loadProjectDetail(currentProject.id);
    } catch (err) {
      console.error("Error toggling task:", err);
    }
  };

  // Handle Kickoff (Smart Trigger)
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

  // Handle Extension
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

  // Handle Delete Project
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Navbar */}
      <Navbar
        projects={projects}
        selectedProjectId={currentProject?.id || null}
        onSelectProject={(id) => loadProjectDetail(id)}
        onOpenNewProject={() => setIsWizardOpen(true)}
      />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400 space-y-3">
            <BrainCircuit className="h-10 w-10 animate-spin text-indigo-400" />
            <p className="text-sm">Đang tải dữ liệu Chronomind...</p>
          </div>
        ) : !currentProject ? (
          /* Empty State / Welcome Hero */
          <div className="py-16 text-center max-w-2xl mx-auto space-y-6">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-indigo-500/20 via-purple-500/20 to-pink-500/20 border border-indigo-500/30 shadow-2xl">
              <Sparkles className="h-10 w-10 text-indigo-400" />
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                AI-Powered Dynamic Project & Deadline Planner
              </h1>
              <p className="text-sm sm:text-base text-slate-400">
                Biến những ý tưởng mơ hồ thành lộ trình kỹ thuật khả thi, tự động phát hiện điểm mù, quản lý Checklist chuẩn bị và kích hoạt Deadline động.
              </p>
            </div>

            <div className="pt-4">
              <button
                onClick={() => setIsWizardOpen(true)}
                className="inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3.5 text-base font-bold text-white shadow-xl shadow-indigo-500/30 hover:from-indigo-500 hover:to-violet-500 transition-all hover:scale-105"
              >
                <Sparkles className="h-5 w-5" />
                <span>Bắt đầu Lập Kế Hoạch Bằng AI</span>
              </button>
            </div>

            {/* Feature highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-10 text-left">
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                <span className="text-xl mb-2 block">🧠</span>
                <h4 className="text-sm font-bold text-white mb-1">AI Feasibility Analyzer</h4>
                <p className="text-xs text-slate-400">
                  Chấm điểm độ khó từ 1-10 và rà soát các điểm mù dễ bị bỏ quên.
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                <span className="text-xl mb-2 block">⏱️</span>
                <h4 className="text-sm font-bold text-white mb-1">Dynamic Deadline</h4>
                <p className="text-xs text-slate-400">
                  Chế độ Preparation không tính giờ cho đến khi bạn sẵn sàng Kick-off.
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                <span className="text-xl mb-2 block">📑</span>
                <h4 className="text-sm font-bold text-white mb-1">Xuất Báo Cáo Tự Động</h4>
                <p className="text-xs text-slate-400">
                  Xuất file Excel (.xlsx) chuẩn WBS và Word (.docx) chuyên nghiệp.
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Active Project Workspace */
          <div className="space-y-7">
            {/* Project Header Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-bold border ${
                      currentProject.status === "PREPARATION"
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        : currentProject.status === "ACTIVE"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                    }`}
                  >
                    {currentProject.status === "PREPARATION"
                      ? "Chờ Chuẩn Bị"
                      : currentProject.status === "ACTIVE"
                      ? "Đang Triển Khai"
                      : "Hoàn Thành"}
                  </span>
                  <span className="text-xs text-slate-500">•</span>
                  <span className="text-xs text-slate-400">
                    Khối lượng: ~<strong>{currentProject.total_estimated_hours}h</strong>
                  </span>
                  <span className="text-xs text-slate-500">•</span>
                  <span className="text-xs text-slate-400">
                    Năng lực: <strong>{currentProject.available_hours_per_week}h/tuần</strong> ({currentProject.skill_level})
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {currentProject.title}
                </h1>

                {currentProject.target_goal && (
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                    <span className="text-indigo-400 font-semibold">Mục tiêu:</span> {currentProject.target_goal}
                  </p>
                )}
              </div>

              {/* Header Actions */}
              <div className="flex items-center gap-3">
                <ExportMenu projectId={currentProject.id} projectTitle={currentProject.title} />

                <button
                  onClick={handleDeleteProject}
                  title="Xóa dự án này"
                  className="rounded-xl border border-slate-800 bg-slate-900 p-2 text-slate-400 hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-400 transition"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Core Feature 1: AI Feasibility & Complexity Card */}
            <FeasibilityCard
              score={currentProject.complexity_score}
              explanation={currentProject.complexity_explanation}
              blindSpots={currentProject.blind_spots}
            />

            {/* Core Feature 2: Smart Trigger (Preparation vs Active) */}
            <PreparationBanner
              project={currentProject}
              onTogglePrereq={handleTogglePrereq}
              onKickoff={handleKickoff}
              onOpenReschedule={() => setIsRescheduleOpen(true)}
              onViewExtensionHistory={() => setIsHistoryOpen(true)}
            />

            {/* Project Overall Progress Bar */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="font-semibold text-slate-300 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-indigo-400" />
                  <span>Tiến độ tổng thể</span>
                </span>
                <span className="font-bold text-indigo-400">{currentProject.progress_percentage}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${currentProject.progress_percentage}%` }}
                />
              </div>
            </div>

            {/* Core Feature 2: Phased Execution Roadmap & WBS */}
            <TimelineRoadmap
              phases={currentProject.phases}
              isPreparationMode={currentProject.status === "PREPARATION"}
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

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-500">
        <p>CHRONOMIND © 2026 • AI-Powered Dynamic Project & Deadline Planner</p>
      </footer>
    </div>
  );
}
