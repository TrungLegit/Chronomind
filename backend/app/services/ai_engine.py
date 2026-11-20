import json
import logging
from typing import Dict, Any, Optional
import httpx
from app.config import settings
from app.schemas.schemas import AIAnalysisResult, AIRedescheduleAnalysis, AIPrerequisiteItem, AIPhaseItem, AITaskItem

logger = logging.getLogger(__name__)

PROJECT_PLANNER_SYSTEM_PROMPT = """
You are Chronomind's Chief AI Project & Engineering Architect (Senior AI Project Manager).
Your mission is to analyze user project ideas—ranging from ambitious engineering hardware to cutting-edge AI, software SaaS, mobile apps, or scientific research—and transform them into a battle-tested, realistic, milestone-driven roadmap.

You MUST return a strictly VALID JSON object adhering to this structure:
{
  "refined_title": "Tên dự án chuẩn hóa, chuyên nghiệp và truyền cảm hứng",
  "complexity_score": 7.5, // Số thực từ 1.0 (rất đơn giản) đến 10.0 (R&D phức tạp/Deeptech)
  "complexity_explanation": "Đánh giá chi tiết lý do chấm điểm này, các rào cản kỹ thuật chính, rủi ro kiến trúc và tính khả thi dựa trên số giờ làm mỗi tuần.",
  "blind_spots": [
    "Cảnh báo điểm mù 1: Các rủi ro tiềm ẩn mà người làm thường quên (VD: thời gian chờ ship linh kiện, xử lý ngoại lệ, rate limit API, nghẽn cổ chai DB, v.v.)",
    "Cảnh báo điểm mù 2: ...",
    "Cảnh báo điểm mù 3: ...",
    "Cảnh báo điểm mù 4: ..."
  ],
  "prerequisites": [
    {
      "title": "Tên việc cần chuẩn bị",
      "category": "KNOWLEDGE" | "EQUIPMENT" | "ENVIRONMENT" | "RESOURCE",
      "description": "Mô tả cụ thể tài liệu cần đọc, công cụ cần mua, hoặc môi trường phần mềm cần thiết lập trước khi bắt đầu."
    }
  ],
  "phases": [
    {
      "phase_number": 1,
      "title": "Phase 1: [Tên giai đoạn]",
      "description": "Mục tiêu cụ thể và tiêu chí hoàn thành của giai đoạn này",
      "estimated_hours": 15.0,
      "tasks": [
        {
          "title": "Tên công việc cụ thể",
          "description": "Các bước thực hiện chi tiết và tiêu chuẩn nghiệm thu",
          "estimated_hours": 3.0,
          "is_milestone": false,
          "priority": "HIGH" | "MEDIUM" | "LOW"
        }
      ]
    }
  ]
}

Core Architectural Rules:
1. NGÔN NGỮ: Mặc định trả về toàn bộ bằng TIẾNG VIỆT tự nhiên, chuẩn văn phong kỹ thuật và quản trị dự án chuyên nghiệp (trừ khi người dùng viết bằng tiếng Anh).
2. THÍCH ỨNG QUỸ THỜI GIAN: Tính toán tổng số giờ và phân bổ số tuần dựa trên `User Weekly Free Time`. Luôn bổ sung khoảng 15-20% đệm an toàn (Safety Buffer) để chống định luật Parkinson và trễ hạn.
3. PHÂN LOẠI CHUYÊN SÂU:
   - Phần cứng / IoT / Robot: Phải nhắc đến thời gian đặt hàng linh kiện, thiết kế mạch nguồn chống sụt áp, nhiễu EMI, và việc test mạch mẫu (breadboard -> PCB).
   - AI / LLM / Data: Phải có khâu thu thập & làm sạch dữ liệu, quản lý quota API / token chi phí, độ trễ phản hồi (latency), và kiểm thử biên (hallucination).
   - Web / App / SaaS: Phải có thiết kế kiến trúc DB, bảo mật xác thực (Auth), xử lý lỗi thân thiện trên UI/UX, và quy trình CI/CD triển khai.
4. KHỞI ĐỘNG NHANH (<24h): Trong Phase 1, task đầu tiên luôn là một hành động kích hoạt ngay lập tức trong vòng 24 giờ để tạo đà tâm lý vượt qua trì hoãn.
5. CỘT MỐC (MILESTONE): Mỗi Phase phải có ít nhất 1 task mang tính chất Cột mốc (`is_milestone: true`) với tiêu chí nghiệm thu rõ ràng.
6. ĐỊNH DẠNG: Chỉ trả về JSON thuần túy, không có text chào hỏi rườm rà.
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

PLAN_INGESTION_SYSTEM_PROMPT = """
You are Chronomind's AI Project Plan Ingestion & Structuring Specialist.
The user has uploaded or provided an existing project plan from an external document (such as Excel table, Word document, Markdown notes, or WBS schedule).
Your mission is to read and interpret this document, respect their defined phases and tasks as closely as possible, normalize it into Chronomind's standard format, estimate reasonable hours if missing, and identify key milestones and prerequisites.

You MUST return a strictly VALID JSON object adhering to this structure:
{
  "refined_title": "Tên dự án được trích xuất từ tài liệu",
  "extracted_description": "Tóm tắt phạm vi và nội dung chính của dự án dựa trên tài liệu",
  "extracted_target_goal": "Mục tiêu đầu ra cụ thể trích xuất từ tài liệu",
  "complexity_score": 6.5, // Số thực 1.0 - 10.0
  "complexity_explanation": "Đánh giá chi tiết về tính khả thi của kế hoạch người dùng đưa vào",
  "blind_spots": [
    "Cảnh báo điểm mù 1: Rủi ro kỹ thuật hoặc thời gian mà kế hoạch hiện tại chưa tính đến",
    "Cảnh báo điểm mù 2: ..."
  ],
  "prerequisites": [
    {
      "title": "Tên việc cần chuẩn bị",
      "category": "KNOWLEDGE" | "EQUIPMENT" | "ENVIRONMENT" | "RESOURCE",
      "description": "Việc cần hoàn thành trước khi bắt đầu"
    }
  ],
  "phases": [
    {
      "phase_number": 1,
      "title": "Phase 1: [Tên giai đoạn trích xuất từ tài liệu]",
      "description": "Mục tiêu của giai đoạn này",
      "estimated_hours": 12.0,
      "tasks": [
        {
          "title": "Tên công việc",
          "description": "Chi tiết công việc",
          "estimated_hours": 3.0,
          "is_milestone": false,
          "priority": "HIGH" | "MEDIUM" | "LOW"
        }
      ]
    }
  ]
}

Core Rules:
1. TỐI ĐA HÓA NỘI DUNG NGƯỜI DÙNG: Giữ nguyên cấu trúc Phase và Task đã có trong tài liệu của người dùng, không tự ý xóa bỏ các đầu việc họ đã lên kế hoạch.
2. ƯỚC LƯỢNG GIỜ THỰC TẾ: Nếu tài liệu thiếu số giờ làm (estimated_hours), hãy ước lượng số giờ hợp lý cho từng task dựa trên quy mô công việc và quỹ thời gian rảnh mỗi tuần của người dùng.
3. PHÁT HIỆN CỘT MỐC (MILESTONE): Đánh dấu `is_milestone: true` cho các công việc mang tính bàn giao, nghiệm thu, demo hoặc hoàn tất phiên bản.
4. NGÔN NGỮ: Toàn bộ JSON trả về bằng TIẾNG VIỆT tự nhiên, chuẩn văn phong kỹ thuật.
5. ĐỊNH DẠNG: Chỉ trả về JSON thuần túy, không có text chào hỏi.
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
    async def analyze_imported_plan(
        cls,
        raw_content: str,
        filename: str,
        file_type: str,
        available_hours_per_week: float = 12.0,
        skill_level: str = "Intermediate",
    ) -> Tuple[AIAnalysisResult, Dict[str, Any]]:
        """
        Parses an imported plan (Excel/Word/Text) into a structured AIAnalysisResult.
        Extracts title, goal, description, phases, and tasks.
        """
        provider = settings.DEFAULT_AI_PROVIDER.lower()
        gemini_key = settings.GEMINI_API_KEY
        openai_key = settings.OPENAI_API_KEY

        prompt = f"""
Tên tài liệu: {filename} (Định dạng: {file_type})
Quỹ thời gian rảnh của người dùng: {available_hours_per_week} giờ/tuần
Trình độ người dùng: {skill_level}

Nội dung kế hoạch được trích xuất từ file:
\"\"\"
{raw_content[:8000]}
\"\"\"

Hãy đọc kỹ tài liệu kế hoạch trên, giữ nguyên các đầu việc và giai đoạn của người dùng, chuẩn hóa vào định dạng JSON của Chronomind.
"""
        metadata: Dict[str, Any] = {}

        # 1. Try Gemini
        if (provider in ("gemini", "auto")) and gemini_key:
            try:
                res = await cls._call_gemini(prompt, PLAN_INGESTION_SYSTEM_PROMPT)
                if res:
                    metadata["title"] = res.get("refined_title")
                    metadata["description"] = res.get("extracted_description")
                    metadata["target_goal"] = res.get("extracted_target_goal")
                    return AIAnalysisResult(**res), metadata
            except Exception as e:
                logger.error(f"Gemini imported plan ingestion failed: {e}. Falling back...")

        # 2. Try OpenAI
        if (provider in ("openai", "auto")) and openai_key:
            try:
                res = await cls._call_openai(prompt, PLAN_INGESTION_SYSTEM_PROMPT)
                if res:
                    metadata["title"] = res.get("refined_title")
                    metadata["description"] = res.get("extracted_description")
                    metadata["target_goal"] = res.get("extracted_target_goal")
                    return AIAnalysisResult(**res), metadata
            except Exception as e:
                logger.error(f"OpenAI imported plan ingestion failed: {e}. Falling back...")

        # 3. Fallback to smart heuristic file parser
        logger.info("Using heuristic parser for imported plan file.")
        return cls._heuristic_imported_plan(raw_content, filename, available_hours_per_week, skill_level)

    @classmethod
    def _heuristic_imported_plan(
        cls,
        raw_content: str,
        filename: str,
        available_hours_per_week: float,
        skill_level: str
    ) -> Tuple[AIAnalysisResult, Dict[str, Any]]:
        """
        Parses extracted document lines into phases and tasks heuristically when no LLM API is available.
        Handles both row-based Excel/CSV tables and paragraph-based Word/Text documents.
        """
        import re
        clean_name = filename.rsplit(".", 1)[0].replace("_", " ").replace("-", " ").title()
        lines = [line.strip() for line in raw_content.splitlines() if line.strip()]

        phase_buckets: Dict[str, List[AITaskItem]] = {}
        phase_order: List[str] = []
        active_phase = "Phase 1: Khởi động & Khảo sát"

        for line in lines:
            lower_line = line.lower()
            # Skip delimiter rows and metadata banners
            if line.startswith(("===", "---", "___")) or "tài liệu nguồn:" in lower_line or "[tệp con" in lower_line or "tệp nén / thư mục:" in lower_line:
                if any(p in lower_line for p in ["phase", "giai đoạn", "chương", "phần", "module", "step", "bước", "đợt", "tuần", "week"]):
                    active_phase = line.lstrip("#- =_").strip()
                    if active_phase not in phase_buckets:
                        phase_buckets[active_phase] = []
                        phase_order.append(active_phase)
                continue

            # Skip pure table header rows like "Giai đoạn | Công việc | Thời lượng"
            if any(h in lower_line for h in ["sheet:", "bảng tính", "bảng 1", "bảng 2", "bảng 3"]):
                continue
            if ("công việc" in lower_line or "task" in lower_line) and ("thời lượng" in lower_line or "hours" in lower_line or "duration" in lower_line):
                continue

            # Case A: Table row with pipe '|'
            if "|" in line:
                cells = [c.strip() for c in line.split("|") if c.strip()]
                if not cells:
                    continue

                target_phase = active_phase
                task_title = cells[0]
                task_hours = 2.5
                is_m = False

                # Check if first cell is a Phase name
                if len(cells) >= 2 and any(p in cells[0].lower() for p in ["phase", "giai đoạn", "đợt", "bước", "chương", "phần", "tuần", "week"]):
                    target_phase = cells[0]
                    task_title = cells[1]
                    remaining_cells = cells[2:]
                else:
                    remaining_cells = cells[1:]

                # Check remaining cells for hours and milestones
                for c in remaining_cells:
                    c_low = c.lower()
                    if any(m_word in c_low for m_word in ["milestone", "cột mốc", "nghiệm thu", "demo", "release", "bàn giao"]):
                        is_m = True
                    # Check number
                    num_match = re.search(r'(\d+(?:\.\d+)?)', c)
                    if num_match:
                        try:
                            val = float(num_match.group(1))
                            if 0.5 <= val <= 200:
                                task_hours = val
                        except ValueError:
                            pass

                if target_phase not in phase_buckets:
                    phase_buckets[target_phase] = []
                    phase_order.append(target_phase)

                clean_task_title = task_title.lstrip("*-0123456789. ")[:90]
                if len(clean_task_title) >= 3:
                    phase_buckets[target_phase].append(AITaskItem(
                        title=clean_task_title,
                        description=f"Trích xuất từ file {filename}: {line[:120]}",
                        estimated_hours=task_hours,
                        is_milestone=is_m,
                        priority="HIGH" if is_m else "MEDIUM"
                    ))

            # Case B: Standalone Header line (e.g. ### Phase 1: Chuẩn bị)
            elif any(lower_line.startswith(p) for p in ["phase", "giai đoạn", "chương", "phần", "module", "step", "bước", "đợt", "tuần", "week"]) or line.startswith("###"):
                active_phase = line.lstrip("#- ").strip()
                if active_phase not in phase_buckets:
                    phase_buckets[active_phase] = []
                    phase_order.append(active_phase)

            # Case C: Freeform text bullet task
            else:
                hours_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:h|giờ|hours|hrs)', line, re.IGNORECASE)
                task_hours = float(hours_match.group(1)) if hours_match else 2.5
                is_m = any(kw in lower_line for kw in ["milestone", "cột mốc", "nghiệm thu", "demo", "hoàn thành", "release", "bàn giao"])

                if active_phase not in phase_buckets:
                    phase_buckets[active_phase] = []
                    phase_order.append(active_phase)

                clean_task_title = line.lstrip("*-0123456789. ")[:90]
                if len(clean_task_title) >= 3:
                    phase_buckets[active_phase].append(AITaskItem(
                        title=clean_task_title,
                        description=f"Trích xuất từ file {filename}: {line[:120]}",
                        estimated_hours=task_hours,
                        is_milestone=is_m,
                        priority="HIGH" if is_m else "MEDIUM"
                    ))

        # Build final AIPhaseItem list
        phases_list: List[AIPhaseItem] = []
        phase_num = 1
        for p_name in phase_order:
            tasks = phase_buckets[p_name]
            if tasks:
                est_hours = sum(t.estimated_hours for t in tasks) or round(available_hours_per_week * 1.5, 1)
                display_title = p_name if p_name.lower().startswith("phase") else f"Phase {phase_num}: {p_name}"
                phases_list.append(AIPhaseItem(
                    phase_number=phase_num,
                    title=display_title,
                    description=f"Giai đoạn gồm {len(tasks)} công việc được trích xuất từ file {filename}.",
                    estimated_hours=round(est_hours, 1),
                    tasks=tasks
                ))
                phase_num += 1

        # Fallback if no phases parsed
        if not phases_list:
            phases_list.append(AIPhaseItem(
                phase_number=1,
                title="Phase 1: Triển khai theo kế hoạch tài liệu",
                description="Các công việc được đọc từ file tài liệu kế hoạch.",
                estimated_hours=round(available_hours_per_week * 2.0, 1),
                tasks=[
                    AITaskItem(title=f"Nghiên cứu tài liệu {filename}", description="Đọc và rà soát mục tiêu.", estimated_hours=4.0, is_milestone=False, priority="HIGH"),
                    AITaskItem(title="Nghiệm thu cột mốc chuẩn bị", description="Hoàn thành bước thiết lập ban đầu.", estimated_hours=2.0, is_milestone=True, priority="HIGH")
                ]
            ))

        total_hours = sum(p.estimated_hours for p in phases_list)
        weeks = max(round(total_hours / max(available_hours_per_week, 1.0), 1), 1.0)

        prerequisites = [
            AIPrerequisiteItem(
                title=f"Rà soát tài liệu {filename}",
                category="KNOWLEDGE",
                description="Đọc kỹ toàn bộ các điều kiện và mục tiêu đã đề ra trong file kế hoạch."
            ),
            AIPrerequisiteItem(
                title="Chuẩn bị tài nguyên & công cụ thực hiện",
                category="ENVIRONMENT",
                description="Cài đặt các phần mềm, tài khoản và môi trường cần thiết theo tài liệu."
            )
        ]

        blind_spots = [
            f"Kế hoạch nhập từ file '{filename}' có thể chưa tính đến thời gian debug và xử lý sự cố (thường chiếm 25-35%).",
            "Cần đảm bảo quỹ thời gian cam kết hằng tuần được duy trì liên tục để tránh dồn ứ công việc.",
            "Nên kiểm tra các phụ thuộc kỹ thuật giữa các giai đoạn để tránh tắc nghẽn tiến độ."
        ]

        result = AIAnalysisResult(
            refined_title=clean_name,
            complexity_score=6.0,
            complexity_explanation=f"Kế hoạch được nhập tự động từ '{filename}'. Tổng khối lượng ~{total_hours}h (~{weeks} tuần với quỹ {available_hours_per_week}h/tuần).",
            blind_spots=blind_spots,
            prerequisites=prerequisites,
            phases=phases_list
        )

        metadata = {
            "title": clean_name,
            "description": f"Dự án được khởi tạo tự động từ tài liệu kế hoạch: {filename}",
            "target_goal": f"Hoàn thành toàn bộ {len(phases_list)} giai đoạn và các cột mốc trong file {filename}.",
            "tools_resources": "Trích xuất từ file kế hoạch"
        }

        return result, metadata

    @classmethod
    async def _call_gemini(cls, prompt: str, system_prompt: str) -> Optional[Dict[str, Any]]:
        models_to_try = [settings.GEMINI_MODEL]
        for fallback in ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-1.5-pro"]:
            if fallback not in models_to_try:
                models_to_try.append(fallback)

        payload = {
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": f"{system_prompt}\n\nUser Request:\n{prompt}"}]
                }
            ],
            "generationConfig": {
                "temperature": 0.35,
                "response_mime_type": "application/json"
            }
        }

        async with httpx.AsyncClient(timeout=45.0) as client:
            last_err = None
            for model_name in models_to_try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={settings.GEMINI_API_KEY}"
                try:
                    resp = await client.post(url, json=payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        raw_text = data["candidates"][0]["content"]["parts"][0]["text"]
                        return extract_json(raw_text)
                    else:
                        last_err = f"Model {model_name} returned status {resp.status_code}: {resp.text}"
                        logger.warning(last_err)
                except Exception as e:
                    last_err = str(e)
                    logger.warning(f"Failed calling Gemini model {model_name}: {e}")

            if last_err:
                raise RuntimeError(f"All Gemini models failed. Last error: {last_err}")
            return None

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

        # Phases tailored to detected domain
        if is_hardware:
            phases = [
                AIPhaseItem(
                    phase_number=1,
                    title="Phase 1: Khảo sát Linh kiện & Sơ đồ Nguyên lý (Schematic)",
                    description="Chọn vi điều khiển, cảm biến, tính toán công suất nguồn và vẽ schematic trên KiCad/EasyEDA.",
                    estimated_hours=p1_hours,
                    tasks=[
                        AITaskItem(title="Lập danh sách BOM linh kiện & đặt hàng sớm", description="Liệt kê MCU, module nguồn, cảm biến và đặt hàng để tránh chờ vận chuyển.", estimated_hours=round(p1_hours*0.3, 1), priority="HIGH"),
                        AITaskItem(title="Thiết kế sơ đồ nguyên lý mạch (Schematic)", description="Vẽ kết nối chân IO, mạch nguồn ổn áp 3.3V/5V và chống nhiễu.", estimated_hours=round(p1_hours*0.4, 1), priority="HIGH"),
                        AITaskItem(title="Dựng mạch thử nghiệm trên Breadboard (Proof of Concept)", description="Nạp firmware mẫu đọc dữ liệu cảm biến thành công trên breadboard.", estimated_hours=round(p1_hours*0.3, 1), is_milestone=True, priority="HIGH")
                    ]
                ),
                AIPhaseItem(
                    phase_number=2,
                    title="Phase 2: Lập trình Firmware Lõi & Xử lý Giao thức",
                    description="Lập trình firmware C++/MicroPython, tối ưu ngắt (Interrupts), đọc ADC và giao tiếp không dây (MQTT/WiFi/BLE).",
                    estimated_hours=p2_hours,
                    tasks=[
                        AITaskItem(title="Cấu hình FreeRTOS / Task scheduler vi điều khiển", description="Tổ chức các task đọc cảm biến, gửi tin và watchdog timer chống treo.", estimated_hours=round(p2_hours*0.3, 1), priority="HIGH"),
                        AITaskItem(title="Lập trình driver giao tiếp cảm biến & module ngoại vi", description="Xử lý giao tiếp I2C/SPI/UART và lọc nhiễu dữ liệu cảm biến thô.", estimated_hours=round(p2_hours*0.4, 1), priority="HIGH"),
                        AITaskItem(title="Kết nối truyền thông tin cậy lên Gateway/Cloud", description="Gửi dữ liệu qua MQTT với cơ chế tự động kết nối lại khi mất mạng.", estimated_hours=round(p2_hours*0.3, 1), is_milestone=True, priority="HIGH")
                    ]
                ),
                AIPhaseItem(
                    phase_number=3,
                    title="Phase 3: Thiết kế Mạch in PCB & Chế tạo Vỏ hộp Prototype",
                    description="Layout PCB 2 lớp, đi dây tín hiệu, đổ đồng GND, gửi gia công và dựng vỏ bảo vệ 3D print.",
                    estimated_hours=p3_hours,
                    tasks=[
                        AITaskItem(title="Layout mạch in PCB & kiểm tra quy chuẩn DRC", description="Bố trí linh kiện hợp lý, đi dây nguồn to bản và chạy DRC kiểm tra lỗi.", estimated_hours=round(p3_hours*0.4, 1), priority="HIGH"),
                        AITaskItem(title="Hàn mạch, đo kiểm điện áp nguồn & test tín hiệu", description="Đo kiểm tra ngắn mạch, kiểm tra điện áp cấp và hàn vi điều khiển.", estimated_hours=round(p3_hours*0.3, 1), priority="HIGH"),
                        AITaskItem(title="Thiết kế & in 3D vỏ hộp bảo vệ ngoài trời/trong nhà", description="Vẽ vỏ hộp trên Fusion360/Tinkercad có lỗ thông gió và cố định bo mạch.", estimated_hours=round(p3_hours*0.3, 1), is_milestone=True, priority="MEDIUM")
                    ]
                ),
                AIPhaseItem(
                    phase_number=4,
                    title="Phase 4: Kiểm thử Độ bền 72h, Tối ưu Năng lượng & Nghiệm thu",
                    description="Thử nghiệm ngâm chạy liên tục trong điều kiện thực tế, đo dòng tiêu thụ và hoàn thiện hồ sơ dự án.",
                    estimated_hours=p4_hours,
                    tasks=[
                        AITaskItem(title="Thử nghiệm chạy liên tục 72 giờ không treo", description="Ghi nhận log truyền thông, kiểm tra sụt áp pin và nhiệt độ linh kiện.", estimated_hours=round(p4_hours*0.4, 1), priority="HIGH"),
                        AITaskItem(title="Tối ưu chế độ Deep Sleep tiết kiệm năng lượng", description="Cấu hình vi điều khiển ngủ sâu khi không có sự kiện để kéo dài tuổi thọ pin.", estimated_hours=round(p4_hours*0.3, 1), priority="MEDIUM"),
                        AITaskItem(title="Tổng kết nghiệm thu & đóng gói tài liệu kỹ thuật", description="Lập báo cáo WBS, sơ đồ kết nối và video demo hoạt động thực tế.", estimated_hours=round(p4_hours*0.3, 1), is_milestone=True, priority="HIGH")
                    ]
                )
            ]
        elif is_ai_ml:
            phases = [
                AIPhaseItem(
                    phase_number=1,
                    title="Phase 1: Thu thập Dữ liệu, Làm sạch & Nghiên cứu Baseline",
                    description="Xác định bài toán, thu thập tập dữ liệu, làm sạch, phân tích khám phá (EDA) và dựng mô hình cơ sở.",
                    estimated_hours=p1_hours,
                    tasks=[
                        AITaskItem(title="Khởi tạo môi trường Deep Learning / Jupyter & Git LFS", description="Cài đặt PyTorch/TensorFlow, CUDA driver và quản lý dataset dung lượng lớn.", estimated_hours=round(p1_hours*0.25, 1), priority="HIGH"),
                        AITaskItem(title="Thu thập, làm sạch và loại bỏ dữ liệu ngoại lai", description="Viết pipeline tiền xử lý dữ liệu, chuẩn hóa feature và cân bằng nhãn.", estimated_hours=round(p1_hours*0.4, 1), priority="HIGH"),
                        AITaskItem(title="Xây dựng Baseline Model & Thiết lập Metric đánh giá", description="Đánh giá mô hình cơ sở theo các metric chuẩn (Accuracy, F1, mAP, BLEU).", estimated_hours=round(p1_hours*0.35, 1), is_milestone=True, priority="HIGH")
                    ]
                ),
                AIPhaseItem(
                    phase_number=2,
                    title="Phase 2: Huấn luyện Mô hình Nâng cao & Fine-Tuning",
                    description="Thử nghiệm các kiến trúc SOTA, tinh chỉnh hyperparameters, áp dụng kỹ thuật data augmentation.",
                    estimated_hours=p2_hours,
                    tasks=[
                        AITaskItem(title="Thiết lập pipeline huấn luyện có checkpointing & TensorBoard", description="Lưu lại best weights tự động và theo dõi loss curve chống overfit.", estimated_hours=round(p2_hours*0.35, 1), priority="HIGH"),
                        AITaskItem(title="Huấn luyện mô hình chính & Thử nghiệm kỹ thuật tối ưu", description="Thử nghiệm learning rate scheduler, optimizer AdamW và regularization.", estimated_hours=round(p2_hours*0.4, 1), priority="HIGH"),
                        AITaskItem(title="Đạt ngưỡng mục tiêu độ chính xác trên Validation Set", description="Xác nhận mô hình vượt qua baseline theo mục tiêu đề ra ban đầu.", estimated_hours=round(p2_hours*0.25, 1), is_milestone=True, priority="HIGH")
                    ]
                ),
                AIPhaseItem(
                    phase_number=3,
                    title="Phase 3: Tối ưu Tốc độ Inference & Đóng gói Serving API",
                    description="Lượng tử hóa mô hình (ONNX / TensorRT / GGUF), xây dựng REST API inference độ trễ thấp.",
                    estimated_hours=p3_hours,
                    tasks=[
                        AITaskItem(title="Chuyển đổi mô hình sang định dạng tối ưu ONNX / TensorRT", description="Tăng tốc độ dự đoán (inference) và giảm dung lượng VRAM/RAM cần thiết.", estimated_hours=round(p3_hours*0.35, 1), priority="MEDIUM"),
                        AITaskItem(title="Viết API phục vụ dự đoán (FastAPI Serving Service)", description="Thiết kế endpoint nhận input, batching và trả kết quả JSON với latency < 200ms.", estimated_hours=round(p3_hours*0.4, 1), priority="HIGH"),
                        AITaskItem(title="Kiểm thử tải đồng thời & Xử lý trường hợp ngoại lệ", description="Đảm bảo API không crash khi nhận dữ liệu bị rỗng hoặc định dạng sai lệch.", estimated_hours=round(p3_hours*0.25, 1), is_milestone=True, priority="HIGH")
                    ]
                ),
                AIPhaseItem(
                    phase_number=4,
                    title="Phase 4: Triển khai Hệ thống, Demo Web & Báo cáo Benchmark",
                    description="Đưa mô hình lên Cloud/GPU server, dựng demo giao diện người dùng và lập báo cáo kỹ thuật.",
                    estimated_hours=p4_hours,
                    tasks=[
                        AITaskItem(title="Đóng gói Docker Container & Triển khai lên máy chủ", description="Tạo Dockerfile chuẩn tối ưu GPU runtime và cấu hình biến môi trường.", estimated_hours=round(p4_hours*0.4, 1), priority="HIGH"),
                        AITaskItem(title="Dựng giao diện Demo trực quan (Gradio / Next.js)", description="Tạo UI cho phép upload ảnh/text và xem kết quả dự đoán thời gian thực.", estimated_hours=round(p4_hours*0.3, 1), priority="MEDIUM"),
                        AITaskItem(title="Tổng kết dự án & Báo cáo so sánh benchmark", description="Xuất báo cáo WBS Chronomind, so sánh các phiên bản mô hình và nghiệm thu.", estimated_hours=round(p4_hours*0.3, 1), is_milestone=True, priority="MEDIUM")
                    ]
                )
            ]
        else:
            phases = [
                AIPhaseItem(
                    phase_number=1,
                    title="Phase 1: Nghiên cứu Khả thi, Thiết kế Kiến trúc & PoC",
                    description="Xác định phạm vi sản phẩm MVP, thiết kế sơ đồ luồng hệ thống, và dựng bản thử nghiệm mẫu.",
                    estimated_hours=p1_hours,
                    tasks=[
                        AITaskItem(title="Lập tài liệu đặc tả yêu cầu & luồng người dùng (User Stories)", description="Viết tài liệu mô tả chi tiết các màn hình hoặc chức năng chính.", estimated_hours=round(p1_hours*0.25, 1), priority="HIGH"),
                        AITaskItem(title="Thiết kế sơ đồ kiến trúc & Mô hình dữ liệu (ERD Database)", description="Vẽ sơ đồ khối hệ thống, thiết kế Database schema và API contracts.", estimated_hours=round(p1_hours*0.35, 1), priority="HIGH"),
                        AITaskItem(title="Dựng bản PoC kiểm chứng công nghệ cốt lõi", description="Viết code mẫu kiểm tra tính khả thi của tính năng khó nhất.", estimated_hours=round(p1_hours*0.4, 1), is_milestone=True, priority="HIGH")
                    ]
                ),
                AIPhaseItem(
                    phase_number=2,
                    title="Phase 2: Xây dựng Module Lõi & Backend API",
                    description="Triển khai các tính năng trung tâm, logic nghiệp vụ quan trọng và bảo mật xác thực.",
                    estimated_hours=p2_hours,
                    tasks=[
                        AITaskItem(title="Khởi tạo khung sườn ứng dụng & Cấu hình Database Migration", description="Cài đặt framework, tạo kết nối DB, thiết lập migration và biến môi trường.", estimated_hours=round(p2_hours*0.25, 1), priority="MEDIUM"),
                        AITaskItem(title="Lập trình tính năng nghiệp vụ trung tâm (Core Business Logic)", description="Xây dựng các thuật toán, API endpoints xử lý dữ liệu chính.", estimated_hours=round(p2_hours*0.45, 1), priority="HIGH"),
                        AITaskItem(title="Tích hợp xác thực bảo mật & Kiểm thử API tự động", description="Bổ sung JWT/OAuth2, validate dữ liệu đầu vào và viết integration tests.", estimated_hours=round(p2_hours*0.3, 1), is_milestone=True, priority="HIGH")
                    ]
                ),
                AIPhaseItem(
                    phase_number=3,
                    title="Phase 3: Hoàn thiện Giao diện UI/UX & Kiểm thử Toàn diện",
                    description="Đồng bộ hóa toàn bộ luồng sử dụng, kiểm thử đơn vị, kiểm thử tích hợp và vá lỗi.",
                    estimated_hours=p3_hours,
                    tasks=[
                        AITaskItem(title="Hoàn thiện giao diện người dùng & Trải nghiệm tương tác responsive", description="Chăm chút UI/UX theo Material Design, thông báo trạng thái, xử lý lỗi thân thiện.", estimated_hours=round(p3_hours*0.35, 1), priority="MEDIUM"),
                        AITaskItem(title="Kiểm thử tải, kiểm thử biên và xử lý sự cố ngoài dự kiến", description="Thử nghiệm với các tình huống dữ liệu bất thường hoặc gián đoạn mạng.", estimated_hours=round(p3_hours*0.35, 1), priority="HIGH"),
                        AITaskItem(title="Đóng gói bản Beta & Thử nghiệm với người dùng mẫu", description="Chạy thử nghiệm bản hoàn chỉnh và thu thập phản hồi đầu tiên.", estimated_hours=round(p3_hours*0.3, 1), is_milestone=True, priority="HIGH")
                    ]
                ),
                AIPhaseItem(
                    phase_number=4,
                    title="Phase 4: Triển khai CI/CD, Production Release & Báo cáo",
                    description="Đưa sản phẩm lên môi trường hoạt động thực tế, cấu hình tên miền, SSL và hoàn thiện hồ sơ dự án.",
                    estimated_hours=p4_hours,
                    tasks=[
                        AITaskItem(title="Triển khai lên môi trường Cloud/Server & Cấu hình SSL/Domain", description="Cấu hình Docker, deploy lên Cloud với chứng chỉ HTTPS an toàn.", estimated_hours=round(p4_hours*0.4, 1), priority="HIGH"),
                        AITaskItem(title="Hoàn thiện tài liệu hướng dẫn sử dụng & Video demo", description="Viết README chi tiết, hướng dẫn cài đặt và quay video trình diễn tính năng.", estimated_hours=round(p4_hours*0.3, 1), priority="MEDIUM"),
                        AITaskItem(title="Tổng kết dự án & Xuất báo cáo tiến độ WBS", description="Xuất báo cáo WBS Chronomind, so sánh thời gian thực tế với kế hoạch ban đầu.", estimated_hours=round(p4_hours*0.3, 1), is_milestone=True, priority="MEDIUM")
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
