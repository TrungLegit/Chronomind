import json
import time
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
import httpx
from sqlalchemy.orm import Session
from app.models.models import SystemState, Project, Phase, Task
from app.services.scheduler import DeadlineScheduler

CONFIG_KEY = "google_calendar_config"
TOKEN_KEY = "google_calendar_token"
DEFAULT_REDIRECT_URI = "http://localhost:8000/api/integrations/google/callback"

class GoogleCalendarService:
    @staticmethod
    def _get_state(db: Session, key: str) -> Optional[Dict[str, Any]]:
        record = db.query(SystemState).filter(SystemState.key == key).first()
        if record and record.value:
            try:
                return json.loads(record.value)
            except Exception:
                return None
        return None

    @staticmethod
    def _set_state(db: Session, key: str, value: Optional[Dict[str, Any]]):
        record = db.query(SystemState).filter(SystemState.key == key).first()
        if not record:
            record = SystemState(key=key)
            db.add(record)
        
        if value is None:
            record.value = None
        else:
            record.value = json.dumps(value)
        db.commit()

    @classmethod
    def get_status(cls, db: Session) -> Dict[str, Any]:
        config = cls._get_state(db, CONFIG_KEY) or {}
        token = cls._get_state(db, TOKEN_KEY) or {}

        client_id = config.get("client_id", "")
        masked_id = ""
        if client_id:
            masked_id = client_id[:12] + "..." + client_id[-8:] if len(client_id) > 20 else client_id

        has_token = bool(token.get("access_token") or token.get("refresh_token"))
        user_email = token.get("user_email")
        user_name = token.get("user_name")

        return {
            "is_configured": bool(client_id and config.get("client_secret")),
            "is_connected": has_token,
            "client_id_preview": masked_id,
            "redirect_uri": config.get("redirect_uri", DEFAULT_REDIRECT_URI),
            "user_email": user_email,
            "user_name": user_name,
            "connected_at": token.get("connected_at")
        }

    @classmethod
    def save_config(cls, db: Session, client_id: str, client_secret: str, redirect_uri: Optional[str] = None):
        cfg = {
            "client_id": client_id.strip(),
            "client_secret": client_secret.strip(),
            "redirect_uri": (redirect_uri or DEFAULT_REDIRECT_URI).strip()
        }
        cls._set_state(db, CONFIG_KEY, cfg)
        return {"status": "success", "message": "Google OAuth configuration saved."}

    @classmethod
    def get_authorization_url(cls, db: Session) -> str:
        config = cls._get_state(db, CONFIG_KEY)
        if not config or not config.get("client_id"):
            raise ValueError("Chưa cấu hình Google Client ID và Client Secret.")

        client_id = config["client_id"]
        redirect_uri = config.get("redirect_uri", DEFAULT_REDIRECT_URI)
        scopes = [
            "https://www.googleapis.com/auth/calendar",
            "https://www.googleapis.com/auth/userinfo.email",
            "https://www.googleapis.com/auth/userinfo.profile"
        ]
        scope_str = "%20".join(scopes)

        auth_url = (
            f"https://accounts.google.com/o/oauth2/v2/auth?"
            f"response_type=code&"
            f"client_id={client_id}&"
            f"redirect_uri={redirect_uri}&"
            f"scope={scope_str}&"
            f"access_type=offline&"
            f"prompt=consent"
        )
        return auth_url

    @classmethod
    async def exchange_code(cls, db: Session, code: str) -> Dict[str, Any]:
        config = cls._get_state(db, CONFIG_KEY)
        if not config:
            raise ValueError("Missing Google OAuth configuration.")

        token_url = "https://oauth2.googleapis.com/token"
        payload = {
            "code": code,
            "client_id": config["client_id"],
            "client_secret": config["client_secret"],
            "redirect_uri": config.get("redirect_uri", DEFAULT_REDIRECT_URI),
            "grant_type": "authorization_code"
        }

        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(token_url, data=payload)
            if resp.status_code != 200:
                raise ValueError(f"Không thể đổi token từ Google: {resp.text}")

            token_data = resp.json()
            access_token = token_data.get("access_token")
            refresh_token = token_data.get("refresh_token")
            expires_in = token_data.get("expires_in", 3600)
            expires_at = time.time() + expires_in - 60

            # Fetch user email/profile
            user_email = ""
            user_name = ""
            userinfo_resp = await client.get(
                "https://www.googleapis.com/oauth2/v2/userinfo",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            if userinfo_resp.status_code == 200:
                u_data = userinfo_resp.json()
                user_email = u_data.get("email", "")
                user_name = u_data.get("name", "")

            # If refresh_token is missing (e.g. repeated auth), preserve old refresh token
            existing_token = cls._get_state(db, TOKEN_KEY) or {}
            if not refresh_token and existing_token.get("refresh_token"):
                refresh_token = existing_token.get("refresh_token")

            saved_token = {
                "access_token": access_token,
                "refresh_token": refresh_token,
                "expires_at": expires_at,
                "user_email": user_email,
                "user_name": user_name,
                "connected_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
            }
            cls._set_state(db, TOKEN_KEY, saved_token)
            return saved_token

    @classmethod
    async def get_valid_access_token(cls, db: Session) -> str:
        config = cls._get_state(db, CONFIG_KEY)
        token = cls._get_state(db, TOKEN_KEY)

        if not token or not token.get("access_token"):
            raise ValueError("Chưa kết nối tài khoản Google Calendar.")

        expires_at = token.get("expires_at", 0)
        # Token still valid
        if time.time() < expires_at:
            return token["access_token"]

        # Token expired, refresh it
        refresh_token = token.get("refresh_token")
        if not refresh_token:
            raise ValueError("Token đã hết hạn và không có refresh token. Vui lòng kết nối lại.")

        token_url = "https://oauth2.googleapis.com/token"
        payload = {
            "client_id": config["client_id"],
            "client_secret": config["client_secret"],
            "refresh_token": refresh_token,
            "grant_type": "refresh_token"
        }

        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(token_url, data=payload)
            if resp.status_code != 200:
                raise ValueError(f"Không thể làm mới token Google: {resp.text}")

            new_data = resp.json()
            token["access_token"] = new_data["access_token"]
            token["expires_at"] = time.time() + new_data.get("expires_in", 3600) - 60
            if "refresh_token" in new_data:
                token["refresh_token"] = new_data["refresh_token"]

            cls._set_state(db, TOKEN_KEY, token)
            return token["access_token"]

    @classmethod
    def disconnect(cls, db: Session):
        cls._set_state(db, TOKEN_KEY, None)
        return {"status": "success", "message": "Đã ngắt kết nối Google Calendar."}

    @classmethod
    async def sync_project_to_google_calendar(cls, db: Session, project: Project) -> Dict[str, Any]:
        """
        Synchronizes all phases and milestones of a project to Google Calendar.
        Creates or reuses a dedicated calendar 'Chronomind: [Project Title]'.
        Uses deterministic base32hex IDs to update existing events instead of creating duplicates.
        """
        access_token = await cls.get_valid_access_token(db)
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }

        async with httpx.AsyncClient(timeout=25.0) as client:
            # 1. Get or create calendar for this project
            calendar_id = None
            cal_title = f"Chronomind: {project.title[:45]}"

            # Search in user's calendar list
            list_resp = await client.get(
                "https://www.googleapis.com/calendar/v3/users/me/calendarList",
                headers=headers
            )
            if list_resp.status_code == 200:
                items = list_resp.json().get("items", [])
                for cal in items:
                    if cal.get("summary") == cal_title:
                        calendar_id = cal.get("id")
                        break

            # If not found, create new calendar
            if not calendar_id:
                create_resp = await client.post(
                    "https://www.googleapis.com/calendar/v3/calendars",
                    headers=headers,
                    json={
                        "summary": cal_title,
                        "description": f"Lịch tiến độ dự án '{project.title}' do Chronomind AI Planner tự động quản lý.",
                        "timeZone": "Asia/Ho_Chi_Minh"
                    }
                )
                if create_resp.status_code in (200, 201):
                    calendar_id = create_resp.json().get("id")
                else:
                    # Fallback to primary calendar if secondary calendar creation fails
                    calendar_id = "primary"

            synced_phases = 0
            synced_milestones = 0
            cursor = project.kick_off_date or datetime.utcnow()

            # 2. Iterate phases and sync
            for phase in project.phases:
                duration_days = DeadlineScheduler.calculate_duration_days(
                    phase.estimated_hours, project.available_hours_per_week
                )
                start_dt = phase.planned_start_date or cursor
                end_dt = phase.planned_end_date or (start_dt + timedelta(days=duration_days))
                cursor = end_dt

                # Safe deterministic base32hex ID (prefix 'p' + clean 32 chars)
                phase_event_id = "p" + phase.id.replace("-", "").lower()[:32]

                desc_parts = [
                    f"Dự án: {project.title}",
                    f"Giai đoạn {phase.phase_number}: {phase.title}",
                    f"Ước tính: {phase.estimated_hours}h (~{duration_days} ngày)",
                    f"Trạng thái: {phase.status}",
                    f"Chi tiết: {phase.description or 'N/A'}\n"
                ]
                if phase.tasks:
                    desc_parts.append("Công việc:")
                    for t in phase.tasks:
                        mark = "✓" if t.status == "DONE" else "○"
                        desc_parts.append(f"  {mark} {t.title} ({t.estimated_hours}h)")

                event_body = {
                    "summary": f"[Phase {phase.phase_number}] {phase.title}",
                    "description": "\n".join(desc_parts),
                    "start": {
                        "dateTime": start_dt.strftime("%Y-%m-%dT%H:%M:%SZ"),
                        "timeZone": "UTC"
                    },
                    "end": {
                        "dateTime": end_dt.strftime("%Y-%m-%dT%H:%M:%SZ"),
                        "timeZone": "UTC"
                    },
                    "colorId": "1"  # Lavender/Blue in Google Calendar
                }

                # Upsert event: Try PUT, if 404 then POST
                event_url = f"https://www.googleapis.com/calendar/v3/calendars/{calendar_id}/events/{phase_event_id}"
                put_resp = await client.put(event_url, headers=headers, json=event_body)
                if put_resp.status_code == 200:
                    synced_phases += 1
                elif put_resp.status_code == 404:
                    post_body = dict(event_body)
                    post_body["id"] = phase_event_id
                    create_evt = await client.post(
                        f"https://www.googleapis.com/calendar/v3/calendars/{calendar_id}/events",
                        headers=headers,
                        json=post_body
                    )
                    if create_evt.status_code in (200, 201):
                        synced_phases += 1

                # 3. Iterate milestone tasks
                for task in phase.tasks:
                    if task.is_milestone:
                        t_start = task.planned_date or start_dt
                        t_end = t_start + timedelta(hours=max(task.estimated_hours, 1.0))
                        m_event_id = "m" + task.id.replace("-", "").lower()[:32]

                        m_body = {
                            "summary": f"⭐ [Cột mốc] {task.title}",
                            "description": (
                                f"Cột mốc Phase {phase.phase_number}: {phase.title}\n"
                                f"Dự án: {project.title}\n"
                                f"Thời lượng: {task.estimated_hours}h | Ưu tiên: {task.priority}\n"
                                f"{task.description or ''}"
                            ),
                            "start": {
                                "dateTime": t_start.strftime("%Y-%m-%dT%H:%M:%SZ"),
                                "timeZone": "UTC"
                            },
                            "end": {
                                "dateTime": t_end.strftime("%Y-%m-%dT%H:%M:%SZ"),
                                "timeZone": "UTC"
                            },
                            "colorId": "11"  # Red / Flame in Google Calendar
                        }

                        m_url = f"https://www.googleapis.com/calendar/v3/calendars/{calendar_id}/events/{m_event_id}"
                        m_put = await client.put(m_url, headers=headers, json=m_body)
                        if m_put.status_code == 200:
                            synced_milestones += 1
                        elif m_put.status_code == 404:
                            post_m = dict(m_body)
                            post_m["id"] = m_event_id
                            create_m = await client.post(
                                f"https://www.googleapis.com/calendar/v3/calendars/{calendar_id}/events",
                                headers=headers,
                                json=post_m
                            )
                            if create_m.status_code in (200, 201):
                                synced_milestones += 1

            return {
                "status": "success",
                "calendar_id": calendar_id,
                "calendar_name": cal_title,
                "synced_phases": synced_phases,
                "synced_milestones": synced_milestones,
                "calendar_url": "https://calendar.google.com/calendar/u/0/r"
            }
