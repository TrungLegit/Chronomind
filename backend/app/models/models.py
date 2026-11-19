import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, Float, Integer, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
import enum
from app.database import Base

class ProjectStatus(str, enum.Enum):
    PREPARATION = "PREPARATION"      # Preparation phase, kickoff not yet triggered
    ACTIVE = "ACTIVE"                # Project underway, dynamic deadlines ticking
    COMPLETED = "COMPLETED"          # All phases done
    ON_HOLD = "ON_HOLD"

class PhaseStatus(str, enum.Enum):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    DELAYED = "DELAYED"

class TaskStatus(str, enum.Enum):
    TODO = "TODO"
    IN_PROGRESS = "IN_PROGRESS"
    DONE = "DONE"
    DELAYED = "DELAYED"

class TaskPriority(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class PrerequisiteCategory(str, enum.Enum):
    KNOWLEDGE = "KNOWLEDGE"
    EQUIPMENT = "EQUIPMENT"
    ENVIRONMENT = "ENVIRONMENT"
    RESOURCE = "RESOURCE"
    OTHER = "OTHER"

def generate_uuid():
    return str(uuid.uuid4())

class Project(Base):
    __tablename__ = "projects"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    target_goal = Column(Text, nullable=True)
    available_hours_per_week = Column(Float, default=10.0, nullable=False)
    skill_level = Column(String(50), default="Intermediate", nullable=False)
    tools_resources = Column(Text, nullable=True)

    status = Column(String(50), default=ProjectStatus.PREPARATION.value, nullable=False)
    complexity_score = Column(Float, default=5.0)  # 1 to 10 scale
    complexity_explanation = Column(Text, nullable=True)
    blind_spots = Column(Text, nullable=True)  # JSON string of identified hidden gotchas

    kick_off_date = Column(DateTime, nullable=True)
    estimated_completion_date = Column(DateTime, nullable=True)
    actual_completion_date = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    prerequisites = relationship("Prerequisite", back_populates="project", cascade="all, delete-orphan", order_by="Prerequisite.order_index")
    phases = relationship("Phase", back_populates="project", cascade="all, delete-orphan", order_by="Phase.phase_number")
    extensions = relationship("ExtensionLog", back_populates="project", cascade="all, delete-orphan", order_by="ExtensionLog.created_at.desc()")

class Prerequisite(Base):
    __tablename__ = "prerequisites"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    category = Column(String(50), default=PrerequisiteCategory.OTHER.value, nullable=False)
    description = Column(Text, nullable=True)
    is_completed = Column(Boolean, default=False, nullable=False)
    completed_at = Column(DateTime, nullable=True)
    order_index = Column(Integer, default=0)

    project = relationship("Project", back_populates="prerequisites")

class Phase(Base):
    __tablename__ = "phases"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    phase_number = Column(Integer, nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    estimated_hours = Column(Float, default=0.0, nullable=False)
    status = Column(String(50), default=PhaseStatus.PENDING.value, nullable=False)

    planned_start_date = Column(DateTime, nullable=True)
    planned_end_date = Column(DateTime, nullable=True)
    actual_start_date = Column(DateTime, nullable=True)
    actual_end_date = Column(DateTime, nullable=True)

    project = relationship("Project", back_populates="phases")
    tasks = relationship("Task", back_populates="phase", cascade="all, delete-orphan", order_by="Task.order_index")

class Task(Base):
    __tablename__ = "tasks"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    phase_id = Column(String(36), ForeignKey("phases.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    estimated_hours = Column(Float, default=1.0, nullable=False)
    is_milestone = Column(Boolean, default=False)
    status = Column(String(50), default=TaskStatus.TODO.value, nullable=False)
    priority = Column(String(50), default=TaskPriority.MEDIUM.value, nullable=False)
    order_index = Column(Integer, default=0)

    planned_date = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)

    phase = relationship("Phase", back_populates="tasks")

class ExtensionLog(Base):
    __tablename__ = "extension_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    phase_id = Column(String(36), nullable=True)
    phase_title = Column(String(255), nullable=True)
    reason = Column(Text, nullable=False)
    days_added = Column(Integer, default=0, nullable=False)
    previous_deadline = Column(DateTime, nullable=True)
    new_deadline = Column(DateTime, nullable=True)
    ai_analysis = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="extensions")

class SystemState(Base):
    __tablename__ = "system_state"

    key = Column(String(100), primary_key=True)
    value = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

