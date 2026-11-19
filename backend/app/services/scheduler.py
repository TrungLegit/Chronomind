from datetime import datetime, timedelta
from typing import Optional, List
from sqlalchemy.orm import Session
from app.models.models import Project, Phase, Task, ExtensionLog, ProjectStatus, PhaseStatus, TaskStatus

class DeadlineScheduler:
    @staticmethod
    def calculate_duration_days(hours: float, hours_per_week: float) -> int:
        """Convert estimated effort hours into calendar days based on weekly capacity."""
        daily_hours = max(hours_per_week / 7.0, 0.5)
        raw_days = hours / daily_hours
        # Round up to whole days, minimum 1 day per phase/task
        return max(int(round(raw_days + 0.49)), 1)

    @classmethod
    def kick_off_project(cls, db: Session, project: Project, start_date: Optional[datetime] = None) -> Project:
        """
        Activates the project: Converts Preparation Mode into Dynamic Deadlines.
        Assigns planned_start_date & planned_end_date for all phases and tasks.
        """
        current_time = start_date or datetime.utcnow()
        project.status = ProjectStatus.ACTIVE.value
        project.kick_off_date = current_time

        cursor_date = current_time

        for i, phase in enumerate(project.phases):
            phase_duration_days = cls.calculate_duration_days(
                phase.estimated_hours, project.available_hours_per_week
            )
            phase.planned_start_date = cursor_date
            phase.planned_end_date = cursor_date + timedelta(days=phase_duration_days)

            # First phase becomes IN_PROGRESS immediately
            if i == 0:
                phase.status = PhaseStatus.IN_PROGRESS.value
                phase.actual_start_date = current_time
            else:
                phase.status = PhaseStatus.PENDING.value

            # Schedule tasks within the phase
            task_cursor = phase.planned_start_date
            total_tasks = len(phase.tasks)
            if total_tasks > 0:
                task_step = max(phase_duration_days / total_tasks, 0.5)
                for t_idx, task in enumerate(phase.tasks):
                    task.planned_date = task_cursor + timedelta(days=int(t_idx * task_step))
                    if i == 0 and t_idx == 0:
                        task.status = TaskStatus.IN_PROGRESS.value

            # Move cursor to end of this phase for the next phase
            cursor_date = phase.planned_end_date

        project.estimated_completion_date = cursor_date
        db.commit()
        db.refresh(project)
        return project

    @classmethod
    def apply_extension(
        cls,
        db: Session,
        project: Project,
        phase_id: Optional[str],
        days_to_add: int,
        reason: str,
        ai_analysis_text: Optional[str] = None
    ) -> ExtensionLog:
        """
        Smart Rescheduling:
        Extends the specified phase (or active phase) and dynamically pushes
        all subsequent phases forward while preserving history.
        """
        previous_deadline = project.estimated_completion_date
        target_phase: Optional[Phase] = None

        if phase_id:
            target_phase = next((p for p in project.phases if p.id == phase_id), None)
        else:
            # Pick currently IN_PROGRESS or first non-completed phase
            target_phase = next((p for p in project.phases if p.status == PhaseStatus.IN_PROGRESS.value), None)
            if not target_phase:
                target_phase = next((p for p in project.phases if p.status != PhaseStatus.COMPLETED.value), None)

        if not target_phase and project.phases:
            target_phase = project.phases[-1]

        delta = timedelta(days=days_to_add)

        found_target = False
        for phase in project.phases:
            if phase.id == target_phase.id:
                found_target = True
                # Extend current phase end date
                if phase.planned_end_date:
                    phase.planned_end_date += delta
                if phase.status == PhaseStatus.PENDING.value:
                    phase.status = PhaseStatus.IN_PROGRESS.value
                # Shift tasks in this phase
                for task in phase.tasks:
                    if task.planned_date and task.status != TaskStatus.DONE.value:
                        task.planned_date += delta
            elif found_target:
                # Downstream phase: shift both start and end dates
                if phase.planned_start_date:
                    phase.planned_start_date += delta
                if phase.planned_end_date:
                    phase.planned_end_date += delta
                for task in phase.tasks:
                    if task.planned_date and task.status != TaskStatus.DONE.value:
                        task.planned_date += delta

        if project.estimated_completion_date:
            project.estimated_completion_date += delta

        log_entry = ExtensionLog(
            project_id=project.id,
            phase_id=target_phase.id if target_phase else None,
            phase_title=target_phase.title if target_phase else "General Schedule",
            reason=reason,
            days_added=days_to_add,
            previous_deadline=previous_deadline,
            new_deadline=project.estimated_completion_date,
            ai_analysis=ai_analysis_text
        )
        db.add(log_entry)
        db.commit()
        db.refresh(project)
        db.refresh(log_entry)
        return log_entry

    @classmethod
    def check_and_update_phase_completion(cls, db: Session, phase: Phase):
        """Checks if all tasks in a phase are done, updates phase status and activates next phase."""
        if not phase.tasks:
            return

        all_tasks_done = all(t.status == TaskStatus.DONE.value for t in phase.tasks)
        if all_tasks_done:
            phase.status = PhaseStatus.COMPLETED.value
            phase.actual_end_date = datetime.utcnow()
            
            # Find and activate next phase
            project = phase.project
            sorted_phases = sorted(project.phases, key=lambda p: p.phase_number)
            current_index = next((idx for idx, p in enumerate(sorted_phases) if p.id == phase.id), -1)
            if current_index != -1 and current_index + 1 < len(sorted_phases):
                next_phase = sorted_phases[current_index + 1]
                if next_phase.status == PhaseStatus.PENDING.value:
                    next_phase.status = PhaseStatus.IN_PROGRESS.value
                    next_phase.actual_start_date = datetime.utcnow()
            else:
                # All phases completed!
                if all(p.status == PhaseStatus.COMPLETED.value for p in project.phases):
                    project.status = ProjectStatus.COMPLETED.value
                    project.actual_completion_date = datetime.utcnow()

        db.commit()
