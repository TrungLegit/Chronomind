import { Project, ProjectSummary, ProjectCreateInput, ExtensionInput, ExtensionLog, Prerequisite, Task } from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export const api = {
  async getProjects(): Promise<ProjectSummary[]> {
    const res = await fetch(`${API_BASE_URL}/projects`, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch projects");
    return res.json();
  },

  async getProject(id: string): Promise<Project> {
    const res = await fetch(`${API_BASE_URL}/projects/${id}`, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch project details");
    return res.json();
  },

  async createProject(data: ProjectCreateInput): Promise<Project> {
    const res = await fetch(`${API_BASE_URL}/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to create project with AI");
    }
    return res.json();
  },

  async deleteProject(id: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/projects/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete project");
  },

  async kickoffProject(id: string, startDate?: string): Promise<Project> {
    const res = await fetch(`${API_BASE_URL}/projects/${id}/kickoff`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ start_date: startDate }),
    });
    if (!res.ok) throw new Error("Failed to kickoff project");
    return res.json();
  },

  async togglePrerequisite(id: string): Promise<{ id: string; is_completed: boolean; all_prerequisites_met: boolean }> {
    const res = await fetch(`${API_BASE_URL}/prerequisites/${id}/toggle`, {
      method: "POST",
    });
    if (!res.ok) throw new Error("Failed to toggle prerequisite");
    return res.json();
  },

  async toggleTask(id: string): Promise<Task> {
    const res = await fetch(`${API_BASE_URL}/tasks/${id}/toggle`, {
      method: "PATCH",
    });
    if (!res.ok) throw new Error("Failed to toggle task");
    return res.json();
  },

  async extendProject(id: string, input: ExtensionInput): Promise<ExtensionLog> {
    const res = await fetch(`${API_BASE_URL}/projects/${id}/extend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to request extension");
    }
    return res.json();
  },

  getExportExcelUrl(id: string): string {
    return `${API_BASE_URL}/projects/${id}/export/excel`;
  },

  getExportWordUrl(id: string): string {
    return `${API_BASE_URL}/projects/${id}/export/word`;
  },

  // Session & Local Persistence methods
  async getLastActiveProject(): Promise<{
    has_recent: boolean;
    project: any;
    next_task: any;
  }> {
    const res = await fetch(`${API_BASE_URL}/projects/session/last-active`, { cache: "no-store" });
    if (!res.ok) return { has_recent: false, project: null, next_task: null };
    return res.json();
  },

  async markProjectAsActive(id: string): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/projects/${id}/mark-active`, { method: "POST" });
    } catch (e) {
      // Ignore network errors on local
    }
  },

  async saveDraft(draft: any): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/projects/session/draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
    } catch (e) {
      // Ignore
    }
  },

  async getDraft(): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/projects/session/draft`, { cache: "no-store" });
      if (!res.ok) return null;
      return res.json();
    } catch (e) {
      return null;
    }
  },

  async clearDraft(): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/projects/session/draft`, { method: "DELETE" });
    } catch (e) {
      // Ignore
    }
  },

  async checkUpdates(): Promise<{ has_update: boolean; behind_count: number }> {
    try {
      const res = await fetch(`${API_BASE_URL}/projects/system/check-updates`, { cache: "no-store" });
      if (!res.ok) return { has_update: false, behind_count: 0 };
      return res.json();
    } catch (e) {
      return { has_update: false, behind_count: 0 };
    }
  },
};

