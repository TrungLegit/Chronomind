"use client";

import React from "react";
import { Sparkles, Plus, Calendar, Compass, Layers, FolderKanban } from "lucide-react";
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
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-lg shadow-indigo-500/20">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tight text-white">CHRONOMIND</span>
              <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold text-indigo-400 border border-indigo-500/20">
                AI ENGINE
              </span>
            </div>
            <p className="text-xs text-slate-400">Dynamic Project & Deadline Planner</p>
          </div>
        </div>

        {/* Project Selector & Actions */}
        <div className="flex items-center gap-3">
          {projects.length > 0 && (
            <div className="hidden sm:flex items-center gap-2">
              <FolderKanban className="h-4 w-4 text-slate-400" />
              <select
                aria-label="Select Project"
                value={selectedProjectId || ""}
                onChange={(e) => onSelectProject(e.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} ({p.status === "PREPARATION" ? "Chờ chuẩn bị" : `${p.progress_percentage}%`})
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={onOpenNewProject}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-500/25 transition hover:from-indigo-500 hover:to-violet-500 hover:shadow-indigo-500/40 focus:outline-none"
          >
            <Plus className="h-4 w-4" />
            <span>Tạo dự án mới</span>
          </button>
        </div>
      </div>
    </header>
  );
};
