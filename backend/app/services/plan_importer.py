import io
import csv
import logging
from typing import Dict, Any, Optional, Tuple, List
import openpyxl
import docx
from app.services.ai_engine import AIEngine
from app.schemas.schemas import AIAnalysisResult, AIPrerequisiteItem, AIPhaseItem, AITaskItem

logger = logging.getLogger(__name__)

class PlanImporterService:
    @staticmethod
    def extract_text_from_file(file_bytes: bytes, filename: str) -> Tuple[str, str]:
        """
        Extracts structured text representation from Excel (.xlsx, .csv),
        Word (.docx), or Text/Markdown (.txt, .md).
        Returns (extracted_text, file_type).
        """
        lower_name = filename.lower()
        extracted_parts: List[str] = []

        # 1. EXCEL (.xlsx, .xlsm, .xltx)
        if lower_name.endswith((".xlsx", ".xlsm", ".xltx")):
            wb = openpyxl.load_workbook(io.BytesIO(file_bytes), data_only=True)
            for sheetname in wb.sheetnames:
                ws = wb[sheetname]
                extracted_parts.append(f"=== BẢNG TÍNH / SHEET: {sheetname} ===")
                row_count = 0
                for row in ws.iter_rows(values_only=True):
                    # Filter out empty rows
                    cells = [str(c).strip() if c is not None else "" for c in row]
                    if any(cells):
                        extracted_parts.append(" | ".join(cells))
                        row_count += 1
                        if row_count > 300:  # safety limit
                            extracted_parts.append("... (còn tiếp) ...")
                            break
            return "\n".join(extracted_parts), "excel"

        # 2. CSV
        elif lower_name.endswith(".csv"):
            text_content = ""
            for encoding in ("utf-8-sig", "utf-8", "latin-1", "cp1258"):
                try:
                    text_content = file_bytes.decode(encoding)
                    break
                except UnicodeDecodeError:
                    continue
            reader = csv.reader(io.StringIO(text_content))
            for row in reader:
                if any(row):
                    extracted_parts.append(" | ".join(cell.strip() for cell in row))
            return "\n".join(extracted_parts), "csv"

        # 3. WORD (.docx)
        elif lower_name.endswith(".docx"):
            doc = docx.Document(io.BytesIO(file_bytes))
            # Paragraphs
            for p in doc.paragraphs:
                txt = p.text.strip()
                if txt:
                    if p.style and "heading" in p.style.name.lower():
                        extracted_parts.append(f"\n### {txt}")
                    else:
                        extracted_parts.append(txt)

            # Tables
            for idx, table in enumerate(doc.tables, 1):
                extracted_parts.append(f"\n=== BẢNG {idx} ===")
                for row in table.rows:
                    row_cells = [cell.text.strip().replace("\n", " ") for cell in row.cells]
                    if any(row_cells):
                        extracted_parts.append(" | ".join(row_cells))

            return "\n".join(extracted_parts), "word"

        # 4. PLAIN TEXT / MARKDOWN / JSON
        else:
            text_content = ""
            for encoding in ("utf-8-sig", "utf-8", "latin-1", "cp1258"):
                try:
                    text_content = file_bytes.decode(encoding)
                    break
                except UnicodeDecodeError:
                    continue
            return text_content.strip(), "text"

    @classmethod
    async def parse_plan_file(
        cls,
        file_bytes: bytes,
        filename: str,
        available_hours_per_week: float = 12.0,
        skill_level: str = "Intermediate",
    ) -> Dict[str, Any]:
        """
        Processes an uploaded file, extracts its contents, and feeds it into the AI engine
        to synthesize into Chronomind's structured project schema.
        """
        extracted_text, file_type = cls.extract_text_from_file(file_bytes, filename)
        if not extracted_text.strip():
            raise ValueError(f"Không thể đọc được nội dung từ file '{filename}'. Vui lòng kiểm tra lại file.")

        logger.info(f"Successfully extracted {len(extracted_text)} chars from {filename} ({file_type})")

        # Let AI Engine ingest and structure the plan
        analysis_result, metadata = await AIEngine.analyze_imported_plan(
            raw_content=extracted_text,
            filename=filename,
            file_type=file_type,
            available_hours_per_week=available_hours_per_week,
            skill_level=skill_level,
        )

        return {
            "title": metadata.get("title") or analysis_result.refined_title,
            "description": metadata.get("description") or f"Dự án được nhập tự động từ tài liệu kế hoạch '{filename}'.",
            "target_goal": metadata.get("target_goal") or "Hoàn thành toàn bộ lộ trình theo file kế hoạch nhập vào.",
            "available_hours_per_week": available_hours_per_week,
            "skill_level": skill_level,
            "tools_resources": metadata.get("tools_resources") or "Được trích xuất từ tài liệu kế hoạch.",
            "file_name": filename,
            "file_type": file_type,
            "extracted_text_preview": extracted_text[:500] + ("..." if len(extracted_text) > 500 else ""),
            "ai_analysis": analysis_result.model_dump() if hasattr(analysis_result, "model_dump") else analysis_result.dict(),
        }
