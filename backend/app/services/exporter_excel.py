import io
from datetime import datetime
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
from app.models.models import Project

class ExcelExporter:
    @staticmethod
    def generate_project_workbook(project: Project) -> io.BytesIO:
        wb = Workbook()

        # Styles
        font_family = "Segoe UI"
        title_font = Font(name=font_family, size=16, bold=True, color="FFFFFF")
        section_font = Font(name=font_family, size=12, bold=True, color="1E293B")
        header_font = Font(name=font_family, size=11, bold=True, color="FFFFFF")
        bold_font = Font(name=font_family, size=10, bold=True, color="1E293B")
        regular_font = Font(name=font_family, size=10, color="334155")
        muted_font = Font(name=font_family, size=9, italic=True, color="64748B")

        primary_fill = PatternFill(start_color="1E293B", end_color="1E293B", fill_type="solid")     # Slate 800
        header_fill = PatternFill(start_color="3B82F6", end_color="3B82F6", fill_type="solid")      # Blue 500
        phase_fill = PatternFill(start_color="F1F5F9", end_color="F1F5F9", fill_type="solid")       # Slate 100
        alt_row_fill = PatternFill(start_color="F8FAFC", end_color="F8FAFC", fill_type="solid")

        # Status fills
        done_fill = PatternFill(start_color="DCFCE7", end_color="DCFCE7", fill_type="solid")
        done_font = Font(name=font_family, size=10, bold=True, color="166534")

        in_progress_fill = PatternFill(start_color="DBEAFE", end_color="DBEAFE", fill_type="solid")
        in_progress_font = Font(name=font_family, size=10, bold=True, color="1E40AF")

        delayed_fill = PatternFill(start_color="FEE2E2", end_color="FEE2E2", fill_type="solid")
        delayed_font = Font(name=font_family, size=10, bold=True, color="991B1B")

        todo_fill = PatternFill(start_color="F3F4F6", end_color="F3F4F6", fill_type="solid")
        todo_font = Font(name=font_family, size=10, color="4B5563")

        thin_side = Side(border_style="thin", color="CBD5E1")
        border_all = Border(left=thin_side, right=thin_side, top=thin_side, bottom=thin_side)

        align_center = Alignment(horizontal="center", vertical="center")
        align_left = Alignment(horizontal="left", vertical="center")

        # -------------------------------------------------------------
        # SHEET 1: PROJECT SUMMARY
        # -------------------------------------------------------------
        ws_sum = wb.active
        ws_sum.title = "Project Summary"
        ws_sum.views.sheetView[0].showGridLines = True

        # Header banner
        ws_sum.merge_cells("A1:F2")
        title_cell = ws_sum["A1"]
        title_cell.value = f"CHRONOMIND | {project.title.upper()}"
        title_cell.font = title_font
        title_cell.fill = primary_fill
        title_cell.alignment = align_center

        row = 4
        # Meta info
        meta_items = [
            ("Project Status", project.status),
            ("AI Complexity Score", f"{project.complexity_score} / 10.0"),
            ("Weekly Available Hours", f"{project.available_hours_per_week} hrs/week"),
            ("User Skill Level", project.skill_level),
            ("Kick-off Date", project.kick_off_date.strftime("%Y-%m-%d %H:%M") if project.kick_off_date else "Preparation Mode (Not Started)"),
            ("Estimated Completion", project.estimated_completion_date.strftime("%Y-%m-%d") if project.estimated_completion_date else "TBD after Kick-off"),
        ]

        for label, val in meta_items:
            ws_sum.cell(row=row, column=1, value=label).font = bold_font
            val_cell = ws_sum.cell(row=row, column=2, value=str(val))
            val_cell.font = regular_font
            ws_sum.cell(row=row, column=1).fill = phase_fill
            row += 1

        row += 1
        ws_sum.cell(row=row, column=1, value="AI Complexity & Risk Analysis:").font = section_font
        row += 1
        ws_sum.merge_cells(start_row=row, start_column=1, end_row=row+2, end_column=6)
        exp_cell = ws_sum.cell(row=row, column=1, value=project.complexity_explanation or "N/A")
        exp_cell.font = regular_font
        exp_cell.alignment = Alignment(wrap_text=True, vertical="top")
        row += 4

        # Preparation Checklist Summary
        ws_sum.cell(row=row, column=1, value="Preparation Checklist (Prerequisites):").font = section_font
        row += 1
        prep_headers = ["Category", "Requirement / Task", "Status", "Completed At"]
        for col_idx, h in enumerate(prep_headers, 1):
            c = ws_sum.cell(row=row, column=col_idx, value=h)
            c.font = header_font
            c.fill = header_fill
            c.alignment = align_center
            c.border = border_all
        row += 1

        for prereq in project.prerequisites:
            ws_sum.cell(row=row, column=1, value=prereq.category).alignment = align_center
            ws_sum.cell(row=row, column=2, value=prereq.title)
            status_cell = ws_sum.cell(row=row, column=3, value="COMPLETED" if prereq.is_completed else "PENDING")
            status_cell.alignment = align_center
            if prereq.is_completed:
                status_cell.fill = done_fill
                status_cell.font = done_font
            else:
                status_cell.fill = todo_fill
                status_cell.font = todo_font

            ws_sum.cell(row=row, column=4, value=prereq.completed_at.strftime("%Y-%m-%d") if prereq.completed_at else "-")

            for col in range(1, 5):
                cell = ws_sum.cell(row=row, column=col)
                if not cell.font or cell.font == regular_font:
                    cell.font = regular_font
                cell.border = border_all
            row += 1

        # -------------------------------------------------------------
        # SHEET 2: WBS & SCHEDULE
        # -------------------------------------------------------------
        ws_wbs = wb.create_sheet(title="WBS & Schedule")
        ws_wbs.views.sheetView[0].showGridLines = True

        # Table headers
        wbs_headers = [
            "Phase / Task",
            "Item Name",
            "Est. Hours",
            "Milestone?",
            "Priority",
            "Planned Date / Deadline",
            "Status",
            "Notes / Description"
        ]

        for col_idx, h in enumerate(wbs_headers, 1):
            c = ws_wbs.cell(row=1, column=col_idx, value=h)
            c.font = header_font
            c.fill = primary_fill
            c.alignment = align_center
            c.border = border_all

        wbs_row = 2
        for phase in project.phases:
            # Phase Row (Distinct style)
            ws_wbs.cell(row=wbs_row, column=1, value=f"Phase {phase.phase_number}").font = bold_font
            ws_wbs.cell(row=wbs_row, column=2, value=phase.title).font = bold_font
            ws_wbs.cell(row=wbs_row, column=3, value=phase.estimated_hours).font = bold_font
            ws_wbs.cell(row=wbs_row, column=4, value="PHASE").font = bold_font
            ws_wbs.cell(row=wbs_row, column=5, value="-").font = muted_font

            deadline_str = ""
            if phase.planned_start_date and phase.planned_end_date:
                deadline_str = f"{phase.planned_start_date.strftime('%Y-%m-%d')} ~ {phase.planned_end_date.strftime('%Y-%m-%d')}"
            ws_wbs.cell(row=wbs_row, column=6, value=deadline_str).font = bold_font

            status_cell = ws_wbs.cell(row=wbs_row, column=7, value=phase.status)
            status_cell.alignment = align_center
            if phase.status == "COMPLETED":
                status_cell.fill, status_cell.font = done_fill, done_font
            elif phase.status == "IN_PROGRESS":
                status_cell.fill, status_cell.font = in_progress_fill, in_progress_font
            elif phase.status == "DELAYED":
                status_cell.fill, status_cell.font = delayed_fill, delayed_font
            else:
                status_cell.fill, status_cell.font = todo_fill, todo_font

            ws_wbs.cell(row=wbs_row, column=8, value=phase.description or "").font = regular_font

            for col in range(1, 9):
                cell = ws_wbs.cell(row=wbs_row, column=col)
                if col not in (7,):
                    cell.fill = phase_fill
                cell.border = border_all

            wbs_row += 1

            # Task Rows
            for task in phase.tasks:
                ws_wbs.cell(row=wbs_row, column=1, value="  ↳ Task").font = muted_font
                ws_wbs.cell(row=wbs_row, column=2, value=task.title).font = regular_font
                ws_wbs.cell(row=wbs_row, column=3, value=task.estimated_hours).font = regular_font
                ws_wbs.cell(row=wbs_row, column=4, value="★ MILESTONE" if task.is_milestone else "Normal").font = bold_font if task.is_milestone else regular_font
                ws_wbs.cell(row=wbs_row, column=5, value=task.priority).alignment = align_center

                t_deadline = task.planned_date.strftime("%Y-%m-%d") if task.planned_date else "-"
                ws_wbs.cell(row=wbs_row, column=6, value=t_deadline).alignment = align_center

                t_status_cell = ws_wbs.cell(row=wbs_row, column=7, value=task.status)
                t_status_cell.alignment = align_center
                if task.status == "DONE":
                    t_status_cell.fill, t_status_cell.font = done_fill, done_font
                elif task.status == "IN_PROGRESS":
                    t_status_cell.fill, t_status_cell.font = in_progress_fill, in_progress_font
                elif task.status == "DELAYED":
                    t_status_cell.fill, t_status_cell.font = delayed_fill, delayed_font
                else:
                    t_status_cell.fill, t_status_cell.font = todo_fill, todo_font

                ws_wbs.cell(row=wbs_row, column=8, value=task.description or "").font = regular_font

                if wbs_row % 2 == 0:
                    for col in range(1, 9):
                        if col != 7:
                            ws_wbs.cell(row=wbs_row, column=col).fill = alt_row_fill

                for col in range(1, 9):
                    ws_wbs.cell(row=wbs_row, column=col).border = border_all

                wbs_row += 1

        # -------------------------------------------------------------
        # SHEET 3: EXTENSION HISTORY
        # -------------------------------------------------------------
        ws_ext = wb.create_sheet(title="Extension History")
        ws_ext.views.sheetView[0].showGridLines = True

        ext_headers = ["Logged At", "Target Phase", "Days Extended", "Reason", "Previous Deadline", "New Deadline", "AI Analysis"]
        for col_idx, h in enumerate(ext_headers, 1):
            c = ws_ext.cell(row=1, column=col_idx, value=h)
            c.font = header_font
            c.fill = primary_fill
            c.alignment = align_center
            c.border = border_all

        ext_row = 2
        for ext in project.extensions:
            ws_ext.cell(row=ext_row, column=1, value=ext.created_at.strftime("%Y-%m-%d %H:%M")).alignment = align_center
            ws_ext.cell(row=ext_row, column=2, value=ext.phase_title or "General").font = bold_font
            ws_ext.cell(row=ext_row, column=3, value=f"+{ext.days_added} days").alignment = align_center
            ws_ext.cell(row=ext_row, column=4, value=ext.reason)
            ws_ext.cell(row=ext_row, column=5, value=ext.previous_deadline.strftime("%Y-%m-%d") if ext.previous_deadline else "-").alignment = align_center
            ws_ext.cell(row=ext_row, column=6, value=ext.new_deadline.strftime("%Y-%m-%d") if ext.new_deadline else "-").alignment = align_center
            ws_ext.cell(row=ext_row, column=7, value=ext.ai_analysis or "-")

            for col in range(1, 8):
                cell = ws_ext.cell(row=ext_row, column=col)
                cell.font = regular_font
                cell.border = border_all
            ext_row += 1

        # Auto-adjust column widths for all sheets
        for sheet in wb.worksheets:
            for col in sheet.columns:
                max_len = 0
                col_letter = get_column_letter(col[0].column)
                for cell in col:
                    if cell.value:
                        lines = str(cell.value).split("\n")
                        for line in lines:
                            if len(line) > max_len:
                                max_len = len(line)
                sheet.column_dimensions[col_letter].width = min(max(max_len + 3, 12), 48)

        stream = io.BytesIO()
        wb.save(stream)
        stream.seek(0)
        return stream
