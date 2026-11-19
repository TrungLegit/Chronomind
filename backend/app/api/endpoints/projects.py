import json
from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import (
    Project, Prerequisite, Phase, Task, ExtensionLog, SystemState,
    ProjectStatus, PhaseStatus, TaskStatus
)
from app.schemas.schemas import (
    ProjectCreateRequest,
    ProjectSummaryOut,
    ProjectDetailOut,
    KickOffRequest,
    ExtensionRequest,
    ExtensionLogOut,
)
from app.services.ai_engine import AIEngine
from app.services.scheduler import DeadlineScheduler

router = APIRouter()

def compute_project_metrics(project: Project) -> dict:
    total_tasks = sum(len(p.tasks) for p in project.phases)
    completed_tasks = sum(sum(1 for t in p.tasks if t.status == TaskStatus.DONE.value) for p in project.phases)
    progress_pct = round((completed_tasks / total_tasks * 100), 1) if total_tasks > 0 else 0.0

    total_prereq = len(project.prerequisites)
    completed_prereq = sum(1 for p in project.prerequisites if p.is_completed)
    all_prereq_met = (total_prereq > 0) and (completed_prereq == total_prereq)

    total_hours = sum(p.estimated_hours for p in project.phases)

    blind_spots_list = []
    if project.blind_spots:
        try:
            blind_spots_list = json.loads(project.blind_spots)
        except Exception:
            blind_spots_list = [project.blind_spots]

    return {
        "total_tasks": total_tasks,
        "completed_tasks": completed_tasks,
        "progress_percentage": progress_pct,
        "prerequisites_count": total_prereq,
        "prerequisites_completed": completed_prereq,
        "all_prerequisites_met": all_prereq_met,
        "total_estimated_hours": total_hours,
        "blind_spots_list": blind_spots_list,
    }

@router.post("/", response_model=ProjectDetailOut, status_code=status.HTTP_201_CREATED)
async def create_project(req: ProjectCreateRequest, db: Session = Depends(get_db)):
    """
    Core Feature 1: AI Feasibility & Complexity Analyzer.
    Analyzes project scope, scores complexity, generates blind spots, prerequisites, and phases.
    Starts in PREPARATION mode (deadlines do not tick yet).
    """
    ai_result = await AIEngine.analyze_project(
        title=req.title,
        description=req.description,
        target_goal=req.target_goal,
        available_hours_per_week=req.available_hours_per_week,
        skill_level=req.skill_level,
        tools_resources=req.tools_resources
    )

    project = Project(
        title=req.title,
        description=req.description,
        target_goal=req.target_goal,
        available_hours_per_week=req.available_hours_per_week,
        skill_level=req.skill_level,
        tools_resources=req.tools_resources,
        status=ProjectStatus.PREPARATION.value,
        complexity_score=ai_result.complexity_score,
        complexity_explanation=ai_result.complexity_explanation,
        blind_spots=json.dumps(ai_result.blind_spots, ensure_ascii=False)
    )
    db.add(project)
    db.flush()

    # Add Prerequisites
    for idx, p_item in enumerate(ai_result.prerequisites):
        prereq = Prerequisite(
            project_id=project.id,
            title=p_item.title,
            category=p_item.category,
            description=p_item.description,
            order_index=idx,
            is_completed=False
        )
        db.add(prereq)

    # Add Phases & Tasks
    for p_phase in ai_result.phases:
        phase = Phase(
            project_id=project.id,
            phase_number=p_phase.phase_number,
            title=p_phase.title,
            description=p_phase.description,
            estimated_hours=p_phase.estimated_hours,
            status=PhaseStatus.PENDING.value
        )
        db.add(phase)
        db.flush()

        for t_idx, p_task in enumerate(p_phase.tasks):
            task = Task(
                phase_id=phase.id,
                title=p_task.title,
                description=p_task.description,
                estimated_hours=p_task.estimated_hours,
                is_milestone=p_task.is_milestone,
                priority=p_task.priority,
                order_index=t_idx,
                status=TaskStatus.TODO.value
            )
            db.add(task)

    db.commit()
    db.refresh(project)

    metrics = compute_project_metrics(project)
    res_dict = {
        **project.__dict__,
        "blind_spots": metrics["blind_spots_list"],
        "total_estimated_hours": metrics["total_estimated_hours"],
        "progress_percentage": metrics["progress_percentage"],
        "all_prerequisites_met": metrics["all_prerequisites_met"]
    }
    return res_dict

@router.get("/", response_model=List[ProjectSummaryOut])
def list_projects(db: Session = Depends(get_db)):
    projects = db.query(Project).order_by(Project.created_at.desc()).all()
    results = []
    for proj in projects:
        metrics = compute_project_metrics(proj)
        results.append(ProjectSummaryOut(
            id=proj.id,
            title=proj.title,
            description=proj.description,
            status=proj.status,
            complexity_score=proj.complexity_score,
            available_hours_per_week=proj.available_hours_per_week,
            skill_level=proj.skill_level,
            prerequisites_count=metrics["prerequisites_count"],
            prerequisites_completed=metrics["prerequisites_completed"],
            phases_count=len(proj.phases),
            tasks_count=metrics["total_tasks"],
            tasks_completed=metrics["completed_tasks"],
            progress_percentage=metrics["progress_percentage"],
            kick_off_date=proj.kick_off_date,
            estimated_completion_date=proj.estimated_completion_date,
            created_at=proj.created_at
        ))
    return results

@router.get("/{project_id}", response_model=ProjectDetailOut)
def get_project(project_id: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    metrics = compute_project_metrics(project)
    return {
        **project.__dict__,
        "blind_spots": metrics["blind_spots_list"],
        "total_estimated_hours": metrics["total_estimated_hours"],
        "progress_percentage": metrics["progress_percentage"],
        "all_prerequisites_met": metrics["all_prerequisites_met"],
        "prerequisites": project.prerequisites,
        "phases": project.phases,
        "extensions": project.extensions
    }

@router.post("/{project_id}/kickoff", response_model=ProjectDetailOut)
def kickoff_project(project_id: str, req: KickOffRequest = KickOffRequest(), db: Session = Depends(get_db)):
    """
    Core Feature 2: Smart Trigger.
    Activates dynamic countdown & schedules all phases/tasks based on user's weekly capacity.
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    updated_proj = DeadlineScheduler.kick_off_project(db, project, req.start_date)
    metrics = compute_project_metrics(updated_proj)
    return {
        **updated_proj.__dict__,
        "blind_spots": metrics["blind_spots_list"],
        "total_estimated_hours": metrics["total_estimated_hours"],
        "progress_percentage": metrics["progress_percentage"],
        "all_prerequisites_met": metrics["all_prerequisites_met"],
        "prerequisites": updated_proj.prerequisites,
        "phases": updated_proj.phases,
        "extensions": updated_proj.extensions
    }

@router.post("/{project_id}/extend", response_model=ExtensionLogOut)
async def extend_project_deadline(project_id: str, req: ExtensionRequest, db: Session = Depends(get_db)):
    """
    Core Feature 2: Smart Rescheduling / Extension.
    Recalculates subsequent deadlines and evaluates delays with AI.
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    target_phase = None
    if req.phase_id:
        target_phase = next((p for p in project.phases if p.id == req.phase_id), None)

    ai_analysis_str = None
    if req.use_ai_analysis:
        ai_res = await AIEngine.analyze_reschedule(
            project_title=project.title,
            phase_title=target_phase.title if target_phase else None,
            reason=req.reason,
            days_requested=req.days_to_add
        )
        ai_analysis_str = f"{ai_res.impact_assessment} Lời khuyên: {ai_res.advice_note}"

    log = DeadlineScheduler.apply_extension(
        db=db,
        project=project,
        phase_id=req.phase_id,
        days_to_add=req.days_to_add,
        reason=req.reason,
        ai_analysis_text=ai_analysis_str
    )
    return log

@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(project_id: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    db.delete(project)
    db.commit()
    return None

# ========================================================
# LOCAL PERSISTENCE & SESSION RECOVERY ENDPOINTS
# ========================================================

@router.get("/session/last-active")
def get_last_active_project(db: Session = Depends(get_db)):
    """
    Returns the user's last active project and the next pending task
    so they can immediately resume where they left off.
    """
    state = db.query(SystemState).filter(SystemState.key == "last_active_project_id").first()
    project = None
    if state and state.value:
        project = db.query(Project).filter(Project.id == state.value).first()

    if not project:
        # Fallback to the most recently updated project
        project = db.query(Project).order_by(Project.updated_at.desc()).first()

    if not project:
        return {"has_recent": False, "project": None, "next_task": None}

    metrics = compute_project_metrics(project)

    # Find the next pending task
    next_task = None
    for phase in sorted(project.phases, key=lambda p: p.phase_number):
        for task in sorted(phase.tasks, key=lambda t: t.order_index):
            if task.status != TaskStatus.DONE.value:
                next_task = {
                    "id": task.id,
                    "title": task.title,
                    "phase_title": phase.title,
                    "phase_number": phase.phase_number,
                    "estimated_hours": task.estimated_hours,
                    "status": task.status,
                    "is_milestone": task.is_milestone
                }
                break
        if next_task:
            break

    return {
        "has_recent": True,
        "project": {
            "id": project.id,
            "title": project.title,
            "description": project.description,
            "status": project.status,
            "progress_percentage": metrics["progress_percentage"],
            "total_tasks": metrics["total_tasks"],
            "completed_tasks": metrics["completed_tasks"],
            "updated_at": project.updated_at,
            "kick_off_date": project.kick_off_date,
            "estimated_completion_date": project.estimated_completion_date
        },
        "next_task": next_task
    }

@router.post("/{project_id}/mark-active")
def mark_project_as_active(project_id: str, db: Session = Depends(get_db)):
    """Marks a project as the currently active project in local persistence."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    project.updated_at = datetime.utcnow()
    state = db.query(SystemState).filter(SystemState.key == "last_active_project_id").first()
    if not state:
        state = SystemState(key="last_active_project_id", value=project_id)
        db.add(state)
    else:
        state.value = project_id
    db.commit()
    return {"status": "ok", "project_id": project_id}

@router.post("/session/draft")
def save_wizard_draft(draft: dict, db: Session = Depends(get_db)):
    """Saves user's in-progress project input draft locally so they never lose their ideas."""
    state = db.query(SystemState).filter(SystemState.key == "wizard_draft").first()
    json_str = json.dumps(draft, ensure_ascii=False)
    if not state:
        state = SystemState(key="wizard_draft", value=json_str)
        db.add(state)
    else:
        state.value = json_str
    db.commit()
    return {"status": "saved"}

@router.get("/session/draft")
def get_wizard_draft(db: Session = Depends(get_db)):
    state = db.query(SystemState).filter(SystemState.key == "wizard_draft").first()
    if state and state.value:
        try:
            return json.loads(state.value)
        except Exception:
            return None
    return None

@router.delete("/session/draft")
def clear_wizard_draft(db: Session = Depends(get_db)):
    state = db.query(SystemState).filter(SystemState.key == "wizard_draft").first()
    if state:
        db.delete(state)
        db.commit()
    return {"status": "cleared"}

@router.get("/system/check-updates")
def check_github_updates():
    """Checks whether the local git repo is behind origin/main."""
    try:
        import subprocess
        # Fast fetch with timeout
        subprocess.run(["git", "fetch", "origin", "main", "--quiet"], timeout=3, check=False)
        res = subprocess.run(["git", "rev-list", "HEAD..origin/main", "--count"], capture_output=True, text=True, timeout=2)
        count = int(res.stdout.strip()) if res.stdout and res.stdout.strip().isdigit() else 0
        return {"has_update": count > 0, "behind_count": count}
    except Exception:
        return {"has_update": False, "behind_count": 0}


