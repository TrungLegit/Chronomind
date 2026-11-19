"use client";

import React from "react";
import { Plus, Terminal, ChevronRight, FolderKanban } from "lucide-react";
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
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-[#080b11]/90 backdrop-blur-md">
      <div className="mx-auto flex h-13 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Left: Brand & Engineering Breadcrumbs */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md border border-white/[0.1] bg-[#121824] text-slate-200">
            <Terminal className="h-3.5 w-3.5 text-blue-400" />
          </div>

          <div className="flex items-center gap-1.5 font-mono text-xs">
            <span className="font-bold tracking-tight text-slate-100">CHRONOMIND</span>
            <span className="text-slate-600">/</span>
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
              PLANNER
            </span>
          </div>

          {/* Project Switcher */}
          {projects.length > 0 && (
            <div className="hidden md:flex items-center gap-2 pl-3 border-l border-white/[0.08]">
              <FolderKanban className="h-3.5 w-3.5 text-slate-500" />
              <select
                aria-label="Select Project"
                value={selectedProjectId || ""}
                onChange={(e) => onSelectProject(e.target.value)}
                className="h-7 rounded border border-white/[0.08] bg-[#0d111a] px-2 text-xs font-mono text-slate-200 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/40"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} [{p.status === "PREPARATION" ? "PREP" : `${p.progress_percentage}%`}]
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Right: Status indicator & Action Button */}
        <div className="flex items-center gap-3">
          {current && (
            <div className="hidden sm:flex items-center gap-2 font-mono text-[11px]">
              <span
                className={`inline-flex items-center gap-1.5 rounded border px-2 py-0.5 font-medium ${
                  current.status === "ACTIVE"
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                    : current.status === "PREPARATION"
                    ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                    : "border-blue-500/30 bg-blue-500/10 text-blue-400"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    current.status === "ACTIVE" ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
                  }`}
                />
                <span>{current.status}</span>
              </span>
            </div>
          )}

          <button
            onClick={onOpenNewProject}
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-blue-600 px-3 text-xs font-medium text-white shadow-xs transition-colors hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500/50"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Tạo dự án mới</span>
          </button>
        </div>
      </div>
    </header>
  );
};
