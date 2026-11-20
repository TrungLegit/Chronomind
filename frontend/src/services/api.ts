import { Project, ProjectSummary, ProjectCreateInput, ExtensionInput, ExtensionLog, Prerequisite, Task } from "@/types";

const getBaseUrl = (): string => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname || "localhost";
    return `http://${hostname}:8000/api`;
  }
  return "http://localhost:8000/api";
};

const fetchWithRetry = async (url: string, options?: RequestInit, retries = 2, delay = 700): Promise<Response> => {
  try {
    return await fetch(url, options);
  } catch (err) {
    if (retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1, delay * 1.5);
    }
    throw err;
  }
};

export const api = {
  async getProjects(): Promise<ProjectSummary[]> {
    try {
      const res = await fetchWithRetry(`${getBaseUrl()}/projects`, { cache: "no-store" });
      if (!res.ok) return [];
      return res.json();
    } catch (e) {
      console.warn("Chronomind: Dang ket noi Backend...", e);
      return [];
    }
  },

  async getProject(id: string): Promise<Project> {
    const res = await fetchWithRetry(`${getBaseUrl()}/projects/${id}`, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch project details");
    return res.json();
  },

  async createProject(data: ProjectCreateInput): Promise<Project> {
    const res = await fetch(`${getBaseUrl()}/projects`, {
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

  async parsePlanFiles(files: File | File[], availableHours = 12, skillLevel = "Intermediate"): Promise<any> {
    const formData = new FormData();
    const fileArray = Array.isArray(files) ? files : [files];
    for (const f of fileArray) {
      formData.append("files", f);
    }
    formData.append("available_hours_per_week", availableHours.toString());
    formData.append("skill_level", skillLevel);

    const res = await fetch(`${getBaseUrl()}/projects/parse-plan-file`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Không thể phân tích các file kế hoạch.");
    }
    return res.json();
  },

  async parsePlanFile(file: File, availableHours = 12, skillLevel = "Intermediate"): Promise<any> {
    return this.parsePlanFiles([file], availableHours, skillLevel);
  },

  async deleteProject(id: string): Promise<void> {
    const res = await fetch(`${getBaseUrl()}/projects/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete project");
  },

  async kickoffProject(id: string, startDate?: string): Promise<Project> {
    const res = await fetch(`${getBaseUrl()}/projects/${id}/kickoff`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ start_date: startDate }),
    });
    if (!res.ok) throw new Error("Failed to kickoff project");
    return res.json();
  },

  async togglePrerequisite(id: string): Promise<{ id: string; is_completed: boolean; all_prerequisites_met: boolean }> {
    const res = await fetch(`${getBaseUrl()}/prerequisites/${id}/toggle`, {
      method: "POST",
    });
    if (!res.ok) throw new Error("Failed to toggle prerequisite");
    return res.json();
  },

  async toggleTask(id: string): Promise<Task> {
    const res = await fetch(`${getBaseUrl()}/tasks/${id}/toggle`, {
      method: "PATCH",
    });
    if (!res.ok) throw new Error("Failed to toggle task");
    return res.json();
  },

  async extendProject(id: string, input: ExtensionInput): Promise<ExtensionLog> {
    const res = await fetch(`${getBaseUrl()}/projects/${id}/extend`, {
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
    return `${getBaseUrl()}/projects/${id}/export/excel`;
  },

  getExportWordUrl(id: string): string {
    return `${getBaseUrl()}/projects/${id}/export/word`;
  },

  getExportIcsUrl(id: string): string {
    return `${getBaseUrl()}/projects/${id}/export/ics`;
  },

  getExportNotebookLMUrl(id: string): string {
    return `${getBaseUrl()}/projects/${id}/export/notebooklm`;
  },

  // Google Calendar Integration APIs
  async getGoogleStatus(): Promise<{
    is_configured: boolean;
    is_connected: boolean;
    client_id_preview: string;
    redirect_uri: string;
    user_email?: string;
    user_name?: string;
    connected_at?: string;
  }> {
    const res = await fetch(`${getBaseUrl()}/integrations/google/status`, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to get Google status");
    return res.json();
  },

  async saveGoogleConfig(data: { client_id: string; client_secret: string; redirect_uri?: string }): Promise<any> {
    const res = await fetch(`${getBaseUrl()}/integrations/google/config`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Không thể lưu cấu hình Google OAuth");
    }
    return res.json();
  },

  async getGoogleAuthUrl(): Promise<{ auth_url: string }> {
    const res = await fetch(`${getBaseUrl()}/integrations/google/auth-url`, { cache: "no-store" });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Không thể lấy link xác thực Google");
    }
    return res.json();
  },

  async syncProjectToGoogle(projectId: string): Promise<{
    status: string;
    calendar_id: string;
    calendar_name: string;
    synced_phases: number;
    synced_milestones: number;
    calendar_url: string;
  }> {
    const res = await fetch(`${getBaseUrl()}/integrations/google/sync/${projectId}`, {
      method: "POST",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Không thể đồng bộ lên Google Calendar");
    }
    return res.json();
  },

  async disconnectGoogle(): Promise<any> {
    const res = await fetch(`${getBaseUrl()}/integrations/google/disconnect`, {
      method: "POST",
    });
    if (!res.ok) throw new Error("Không thể ngắt kết nối Google");
    return res.json();
  },

  // Session & Local Persistence methods
  async getLastActiveProject(): Promise<{
    has_recent: boolean;
    project: any;
    next_task: any;
  }> {
    try {
      const res = await fetchWithRetry(`${getBaseUrl()}/projects/session/last-active`, { cache: "no-store" }, 1, 500);
      if (!res.ok) return { has_recent: false, project: null, next_task: null };
      return res.json();
    } catch (e) {
      return { has_recent: false, project: null, next_task: null };
    }
  },

  async markProjectAsActive(id: string): Promise<void> {
    try {
      await fetch(`${getBaseUrl()}/projects/${id}/mark-active`, { method: "POST" });
    } catch (e) {
      // Ignore
    }
  },

  async saveDraft(draft: any): Promise<void> {
    try {
      await fetch(`${getBaseUrl()}/projects/session/draft`, {
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
      const res = await fetch(`${getBaseUrl()}/projects/session/draft`, { cache: "no-store" });
      if (!res.ok) return null;
      return res.json();
    } catch (e) {
      return null;
    }
  },

  async clearDraft(): Promise<void> {
    try {
      await fetch(`${getBaseUrl()}/projects/session/draft`, { method: "DELETE" });
    } catch (e) {
      // Ignore
    }
  },

  async checkUpdates(): Promise<{ has_update: boolean; behind_count: number }> {
    try {
      const res = await fetch(`${getBaseUrl()}/projects/system/check-updates`, { cache: "no-store" });
      if (!res.ok) return { has_update: false, behind_count: 0 };
      return res.json();
    } catch (e) {
      return { has_update: false, behind_count: 0 };
    }
  },

  async getNetworkInfo(): Promise<{
    local_ip: string;
    frontend_port: number;
    backend_port: number;
    mobile_url: string;
  }> {
    try {
      const res = await fetch(`${getBaseUrl()}/projects/system/network-info`, { cache: "no-store" });
      if (!res.ok) throw new Error();
      return res.json();
    } catch (e) {
      const host = typeof window !== "undefined" ? window.location.hostname : "localhost";
      return {
        local_ip: host,
        frontend_port: 3000,
        backend_port: 8000,
        mobile_url: `http://${host}:3000`,
      };
    }
  },
};
