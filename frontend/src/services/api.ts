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
};
