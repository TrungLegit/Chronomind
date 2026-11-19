import re
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import Project
from app.services.exporter_excel import ExcelExporter
from app.services.exporter_word import WordExporter

router = APIRouter()

def clean_filename(name: str) -> str:
    return re.sub(r'[\\/*?:"<>| ]', '_', name)[:40]

@router.get("/{project_id}/export/excel")
def export_excel(project_id: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    stream = ExcelExporter.generate_project_workbook(project)
    safe_title = clean_filename(project.title)
    filename = f"Chronomind_{safe_title}_WBS.xlsx"

    return Response(
        content=stream.getvalue(),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

@router.get("/{project_id}/export/word")
def export_word(project_id: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    stream = WordExporter.generate_project_document(project)
    safe_title = clean_filename(project.title)
    filename = f"Chronomind_{safe_title}_Report.docx"

    return Response(
        content=stream.getvalue(),
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )
