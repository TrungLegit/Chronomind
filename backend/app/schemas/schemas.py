from pydantic import BaseModel, Field
from typing import List, Optional, Any
from datetime import datetime
from app.models.models import (
    ProjectStatus,
    PhaseStatus,
    TaskStatus,
    TaskPriority,
    PrerequisiteCategory,
)

# --- Prerequisite Schemas ---
class PrerequisiteBase(BaseModel):
    title: str
    category: PrerequisiteCategory = PrerequisiteCategory.OTHER
    description: Optional[str] = None
    order_index: int = 0

class PrerequisiteCreate(PrerequisiteBase):
    pass

class PrerequisiteOut(PrerequisiteBase):
    id: str
    project_id: str
    is_completed: bool
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class PrerequisiteToggleResponse(BaseModel):
    id: str
    is_completed: bool
    completed_at: Optional[datetime] = None
    all_prerequisites_met: bool
    completed_count: int
    total_count: int

# --- Task Schemas ---
class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    estimated_hours: float = 1.0
    is_milestone: bool = False
    status: TaskStatus = TaskStatus.TODO
    priority: TaskPriority = TaskPriority.MEDIUM
    order_index: int = 0

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    estimated_hours: Optional[float] = None
    is_milestone: Optional[bool] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None

class TaskOut(TaskBase):
    id: str
    phase_id: str
    planned_date: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# --- Phase Schemas ---
class PhaseBase(BaseModel):
    phase_number: int
    title: str
    description: Optional[str] = None
    estimated_hours: float = 0.0

class PhaseCreate(PhaseBase):
    tasks: List[TaskCreate] = []

class PhaseOut(PhaseBase):
    id: str
    project_id: str
    status: PhaseStatus
    planned_start_date: Optional[datetime] = None
    planned_end_date: Optional[datetime] = None
    actual_start_date: Optional[datetime] = None
    actual_end_date: Optional[datetime] = None
    tasks: List[TaskOut] = []

    class Config:
        from_attributes = True

# --- Extension Log Schemas ---
class ExtensionLogOut(BaseModel):
    id: str
    project_id: str
    phase_id: Optional[str] = None
    phase_title: Optional[str] = None
    reason: str
    days_added: int
    previous_deadline: Optional[datetime] = None
    new_deadline: Optional[datetime] = None
    ai_analysis: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ExtensionRequest(BaseModel):
    phase_id: Optional[str] = None
    days_to_add: int = Field(default=3, ge=1, le=60)
    reason: str = Field(..., min_length=5, description="Lý do trễ hạn hoặc yêu cầu gia hạn")
    use_ai_analysis: bool = True

# --- Project Schemas ---
class ProjectCreateRequest(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    description: str = Field(..., min_length=10, description="Mô tả ý tưởng dự án dù còn sơ khai")
    target_goal: Optional[str] = Field(None, description="Mục tiêu đầu ra mong muốn")
    available_hours_per_week: float = Field(default=10.0, ge=1.0, le=100.0, description="Số giờ rảnh mỗi tuần")
    skill_level: str = Field(default="Intermediate", description="Trình độ hiện tại (Beginner/Intermediate/Advanced)")
    tools_resources: Optional[str] = Field(None, description="Công cụ, máy móc, tài nguyên hiện có")

class KickOffRequest(BaseModel):
    start_date: Optional[datetime] = None  # defaults to now

class ProjectSummaryOut(BaseModel):
    id: str
    title: str
    description: str
    status: ProjectStatus
    complexity_score: float
    available_hours_per_week: float
    skill_level: str
    prerequisites_count: int
    prerequisites_completed: int
    phases_count: int
    tasks_count: int
    tasks_completed: int
    progress_percentage: float
    kick_off_date: Optional[datetime] = None
    estimated_completion_date: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ProjectDetailOut(BaseModel):
    id: str
    title: str
    description: str
    target_goal: Optional[str] = None
    available_hours_per_week: float
    skill_level: str
    tools_resources: Optional[str] = None
    status: ProjectStatus
    complexity_score: float
    complexity_explanation: Optional[str] = None
    blind_spots: List[str] = []
    kick_off_date: Optional[datetime] = None
    estimated_completion_date: Optional[datetime] = None
    actual_completion_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    prerequisites: List[PrerequisiteOut] = []
    phases: List[PhaseOut] = []
    extensions: List[ExtensionLogOut] = []

    # Computed metrics
    total_estimated_hours: float = 0.0
    progress_percentage: float = 0.0
    all_prerequisites_met: bool = False

    class Config:
        from_attributes = True

# AI Structured Output models
class AIPrerequisiteItem(BaseModel):
    title: str
    category: str  # KNOWLEDGE, EQUIPMENT, ENVIRONMENT, RESOURCE
    description: str

class AITaskItem(BaseModel):
    title: str
    description: str
    estimated_hours: float
    is_milestone: bool = False
    priority: str = "MEDIUM"

class AIPhaseItem(BaseModel):
    phase_number: int
    title: str
    description: str
    estimated_hours: float
    tasks: List[AITaskItem]

class AIAnalysisResult(BaseModel):
    refined_title: str
    complexity_score: float  # 1 - 10
    complexity_explanation: str
    blind_spots: List[str]
    prerequisites: List[AIPrerequisiteItem]
    phases: List[AIPhaseItem]

class AIRedescheduleAnalysis(BaseModel):
    recommended_days: int
    impact_assessment: str
    mitigation_tips: List[str]
    advice_note: str
