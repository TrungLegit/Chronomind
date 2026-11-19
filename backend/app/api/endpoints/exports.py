import re
import urllib.parse
import unicodedata
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import Project
from app.services.exporter_excel import ExcelExporter
from app.services.exporter_word import WordExporter
from app.services.exporter_ics import IcsExporter

router = APIRouter()

def clean_filename_ascii(name: str) -> str:
    nfkd = unicodedata.normalize("NFKD", name)
    ascii_name = "".join([c for c in nfkd if not unicodedata.combining(c)])
    clean = re.sub(r"[^a-zA-Z0-9_\-]", "_", ascii_name)
    return clean[:40] or "project"

def make_content_disposition(filename: str) -> str:
    encoded = urllib.parse.quote(filename)
    ascii_name = clean_filename_ascii(filename)
    return f'attachment; filename="{ascii_name}"; filename*=UTF-8\'\'{encoded}'

@router.get("/{project_id}/export/excel")
def export_excel(project_id: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    stream = ExcelExporter.generate_project_workbook(project)
    filename = f"Chronomind_{clean_filename_ascii(project.title)}_WBS.xlsx"

    return Response(
        content=stream.getvalue(),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": make_content_disposition(filename)}
    )

@router.get("/{project_id}/export/word")
def export_word(project_id: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    stream = WordExporter.generate_project_document(project)
    filename = f"Chronomind_{clean_filename_ascii(project.title)}_Report.docx"

    return Response(
        content=stream.getvalue(),
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": make_content_disposition(filename)}
    )

@router.get("/{project_id}/export/ics")
def export_ics(project_id: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    stream = IcsExporter.generate_project_ics(project)
    filename = f"Chronomind_{clean_filename_ascii(project.title)}_Calendar.ics"

    return Response(
        content=stream.getvalue(),
        media_type="text/calendar; charset=utf-8",
        headers={"Content-Disposition": make_content_disposition(filename)}
    )
