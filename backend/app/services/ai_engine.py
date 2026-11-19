import json
import logging
from typing import Dict, Any, Optional
import httpx
from app.config import settings
from app.schemas.schemas import AIAnalysisResult, AIRedescheduleAnalysis, AIPrerequisiteItem, AIPhaseItem, AITaskItem

logger = logging.getLogger(__name__)

PROJECT_PLANNER_SYSTEM_PROMPT = """
You are Chronomind's Chief Project & Engineering Architect (AI Project Manager).
Your mission is to analyze user project ideas—even if vague or ambitious—and turn them into an actionable, realistic, milestone-driven project plan.

You MUST return a VALID JSON object adhering to this exact structure:
{
  "refined_title": "Clear, professional project title",
  "complexity_score": 7.5, // Float between 1.0 (very trivial) and 10.0 (extreme R&D/hardtech)
  "complexity_explanation": "Detailed explanation of why this project receives this score, key architectural challenges, and technical hurdles.",
  "blind_spots": [
    "Hidden gotchas, procurement delays, debugging time, security audits, or edge-cases the user likely overlooked"
  ],
  "prerequisites": [
    {
      "title": "Prerequisite item name",
      "category": "KNOWLEDGE" | "EQUIPMENT" | "ENVIRONMENT" | "RESOURCE",
      "description": "What to learn, buy, or install before kicking off the project"
    }
  ],
  "phases": [
    {
      "phase_number": 1,
      "title": "Phase 1: Research & Feasibility",
      "description": "Phase objective and scope",
      "estimated_hours": 15.0,
      "tasks": [
        {
          "title": "Specific Task Name",
          "description": "Concrete action step",
          "estimated_hours": 3.0,
          "is_milestone": false,
          "priority": "HIGH" | "MEDIUM" | "LOW"
        }
      ]
    }
  ]
}

Important Guidelines:
1. Always adapt the scope to the user's weekly available hours and skill level.
2. For hardware/IoT/robotics: Include component lead time, power supply design, and PCB prototyping risks in blind spots and prerequisites.
3. For software/AI: Include environment setup, data cleaning, testing/QA, CI/CD, and deployment.
4. Make sure estimated_hours for tasks in each phase sum up closely to the phase's estimated_hours.
5. Provide at least 3-5 Prerequisites and 3-5 Phases, with 3-6 actionable tasks per phase.
6. Return ONLY the JSON object. Do not wrap in markdown or backticks if possible, or use standard markdown ```json.
"""

RESCHEDULE_SYSTEM_PROMPT = """
You are Chronomind's AI Rescheduling Engine.
The user is requesting an extension or reporting a delay on their project.
Evaluate their reason, assess downstream impact, and provide strategic mitigation advice.

Return a JSON object:
{
  "recommended_days": 3, // suggested integer days
  "impact_assessment": "How this delay affects subsequent milestones and critical path",
  "mitigation_tips": [
    "Concrete actionable advice to recover lost time or de-risk the blocker"
  ],
  "advice_note": "Encouraging, professional guidance from an experienced project manager"
}
"""

def extract_json(raw_text: str) -> Dict[str, Any]:
    text = raw_text.strip()
    if text.startswith("```json"):
        text = text[7:]
    elif text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    text = text.strip()
    return json.loads(text)

class AIEngine:
    @classmethod
    async def analyze_project(
        cls,
        title: str,
        description: str,
        target_goal: Optional[str],
        available_hours_per_week: float,
        skill_level: str,
        tools_resources: Optional[str],
    ) -> AIAnalysisResult:
        """Call AI provider or fallback to intelligent heuristic generator."""
        provider = settings.DEFAULT_AI_PROVIDER.lower()
        gemini_key = settings.GEMINI_API_KEY
        openai_key = settings.OPENAI_API_KEY

        prompt = f"""
Project Title: {title}
Description: {description}
Target Goal: {target_goal or 'Complete prototype ready for demonstration'}
User Weekly Free Time: {available_hours_per_week} hours/week
User Skill Level: {skill_level}
Available Tools & Resources: {tools_resources or 'Standard PC / Laptop'}

Analyze this project thoroughly, identify blind spots, prerequisites, and generate a multi-phase roadmap.
"""

        # 1. Try Gemini
        if (provider in ("gemini", "auto")) and gemini_key:
            try:
                res = await cls._call_gemini(prompt, PROJECT_PLANNER_SYSTEM_PROMPT)
                if res:
                    return AIAnalysisResult(**res)
            except Exception as e:
                logger.error(f"Gemini API failed: {e}. Falling back...")

        # 2. Try OpenAI
        if (provider in ("openai", "auto")) and openai_key:
            try:
                res = await cls._call_openai(prompt, PROJECT_PLANNER_SYSTEM_PROMPT)
                if res:
                    return AIAnalysisResult(**res)
            except Exception as e:
                logger.error(f"OpenAI API failed: {e}. Falling back...")

        # 3. Intelligent Heuristic Generator (Zero API key / offline fallback)
        logger.info("Using built-in intelligent planner heuristic generator.")
        return cls._generate_heuristic_plan(
            title, description, target_goal, available_hours_per_week, skill_level, tools_resources
        )

    @classmethod
    async def analyze_reschedule(
        cls,
        project_title: str,
        phase_title: Optional[str],
        reason: str,
        days_requested: int
    ) -> AIRedescheduleAnalysis:
        prompt = f"""
Project: {project_title}
Delayed Phase: {phase_title or 'General Project Schedule'}
User Reason for Delay: {reason}
Days Requested: {days_requested} days
"""
        provider = settings.DEFAULT_AI_PROVIDER.lower()
        if (provider in ("gemini", "auto")) and settings.GEMINI_API_KEY:
            try:
                res = await cls._call_gemini(prompt, RESCHEDULE_SYSTEM_PROMPT)
                if res:
                    return AIRedescheduleAnalysis(**res)
            except Exception as e:
                logger.error(f"Gemini reschedule call failed: {e}")

        if (provider in ("openai", "auto")) and settings.OPENAI_API_KEY:
            try:
                res = await cls._call_openai(prompt, RESCHEDULE_SYSTEM_PROMPT)
                if res:
                    return AIRedescheduleAnalysis(**res)
            except Exception as e:
                logger.error(f"OpenAI reschedule call failed: {e}")

        # Fallback analysis
        impact = f"Yêu cầu gia hạn thêm {days_requested} ngày do lý do: '{reason}'. Thời hạn của các giai đoạn tiếp theo sẽ tự động tịnh tiến để đảm bảo tính khả thi."
        tips = [
            "Ưu tiên hoàn thành các task đóng vai trò Milestone trước khi mở rộng tính năng phụ.",
            "Chia nhỏ task đang bị tắc nghẽn thành các phiên làm việc 45 phút tập trung.",
            "Xem xét loại bỏ hoặc dời các yêu cầu 'nice-to-have' sang phiên bản sau nếu cần giữ deadline gốc."
        ]
        advice = f"Chậm lại một chút để giải quyết triệt để vấn đề kỹ thuật là quyết định đúng đắn. Hãy tập trung gỡ nút thắt hiện tại và tiếp tục theo lộ trình đã điều chỉnh!"
        return AIRedescheduleAnalysis(
            recommended_days=days_requested,
            impact_assessment=impact,
            mitigation_tips=tips,
            advice_note=advice
        )

    @classmethod
    async def _call_gemini(cls, prompt: str, system_prompt: str) -> Optional[Dict[str, Any]]:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.GEMINI_MODEL}:generateContent?key={settings.GEMINI_API_KEY}"
        payload = {
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": f"{system_prompt}\n\nUser Request:\n{prompt}"}]
                }
            ],
            "generationConfig": {
                "temperature": 0.4,
                "response_mime_type": "application/json"
            }
        }
        async with httpx.AsyncClient(timeout=45.0) as client:
            resp = await client.post(url, json=payload)
            resp.raise_for_status()
            data = resp.json()
            raw_text = data["candidates"][0]["content"]["parts"][0]["text"]
            return extract_json(raw_text)

    @classmethod
    async def _call_openai(cls, prompt: str, system_prompt: str) -> Optional[Dict[str, Any]]:
        url = "https://api.openai.com/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": settings.OPENAI_MODEL,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.4
        }
        async with httpx.AsyncClient(timeout=45.0) as client:
            resp = await client.post(url, headers=headers, json=payload)
            resp.raise_for_status()
            data = resp.json()
            raw_text = data["choices"][0]["message"]["content"]
            return extract_json(raw_text)

    @classmethod
    def _generate_heuristic_plan(
        cls,
        title: str,
        description: str,
        target_goal: Optional[str],
        available_hours_per_week: float,
        skill_level: str,
        tools_resources: Optional[str]
    ) -> AIAnalysisResult:
        """Intelligent domain-specific heuristic generator for robust offline & demo reliability."""
        text_lower = (title + " " + description + " " + (tools_resources or "")).lower()

        # Domain classification
        is_hardware = any(w in text_lower for w in ["mạch", "pcb", "arduino", "esp32", "stm32", "robot", "phần cứng", "sensor", "cảm biến", "hardware", "iot"])
        is_ai_ml = any(w in text_lower for w in ["ai", "llm", "deep learning", "machine learning", "trí tuệ nhân tạo", "rag", "yolo", "cv", "vision", "nlp"])
        is_web_app = any(w in text_lower for w in ["web", "app", "react", "next", "fastapi", "vue", "backend", "frontend", "saas", "dashboard", "fullstack"])

        # Determine complexity
        base_score = 5.0
        if skill_level.lower() == "beginner":
            base_score += 1.8
        elif skill_level.lower() == "advanced":
            base_score -= 1.0

        if is_hardware:
            base_score += 1.5
        if is_ai_ml:
            base_score += 1.2
        if len(description) > 300:
            base_score += 0.5
        complexity_score = min(max(round(base_score, 1), 3.0), 9.5)

        # Blind spots
        blind_spots = [
            "Thời gian đặt hàng và vận chuyển linh kiện/tài nguyên (thường mất từ 3-7 ngày làm việc ngoài dự kiến).",
            "Công tác gỡ lỗi (Debugging) và xử lý ngoại lệ: Thực tế thường chiếm từ 30% đến 40% tổng thời gian dự án.",
            "Tối ưu hóa hiệu năng và bảo mật môi trường chạy thực tế (Production readiness) trước khi bàn giao.",
            "Độ trễ khi tích hợp các API bên thứ ba hoặc phụ thuộc vào phiên bản thư viện chưa tương thích."
        ]
        if is_hardware:
            blind_spots.insert(0, "Sai sót sơ đồ nguyên lý (Schematic) hoặc thiết kế footprint linh kiện dẫn đến phải làm lại mạch in (re-spin PCB).")
            blind_spots.append("Hiện tượng sụt áp nguồn hoặc nhiễu điện từ (EMI) khi nhiều module hoạt động cùng lúc.")
        elif is_ai_ml:
            blind_spots.insert(0, "Thời gian thu thập, làm sạch và gắn nhãn tập dữ liệu (Dataset) thường lâu gấp đôi dự tính.")
            blind_spots.append("Chi phí token API và độ trễ phản hồi (latency) khi gọi mô hình ngôn ngữ lớn liên tục.")
        else:
            blind_spots.append("Thiếu sót trong thiết kế cơ sở dữ liệu khiến việc mở rộng tính năng về sau gặp bế tắc.")

        # Prerequisites
        prerequisites = [
            AIPrerequisiteItem(
                title="Cài đặt môi trường phát triển & IDE chuẩn",
                category="ENVIRONMENT",
                description="Thiết lập môi trường làm việc chuẩn (VS Code / Python / Node / Git), cấu hình linter và formatter."
            ),
            AIPrerequisiteItem(
                title="Khảo sát kiến trúc kỹ thuật & Thư viện lõi",
                category="KNOWLEDGE",
                description="Đọc tài liệu kỹ thuật, xem các ví dụ mẫu (proof-of-concept) của các công nghệ cốt lõi sẽ áp dụng."
            ),
            AIPrerequisiteItem(
                title="Chuẩn bị tài khoản & Khóa API hoặc phần cứng",
                category="RESOURCE" if not is_hardware else "EQUIPMENT",
                description="Đăng ký tài khoản nhà cung cấp, chuẩn bị khóa API, token xác thực hoặc đặt mua các linh kiện cần thiết."
            ),
            AIPrerequisiteItem(
                title="Thiết lập kho mã nguồn & Quy ước đóng góp",
                category="ENVIRONMENT",
                description="Khởi tạo repository Git trên GitHub/GitLab, cấu hình .gitignore và file README khởi đầu."
            )
        ]

        # Calculate time scaling according to available hours
        weekly_hours = max(available_hours_per_week, 5.0)

        # Phases
        p1_hours = round(weekly_hours * 1.5, 1)
        p2_hours = round(weekly_hours * 2.5, 1)
        p3_hours = round(weekly_hours * 2.0, 1)
        p4_hours = round(weekly_hours * 1.5, 1)

        phases = [
            AIPhaseItem(
                phase_number=1,
                title="Phase 1: Nghiên cứu Khả thi & Thiết kế Kiến trúc",
                description="Xác định phạm vi, thiết kế sơ đồ luồng hệ thống, và dựng bản thử nghiệm mẫu (PoC).",
                estimated_hours=p1_hours,
                tasks=[
                    AITaskItem(title="Lập tài liệu đặc tả yêu cầu & luồng người dùng", description="Viết tài liệu mô tả chi tiết các màn hình hoặc chức năng chính.", estimated_hours=round(p1_hours*0.25, 1), priority="HIGH"),
                    AITaskItem(title="Thiết kế sơ đồ kiến trúc & Mô hình dữ liệu", description="Vẽ sơ đồ khối hệ thống, thiết kế Database schema hoặc schematic.", estimated_hours=round(p1_hours*0.35, 1), priority="HIGH"),
                    AITaskItem(title="Dựng bản PoC kiểm chứng công nghệ cốt lõi", description="Viết code mẫu kiểm tra tính khả thi của tính năng quan trọng nhất.", estimated_hours=round(p1_hours*0.4, 1), is_milestone=True, priority="HIGH")
                ]
            ),
            AIPhaseItem(
                phase_number=2,
                title="Phase 2: Xây dựng Module Lõi & Chức năng Chính",
                description="Triển khai các tính năng trung tâm và logic nghiệp vụ quan trọng của dự án.",
                estimated_hours=p2_hours,
                tasks=[
                    AITaskItem(title="Khởi tạo khung sườn ứng dụng & Cấu hình cơ sở dữ liệu", description="Cài đặt framework, tạo kết nối DB, thiết lập các biến môi trường.", estimated_hours=round(p2_hours*0.25, 1), priority="MEDIUM"),
                    AITaskItem(title="Lập trình tính năng nghiệp vụ trung tâm (Core Engine)", description="Xây dựng các thuật toán, API endpoints hoặc mạch xử lý tín hiệu chính.", estimated_hours=round(p2_hours*0.45, 1), priority="HIGH"),
                    AITaskItem(title="Tích hợp các module giao tiếp và dữ liệu ngoại vi", description="Kết nối các dịch vụ ngoài, màn hình UI hoặc cảm biến ngoại vi.", estimated_hours=round(p2_hours*0.3, 1), is_milestone=True, priority="HIGH")
                ]
            ),
            AIPhaseItem(
                phase_number=3,
                title="Phase 3: Hoàn thiện Giao diện & Thử nghiệm Kiểm thử (QA)",
                description="Đồng bộ hóa toàn bộ luồng sử dụng, kiểm thử đơn vị, kiểm thử tích hợp và vá lỗi.",
                estimated_hours=p3_hours,
                tasks=[
                    AITaskItem(title="Hoàn thiện giao diện người dùng & Trải nghiệm tương tác", description="Chăm chút UI/UX, thông báo trạng thái, xử lý lỗi thân thiện.", estimated_hours=round(p3_hours*0.35, 1), priority="MEDIUM"),
                    AITaskItem(title="Kiểm thử tải, kiểm thử biên và xử lý sự cố ngoài dự kiến", description="Thử nghiệm với các tình huống dữ liệu bất thường hoặc gián đoạn mạng.", estimated_hours=round(p3_hours*0.35, 1), priority="HIGH"),
                    AITaskItem(title="Đóng gói bản Beta & Thử nghiệm với người dùng mẫu", description="Chạy thử nghiệm bản hoàn chỉnh và thu thập phản hồi đầu tiên.", estimated_hours=round(p3_hours*0.3, 1), is_milestone=True, priority="HIGH")
                ]
            ),
            AIPhaseItem(
                phase_number=4,
                title="Phase 4: Triển khai, Đóng gói & Báo cáo Tổng kết",
                description="Đưa sản phẩm lên môi trường hoạt động thực tế, viết tài liệu hướng dẫn và tổng kết dự án.",
                estimated_hours=p4_hours,
                tasks=[
                    AITaskItem(title="Triển khai lên môi trường Cloud/Server hoặc Đóng hộp sản phẩm", description="Cấu hình Docker, deploy lên VPS/Vercel hoặc hoàn thiện vỏ hộp mạch.", estimated_hours=round(p4_hours*0.4, 1), priority="HIGH"),
                    AITaskItem(title="Hoàn thiện tài liệu hướng dẫn sử dụng & Video demo", description="Viết README chi tiết, hướng dẫn cài đặt và quay video trình diễn tính năng.", estimated_hours=round(p4_hours*0.3, 1), priority="MEDIUM"),
                    AITaskItem(title="Tổng kết dự án & Đánh giá kết quả đạt được", description="Xuất báo cáo WBS, so sánh thời gian thực tế với kế hoạch ban đầu.", estimated_hours=round(p4_hours*0.3, 1), is_milestone=True, priority="MEDIUM")
                ]
            )
        ]

        explanation = (
            f"Dự án '{title}' được đánh giá ở mức {complexity_score}/10 độ khó. "
            f"Dựa trên quỹ thời gian {available_hours_per_week}h/tuần và trình độ {skill_level}, "
            f"dự án có khối lượng ước tính ~{p1_hours + p2_hours + p3_hours + p4_hours} giờ làm việc thực tế "
            f"(khoảng {round((p1_hours + p2_hours + p3_hours + p4_hours)/weekly_hours, 1)} tuần). "
            f"Thách thức lớn nhất nằm ở khâu tích hợp và gỡ lỗi, đòi hỏi hoàn thành kỹ danh mục Chuẩn bị (Prerequisites) "
            f"trước khi chính thức bắt đầu để tránh đứt gãy tiến độ."
        )

        return AIAnalysisResult(
            refined_title=f"{title.strip()} - Smart Roadmap",
            complexity_score=complexity_score,
            complexity_explanation=explanation,
            blind_spots=blind_spots,
            prerequisites=prerequisites,
            phases=phases
        )
