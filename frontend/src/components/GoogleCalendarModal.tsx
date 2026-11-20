"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  Download,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  KeyRound,
  RefreshCw,
  Sparkles,
  HelpCircle,
  X,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { api } from "@/services/api";
import { Project, Phase } from "@/types";

interface GoogleCalendarModalProps {
  isOpen: boolean;
  project: Project;
  onClose: () => void;
}

export const GoogleCalendarModal: React.FC<GoogleCalendarModalProps> = ({
  isOpen,
  project,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<"instant" | "api">("instant");
  const [googleStatus, setGoogleStatus] = useState<any>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  
  // API Config Form
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [jsonInput, setJsonInput] = useState("");
  const [showJsonInput, setShowJsonInput] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const redirectUri = "http://localhost:8000/api/integrations/google/callback";

  const fetchStatus = async () => {
    setIsLoadingStatus(true);
    setErrorMessage(null);
    try {
      const st = await api.getGoogleStatus();
      setGoogleStatus(st);
    } catch (e: any) {
      console.error("Failed to load Google status:", e);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
      setSyncResult(null);
      setErrorMessage(null);
    }
  }, [isOpen]);

  // Listen for popup auth completion message
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === "GOOGLE_AUTH_SUCCESS") {
        fetchStatus();
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleJsonCredentialsParse = (text: string) => {
    setJsonInput(text);
    try {
      const parsed = JSON.parse(text);
      const web = parsed.web || parsed.installed;
      if (web && web.client_id) {
        setClientId(web.client_id);
        if (web.client_secret) setClientSecret(web.client_secret);
        setErrorMessage(null);
      }
    } catch (e) {
      // Ignore while user is typing
    }
  };

  const handleSaveAndConnect = async () => {
    if (!clientId.trim() || !clientSecret.trim()) {
      setErrorMessage("Vui lòng nhập đầy đủ Client ID và Client Secret");
      return;
    }
    setIsSavingConfig(true);
    setErrorMessage(null);
    try {
      await api.saveGoogleConfig({
        client_id: clientId.trim(),
        client_secret: clientSecret.trim(),
        redirect_uri: redirectUri,
      });

      // Fetch Auth URL and open login popup
      const { auth_url } = await api.getGoogleAuthUrl();
      const popup = window.open(
        auth_url,
        "GoogleAuthPopup",
        "width=560,height=680,menubar=no,status=no,toolbar=no"
      );

      // Periodically check if popup closed
      const checkTimer = setInterval(() => {
        if (!popup || popup.closed) {
          clearInterval(checkTimer);
          fetchStatus();
        }
      }, 1000);
    } catch (e: any) {
      setErrorMessage(e.message || "Lỗi khi lưu cấu hình hoặc mở xác thực");
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Bạn có chắc muốn hủy kết nối Google Calendar?")) return;
    try {
      await api.disconnectGoogle();
      await fetchStatus();
      setSyncResult(null);
    } catch (e: any) {
      setErrorMessage(e.message || "Lỗi khi ngắt kết nối");
    }
  };

  const handleSyncToGoogle = async () => {
    setIsSyncing(true);
    setErrorMessage(null);
    setSyncResult(null);
    try {
      const res = await api.syncProjectToGoogle(project.id);
      setSyncResult(res);
    } catch (e: any) {
      setErrorMessage(e.message || "Không thể đồng bộ lên Google Calendar");
    } finally {
      setIsSyncing(false);
    }
  };

  // Helper to build 1-click Google Calendar web render URL for a phase
  const getGoogleCalendarPhaseUrl = (phase: Phase) => {
    const title = encodeURIComponent(`[Phase ${phase.phase_number}] ${phase.title} - ${project.title}`);
    const details = encodeURIComponent(
      `Dự án: ${project.title}\nThời lượng: ${phase.estimated_hours}h\nMô tả: ${phase.description || 'N/A'}`
    );

    // Format start & end date to YYYYMMDDTHHmmssZ
    let datesParam = "";
    if (phase.planned_start_date && phase.planned_end_date) {
      const s = new Date(phase.planned_start_date).toISOString().replace(/-|:|\.\d\d\d/g, "");
      const e = new Date(phase.planned_end_date).toISOString().replace(/-|:|\.\d\d\d/g, "");
      datesParam = `&dates=${s}/${e}`;
    }

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}${datesParam}&details=${details}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-[#001d35]/40 backdrop-blur-xs" onClick={onClose} />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl rounded-3xl bg-white shadow-2xl border border-[#dadce0] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e5e7eb] bg-[#f8fafd]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-[#dadce0] shadow-xs">
              <Calendar className="h-5 w-5 text-[#0b57d0]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1f1f1f]">
                Kết nối & Đồng bộ Google Calendar
              </h2>
              <p className="text-xs text-[#5f6368]">
                Dự án: <strong className="text-[#1f1f1f]">{project.title}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full flex items-center justify-center text-[#5f6368] hover:bg-[#e9eef6] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Navigator */}
        <div className="flex border-b border-[#e5e7eb] px-6 bg-white">
          <button
            onClick={() => setActiveTab("instant")}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition-all ${
              activeTab === "instant"
                ? "border-[#0b57d0] text-[#0b57d0]"
                : "border-transparent text-[#5f6368] hover:text-[#1f1f1f]"
            }`}
          >
            <Sparkles className="h-4 w-4" />
            <span>Thêm nhanh (1-Click / .ics)</span>
            <span className="text-[10px] rounded-full bg-[#e6f4ea] text-[#137333] px-2 py-0.5 font-bold">
              Không cần setup
            </span>
          </button>

          <button
            onClick={() => setActiveTab("api")}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition-all ${
              activeTab === "api"
                ? "border-[#0b57d0] text-[#0b57d0]"
                : "border-transparent text-[#5f6368] hover:text-[#1f1f1f]"
            }`}
          >
            <KeyRound className="h-4 w-4" />
            <span>Tùy chọn nâng cao (Google API 2 chiều)</span>
            {googleStatus?.is_connected && (
              <span className="h-2 w-2 rounded-full bg-[#137333]" />
            )}
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMessage && (
            <div className="flex items-center gap-2 rounded-xl bg-[#fdf2f2] border border-[#f9dedc] p-3 text-xs text-[#b3261e]">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* TAB 1: INSTANT / ZERO CONFIG */}
          {activeTab === "instant" && (
            <div className="space-y-5">
              {/* Box 1: Download .ics */}
              <div className="rounded-2xl border border-[#dadce0] bg-[#f8fafd] p-4 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#1f1f1f]">Cách 1: Tải tệp lịch iCalendar (.ics)</span>
                      <span className="text-[10px] rounded bg-[#c2e7ff] text-[#001d35] font-semibold px-1.5 py-0.5">Tiện lợi nhất</span>
                    </div>
                    <p className="text-xs text-[#5f6368] leading-relaxed">
                      Tải về tệp <code className="bg-white px-1.5 py-0.5 rounded border border-[#dadce0] text-[#0b57d0]">.ics</code> chuẩn quốc tế chứa toàn bộ Phase và Milestone của dự án. Tương thích với Google Calendar, Apple Calendar, Outlook.
                    </p>
                  </div>

                  <a
                    href={api.getExportIcsUrl(project.id)}
                    download
                    className="shrink-0 flex items-center gap-2 rounded-full bg-[#0b57d0] hover:bg-[#0842a0] text-white px-4 py-2 text-xs font-semibold shadow-xs transition-all"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Tải file .ics</span>
                  </a>
                </div>

                {/* Import guidance note */}
                <div className="bg-white rounded-xl p-3 border border-[#e5e7eb] text-[11px] text-[#5f6368] space-y-1">
                  <strong className="text-[#1f1f1f] block font-semibold">Cách import vào Google Calendar:</strong>
                  <ol className="list-decimal pl-4 space-y-0.5">
                    <li>Mở <a href="https://calendar.google.com" target="_blank" rel="noreferrer" className="text-[#0b57d0] underline">calendar.google.com</a> trên trình duyệt.</li>
                    <li>Ở góc trên bên phải, bấm vào biểu tượng ⚙️ (Cài đặt) &gt; chọn <strong>Cài đặt</strong>.</li>
                    <li>Ở menu bên trái, chọn <strong>Nhập và xuất (Import &amp; export)</strong>.</li>
                    <li>Chọn tệp <code>.ics</code> vừa tải xuống và bấm <strong>Nhập</strong>. Toàn bộ lịch trình sẽ xuất hiện ngay lập tức!</li>
                  </ol>
                </div>
              </div>

              {/* Box 2: 1-Click web template link for each Phase */}
              <div className="rounded-2xl border border-[#dadce0] bg-white p-4 space-y-3">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-[#1f1f1f]">Cách 2: Thêm từng giai đoạn vào Google Calendar bằng 1-Click</span>
                  <p className="text-xs text-[#5f6368]">
                    Bấm vào từng giai đoạn bên dưới để mở ngay màn hình tạo sự kiện của Google Calendar với nội dung đã được điền sẵn:
                  </p>
                </div>

                <div className="divide-y divide-[#f1f3f4] border border-[#e5e7eb] rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                  {project.phases.map((phase) => (
                    <div key={phase.id} className="flex items-center justify-between p-3 hover:bg-[#f8fafd] transition-colors">
                      <div className="min-w-0 pr-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-[#0b57d0]">Phase {phase.phase_number}</span>
                          <span className="text-xs font-medium text-[#1f1f1f] truncate">{phase.title}</span>
                        </div>
                        <span className="text-[11px] text-[#5f6368]">
                          Ước tính: {phase.estimated_hours}h
                        </span>
                      </div>

                      <a
                        href={getGoogleCalendarPhaseUrl(phase)}
                        target="_blank"
                        rel="noreferrer"
                        className="shrink-0 flex items-center gap-1.5 rounded-full border border-[#dadce0] bg-white hover:bg-[#eaf1fb] hover:border-[#c2e7ff] text-[#0b57d0] px-3 py-1.5 text-xs font-medium transition-all shadow-xs"
                      >
                        <span>Thêm vào Calendar</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ADVANCED GOOGLE API (2-WAY AUTO SYNC) */}
          {activeTab === "api" && (
            <div className="space-y-5">
              {/* CONNECTED STATE */}
              {googleStatus?.is_connected ? (
                <div className="rounded-2xl border border-[#ceead6] bg-[#f8fafd] p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e6f4ea] text-[#137333]">
                        <CheckCircle2 className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-[#1f1f1f]">Đã kết nối tài khoản Google</h4>
                        <p className="text-xs text-[#5f6368]">
                          {googleStatus.user_email || "Tài khoản Google đã xác thực"}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={handleDisconnect}
                      className="flex items-center gap-1.5 rounded-full border border-[#dadce0] bg-white px-3 py-1.5 text-xs font-medium text-[#5f6368] hover:text-[#c5221f] hover:border-[#fad2cf] hover:bg-[#fdf2f2] transition-all"
                    >
                      <LogOut className="h-3 w-3" />
                      <span>Hủy kết nối</span>
                    </button>
                  </div>

                  {/* Sync Action */}
                  <div className="border-t border-[#e5e7eb] pt-4 space-y-3">
                    <p className="text-xs text-[#5f6368] leading-relaxed">
                      Hệ thống sẽ tạo riêng một lịch <strong>Chronomind: {project.title}</strong> trên Google Calendar của bạn và đẩy các sự kiện Phase &amp; Cột mốc lên đó. Khi bạn lùi deadline, chỉ cần bấm đồng bộ lại thì ngày giờ trên Google Calendar sẽ tự động dịch chuyển tương ứng!
                    </p>

                    <div className="flex items-center gap-3 flex-wrap">
                      <button
                        onClick={handleSyncToGoogle}
                        disabled={isSyncing}
                        className="flex items-center gap-2 rounded-full bg-[#0b57d0] hover:bg-[#0842a0] disabled:bg-[#80868b] text-white px-5 py-2.5 text-xs font-semibold shadow-xs transition-all"
                      >
                        <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                        <span>{isSyncing ? "Đang đồng bộ..." : "Đồng bộ ngay dự án này lên Google"}</span>
                      </button>

                      <a
                        href="https://calendar.google.com"
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 rounded-full border border-[#dadce0] bg-white hover:bg-[#f8fafd] text-[#3c4043] px-4 py-2.5 text-xs font-medium transition-all shadow-xs"
                      >
                        <span>Mở Google Calendar</span>
                        <ExternalLink className="h-3.5 w-3.5 text-[#5f6368]" />
                      </a>
                    </div>
                  </div>

                  {/* Sync Result Banner */}
                  {syncResult && (
                    <div className="rounded-xl bg-[#e6f4ea] border border-[#ceead6] p-3.5 text-xs text-[#137333] space-y-1.5">
                      <div className="flex items-center gap-2 font-bold">
                        <Check className="h-4 w-4" />
                        <span>Đồng bộ thành công!</span>
                      </div>
                      <p>
                        Đã cập nhật <strong>{syncResult.synced_phases} Phase</strong> và <strong>{syncResult.synced_milestones} Cột mốc</strong> vào lịch <em>"{syncResult.calendar_name}"</em>.
                      </p>
                      <a
                        href={syncResult.calendar_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[#0b57d0] underline font-semibold mt-1"
                      >
                        <span>Xem trên Google Calendar ngay</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                /* NOT CONNECTED: VISUAL STEP-BY-STEP SETUP GUIDE */
                <div className="space-y-4">
                  <div className="rounded-2xl border border-[#dadce0] bg-[#f8fafd] p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#1f1f1f] flex items-center gap-1.5">
                        <Sparkles className="h-4 w-4 text-[#0b57d0]" />
                        <span>Hướng dẫn thiết lập Google API (Chỉ mất 2 phút)</span>
                      </span>
                      <a
                        href="https://console.cloud.google.com/projectcreate"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-semibold text-[#0b57d0] hover:underline flex items-center gap-1"
                      >
                        <span>Mở Google Cloud Console</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>

                    {/* Step-by-step numbered instructions */}
                    <div className="space-y-2.5 text-xs text-[#3c4043]">
                      <div className="flex items-start gap-2.5 bg-white p-2.5 rounded-xl border border-[#e5e7eb]">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#c2e7ff] text-[#001d35] font-bold text-[11px]">
                          1
                        </span>
                        <div>
                          <strong>Tạo dự án mới:</strong> Vào <a href="https://console.cloud.google.com/projectcreate" target="_blank" rel="noreferrer" className="text-[#0b57d0] underline">Google Cloud Console</a> và đặt tên dự án (ví dụ: <code>Chronomind-Local</code>).
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5 bg-white p-2.5 rounded-xl border border-[#e5e7eb]">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#c2e7ff] text-[#001d35] font-bold text-[11px]">
                          2
                        </span>
                        <div>
                          <strong>Bật Google Calendar API:</strong> Truy cập <a href="https://console.cloud.google.com/apis/library/calendar-json.googleapis.com" target="_blank" rel="noreferrer" className="text-[#0b57d0] underline">Google Calendar API Library</a> và bấm <strong>Enable (Bật)</strong>.
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5 bg-white p-2.5 rounded-xl border border-[#e5e7eb]">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#c2e7ff] text-[#001d35] font-bold text-[11px]">
                          3
                        </span>
                        <div>
                          <strong>Màn hình đồng ý OAuth (OAuth consent screen):</strong> Chọn <em>External</em> &gt; Điền App name <code>Chronomind</code> &gt; Thêm chính email của bạn vào danh sách <em>Test users</em>.
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5 bg-white p-2.5 rounded-xl border border-[#e5e7eb]">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#c2e7ff] text-[#001d35] font-bold text-[11px]">
                          4
                        </span>
                        <div className="space-y-1.5 w-full">
                          <div>
                            <strong>Tạo OAuth Client ID:</strong> Vào <em>Credentials</em> &gt; <em>Create Credentials</em> &gt; <em>OAuth client ID</em> &gt; Loại: <strong>Web application</strong>.
                          </div>
                          <div className="flex items-center justify-between gap-2 bg-[#f0f4f9] px-2.5 py-1.5 rounded-lg border border-[#dadce0]">
                            <span className="text-[11px] text-[#5f6368] truncate">
                              Authorized redirect URI: <code className="font-mono text-[#0b57d0]">{redirectUri}</code>
                            </span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(redirectUri, "uri")}
                              className="text-xs font-semibold text-[#0b57d0] hover:text-[#0842a0] shrink-0 flex items-center gap-1"
                            >
                              {copiedText === "uri" ? <Check className="h-3.5 w-3.5 text-[#137333]" /> : <Copy className="h-3.5 w-3.5" />}
                              <span>{copiedText === "uri" ? "Đã chép" : "Sao chép"}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Form to paste Client ID & Client Secret */}
                  <div className="rounded-2xl border border-[#dadce0] bg-white p-4 space-y-3.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#1f1f1f]">
                        Bước 5: Nhập thông tin xác thực
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowJsonInput(!showJsonInput)}
                        className="text-[11px] font-semibold text-[#0b57d0] hover:underline"
                      >
                        {showJsonInput ? "Nhập từng trường" : "Hoặc dán toàn bộ file credentials.json"}
                      </button>
                    </div>

                    {showJsonInput ? (
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold text-[#5f6368]">
                          Nội dung file credentials.json (Tải từ Google Cloud):
                        </label>
                        <textarea
                          rows={4}
                          value={jsonInput}
                          onChange={(e) => handleJsonCredentialsParse(e.target.value)}
                          placeholder='{"web":{"client_id":"...","client_secret":"..."}}'
                          className="w-full text-xs font-mono p-2.5 rounded-xl border border-[#dadce0] focus:border-[#0b57d0] focus:ring-1 focus:ring-[#0b57d0] outline-none"
                        />
                        {clientId && (
                          <span className="text-[11px] text-[#137333] flex items-center gap-1 font-medium">
                            <Check className="h-3.5 w-3.5" /> Đã trích xuất Client ID thành công!
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-semibold text-[#5f6368] block">
                              Client ID:
                            </label>
                            {clientId.includes(".apps.googleusercontent.com") && (
                              <span className="text-[10px] text-[#137333] font-semibold flex items-center gap-1">
                                <Check className="h-3 w-3" /> Định dạng Client ID hợp lệ
                              </span>
                            )}
                          </div>
                          <input
                            type="text"
                            value={clientId}
                            onChange={(e) => setClientId(e.target.value)}
                            placeholder="xxxxxxxxx.apps.googleusercontent.com"
                            className="w-full text-xs p-2.5 rounded-xl border border-[#dadce0] focus:border-[#0b57d0] focus:ring-1 focus:ring-[#0b57d0] outline-none font-mono"
                          />
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-semibold text-[#5f6368] block">
                              Client Secret:
                            </label>
                            {clientSecret.trim().length >= 10 && (
                              <span className="text-[10px] text-[#137333] font-semibold flex items-center gap-1">
                                <Check className="h-3 w-3" /> Đã nhập Secret
                              </span>
                            )}
                          </div>
                          <input
                            type="password"
                            value={clientSecret}
                            onChange={(e) => setClientSecret(e.target.value)}
                            placeholder="GOCSPX-xxxxxxxxxxxxxxxx"
                            className="w-full text-xs p-2.5 rounded-xl border border-[#dadce0] focus:border-[#0b57d0] focus:ring-1 focus:ring-[#0b57d0] outline-none font-mono"
                          />
                        </div>

                        {/* Helper tip banner */}
                        <div className="rounded-xl bg-[#f0f4f9] p-3 text-[11px] text-[#444746] flex items-start gap-2 border border-[#dadce0]">
                          <Sparkles className="h-4 w-4 text-[#0b57d0] shrink-0 mt-0.5" />
                          <div className="leading-relaxed">
                            <strong>Mẹo tiết kiệm thời gian:</strong> Nếu không muốn tạo dự án trên Google Cloud, bạn chỉ cần chuyển sang tab <strong>"Thêm nhanh (1-Click / .ics)"</strong> để tải file hoặc đẩy từng giai đoạn lên Google Calendar ngay tức thì với 0 bước cài đặt!
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="pt-2">
                      <button
                        onClick={handleSaveAndConnect}
                        disabled={isSavingConfig}
                        className="w-full flex items-center justify-center gap-2 rounded-full bg-[#0b57d0] hover:bg-[#0842a0] disabled:bg-[#80868b] text-white py-2.5 text-xs font-semibold shadow-xs transition-all"
                      >
                        <Sparkles className="h-4 w-4" />
                        <span>{isSavingConfig ? "Đang xử lý..." : "Lưu & Bắt đầu Đăng nhập Google"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[#e5e7eb] bg-[#f8fafd] flex justify-end">
          <button
            onClick={onClose}
            className="rounded-full border border-[#dadce0] bg-white px-5 py-2 text-xs font-semibold text-[#3c4043] hover:bg-[#f1f3f4] transition-all"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
