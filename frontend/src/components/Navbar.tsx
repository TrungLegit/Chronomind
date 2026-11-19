"use client";

import React from "react";
import { Plus, Calendar, Search, FolderKanban, Sparkles } from "lucide-react";
import { ProjectSummary } from "@/types";

interface NavbarProps {
  projects: ProjectSummary[];
  selectedProjectId: string | null;
  onSelectProject: (id: string) => void;
  onOpenNewProject: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  projects,
  selectedProjectId,
  onSelectProject,
  onOpenNewProject,
}) => {
  const current = projects.find((p) => p.id === selectedProjectId);

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

          {/* Google Calendar "+ Tạo" Button */}
          <button
            onClick={onOpenNewProject}
            className="flex items-center gap-2.5 rounded-full bg-white border border-[#dadce0] px-4 py-2 text-sm font-medium text-[#3c4043] shadow-xs hover:shadow-md hover:bg-[#f8fafd] transition-all focus:outline-none"
          >
            {/* Google 4-color Plus Icon */}
            <svg width="20" height="20" viewBox="0 0 36 36">
              <path fill="#4285F4" d="M16 16v14h4V16h14v-4H20V-2h-4v14H2v4z"/>
              <path fill="#34A853" d="M30 16H20l-4-4h14z"/>
              <path fill="#4285F4" d="M6 16h10l4-4H6z"/>
              <path fill="#FBBC05" d="M20 16v14l-4-4V16z"/>
              <path fill="#EA4335" d="M20 2v14l-4-4V2z"/>
            </svg>
            <span className="font-semibold text-[#1f1f1f]">Tạo dự án mới</span>
          </button>
        </div>
      </div>
    </header>
  );
};
