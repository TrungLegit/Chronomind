from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import Task, TaskStatus
from app.schemas.schemas import TaskOut, TaskUpdate
from app.services.scheduler import DeadlineScheduler

router = APIRouter()

@router.patch("/{task_id}/toggle", response_model=TaskOut)
def toggle_task_status(task_id: str, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if task.status == TaskStatus.DONE.value:
        task.status = TaskStatus.TODO.value
        task.completed_at = None
    elif task.status == TaskStatus.TODO.value:
        task.status = TaskStatus.IN_PROGRESS.value
    else:  # IN_PROGRESS or DELAYED
        task.status = TaskStatus.DONE.value
        task.completed_at = datetime.utcnow()

    db.commit()
    db.refresh(task)

    # Check phase completion
    DeadlineScheduler.check_and_update_phase_completion(db, task.phase)

    return task

@router.put("/{task_id}", response_model=TaskOut)
def update_task(task_id: str, req: TaskUpdate, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    for field, val in req.model_dump(exclude_unset=True).items():
        setattr(task, field, val)

    if req.status == TaskStatus.DONE:
        task.completed_at = datetime.utcnow()
    elif req.status in (TaskStatus.TODO, TaskStatus.IN_PROGRESS):
        task.completed_at = None

    db.commit()
    db.refresh(task)

    DeadlineScheduler.check_and_update_phase_completion(db, task.phase)
    return task
