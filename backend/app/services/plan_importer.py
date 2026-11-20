import io
import csv
import zipfile
import logging
from typing import Dict, Any, Optional, Tuple, List
import openpyxl
import docx
from app.services.ai_engine import AIEngine
from app.schemas.schemas import AIAnalysisResult, AIPrerequisiteItem, AIPhaseItem, AITaskItem

logger = logging.getLogger(__name__)

SUPPORTED_EXTENSIONS = (".xlsx", ".xlsm", ".xltx", ".csv", ".docx", ".txt", ".md", ".json")

class PlanImporterService:
    @classmethod
    def extract_text_from_file(cls, file_bytes: bytes, filename: str) -> Tuple[str, str]:
        """
        Extracts structured text representation from Excel (.xlsx, .csv),
        Word (.docx), Text/Markdown (.txt, .md), or ZIP archives containing them.
        Returns (extracted_text, file_type).
        """
        lower_name = filename.lower()
        extracted_parts: List[str] = []

        # 0. ZIP ARCHIVE (Folder compressed into .zip)
        if lower_name.endswith(".zip"):
            try:
                with zipfile.ZipFile(io.BytesIO(file_bytes)) as zf:
                    extracted_parts.append(f"=== TỆP NÉN / THƯ MỤC: {filename} ===")
                    count = 0
                    for info in zf.infolist():
                        if info.is_dir() or info.filename.startswith(("__MACOSX", ".")):
                            continue
                        clean_inner = info.filename.split("/")[-1]
                        if not clean_inner or clean_inner.startswith("."):
                            continue
                        if clean_inner.lower().endswith(SUPPORTED_EXTENSIONS):
                            inner_bytes = zf.read(info.filename)
                            inner_text, inner_type = cls.extract_text_from_file(inner_bytes, clean_inner)
                            if inner_text.strip():
                                extracted_parts.append(f"\n--- [Tệp con trong zip]: {info.filename} ({inner_type}) ---")
                                extracted_parts.append(inner_text)
                                count += 1
                    if count == 0:
                        extracted_parts.append("Không tìm thấy tệp .xlsx, .docx hoặc .txt nào bên trong file zip.")
                return "\n".join(extracted_parts), "zip"
            except Exception as e:
                logger.error(f"Error extracting zip file {filename}: {e}")
                return f"Lỗi giải nén file zip {filename}: {str(e)}", "zip"

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
    async def parse_multiple_files(
        cls,
        files: List[Tuple[bytes, str]],
        available_hours_per_week: float = 12.0,
        skill_level: str = "Intermediate",
    ) -> Dict[str, Any]:
        """
        Processes one or multiple uploaded plan files (or a zip folder containing them),
        extracts contents from all of them, and synthesizes into a unified Chronomind roadmap.
        """
        combined_texts: List[str] = []
        processed_file_names: List[str] = []
        file_types: List[str] = []

        for file_bytes, filename in files:
            extracted_text, file_type = cls.extract_text_from_file(file_bytes, filename)
            if extracted_text.strip():
                combined_texts.append(f"\n==========================================")
                combined_texts.append(f"TÀI LIỆU NGUỒN: {filename} (Định dạng: {file_type.upper()})")
                combined_texts.append(f"==========================================")
                combined_texts.append(extracted_text)
                processed_file_names.append(filename)
                if file_type not in file_types:
                    file_types.append(file_type)

        if not combined_texts:
            raise ValueError("Không thể đọc được nội dung từ bất kỳ tệp tin nào được tải lên. Hãy kiểm tra lại file của bạn.")

        full_content = "\n".join(combined_texts)
        summary_name = processed_file_names[0] if len(processed_file_names) == 1 else f"Tổng hợp {len(processed_file_names)} tài liệu kế hoạch"

        logger.info(f"Synthesizing {len(processed_file_names)} files (total {len(full_content)} chars)")

        # Pass combined multi-document content to AI Engine
        analysis_result, metadata = await AIEngine.analyze_imported_plan(
            raw_content=full_content,
            filename=summary_name,
            file_type=", ".join(file_types),
            available_hours_per_week=available_hours_per_week,
            skill_level=skill_level,
        )

        return {
            "title": metadata.get("title") or analysis_result.refined_title,
            "description": metadata.get("description") or f"Dự án được tổng hợp từ {len(processed_file_names)} tệp tài liệu: {', '.join(processed_file_names)}.",
            "target_goal": metadata.get("target_goal") or "Hoàn thành toàn bộ lộ trình được trích xuất từ các tài liệu kế hoạch.",
            "available_hours_per_week": available_hours_per_week,
            "skill_level": skill_level,
            "tools_resources": metadata.get("tools_resources") or "Được trích xuất từ tài liệu kế hoạch.",
            "files_processed": processed_file_names,
            "total_files_count": len(processed_file_names),
            "file_types": file_types,
            "extracted_text_preview": full_content[:800] + ("..." if len(full_content) > 800 else ""),
            "ai_analysis": analysis_result.model_dump() if hasattr(analysis_result, "model_dump") else analysis_result.dict(),
        }

    @classmethod
    async def parse_plan_file(
        cls,
        file_bytes: bytes,
        filename: str,
        available_hours_per_week: float = 12.0,
        skill_level: str = "Intermediate",
    ) -> Dict[str, Any]:
        """Single file backward-compatible wrapper."""
        return await cls.parse_multiple_files([(file_bytes, filename)], available_hours_per_week, skill_level)

