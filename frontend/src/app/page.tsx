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
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  Clock,
  ShieldAlert,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { ProjectWizardModal } from "@/components/ProjectWizardModal";
import { FeasibilityCard } from "@/components/FeasibilityCard";
import { PreparationBanner } from "@/components/PreparationBanner";
import { TimelineRoadmap } from "@/components/TimelineRoadmap";
import { RescheduleModal } from "@/components/RescheduleModal";
import { ExtensionHistoryDrawer } from "@/components/ExtensionHistoryDrawer";
import { ExportMenu } from "@/components/ExportMenu";
import { ResumeProjectBanner } from "@/components/ResumeProjectBanner";
import { GoogleCalendarModal } from "@/components/GoogleCalendarModal";
import { useDeviceAdaptive } from "@/hooks/useDeviceAdaptive";
import { api } from "@/services/api";
import { Project, ProjectSummary, ProjectCreateInput, ExtensionInput } from "@/types";

export default function Home() {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isWizardOpen, setIsWizardOpen] = useState<boolean>(false);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(false);
  const [isGoogleConnected, setIsGoogleConnected] = useState<boolean>(false);
  const [recentSession, setRecentSession] = useState<{
    project: any;
    next_task: any;
  } | null>(null);
  const [showResumeBanner, setShowResumeBanner] = useState<boolean>(true);
  const [backendConnecting, setBackendConnecting] = useState<boolean>(false);

  // Real-time device form factor adaptation (Mobile, Z Fold, iPhone/Surface Duo, Desktop)
  const { isMobile, isFoldNarrow, isFoldUnfolded, isDualScreen } = useDeviceAdaptive();

  const loadProjects = async (selectId?: string) => {
    try {
      const [list, session] = await Promise.all([
        api.getProjects(),
        api.getLastActiveProject(),
      ]);

      setProjects(list);
      setBackendConnecting(false);

      // Check Google Calendar connection status
      api.getGoogleStatus().then((st) => {
        setIsGoogleConnected(Boolean(st && st.is_connected));
      }).catch(() => {});

      if (session && session.has_recent && session.project) {
        setRecentSession({
          project: session.project,
          next_task: session.next_task,
        });
      }

      if (list.length > 0) {
        const savedLocalId = typeof window !== "undefined" ? localStorage.getItem("chronomind_last_active_project_id") : null;
        const candidateId = selectId || savedLocalId || (session?.project?.id) || list[0].id;
        const exists = list.some((p) => p.id === candidateId);
        const idToLoad = exists ? candidateId : list[0].id;
        loadProjectDetail(idToLoad);
      } else {
        setCurrentProject(null);
      }
    } catch (err) {
      console.warn("Backend not ready yet:", err);
      setBackendConnecting(true);
    } finally {
      setLoading(false);
    }
  };

  const loadProjectDetail = async (id: string) => {
    try {
      const detail = await api.getProject(id);
      setCurrentProject(detail);
      if (typeof window !== "undefined") {
        localStorage.setItem("chronomind_last_active_project_id", id);
      }
      api.markProjectAsActive(id);
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
    <div className="min-h-screen bg-[#f8fafd] text-[#1f1f1f] flex flex-col font-sans selection:bg-[#c2e7ff] selection:text-[#001d35] antialiased">
      {/* Google Workspace App Bar */}
      <Navbar
        projects={projects}
        selectedProjectId={currentProject?.id || null}
        onSelectProject={(id) => loadProjectDetail(id)}
        onOpenNewProject={() => setIsWizardOpen(true)}
      />

      <main
        className={`flex-1 mx-auto w-full max-w-7xl space-y-5 ${
          isFoldNarrow
            ? "px-2.5 py-3"
            : isMobile
            ? "px-3.5 py-4"
            : "px-4 sm:px-6 py-6"
        }`}
      >
        {/* Backend Connecting Banner (Google Workspace Style) */}
        {backendConnecting && (
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-[#fef7e0] border border-[#feefc3] p-3.5 text-xs text-[#b06000] shadow-xs">
            <div className="flex items-center gap-2.5">
              <RefreshCw className="h-4 w-4 animate-spin text-[#b06000]" />
              <span>Máy chủ Backend đang khởi chạy... Tự động thử lại khi hoàn tất.</span>
            </div>
            <button
              onClick={() => loadProjects()}
              className="rounded-full bg-white border border-[#feefc3] px-3 py-1 font-semibold text-xs text-[#b06000] hover:bg-[#fff9e6] transition-all shadow-xs"
            >
              Thử lại ngay
            </button>
          </div>
        )}

        {/* Local Persistence: Resume banner */}
        {recentSession && showResumeBanner && recentSession.project && (
          <ResumeProjectBanner
            recentData={recentSession}
            currentProjectId={currentProject?.id}
            onResume={(id) => {
              loadProjectDetail(id);
              setShowResumeBanner(false);
            }}
            onDismiss={() => setShowResumeBanner(false)}
          />
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-[#5f6368] space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-[#0b57d0]" />
            <span className="text-xs font-medium">Đang tải dữ liệu Chronomind...</span>
          </div>
        ) : !currentProject ? (
          /* ======================================================== */
          /* AUTHENTIC GOOGLE WORKSPACE EMPTY STATE (Material 3 Theme) */
          /* ======================================================== */
          <div className="py-10 sm:py-16 text-center max-w-3xl mx-auto space-y-8 px-2">
            {/* Google Calendar 4-Color Header Badge */}
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white border border-[#dadce0] shadow-md">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="4" width="18" height="18" rx="4" fill="#0b57d0" />
                <rect x="3" y="4" width="18" height="6" fill="#1a73e8" />
                <circle cx="8" cy="2" r="1.5" fill="#5f6368" />
                <circle cx="16" cy="2" r="1.5" fill="#5f6368" />
                <text x="12" y="17" fill="white" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">31</text>
              </svg>
            </div>

            <div className="space-y-3 max-w-xl mx-auto">
              <h1 className="text-2xl sm:text-3xl font-bold text-[#1f1f1f] tracking-tight">
                Lập Kế Hoạch &amp; Deadline Dự Án Bằng AI
              </h1>
              <p className="text-xs sm:text-sm text-[#444746] leading-relaxed">
                Biến ý tưởng thành lộ trình kỹ thuật chi tiết, đánh giá độ khó, nhắc nhở điểm mù và theo dõi tiến độ trực quan như Google Calendar.
              </p>
            </div>

            {/* Google "+ Bắt đầu dự án" Action Button */}
            <div>
              <button
                onClick={() => setIsWizardOpen(true)}
                className="inline-flex items-center gap-3 rounded-full bg-[#0b57d0] hover:bg-[#0842a0] px-7 py-3.5 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all active:scale-95"
              >
                {/* 4-Color Google Plus Icon */}
                <svg width="20" height="20" viewBox="0 0 36 36">
                  <path fill="#ffffff" d="M16 16v14h4V16h14v-4H20V-2h-4v14H2v4z"/>
                  <path fill="#34A853" d="M30 16H20l-4-4h14z"/>
                  <path fill="#4285F4" d="M6 16h10l4-4H6z"/>
                  <path fill="#FBBC05" d="M20 16v14l-4-4V16z"/>
                  <path fill="#EA4335" d="M20 2v14l-4-4V2z"/>
                </svg>
                <span>Bắt đầu Lập Kế Hoạch Bằng AI</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            {/* 4 Google-Themed Colored Feature Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left pt-2">
              {/* Card 1: Google Blue */}
              <div className="rounded-2xl border border-[#c2e7ff] bg-white p-5 shadow-xs hover:shadow-md transition-all">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[#e8f0fe] text-[#0b57d0] mb-3 text-xs font-bold">
                  01
                </span>
                <h4 className="text-sm font-bold text-[#1f1f1f] mb-1">Đánh giá độ khó AI</h4>
                <p className="text-xs text-[#5f6368] leading-relaxed">
                  Chấm điểm từ 1-10 dựa trên quỹ thời gian rảnh và trình độ hiện tại.
                </p>
              </div>

              {/* Card 2: Google Green */}
              <div className="rounded-2xl border border-[#ceead6] bg-white p-5 shadow-xs hover:shadow-md transition-all">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[#e6f4ea] text-[#137333] mb-3 text-xs font-bold">
                  02
                </span>
                <h4 className="text-sm font-bold text-[#1f1f1f] mb-1">Lịch biểu Gantt</h4>
                <p className="text-xs text-[#5f6368] leading-relaxed">
                  Trực quan như Google Calendar. Tự động dời hạn khi có phát sinh.
                </p>
              </div>

              {/* Card 3: Google Amber */}
              <div className="rounded-2xl border border-[#feefc3] bg-white p-5 shadow-xs hover:shadow-md transition-all">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[#fef7e0] text-[#b06000] mb-3 text-xs font-bold">
                  03
                </span>
                <h4 className="text-sm font-bold text-[#1f1f1f] mb-1">Checklist Chuẩn Bị</h4>
                <p className="text-xs text-[#5f6368] leading-relaxed">
                  Quản lý việc cần chuẩn bị theo phong cách Google Tasks trước khi làm thật.
                </p>
              </div>

              {/* Card 4: Google Red */}
              <div className="rounded-2xl border border-[#f9dedc] bg-white p-5 shadow-xs hover:shadow-md transition-all">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[#fdf2f2] text-[#b3261e] mb-3 text-xs font-bold">
                  04
                </span>
                <h4 className="text-sm font-bold text-[#1f1f1f] mb-1">Cảnh Báo Điểm Mù</h4>
                <p className="text-xs text-[#5f6368] leading-relaxed">
                  Rà soát rủi ro, lỗi thường gặp và những việc bạn chưa lường trước.
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* ======================================================== */
          /* ACTIVE PROJECT WORKSPACE (ADAPTIVE FOLD / DUO / MOBILE)   */
          /* ======================================================== */
          <div className="space-y-5">
            {/* Project Header Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#dadce0]">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
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

                <h1 className="text-xl sm:text-2xl font-bold text-[#1f1f1f] tracking-tight">
                  {currentProject.title}
                </h1>

                {currentProject.target_goal && (
                  <p className="text-xs text-[#5f6368] flex items-center gap-1.5 flex-wrap">
                    <span className="font-semibold text-[#0b57d0]">Mục tiêu:</span> {currentProject.target_goal}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <button
                  onClick={() => setIsCalendarOpen(true)}
                  className="flex items-center gap-1.5 sm:gap-2 rounded-full border border-[#dadce0] bg-white px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs font-semibold text-[#3c4043] hover:bg-[#eaf1fb] hover:border-[#c2e7ff] hover:text-[#0b57d0] shadow-xs transition-all"
                >
                  <Calendar className="h-4 w-4 text-[#0b57d0]" />
                  <span>Google Calendar</span>
                  {isGoogleConnected && (
                    <span className="h-2 w-2 rounded-full bg-[#137333]" title="Tài khoản Google đã kết nối" />
                  )}
                </button>

                <ExportMenu projectId={currentProject.id} projectTitle={currentProject.title} />

                <button
                  onClick={handleDeleteProject}
                  title="Xóa dự án này"
                  className="h-8 w-8 sm:h-9 sm:w-9 inline-flex items-center justify-center rounded-full border border-[#dadce0] bg-white text-[#5f6368] hover:text-[#ea4335] hover:border-[#fad2cf] hover:bg-[#fce8e6] transition-all shadow-xs"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* ADAPTIVE LAYOUT: FOLD UNFOLDED / DUAL-SCREEN VS STANDARD */}
            {isFoldUnfolded || isDualScreen ? (
              /* DUAL-PANE SPLIT LAYOUT (FOR GALAXY Z FOLD UNFOLDED & SURFACE/IPHONE DUO) */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                {/* Left Pane (Screen 1): KPI & Preparation Checklist */}
                <div className="lg:col-span-5 space-y-4">
                  <FeasibilityCard
                    score={currentProject.complexity_score}
                    explanation={currentProject.complexity_explanation}
                    blindSpots={currentProject.blind_spots}
                    totalHours={currentProject.total_estimated_hours}
                    hoursPerWeek={currentProject.available_hours_per_week}
                    skillLevel={currentProject.skill_level}
                  />

                  <PreparationBanner
                    project={currentProject}
                    onTogglePrereq={handleTogglePrereq}
                    onKickoff={handleKickoff}
                    onOpenReschedule={() => setIsRescheduleOpen(true)}
                    onViewExtensionHistory={() => setIsHistoryOpen(true)}
                  />
                </div>

                {/* Central Hinge Spacer if Dual-Screen */}
                {isDualScreen && (
                  <div className="hidden lg:block w-3 bg-[#dadce0] rounded-full self-stretch my-2 shadow-inner" />
                )}

                {/* Right Pane (Screen 2): Progress Bar & Gantt Roadmap */}
                <div className={`${isDualScreen ? 'lg:col-span-6' : 'lg:col-span-7'} space-y-4`}>
                  <div className="rounded-2xl border border-[#dadce0] bg-white px-5 py-3.5 shadow-xs">
                    <div className="flex justify-between items-center text-xs mb-1.5">
                      <span className="font-semibold text-[#1f1f1f] flex items-center gap-1.5">
                        <Activity className="h-4 w-4 text-[#0b57d0]" />
                        <span>Tiến độ tổng thể</span>
                      </span>
                      <span className="font-bold text-[#0b57d0]">
                        {currentProject.progress_percentage}%
                      </span>
                    </div>
                    <div className="w-full bg-[#f1f3f4] rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-[#0b57d0] h-full rounded-full transition-all duration-300"
                        style={{ width: `${currentProject.progress_percentage}%` }}
                      />
                    </div>
                  </div>

                  <TimelineRoadmap
                    phases={currentProject.phases}
                    isPreparationMode={currentProject.status === "PREPARATION"}
                    kickoffDate={currentProject.kick_off_date}
                    completionDate={currentProject.estimated_completion_date}
                    extensions={currentProject.extensions}
                    onToggleTask={handleToggleTask}
                    onOpenCalendar={() => setIsCalendarOpen(true)}
                  />
                </div>
              </div>
            ) : (
              /* STANDARD FLUID SINGLE-COLUMN (MOBILE, FOLD NARROW, DESKTOP) */
              <div className="space-y-5">
                <FeasibilityCard
                  score={currentProject.complexity_score}
                  explanation={currentProject.complexity_explanation}
                  blindSpots={currentProject.blind_spots}
                  totalHours={currentProject.total_estimated_hours}
                  hoursPerWeek={currentProject.available_hours_per_week}
                  skillLevel={currentProject.skill_level}
                />

                <PreparationBanner
                  project={currentProject}
                  onTogglePrereq={handleTogglePrereq}
                  onKickoff={handleKickoff}
                  onOpenReschedule={() => setIsRescheduleOpen(true)}
                  onViewExtensionHistory={() => setIsHistoryOpen(true)}
                />

                {/* Progress Bar */}
                <div className="rounded-2xl border border-[#dadce0] bg-white px-5 py-3.5 shadow-xs">
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

                <TimelineRoadmap
                  phases={currentProject.phases}
                  isPreparationMode={currentProject.status === "PREPARATION"}
                  kickoffDate={currentProject.kick_off_date}
                  completionDate={currentProject.estimated_completion_date}
                  extensions={currentProject.extensions}
                  onToggleTask={handleToggleTask}
                  onOpenCalendar={() => setIsCalendarOpen(true)}
                />
              </div>
            )}
          </div>
        )}
      </main>

      {/* MOBILE FLOATING ACTION BUTTON (FAB) - GOOGLE STYLE */}
      {isMobile && (
        <button
          onClick={() => setIsWizardOpen(true)}
          title="Tạo dự án mới"
          className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-2xl bg-white border border-[#dadce0] text-[#3c4043] shadow-lg hover:shadow-xl active:scale-90 transition-all"
        >
          {/* 4-Color Google Plus Icon */}
          <svg width="28" height="28" viewBox="0 0 36 36">
            <path fill="#4285F4" d="M16 16v14h4V16h14v-4H20V-2h-4v14H2v4z"/>
            <path fill="#34A853" d="M30 16H20l-4-4h14z"/>
            <path fill="#4285F4" d="M6 16h10l4-4H6z"/>
            <path fill="#FBBC05" d="M20 16v14l-4-4V16z"/>
            <path fill="#EA4335" d="M20 2v14l-4-4V2z"/>
          </svg>
        </button>
      )}

      {/* Modals & Drawers */}
      <ProjectWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onSubmit={handleCreateProject}
      />

      {currentProject && (
        <>
          <GoogleCalendarModal
            isOpen={isCalendarOpen}
            project={currentProject}
            onClose={() => {
              setIsCalendarOpen(false);
              api.getGoogleStatus().then((st) => setIsGoogleConnected(Boolean(st && st.is_connected))).catch(() => {});
            }}
          />

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
      <footer className="border-t border-[#dadce0] bg-white py-4 text-center text-xs text-[#5f6368]">
        Chronomind • AI Dynamic Project &amp; Deadline Planner © 2026
      </footer>
    </div>
  );
}
