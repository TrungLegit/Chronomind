import io
from datetime import datetime, timedelta
from typing import Optional
from app.models.models import Project, Phase, Task
from app.services.scheduler import DeadlineScheduler

class IcsExporter:
    @staticmethod
    def _escape_text(text: Optional[str]) -> str:
        if not text:
            return ""
        # RFC 5545 text escaping
        res = text.replace("\\", "\\\\")
        res = res.replace(";", "\\;")
        res = res.replace(",", "\\,")
        res = res.replace("\r\n", "\\n").replace("\n", "\\n").replace("\r", "\\n")
        return res

    @staticmethod
    def _format_datetime(dt: datetime) -> str:
        return dt.strftime("%Y%m%dT%H%M%SZ")

    @classmethod
    def generate_project_ics(cls, project: Project) -> io.BytesIO:
        """
        Generates RFC 5545 compliant iCalendar (.ics) bytes stream
        for all phases and milestone tasks of a project.
        """
        lines = [
            "BEGIN:VCALENDAR",
            "VERSION:2.0",
            "PRODID:-//Chronomind//Chronomind Dynamic Project Planner//EN",
            "CALSCALE:GREGORIAN",
            "METHOD:PUBLISH",
            f"X-WR-CALNAME:{cls._escape_text('Chronomind - ' + project.title)}",
            "X-WR-TIMEZONE:UTC",
        ]

        now_str = cls._format_datetime(datetime.utcnow())
        cursor = project.kick_off_date or datetime.utcnow()

        for phase in project.phases:
            # Determine start and end date
            duration_days = DeadlineScheduler.calculate_duration_days(
                phase.estimated_hours, project.available_hours_per_week
            )
            start_dt = phase.planned_start_date or cursor
            end_dt = phase.planned_end_date or (start_dt + timedelta(days=duration_days))
            cursor = end_dt

            # Prepare phase description
            desc_lines = [
                f"Dự án: {project.title}",
                f"Giai đoạn {phase.phase_number}: {phase.title}",
                f"Thời lượng ước tính: {phase.estimated_hours} giờ (~{duration_days} ngày)",
                f"Trạng thái: {phase.status}",
            ]
            if phase.description:
                desc_lines.append(f"\nMô tả: {phase.description}")

            if phase.tasks:
                desc_lines.append("\nDanh sách công việc (Tasks):")
                for t in phase.tasks:
                    mark = "[x]" if t.status == "DONE" else "[ ]"
                    ms = " [Milestone]" if t.is_milestone else ""
                    desc_lines.append(f"- {mark} {t.title}{ms} ({t.estimated_hours}h - {t.priority})")

            phase_uid = f"phase-{phase.id}@chronomind.local"
            escaped_summary = cls._escape_text(f"[Phase {phase.phase_number}] {phase.title}")
            escaped_desc = cls._escape_text("\n".join(desc_lines))

            lines.extend([
                "BEGIN:VEVENT",
                f"UID:{phase_uid}",
                f"DTSTAMP:{now_str}",
                f"DTSTART:{cls._format_datetime(start_dt)}",
                f"DTEND:{cls._format_datetime(end_dt)}",
                f"SUMMARY:{escaped_summary}",
                f"DESCRIPTION:{escaped_desc}",
                "CATEGORIES:Chronomind,Phase",
                "STATUS:CONFIRMED",
                "TRANSP:OPAQUE",
                "END:VEVENT"
            ])

            # Export milestone tasks as separate targeted events
            for task in phase.tasks:
                if task.is_milestone:
                    t_start = task.planned_date or start_dt
                    t_end = t_start + timedelta(hours=max(task.estimated_hours, 1.0))
                    task_uid = f"milestone-{task.id}@chronomind.local"
                    t_summary = cls._escape_text(f"⭐ [Cột mốc] {task.title}")
                    t_desc = cls._escape_text(
                        f"Cột mốc quan trọng thuộc Phase {phase.phase_number}: {phase.title}\n"
                        f"Dự án: {project.title}\n"
                        f"Ước tính: {task.estimated_hours}h | Độ ưu tiên: {task.priority}\n"
                        f"Chi tiết: {task.description or 'N/A'}"
                    )
                    lines.extend([
                        "BEGIN:VEVENT",
                        f"UID:{task_uid}",
                        f"DTSTAMP:{now_str}",
                        f"DTSTART:{cls._format_datetime(t_start)}",
                        f"DTEND:{cls._format_datetime(t_end)}",
                        f"SUMMARY:{t_summary}",
                        f"DESCRIPTION:{t_desc}",
                        "CATEGORIES:Chronomind,Milestone",
                        "PRIORITY:1",
                        "STATUS:CONFIRMED",
                        "END:VEVENT"
                    ])

        lines.append("END:VCALENDAR")
        lines.append("")  # trailing newline

        content = "\r\n".join(lines).encode("utf-8")
        return io.BytesIO(content)
