export type ProjectStatus = "PREPARATION" | "ACTIVE" | "COMPLETED" | "ON_HOLD";
export type PhaseStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "DELAYED";
export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE" | "DELAYED";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type PrerequisiteCategory = "KNOWLEDGE" | "EQUIPMENT" | "ENVIRONMENT" | "RESOURCE" | "OTHER";

export interface Prerequisite {
  id: string;
  project_id: string;
  title: string;
  category: PrerequisiteCategory;
  description?: string;
  is_completed: boolean;
  completed_at?: string;
  order_index: number;
}

export interface Task {
  id: string;
  phase_id: string;
  title: string;
  description?: string;
  estimated_hours: number;
  is_milestone: boolean;
  status: TaskStatus;
  priority: TaskPriority;
  order_index: number;
  planned_date?: string;
  completed_at?: string;
}

export interface Phase {
  id: string;
  project_id: string;
  phase_number: number;
  title: string;
  description?: string;
  estimated_hours: number;
  status: PhaseStatus;
  planned_start_date?: string;
  planned_end_date?: string;
  actual_start_date?: string;
  actual_end_date?: string;
  tasks: Task[];
}

export interface ExtensionLog {
  id: string;
  project_id: string;
  phase_id?: string;
  phase_title?: string;
  reason: string;
  days_added: number;
  previous_deadline?: string;
  new_deadline?: string;
  ai_analysis?: string;
  created_at: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  target_goal?: string;
  available_hours_per_week: number;
  skill_level: string;
  tools_resources?: string;
  status: ProjectStatus;
  complexity_score: number;
  complexity_explanation?: string;
  blind_spots: string[];
  kick_off_date?: string;
  estimated_completion_date?: string;
  actual_completion_date?: string;
  created_at: string;
  updated_at: string;
  prerequisites: Prerequisite[];
  phases: Phase[];
  extensions: ExtensionLog[];
  total_estimated_hours: number;
  progress_percentage: number;
  all_prerequisites_met: boolean;
}

export interface ProjectSummary {
  id: string;
  title: string;
  description: string;
  status: ProjectStatus;
  complexity_score: number;
  available_hours_per_week: number;
  skill_level: string;
  prerequisites_count: number;
  prerequisites_completed: number;
  phases_count: number;
  tasks_count: number;
  tasks_completed: number;
  progress_percentage: number;
  kick_off_date?: string;
  estimated_completion_date?: string;
  created_at: string;
}

export interface ProjectCreateInput {
  title: string;
  description: string;
  target_goal?: string;
  available_hours_per_week: number;
  skill_level: string;
  tools_resources?: string;
  imported_plan?: any;
}

export interface ExtensionInput {
  phase_id?: string;
  days_to_add: number;
  reason: string;
  use_ai_analysis?: boolean;
}
