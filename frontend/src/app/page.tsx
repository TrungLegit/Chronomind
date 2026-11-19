"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  Calendar,
  Layers,
  TrendingUp,
  Activity,
  ArrowRight,
  Loader2,
  Sparkles,
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
    <div className="min-h-screen bg-[#f8fafd] text-[#1f1f1f] flex flex-col font-sans selection:bg-[#c2e7ff] selection:text-[#001d35]">
      {/* Google Workspace App Bar */}
      <Navbar
        projects={projects}
        selectedProjectId={currentProject?.id || null}
        onSelectProject={(id) => loadProjectDetail(id)}
        onOpenNewProject={() => setIsWizardOpen(true)}
      />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 py-6 space-y-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-[#5f6368] space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-[#0b57d0]" />
            <span className="text-xs font-medium">Đang tải dữ liệu Chronomind...</span>
          </div>
        ) : !currentProject ? (
          /* Empty Welcoming Launchpad (Google Workspace style) */
          <div className="py-16 text-center max-w-2xl mx-auto space-y-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#eaf1fb] border border-[#c2e7ff] text-[#0b57d0] shadow-xs">
              <Calendar className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-[#1f1f1f] tracking-tight">
                Chronomind • Lập Kế Hoạch & Deadline Dự Án Bằng AI
              </h1>
              <p className="text-sm text-[#5f6368] leading-relaxed">
                Biến ý tưởng thành lộ trình kỹ thuật chi tiết, đánh giá độ khó, quản lý danh sách việc cần chuẩn bị và theo dõi tiến độ trực quan như Google Calendar.
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setIsWizardOpen(true)}
                className="inline-flex items-center gap-2.5 rounded-full bg-[#0b57d0] hover:bg-[#0842a0] px-6 py-3 text-sm font-semibold text-white shadow-sm hover:shadow-md transition-all"
              >
                <Sparkles className="h-4 w-4" />
                <span>Bắt đầu Lập Kế Hoạch Bằng AI</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            {/* 3 Friendly Google-style Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 text-left">
              <div className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-xs">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[#eaf1fb] text-[#1a73e8] mb-3 text-sm font-bold">
                  01
                </span>
                <h4 className="text-sm font-bold text-[#1f1f1f] mb-1">Đánh giá độ khó AI</h4>
                <p className="text-xs text-[#5f6368] leading-relaxed">
                  Chấm điểm từ 1-10 và nhắc nhở các rủi ro bạn chưa tính tới.
                </p>
              </div>

              <div className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-xs">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[#fef7e0] text-[#b06000] mb-3 text-sm font-bold">
                  02
                </span>
                <h4 className="text-sm font-bold text-[#1f1f1f] mb-1">Lịch biểu Gantt</h4>
                <p className="text-xs text-[#5f6368] leading-relaxed">
                  Trực quan như Google Calendar. Tự động lùi hạn khi có sự cố.
                </p>
              </div>

              <div className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-xs">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[#e6f4ea] text-[#137333] mb-3 text-sm font-bold">
                  03
                </span>
                <h4 className="text-sm font-bold text-[#1f1f1f] mb-1">Xuất file Excel & Word</h4>
                <p className="text-xs text-[#5f6368] leading-relaxed">
                  Tải ngay bảng WBS (.xlsx) và báo cáo tiến độ chuẩn chỉnh (.docx).
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Active Project Workspace (Google Workspace theme) */
          <div className="space-y-5">
            {/* Project Header Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#e5e7eb]">
              <div>
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span
                    className={`rounded-full px-3 py-0.5 text-xs font-semibold border ${
                      currentProject.status === "PREPARATION"
                        ? "bg-[#fef7e0] text-[#b06000] border-[#feefc3]"
                        : currentProject.status === "ACTIVE"
                        ? "bg-[#e6f4ea] text-[#137333] border-[#ceead6]"
                        : "bg-[#e8f0fe] text-[#1a73e8] border-[#c2e7ff]"
                    }`}
                  >
                    {currentProject.status === "PREPARATION"
                      ? "Chờ Chuẩn Bị"
                      : currentProject.status === "ACTIVE"
                      ? "Đang Triển Khai"
                      : "Hoàn Tất"}
                  </span>
                  <span className="text-gray-300">•</span>
                  <span className="text-xs text-[#5f6368]">
                    Khối lượng: <strong>{currentProject.total_estimated_hours}h</strong>
                  </span>
                  <span className="text-gray-300">•</span>
                  <span className="text-xs text-[#5f6368]">
                    Quỹ thời gian: <strong>{currentProject.available_hours_per_week}h/tuần</strong> ({currentProject.skill_level})
                  </span>
                </div>

                <h1 className="text-2xl font-bold text-[#1f1f1f] tracking-tight">
                  {currentProject.title}
                </h1>

                {currentProject.target_goal && (
                  <p className="text-xs text-[#5f6368] mt-1 flex items-center gap-1.5">
                    <span className="font-semibold text-[#0b57d0]">Mục tiêu đầu ra:</span> {currentProject.target_goal}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 shrink-0">
                <ExportMenu projectId={currentProject.id} projectTitle={currentProject.title} />

                <button
                  onClick={handleDeleteProject}
                  title="Xóa dự án này"
                  className="h-9 w-9 inline-flex items-center justify-center rounded-full border border-[#dadce0] bg-white text-[#5f6368] hover:text-[#ea4335] hover:border-[#fad2cf] hover:bg-[#fce8e6] transition-all shadow-xs"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Core Feature 1: Feasibility Card (Metrics + AI Review + Blind Spots) */}
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

            {/* Overall Progress Bar */}
            <div className="rounded-2xl border border-[#e5e7eb] bg-white px-5 py-3.5 shadow-xs">
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="font-semibold text-[#1f1f1f] flex items-center gap-1.5">
                  <Activity className="h-4 w-4 text-[#0b57d0]" />
                  <span>Tiến độ tổng thể dự án</span>
                </span>
                <span className="font-bold text-[#0b57d0]">
                  {currentProject.progress_percentage}% Hoàn thành
                </span>
              </div>
              <div className="w-full bg-[#f1f3f4] rounded-full h-2 overflow-hidden">
                <div
                  className="bg-[#0b57d0] h-full rounded-full transition-all duration-300"
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

      {/* Google Workspace Footer */}
      <footer className="border-t border-[#e5e7eb] bg-white py-4 text-center text-xs text-[#5f6368]">
        Chronomind • AI Dynamic Project & Deadline Planner © 2026
      </footer>
    </div>
  );
}
