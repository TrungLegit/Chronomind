from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import HTMLResponse, JSONResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import Project
from app.services.google_calendar import GoogleCalendarService

router = APIRouter()

class GoogleConfigSchema(BaseModel):
    client_id: str
    client_secret: str
    redirect_uri: Optional[str] = None

@router.get("/google/status")
def get_google_status(db: Session = Depends(get_db)):
    """Returns Google Calendar integration status (connected or not, email, client id preview)."""
    return GoogleCalendarService.get_status(db)

@router.post("/google/config")
def save_google_config(config: GoogleConfigSchema, db: Session = Depends(get_db)):
    """Saves Google OAuth credentials."""
    if not config.client_id or not config.client_secret:
        raise HTTPException(status_code=400, detail="Client ID và Client Secret không được để trống.")
    return GoogleCalendarService.save_config(
        db,
        client_id=config.client_id,
        client_secret=config.client_secret,
        redirect_uri=config.redirect_uri
    )

@router.get("/google/auth-url")
def get_auth_url(db: Session = Depends(get_db)):
    """Generates Google OAuth consent screen URL."""
    try:
        url = GoogleCalendarService.get_authorization_url(db)
        return {"auth_url": url}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/google/callback", response_class=HTMLResponse)
async def google_callback(
    code: Optional[str] = Query(None),
    error: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Handles OAuth 2.0 redirect from Google."""
    if error:
        return HTMLResponse(content=f"""
        <!DOCTYPE html>
        <html lang="vi">
        <head>
          <meta charset="utf-8">
          <title>Lỗi xác thực Google Calendar - Chronomind</title>
          <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #fdf2f2; color: #b3261e; }}
            .card {{ background: white; padding: 40px; border-radius: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); text-align: center; max-width: 440px; border: 1px solid #f9dedc; }}
            .btn {{ display: inline-block; margin-top: 20px; padding: 10px 24px; background: #b3261e; color: white; border-radius: 9999px; text-decoration: none; font-weight: 500; font-size: 14px; cursor: pointer; }}
          </style>
        </head>
        <body>
          <div class="card">
            <div style="font-size: 40px; margin-bottom: 12px;">⚠️</div>
            <h2 style="margin: 0 0 8px; font-size: 18px;">Xác thực thất bại</h2>
            <p style="color: #444746; font-size: 14px; margin: 0;">Google phản hồi lỗi: {error}</p>
            <button class="btn" onclick="window.close()">Đóng cửa sổ này</button>
          </div>
        </body>
        </html>
        """, status_code=400)

    if not code:
        return HTMLResponse(content="Thiếu tham số mã ủy quyền (code).", status_code=400)

    try:
        token_info = await GoogleCalendarService.exchange_code(db, code)
        user_email = token_info.get("user_email") or "Tài khoản Google"

        return HTMLResponse(content=f"""
        <!DOCTYPE html>
        <html lang="vi">
        <head>
          <meta charset="utf-8">
          <title>Kết nối thành công - Chronomind</title>
          <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f8fafd; color: #1f1f1f; }}
            .card {{ background: white; padding: 44px 36px; border-radius: 24px; box-shadow: 0 4px 24px rgba(11,87,208,0.08); text-align: center; max-width: 440px; border: 1px solid #e0e2ec; }}
            .badge {{ display: inline-flex; align-items: center; justify-content: center; width: 64px; height: 64px; border-radius: 50%; background: #e8f5e9; color: #137333; font-size: 32px; margin-bottom: 16px; }}
            .btn {{ display: inline-block; margin-top: 24px; padding: 10px 28px; background: #0b57d0; color: white; border-radius: 9999px; text-decoration: none; font-weight: 500; font-size: 14px; cursor: pointer; border: none; }}
          </style>
        </head>
        <body>
          <div class="card">
            <div class="badge">✓</div>
            <h2 style="margin: 0 0 8px; font-size: 20px; font-weight: 600;">Kết nối Google Calendar thành công!</h2>
            <p style="color: #444746; font-size: 14px; line-height: 1.5; margin: 0;">
              Đã liên kết với <strong>{user_email}</strong>.<br/>
              Bạn có thể quay lại Chronomind để đồng bộ dự án.
            </p>
            <button class="btn" onclick="window.close()">Đóng cửa sổ & Tiếp tục</button>
          </div>
          <script>
            try {{
              if (window.opener) {{
                window.opener.postMessage({{ type: 'GOOGLE_AUTH_SUCCESS', email: '{user_email}' }}, '*');
                setTimeout(() => window.close(), 1600);
              }}
            }} catch(e) {{}}
          </script>
        </body>
        </html>
        """)
    except Exception as e:
        return HTMLResponse(content=f"""
        <!DOCTYPE html>
        <html lang="vi">
        <head>
          <meta charset="utf-8">
          <title>Lỗi kết nối - Chronomind</title>
          <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #fdf2f2; }}
            .card {{ background: white; padding: 40px; border-radius: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); text-align: center; max-width: 440px; border: 1px solid #f9dedc; }}
            .btn {{ display: inline-block; margin-top: 20px; padding: 10px 24px; background: #b3261e; color: white; border-radius: 9999px; text-decoration: none; font-weight: 500; font-size: 14px; cursor: pointer; }}
          </style>
        </head>
        <body>
          <div class="card">
            <div style="font-size: 40px; margin-bottom: 12px;">❌</div>
            <h2 style="margin: 0 0 8px; font-size: 18px; color: #b3261e;">Lỗi xác thực token</h2>
            <p style="color: #444746; font-size: 13px;">{str(e)}</p>
            <button class="btn" onclick="window.close()">Đóng</button>
          </div>
        </body>
        </html>
        """, status_code=500)

@router.post("/google/sync/{project_id}")
async def sync_project_to_google(project_id: str, db: Session = Depends(get_db)):
    """Pushes/updates all project phases & milestones to Google Calendar."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Không tìm thấy dự án.")

    try:
        res = await GoogleCalendarService.sync_project_to_google_calendar(db, project)
        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/google/disconnect")
def disconnect_google(db: Session = Depends(get_db)):
    """Disconnects Google account and deletes token."""
    return GoogleCalendarService.disconnect(db)
