from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import Prerequisite, Project
from app.schemas.schemas import PrerequisiteOut, PrerequisiteToggleResponse, PrerequisiteCreate

router = APIRouter()

@router.post("/{prereq_id}/toggle", response_model=PrerequisiteToggleResponse)
def toggle_prerequisite(prereq_id: str, db: Session = Depends(get_db)):
    prereq = db.query(Prerequisite).filter(Prerequisite.id == prereq_id).first()
    if not prereq:
        raise HTTPException(status_code=404, detail="Prerequisite item not found")

    prereq.is_completed = not prereq.is_completed
    prereq.completed_at = datetime.utcnow() if prereq.is_completed else None
    db.commit()
    db.refresh(prereq)

    # Calculate status for the whole project
    all_prereqs = db.query(Prerequisite).filter(Prerequisite.project_id == prereq.project_id).all()
    completed_count = sum(1 for p in all_prereqs if p.is_completed)
    total_count = len(all_prereqs)
    all_met = (total_count > 0) and (completed_count == total_count)

    return PrerequisiteToggleResponse(
        id=prereq.id,
        is_completed=prereq.is_completed,
        completed_at=prereq.completed_at,
        all_prerequisites_met=all_met,
        completed_count=completed_count,
        total_count=total_count
    )

@router.post("/project/{project_id}", response_model=PrerequisiteOut)
def add_prerequisite(project_id: str, req: PrerequisiteCreate, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    count = len(project.prerequisites)
    prereq = Prerequisite(
        project_id=project_id,
        title=req.title,
        category=req.category.value,
        description=req.description,
        order_index=count,
        is_completed=False
    )
    db.add(prereq)
    db.commit()
    db.refresh(prereq)
    return prereq
