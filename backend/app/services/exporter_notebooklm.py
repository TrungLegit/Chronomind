import json
from datetime import datetime
from app.models.models import Project

class NotebookLMExporter:
    @staticmethod
    def generate_project_markdown(project: Project) -> str:
        """
        Generates a comprehensive, highly-structured briefing document in Markdown
        specifically formatted for ingestion into Google NotebookLM.
        Optimized for NotebookLM Grounded Q&A and Audio Overview (Podcast Generation).
        """
        total_tasks = sum(len(p.tasks) for p in project.phases)
        completed_tasks = sum(sum(1 for t in p.tasks if t.status == "DONE") for p in project.phases)
        total_hours = sum(p.estimated_hours for p in project.phases)

        blind_spots_list = []
        if project.blind_spots:
            try:
                blind_spots_list = json.loads(project.blind_spots)
            except Exception:
                blind_spots_list = [project.blind_spots]

        md_lines = []

        # Title & Executive Metadata
        md_lines.append(f"# TÀI LIỆU TOÀN DIỆN DỰ ÁN: {project.title.upper()}")
        md_lines.append(f"> Tài liệu tổng hợp từ hệ thống Chronomind AI Planner để nạp vào Google NotebookLM.")
        md_lines.append(f"> Ngày xuất bản: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}\n")

        md_lines.append("## 1. TỔNG QUAN DỰ ÁN (PROJECT OVERVIEW)")
        md_lines.append(f"- **Tên dự án:** {project.title}")
        md_lines.append(f"- **Trạng thái hiện tại:** {project.status}")
        md_lines.append(f"- **Mục tiêu đầu ra (Definition of Done):** {project.target_goal or 'N/A'}")
        md_lines.append(f"- **Quỹ thời gian cam kết:** {project.available_hours_per_week} giờ/tuần")
        md_lines.append(f"- **Trình độ người thực hiện:** {project.skill_level}")
        md_lines.append(f"- **Công cụ & Thiết bị có sẵn:** {project.tools_resources or 'N/A'}")
        md_lines.append(f"- **Tổng khối lượng ước tính:** {total_hours} giờ làm việc thực tế")
        md_lines.append(f"- **Tiến độ hoàn thành:** {completed_tasks}/{total_tasks} công việc ({round(completed_tasks/max(total_tasks, 1)*100, 1)}%)")
        if project.kick_off_date:
            md_lines.append(f"- **Ngày chính thức bắt đầu (Kick-off):** {project.kick_off_date.strftime('%Y-%m-%d')}")
        if project.estimated_completion_date:
            md_lines.append(f"- **Hạn chót dự kiến hoàn thành:** {project.estimated_completion_date.strftime('%Y-%m-%d')}")
        md_lines.append(f"\n### Mô tả phạm vi dự án:")
        md_lines.append(project.description)
        md_lines.append("")

        # Section 2: AI Complexity & Blind Spots
        md_lines.append("## 2. PHÂN TÍCH ĐỘ KHÓ & ĐIỂM MÙ KỸ THUẬT (AI FEASIBILITY & BLIND SPOTS)")
        md_lines.append(f"**Độ khó kỹ thuật được AI chấm điểm:** {project.complexity_score} / 10.0")
        md_lines.append(f"\n**Nhận định kiến trúc & Đánh giá rủi ro từ AI Architect:**")
        md_lines.append(project.complexity_explanation or "Không có nhận định đặc biệt.")

        if blind_spots_list:
            md_lines.append("\n### Các điểm mù kỹ thuật & Rủi ro tiềm ẩn cần đặc biệt lưu ý:")
            for idx, bs in enumerate(blind_spots_list, 1):
                md_lines.append(f"{idx}. {bs}")
        md_lines.append("")

        # Section 3: Prerequisites
        if project.prerequisites:
            md_lines.append("## 3. CHECKLIST VIỆC CẦN CHUẨN BỊ (PREREQUISITES)")
            md_lines.append("Những điều kiện tiên quyết cần hoàn thành trước khi bước vào giai đoạn lập trình/thiết kế chính thức:\n")
            for p in project.prerequisites:
                status_icon = "✓ [HOÀN THÀNH]" if p.is_completed else "○ [CHỜ THỰC HIỆN]"
                md_lines.append(f"- **{status_icon} [{p.category}] {p.title}**")
                if p.description:
                    md_lines.append(f"  *Chi tiết:* {p.description}")
            md_lines.append("")

        # Section 4: Phase-by-Phase WBS
        md_lines.append("## 4. BẢNG PHÂN RÃ CÔNG VIỆC CHI TIẾT (WORK BREAKDOWN STRUCTURE)")
        for phase in project.phases:
            p_start = phase.planned_start_date.strftime('%Y-%m-%d') if phase.planned_start_date else 'TBD'
            p_end = phase.planned_end_date.strftime('%Y-%m-%d') if phase.planned_end_date else 'TBD'
            md_lines.append(f"\n### Giai đoạn {phase.phase_number}: {phase.title}")
            md_lines.append(f"- **Thời lượng:** {phase.estimated_hours} giờ | **Trạng thái:** {phase.status}")
            md_lines.append(f"- **Lịch trình dự kiến:** {p_start} đến {p_end}")
            if phase.description:
                md_lines.append(f"- **Mục tiêu giai đoạn:** {phase.description}")

            md_lines.append("\n**Danh sách các đầu việc (Tasks):**")
            for t in phase.tasks:
                milestone_tag = " [⭐ CỘT MỐC QUAN TRỌNG]" if t.is_milestone else ""
                status_tag = f"[{t.status}]"
                md_lines.append(f"- {status_tag} **{t.title}** ({t.estimated_hours}h - Ưu tiên: {t.priority}){milestone_tag}")
                if t.description:
                    md_lines.append(f"  *Mô tả:* {t.description}")
            md_lines.append("")

        # Section 5: Extensions
        if project.extensions:
            md_lines.append("## 5. NHẬT KÝ GIA HẠN & SỰ CỐ TIẾN ĐỘ (EXTENSION LOGS)")
            for ext in project.extensions:
                md_lines.append(f"- **Gia hạn +{ext.days_added} ngày** (Ghi nhận lúc: {ext.created_at.strftime('%Y-%m-%d %H:%M')})")
                md_lines.append(f"  *Giai đoạn:* {ext.phase_title or 'Toàn dự án'}")
                md_lines.append(f"  *Lý do:* {ext.reason}")
                if ext.ai_analysis:
                    md_lines.append(f"  *Đánh giá từ AI:* {ext.ai_analysis}")
            md_lines.append("")

        # Section 6: Suggested Discussion Prompts for Google NotebookLM Audio Overview
        md_lines.append("## 6. GỢI Ý CHỦ ĐỀ THẢO LUẬN CHO GOOGLE NOTEBOOKLM AUDIO PODCAST")
        md_lines.append("> Khi tạo Podcast Audio Overview trên NotebookLM, bạn có thể hướng dẫn 2 người dẫn chương trình AI tập trung vào các câu hỏi sau:")
        md_lines.append(f"1. *Dự án '{project.title}' giải quyết bài toán gì và điểm đột phá là gì?*")
        md_lines.append(f"2. *Vì sao dự án này được đánh giá độ khó {project.complexity_score}/10? Đâu là rào cản kỹ thuật lớn nhất?*")
        md_lines.append("3. *Những điểm mù kỹ thuật (blind spots) nào có thể khiến tác giả bị trễ hạn nếu không phòng ngừa trước?*")
        md_lines.append("4. *Đâu là cột mốc (Milestone) quyết định sự thành bại trong lộ trình phát triển của dự án này?*")

        return "\n".join(md_lines)
