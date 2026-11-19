"use client";

import React, { useState, useEffect } from "react";
import { Plus, Calendar, Search, FolderKanban, Sparkles, Bell, Smartphone } from "lucide-react";
import { ProjectSummary } from "@/types";
import { api } from "@/services/api";

interface NavbarProps {
  projects: ProjectSummary[];
  selectedProjectId: string | null;
  onSelectProject: (id: string) => void;
  onOpenNewProject: () => void;
  onOpenMobileSimulator?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  projects,
  selectedProjectId,
  onSelectProject,
  onOpenNewProject,
  onOpenMobileSimulator,
}) => {
  const current = projects.find((p) => p.id === selectedProjectId);
  const [updateInfo, setUpdateInfo] = useState<{ has_update: boolean; behind_count: number }>({
    has_update: false,
    behind_count: 0,
  });

  useEffect(() => {
    api.checkUpdates().then(setUpdateInfo).catch(() => {});
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#e5e7eb] bg-white shadow-xs">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Left: Google Workspace Logo & Name */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eaf1fb] border border-[#c2e7ff] text-[#0b57d0]">
            <Calendar className="h-5 w-5" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-[#1f1f1f]">
                Chronomind
              </span>
              <span className="rounded-full bg-[#c2e7ff] px-2 py-0.5 text-[11px] font-semibold text-[#001d35]">
                AI Planner
              </span>
            </div>
            <p className="text-xs text-[#5f6368] hidden sm:block">
              Quản lý tiến độ & Lập lịch thông minh
            </p>
          </div>
        </div>

        {/* Center: Search-style Project Selector (like Gmail / Calendar search bar) */}
        {projects.length > 0 && (
          <div className="hidden md:flex flex-1 max-w-md mx-6">
            <div className="relative w-full flex items-center">
              <FolderKanban className="absolute left-3.5 h-4 w-4 text-[#5f6368]" />
              <select
                aria-label="Chọn dự án"
                value={selectedProjectId || ""}
                onChange={(e) => onSelectProject(e.target.value)}
                className="w-full h-10 pl-10 pr-4 rounded-full bg-[#f0f4f9] hover:bg-[#e9eef6] focus:bg-white text-sm font-medium text-[#1f1f1f] border border-transparent focus:border-[#0b57d0] focus:outline-none focus:ring-2 focus:ring-[#0b57d0]/20 transition-all cursor-pointer"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} ({p.status === "PREPARATION" ? "Chờ chuẩn bị" : `Tiến độ: ${p.progress_percentage}%`})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Right: Project Status Pill & Google-style "+ Tạo mới" Pill Button */}
        <div className="flex items-center gap-3">
          {updateInfo.has_update && (
            <div
              title="Phát hiện bản cập nhật mới trên GitHub. Hãy chạy 'git pull' hoặc mở lại start-dev.bat để cập nhật!"
              className="hidden lg:flex items-center gap-1.5 rounded-full bg-[#fef7e0] border border-[#feefc3] text-[#b06000] px-3 py-1 text-xs font-semibold shadow-xs animate-pulse cursor-help"
            >
              <Bell className="h-3.5 w-3.5 text-[#b06000]" />
              <span>Có {updateInfo.behind_count} cập nhật mới trên GitHub</span>
            </div>
          )}

          {current && (
            <div className="hidden sm:flex items-center gap-1.5">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border ${
                  current.status === "ACTIVE"
                    ? "bg-[#e6f4ea] text-[#137333] border-[#ceead6]"
                    : current.status === "PREPARATION"
                    ? "bg-[#fef7e0] text-[#b06000] border-[#feefc3]"
                    : "bg-[#e8f0fe] text-[#1a73e8] border-[#d2e3fc]"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    current.status === "ACTIVE" ? "bg-[#34a853] animate-pulse" : "bg-[#fbbc04]"
                  }`}
                />
                <span>
                  {current.status === "PREPARATION"
                    ? "Chờ chuẩn bị"
                    : current.status === "ACTIVE"
                    ? "Đang triển khai"
                    : "Hoàn tất"}
                </span>
              </span>
            </div>
          )}

          {/* Mobile Simulator button */}
          {onOpenMobileSimulator && (
            <button
              onClick={onOpenMobileSimulator}
              title="Kiểm tra tương thích hiển thị trên các dòng điện thoại iOS / Android"
              className="flex items-center gap-1.5 rounded-full border border-[#dadce0] bg-white px-3 py-1.5 text-xs font-semibold text-[#0b57d0] hover:bg-[#eaf1fb] hover:border-[#c2e7ff] transition-all shadow-xs"
            >
              <Smartphone className="h-4 w-4 text-[#0b57d0]" />
              <span className="hidden sm:inline">📱 Giả lập ĐT</span>
            </button>
          )}

          {/* Google Calendar "+ Tạo" Button */}
          <button
            onClick={onOpenNewProject}
            className="flex items-center gap-2 rounded-full bg-white border border-[#dadce0] px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-[#3c4043] shadow-xs hover:shadow-md hover:bg-[#f8fafd] transition-all focus:outline-none shrink-0"
          >
            {/* Google 4-color Plus Icon */}
            <svg width="18" height="18" viewBox="0 0 36 36" className="shrink-0">
              <path fill="#4285F4" d="M16 16v14h4V16h14v-4H20V-2h-4v14H2v4z"/>
              <path fill="#34A853" d="M30 16H20l-4-4h14z"/>
              <path fill="#4285F4" d="M6 16h10l4-4H6z"/>
              <path fill="#FBBC05" d="M20 16v14l-4-4V16z"/>
              <path fill="#EA4335" d="M20 2v14l-4-4V2z"/>
            </svg>
            <span className="font-semibold text-[#1f1f1f]">
              <span className="hidden sm:inline">Tạo dự án mới</span>
              <span className="sm:hidden">Tạo mới</span>
            </span>
          </button>
        </div>
      </div>

      {/* Mobile-only secondary bar for project selection */}
      {projects.length > 0 && (
        <div className="md:hidden px-4 pb-2.5 pt-0.5 border-t border-[#f1f3f4] bg-[#f8fafd]">
          <div className="relative w-full flex items-center">
            <FolderKanban className="absolute left-3 h-3.5 w-3.5 text-[#5f6368]" />
            <select
              aria-label="Chọn dự án trên di động"
              value={selectedProjectId || ""}
              onChange={(e) => onSelectProject(e.target.value)}
              className="w-full h-8 pl-8 pr-3 rounded-full bg-white text-xs font-medium text-[#1f1f1f] border border-[#dadce0] focus:border-[#0b57d0] focus:outline-none"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} ({p.progress_percentage}%)
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </header>
  );
};
