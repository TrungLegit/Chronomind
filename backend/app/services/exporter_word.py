import io
import json
from datetime import datetime
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from app.models.models import Project

def set_cell_background(cell, fill_hex: str):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'), fill_hex)
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('w:top', top), ('w:bottom', bottom), ('w:left', left), ('w:right', right)]:
        node = OxmlElement(m)
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

class WordExporter:
    @staticmethod
    def generate_project_document(project: Project) -> io.BytesIO:
        doc = Document()

        # Set standard margins (0.75 inch)
        for section in doc.sections:
            section.top_margin = Inches(0.75)
            section.bottom_margin = Inches(0.75)
            section.left_margin = Inches(0.8)
            section.right_margin = Inches(0.8)

        # Palette
        c_primary = RGBColor(30, 41, 59)     # Slate 800
        c_accent = RGBColor(37, 99, 235)     # Blue 600
        c_muted = RGBColor(100, 116, 139)    # Slate 500

        # Header Title
        title_p = doc.add_paragraph()
        title_p.paragraph_format.space_before = Pt(0)
        title_p.paragraph_format.space_after = Pt(4)
        run_title = title_p.add_run("CHRONOMIND | PROJECT STATUS & ROADMAP")
        run_title.font.name = "Segoe UI"
        run_title.font.size = Pt(20)
        run_title.font.bold = True
        run_title.font.color.rgb = c_accent

        subtitle_p = doc.add_paragraph()
        subtitle_p.paragraph_format.space_after = Pt(16)
        run_sub = subtitle_p.add_run(f"Project: {project.title} • Generated on {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}")
        run_sub.font.name = "Segoe UI"
        run_sub.font.size = Pt(10)
        run_sub.font.color.rgb = c_muted

        # Divider line
        p_div = doc.add_paragraph()
        p_div.paragraph_format.space_after = Pt(12)
        r_div = p_div.add_run("―" * 58)
        r_div.font.color.rgb = c_muted

        # -------------------------------------------------------------
        # SECTION 1: EXECUTIVE SUMMARY
        # -------------------------------------------------------------
        h1 = doc.add_heading("1. Executive Summary & Parameters", level=1)
        h1.paragraph_format.space_before = Pt(14)
        h1.paragraph_format.space_after = Pt(8)

        # Overview Table
        table_meta = doc.add_table(rows=6, cols=2)
        table_meta.alignment = WD_TABLE_ALIGNMENT.CENTER
        table_meta.autofit = False

        meta_data = [
            ("Current Status", project.status),
            ("AI Feasibility & Complexity Score", f"{project.complexity_score} / 10.0"),
            ("Weekly Dedicated Capacity", f"{project.available_hours_per_week} Hours/Week"),
            ("Current Skill Level", project.skill_level),
            ("Official Kick-off Date", project.kick_off_date.strftime("%Y-%m-%d %H:%M") if project.kick_off_date else "Preparation Mode (Pending Kick-off)"),
            ("Target Completion Deadline", project.estimated_completion_date.strftime("%Y-%m-%d") if project.estimated_completion_date else "To be determined at kick-off"),
        ]

        for i, (label, val) in enumerate(meta_data):
            cell_label = table_meta.cell(i, 0)
            cell_val = table_meta.cell(i, 1)

            cell_label.width = Inches(2.2)
            cell_val.width = Inches(4.5)

            set_cell_background(cell_label, "F1F5F9")
            set_cell_margins(cell_label, top=80, bottom=80, left=120, right=120)
            set_cell_margins(cell_val, top=80, bottom=80, left=120, right=120)

            p_l = cell_label.paragraphs[0]
            p_l.paragraph_format.space_after = Pt(0)
            r_l = p_l.add_run(label)
            r_l.font.bold = True
            r_l.font.size = Pt(9.5)
            r_l.font.name = "Segoe UI"

            p_v = cell_val.paragraphs[0]
            p_v.paragraph_format.space_after = Pt(0)
            r_v = p_v.add_run(str(val))
            r_v.font.size = Pt(9.5)
            r_v.font.name = "Segoe UI"

        doc.add_paragraph().paragraph_format.space_after = Pt(6)

        # Description & Goal
        p_desc = doc.add_paragraph()
        r_desc_title = p_desc.add_run("Project Description: ")
        r_desc_title.font.bold = True
        p_desc.add_run(project.description)

        if project.target_goal:
            p_goal = doc.add_paragraph()
            r_goal_title = p_goal.add_run("Target Outcome: ")
            r_goal_title.font.bold = True
            p_goal.add_run(project.target_goal)

        # -------------------------------------------------------------
        # SECTION 2: AI COMPLEXITY & BLIND SPOTS
        # -------------------------------------------------------------
        h2 = doc.add_heading("2. AI Feasibility Analysis & Blind Spots", level=1)
        h2.paragraph_format.space_before = Pt(16)
        h2.paragraph_format.space_after = Pt(6)

        p_exp = doc.add_paragraph()
        p_exp.paragraph_format.space_after = Pt(8)
        p_exp.add_run(project.complexity_explanation or "Phân tích độ khó chưa được tạo.")

        # Blind spots
        blind_spots = []
        if project.blind_spots:
            try:
                blind_spots = json.loads(project.blind_spots)
            except Exception:
                blind_spots = [project.blind_spots]

        if blind_spots:
            p_bs_title = doc.add_paragraph()
            r_bs = p_bs_title.add_run("⚠️ Key Blind Spots & Unseen Gotchas Identified by AI:")
            r_bs.font.bold = True
            r_bs.font.color.rgb = RGBColor(194, 65, 12)  # Amber 700

            for bs in blind_spots:
                p_item = doc.add_paragraph(style='List Bullet')
                p_item.paragraph_format.space_after = Pt(3)
                p_item.add_run(bs)

        # -------------------------------------------------------------
        # SECTION 3: PREREQUISITES & PREPARATION CHECKLIST
        # -------------------------------------------------------------
        h3 = doc.add_heading("3. Preparation Checklist (Prerequisites)", level=1)
        h3.paragraph_format.space_before = Pt(16)
        h3.paragraph_format.space_after = Pt(6)

        p_prep_desc = doc.add_paragraph()
        p_prep_desc.paragraph_format.space_after = Pt(6)
        p_prep_desc.add_run("Các hạng mục cần hoàn thành hoặc trang bị trước khi chính thức bấm Kick-off:")

        if project.prerequisites:
            table_prep = doc.add_table(rows=len(project.prerequisites) + 1, cols=4)
            table_prep.alignment = WD_TABLE_ALIGNMENT.CENTER

            headers_p = ["Category", "Title & Details", "Status", "Completed At"]
            for col_idx, h in enumerate(headers_p):
                cell = table_prep.cell(0, col_idx)
                set_cell_background(cell, "1E293B")
                set_cell_margins(cell, top=100, bottom=100, left=100, right=100)
                p = cell.paragraphs[0]
                p.paragraph_format.space_after = Pt(0)
                r = p.add_run(h)
                r.font.bold = True
                r.font.color.rgb = RGBColor(255, 255, 255)
                r.font.size = Pt(9.5)

            for idx, item in enumerate(project.prerequisites, 1):
                c0 = table_prep.cell(idx, 0)
                c1 = table_prep.cell(idx, 1)
                c2 = table_prep.cell(idx, 2)
                c3 = table_prep.cell(idx, 3)

                c0.width = Inches(1.3)
                c1.width = Inches(3.2)
                c2.width = Inches(1.1)
                c3.width = Inches(1.1)

                set_cell_margins(c0, 60, 60, 80, 80)
                set_cell_margins(c1, 60, 60, 80, 80)
                set_cell_margins(c2, 60, 60, 80, 80)
                set_cell_margins(c3, 60, 60, 80, 80)

                c0.paragraphs[0].add_run(item.category).font.size = Pt(9)
                
                p_title = c1.paragraphs[0]
                r_t = p_title.add_run(item.title)
                r_t.font.bold = True
                r_t.font.size = Pt(9)
                if item.description:
                    p_desc = c1.add_paragraph()
                    p_desc.paragraph_format.space_after = Pt(0)
                    r_d = p_desc.add_run(item.description)
                    r_d.font.size = Pt(8.5)
                    r_d.font.color.rgb = c_muted

                r_status = c2.paragraphs[0].add_run("DONE" if item.is_completed else "PENDING")
                r_status.font.bold = True
                r_status.font.size = Pt(9)
                if item.is_completed:
                    r_status.font.color.rgb = RGBColor(22, 101, 52)
                    set_cell_background(c2, "DCFCE7")
                else:
                    r_status.font.color.rgb = RGBColor(75, 85, 99)
                    set_cell_background(c2, "F3F4F6")

                c3.paragraphs[0].add_run(item.completed_at.strftime("%Y-%m-%d") if item.completed_at else "-").font.size = Pt(9)

        # -------------------------------------------------------------
        # SECTION 4: PHASES & TASKS ROADMAP
        # -------------------------------------------------------------
        h4 = doc.add_heading("4. Phased Execution Roadmap & WBS", level=1)
        h4.paragraph_format.space_before = Pt(18)
        h4.paragraph_format.space_after = Pt(6)

        for phase in project.phases:
            p_ph = doc.add_paragraph()
            p_ph.paragraph_format.space_before = Pt(10)
            p_ph.paragraph_format.space_after = Pt(2)
            r_ph = p_ph.add_run(f"Phase {phase.phase_number}: {phase.title} ({phase.estimated_hours}h) - [{phase.status}]")
            r_ph.font.bold = True
            r_ph.font.size = Pt(12)
            r_ph.font.color.rgb = c_accent

            if phase.description:
                p_ph_d = doc.add_paragraph()
                p_ph_d.paragraph_format.space_after = Pt(4)
                r_ph_d = p_ph_d.add_run(phase.description)
                r_ph_d.font.italic = True
                r_ph_d.font.size = Pt(9.5)

            if phase.planned_start_date and phase.planned_end_date:
                p_dates = doc.add_paragraph()
                p_dates.paragraph_format.space_after = Pt(6)
                p_dates.add_run(f"Timeline: {phase.planned_start_date.strftime('%Y-%m-%d')} to {phase.planned_end_date.strftime('%Y-%m-%d')}").font.size = Pt(9)

            if phase.tasks:
                tbl_tasks = doc.add_table(rows=len(phase.tasks) + 1, cols=5)
                tbl_tasks.alignment = WD_TABLE_ALIGNMENT.CENTER

                task_headers = ["Task Title", "Est. Hours", "Type", "Priority", "Status"]
                for c_i, th in enumerate(task_headers):
                    c = tbl_tasks.cell(0, c_i)
                    set_cell_background(c, "334155")
                    set_cell_margins(c, 60, 60, 80, 80)
                    p = c.paragraphs[0]
                    p.paragraph_format.space_after = Pt(0)
                    r = p.add_run(th)
                    r.font.bold = True
                    r.font.color.rgb = RGBColor(255, 255, 255)
                    r.font.size = Pt(9)

                for t_idx, task in enumerate(phase.tasks, 1):
                    tc0 = tbl_tasks.cell(t_idx, 0)
                    tc1 = tbl_tasks.cell(t_idx, 1)
                    tc2 = tbl_tasks.cell(t_idx, 2)
                    tc3 = tbl_tasks.cell(t_idx, 3)
                    tc4 = tbl_tasks.cell(t_idx, 4)

                    tc0.width = Inches(3.2)
                    tc1.width = Inches(0.8)
                    tc2.width = Inches(1.1)
                    tc3.width = Inches(0.8)
                    tc4.width = Inches(0.8)

                    set_cell_margins(tc0, 50, 50, 60, 60)
                    set_cell_margins(tc1, 50, 50, 60, 60)
                    set_cell_margins(tc2, 50, 50, 60, 60)
                    set_cell_margins(tc3, 50, 50, 60, 60)
                    set_cell_margins(tc4, 50, 50, 60, 60)

                    tc0.paragraphs[0].add_run(task.title).font.size = Pt(9)
                    tc1.paragraphs[0].add_run(f"{task.estimated_hours}h").font.size = Pt(9)
                    tc2.paragraphs[0].add_run("★ Milestone" if task.is_milestone else "Task").font.size = Pt(9)
                    tc3.paragraphs[0].add_run(task.priority).font.size = Pt(9)
                    
                    st_r = tc4.paragraphs[0].add_run(task.status)
                    st_r.font.bold = True
                    st_r.font.size = Pt(9)
                    if task.status == "DONE":
                        st_r.font.color.rgb = RGBColor(22, 101, 52)
                    elif task.status == "IN_PROGRESS":
                        st_r.font.color.rgb = RGBColor(30, 64, 175)

        # -------------------------------------------------------------
        # SECTION 5: EXTENSION HISTORY
        # -------------------------------------------------------------
        if project.extensions:
            h5 = doc.add_heading("5. Delay Log & Smart Rescheduling History", level=1)
            h5.paragraph_format.space_before = Pt(18)
            h5.paragraph_format.space_after = Pt(6)

            tbl_ext = doc.add_table(rows=len(project.extensions) + 1, cols=4)
            tbl_ext.alignment = WD_TABLE_ALIGNMENT.CENTER
            ext_h = ["Date", "Target Phase", "Extension", "Reason & AI Assessment"]
            for c_i, th in enumerate(ext_h):
                c = tbl_ext.cell(0, c_i)
                set_cell_background(c, "1E293B")
                set_cell_margins(c, 60, 60, 80, 80)
                p = c.paragraphs[0]
                p.paragraph_format.space_after = Pt(0)
                r = p.add_run(th)
                r.font.bold = True
                r.font.color.rgb = RGBColor(255, 255, 255)
                r.font.size = Pt(9)

            for e_idx, ext in enumerate(project.extensions, 1):
                ec0 = tbl_ext.cell(e_idx, 0)
                ec1 = tbl_ext.cell(e_idx, 1)
                ec2 = tbl_ext.cell(e_idx, 2)
                ec3 = tbl_ext.cell(e_idx, 3)

                ec0.width = Inches(1.2)
                ec1.width = Inches(1.3)
                ec2.width = Inches(1.0)
                ec3.width = Inches(3.2)

                set_cell_margins(ec0, 50, 50, 60, 60)
                set_cell_margins(ec1, 50, 50, 60, 60)
                set_cell_margins(ec2, 50, 50, 60, 60)
                set_cell_margins(ec3, 50, 50, 60, 60)

                ec0.paragraphs[0].add_run(ext.created_at.strftime("%Y-%m-%d")).font.size = Pt(8.5)
                ec1.paragraphs[0].add_run(ext.phase_title or "General").font.size = Pt(8.5)
                ec2.paragraphs[0].add_run(f"+{ext.days_added} Days").font.size = Pt(8.5)

                p_res = ec3.paragraphs[0]
                r_r = p_res.add_run(f"Reason: {ext.reason}")
                r_r.font.size = Pt(8.5)
                if ext.ai_analysis:
                    p_ai = ec3.add_paragraph()
                    p_ai.paragraph_format.space_after = Pt(0)
                    r_ai = p_ai.add_run(f"AI: {ext.ai_analysis}")
                    r_ai.font.italic = True
                    r_ai.font.size = Pt(8.0)
                    r_ai.font.color.rgb = c_muted

        stream = io.BytesIO()
        doc.save(stream)
        stream.seek(0)
        return stream
