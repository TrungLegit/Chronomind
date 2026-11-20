"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Clock,
  Zap,
  Wrench,
  Loader2,
  Sparkles,
  ArrowRight,
  RotateCcw,
  UploadCloud,
  FileSpreadsheet,
  FileText,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Layers,
  FileCheck2,
  FolderUp,
  FolderArchive,
  Trash2,
  Plus,
} from "lucide-react";
import { ProjectCreateInput } from "@/types";
import { api } from "@/services/api";

interface ProjectWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProjectCreateInput) => Promise<void>;
}

const TEMPLATES = [
  {
    title: "Trạm quan trắc vườn thông minh IoT",
    desc: "Sử dụng vi điều khiển ESP32 và cảm biến đất để đo độ ẩm, nhiệt độ, kết nối MQTT đẩy dữ liệu lên Dashboard web và tự động kích hoạt máy bơm mini qua relay.",
    goal: "Hệ thống tưới tự động hoạt động ổn định 30 ngày dùng pin",
    hours: 12,
    skill: "Intermediate",
    tools: "Mỏ hàn, ESP32, Relay 5V, Laptop Ubuntu",
  },
  {
    title: "Ứng dụng SaaS Tóm tắt Video Youtube bằng AI",
    desc: "Xây dựng Web app cho phép paste link Youtube, trích xuất transcript, gọi Gemini API tóm tắt thành bullet points và cho phép export ra Notion/PDF.",
    goal: "Website MVP có thanh toán Stripe và tóm tắt dưới 15 giây",
    hours: 15,
    skill: "Intermediate",
    tools: "Next.js, FastAPI, Supabase, Gemini API",
  },
  {
    title: "Nghiên cứu & Huấn luyện Model Nhận diện Biển số xe",
    desc: "Xây dựng pipeline thu thập dữ liệu ảnh xe máy/ô tô tại Việt Nam, fine-tune mô hình YOLOv8, tối ưu hóa chạy realtime trên Raspberry Pi hoặc Jetson Nano.",
    goal: "Độ chính xác mAP > 92% với tốc độ xử lý > 25 FPS",
    hours: 20,
    skill: "Advanced",
    tools: "Python, PyTorch, GPU RTX 3060, Raspberry Pi 4",
  },
];

export const ProjectWizardModal: React.FC<ProjectWizardModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [creationMode, setCreationMode] = useState<"ideation" | "import">("ideation");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetGoal, setTargetGoal] = useState("");
  const [hoursPerWeek, setHoursPerWeek] = useState(12);
  const [skillLevel, setSkillLevel] = useState("Intermediate");
  const [toolsResources, setToolsResources] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [hasDraft, setHasDraft] = useState(false);

  // File import state (supports multiple files, folders, and .zip)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsedPlan, setParsedPlan] = useState<any | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const isSupportedFile = (file: File) => {
    const ext = file.name.toLowerCase();
    return (
      ext.endsWith(".xlsx") ||
      ext.endsWith(".xls") ||
      ext.endsWith(".csv") ||
      ext.endsWith(".docx") ||
      ext.endsWith(".txt") ||
      ext.endsWith(".md") ||
      ext.endsWith(".zip") ||
      ext.endsWith(".json")
    );
  };

  const handleFilesAdded = (incoming: FileList | File[]) => {
    const valid: File[] = [];
    const list = Array.from(incoming);
    for (const f of list) {
      if (isSupportedFile(f) && !selectedFiles.some((ex) => ex.name === f.name && ex.size === f.size)) {
        valid.push(f);
      }
    }
    if (valid.length === 0 && list.length > 0) {
      setParseError("Không tìm thấy tệp hợp lệ (.xlsx, .docx, .csv, .txt, .md, .zip). Vui lòng kiểm tra lại định dạng tệp.");
      return;
    }
    const updated = [...selectedFiles, ...valid];
    setSelectedFiles(updated);
    setParseError(null);
    setParsedPlan(null);
    // Automatically trigger analysis for seamless experience
    executeAnalysis(updated);
  };

  const handleRemoveFile = (index: number) => {
    const updated = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(updated);
    if (updated.length === 0) {
      setParsedPlan(null);
    } else {
      executeAnalysis(updated);
    }
  };

  const executeAnalysis = async (filesToAnalyze: File[]) => {
    if (!filesToAnalyze || filesToAnalyze.length === 0) return;
    setIsParsingFile(true);
    setParseError(null);

    try {
      const result = await api.parsePlanFiles(filesToAnalyze, hoursPerWeek, skillLevel);
      setParsedPlan(result);
      // Auto fill form fields
      if (result.title) setTitle(result.title);
      if (result.description) setDescription(result.description);
      if (result.target_goal) setTargetGoal(result.target_goal);
      if (result.tools_resources) setToolsResources(result.tools_resources);
    } catch (err: any) {
      console.error("Parse plan file error:", err);
      setParseError(err.message || "Không thể phân tích các tệp đã tải lên. Vui lòng thử lại.");
    } finally {
      setIsParsingFile(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesAdded(e.dataTransfer.files);
    }
  };

  // Load saved draft on open
  useEffect(() => {
    if (!isOpen) return;

    try {
      const local = localStorage.getItem("chronomind_wizard_draft");
      if (local) {
        const parsed = JSON.parse(local);
        if (parsed.title || parsed.description) {
          setTitle(parsed.title || "");
          setDescription(parsed.description || "");
          setTargetGoal(parsed.target_goal || "");
          setHoursPerWeek(parsed.available_hours_per_week || 12);
          setSkillLevel(parsed.skill_level || "Intermediate");
          setToolsResources(parsed.tools_resources || "");
          setHasDraft(true);
          return;
        }
      }
    } catch (e) {
      // Ignore
    }

    // Try backend draft if local is empty
    api.getDraft().then((draft) => {
      if (draft && (draft.title || draft.description)) {
        setTitle(draft.title || "");
        setDescription(draft.description || "");
        setTargetGoal(draft.target_goal || "");
        setHoursPerWeek(draft.available_hours_per_week || 12);
        setSkillLevel(draft.skill_level || "Intermediate");
        setToolsResources(draft.tools_resources || "");
        setHasDraft(true);
      }
    });
  }, [isOpen]);

  // Auto-save draft on changes (debounced)
  useEffect(() => {
    if (!isOpen || loading) return;

    const draftData = {
      title,
      description,
      target_goal: targetGoal,
      available_hours_per_week: hoursPerWeek,
      skill_level: skillLevel,
      tools_resources: toolsResources,
      updated_at: new Date().toISOString(),
    };

    const timer = setTimeout(() => {
      try {
        localStorage.setItem("chronomind_wizard_draft", JSON.stringify(draftData));
        api.saveDraft(draftData);
      } catch (e) {
        // Ignore
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [title, description, targetGoal, hoursPerWeek, skillLevel, toolsResources, isOpen, loading]);

  const handleClearDraft = () => {
    setTitle("");
    setDescription("");
    setTargetGoal("");
    setHoursPerWeek(12);
    setSkillLevel("Intermediate");
    setToolsResources("");
    setHasDraft(false);
    try {
      localStorage.removeItem("chronomind_wizard_draft");
      api.clearDraft();
    } catch (e) {}
  };

  if (!isOpen) return null;

  const loadingSteps = [
    "Khởi tạo AI Project Manager & đọc hiểu ý tưởng của bạn...",
    "Tính toán độ khó kiến trúc & đối chiếu quỹ thời gian...",
    "Rà soát các điểm mù kỹ thuật (phần cứng, bug, bảo mật, API)...",
    "Thiết lập Checklist Chuẩn Bị (Prerequisites) tiền dự án...",
    "Phân rã giai đoạn WBS & thiết lập lịch trình động...",
  ];

  const handleApplyTemplate = (tpl: typeof TEMPLATES[0]) => {
    setTitle(tpl.title);
    setDescription(tpl.desc);
    setTargetGoal(tpl.goal);
    setHoursPerWeek(tpl.hours);
    setSkillLevel(tpl.skill);
    setToolsResources(tpl.tools);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setLoading(true);
    setLoadingStep(0);

    const interval = setInterval(() => {
      setLoadingStep((prev) => (prev < loadingSteps.length - 1 ? prev + 1 : prev));
    }, 1100);

    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        target_goal: targetGoal || undefined,
        available_hours_per_week: hoursPerWeek,
        skill_level: skillLevel,
        tools_resources: toolsResources || undefined,
        imported_plan: parsedPlan?.ai_analysis || undefined,
      });
      clearInterval(interval);
      // Clear draft upon successful project creation
      try {
        localStorage.removeItem("chronomind_wizard_draft");
        api.clearDraft();
      } catch (e) {}
      onClose();
    } catch (err: any) {
      clearInterval(interval);
      alert(err.message || "Có lỗi xảy ra khi phân tích dự án.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-xl rounded-3xl border border-[#e5e7eb] bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute right-4 top-4 rounded-full p-2 text-[#5f6368] hover:bg-[#f1f3f4] hover:text-[#1f1f1f] transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {loading ? (
          <div className="py-12 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eaf1fb] text-[#0b57d0]">
              <Loader2 className="h-7 w-7 animate-spin" />
            </div>

            <div>
              <h3 className="text-base font-bold text-[#1f1f1f]">
                AI ĐANG PHÂN RÃ KẾ HOẠCH DỰ ÁN...
              </h3>
              <p className="text-xs text-[#5f6368] mt-1">
                Tự động tối ưu hóa lộ trình dựa trên quỹ thời gian rảnh của bạn
              </p>
            </div>

            <div className="mx-auto max-w-sm space-y-2.5 text-left pt-2">
              {loadingSteps.map((step, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-2.5 text-xs transition-colors ${
                    idx === loadingStep
                      ? "text-[#0b57d0] font-semibold"
                      : idx < loadingStep
                      ? "text-[#137333]"
                      : "text-[#80868b]"
                  }`}
                >
                  <span className="shrink-0 font-bold">
                    {idx < loadingStep ? "✓" : idx === loadingStep ? "›" : "•"}
                  </span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-4 pb-3 border-b border-[#f1f3f4]">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#0b57d0] mb-1">
                <Sparkles className="h-4 w-4" /> AI FEASIBILITY & TIMELINE PLANNER
              </div>
              <h2 className="text-xl font-bold text-[#1f1f1f]">Khởi Tạo Kế Hoạch Dự Án</h2>
              <p className="text-xs text-[#5f6368] mt-0.5">
                Lập kế hoạch thông minh từ ý tưởng sơ bộ hoặc nhập trực tiếp từ tài liệu Excel, Word đã có sẵn.
              </p>
            </div>

            {/* Segmented Mode Switcher */}
            <div className="flex rounded-2xl bg-[#f0f4f9] p-1 mb-4">
              <button
                type="button"
                onClick={() => setCreationMode("ideation")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-xl transition-all ${
                  creationMode === "ideation"
                    ? "bg-white text-[#0b57d0] shadow-xs"
                    : "text-[#5f6368] hover:text-[#1f1f1f]"
                }`}
              >
                <Sparkles className="h-4 w-4" />
                <span>Ý tưởng sơ bộ (AI Planner)</span>
              </button>

              <button
                type="button"
                onClick={() => setCreationMode("import")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-xl transition-all ${
                  creationMode === "import"
                    ? "bg-white text-[#0b57d0] shadow-xs"
                    : "text-[#5f6368] hover:text-[#1f1f1f]"
                }`}
              >
                <UploadCloud className="h-4 w-4" />
                <span>Nhập file kế hoạch có sẵn</span>
                <span className="rounded-full bg-[#e6f4ea] text-[#137333] px-1.5 py-0.5 text-[10px] font-bold">
                  Excel / Word
                </span>
              </button>
            </div>

            {/* TAB 2: IMPORT PLAN FROM FILE(S) OR FOLDER */}
            {creationMode === "import" ? (
              <div className="space-y-4">
                {/* Hidden File and Folder Inputs */}
                <input
                  type="file"
                  ref={fileInputRef}
                  multiple
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleFilesAdded(e.target.files);
                    }
                  }}
                  accept=".xlsx,.xls,.csv,.docx,.txt,.md,.zip,.json"
                  className="hidden"
                />

                <input
                  type="file"
                  ref={folderInputRef}
                  multiple
                  {...({ webkitdirectory: "", directory: "" } as any)}
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleFilesAdded(e.target.files);
                    }
                  }}
                  className="hidden"
                />

                {/* Drag & Drop Zone */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
                    isDragOver
                      ? "border-[#0b57d0] bg-[#eaf1fb]"
                      : "border-[#dadce0] bg-[#f8fafd] hover:bg-[#f0f4f9]"
                  }`}
                >
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white border border-[#dadce0] text-[#0b57d0] shadow-xs mb-3">
                    <UploadCloud className="h-6 w-6" />
                  </div>
                  <h4 className="text-sm font-bold text-[#1f1f1f]">
                    Kéo thả nhiều file, file nén (.zip) hoặc cả thư mục vào đây
                  </h4>
                  <p className="text-xs text-[#5f6368] mt-1 max-w-sm mx-auto">
                    Hệ thống sẽ tự động đọc, gộp và tổng hợp các Phase, Task, Milestone từ toàn bộ tài liệu của bạn thành 1 kế hoạch duy nhất.
                  </p>

                  {/* 2 Primary Selection Buttons */}
                  <div className="flex items-center justify-center gap-2.5 mt-4">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1.5 rounded-full bg-[#0b57d0] hover:bg-[#0842a0] text-white px-4 py-2 text-xs font-semibold shadow-xs transition-all"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Chọn file(s) / .ZIP</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => folderInputRef.current?.click()}
                      className="flex items-center gap-1.5 rounded-full border border-[#dadce0] bg-white hover:bg-[#f0f4f9] text-[#1f1f1f] px-4 py-2 text-xs font-semibold shadow-xs transition-all"
                    >
                      <FolderUp className="h-3.5 w-3.5 text-[#0b57d0]" />
                      <span>Chọn cả Thư mục (Folder)</span>
                    </button>
                  </div>

                  {/* Badges */}
                  <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
                    <span className="inline-flex items-center gap-1 rounded-lg bg-white border border-[#dadce0] px-2.5 py-1 text-[11px] font-medium text-[#1e8e3e]">
                      <FileSpreadsheet className="h-3.5 w-3.5 text-[#1e8e3e]" />
                      <span>Excel (.xlsx, .csv)</span>
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-lg bg-white border border-[#dadce0] px-2.5 py-1 text-[11px] font-medium text-[#1a73e8]">
                      <FileText className="h-3.5 w-3.5 text-[#1a73e8]" />
                      <span>Word (.docx)</span>
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-lg bg-white border border-[#dadce0] px-2.5 py-1 text-[11px] font-medium text-[#9333ea]">
                      <FolderArchive className="h-3.5 w-3.5 text-[#9333ea]" />
                      <span>Thư mục nén (.zip)</span>
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-lg bg-white border border-[#dadce0] px-2.5 py-1 text-[11px] font-medium text-[#5f6368]">
                      <FileCode className="h-3.5 w-3.5 text-[#5f6368]" />
                      <span>Ghi chú (.txt, .md)</span>
                    </span>
                  </div>
                </div>

                {/* Selected Files Chips List */}
                {selectedFiles.length > 0 && (
                  <div className="bg-white rounded-2xl border border-[#dadce0] p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#1f1f1f] flex items-center gap-1.5">
                        <FolderUp className="h-4 w-4 text-[#0b57d0]" />
                        <span>Danh sách tài liệu đã chọn ({selectedFiles.length} tệp):</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedFiles([])}
                        className="text-[11px] text-[#b3261e] hover:underline font-medium"
                      >
                        Xóa tất cả
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1">
                      {selectedFiles.map((f, idx) => {
                        const ext = f.name.toLowerCase();
                        let IconComponent = FileCode;
                        let iconColor = "text-[#5f6368]";
                        if (ext.endsWith(".xlsx") || ext.endsWith(".csv")) {
                          IconComponent = FileSpreadsheet;
                          iconColor = "text-[#1e8e3e]";
                        } else if (ext.endsWith(".docx")) {
                          IconComponent = FileText;
                          iconColor = "text-[#1a73e8]";
                        } else if (ext.endsWith(".zip")) {
                          IconComponent = FolderArchive;
                          iconColor = "text-[#9333ea]";
                        }

                        const sizeKb = Math.round(f.size / 1024) || 1;

                        return (
                          <div
                            key={idx}
                            className="inline-flex items-center gap-1.5 bg-[#f8fafd] border border-[#dadce0] rounded-xl px-2.5 py-1.5 text-xs text-[#1f1f1f] max-w-xs truncate"
                          >
                            <IconComponent className={`h-3.5 w-3.5 shrink-0 ${iconColor}`} />
                            <span className="truncate font-medium">{f.name}</span>
                            <span className="text-[10px] text-[#5f6368] shrink-0">({sizeKb} KB)</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveFile(idx)}
                              className="h-4 w-4 rounded-full flex items-center justify-center text-[#5f6368] hover:bg-[#fad2cf] hover:text-[#b3261e] shrink-0 ml-1 transition-colors"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Parsing Status Loader */}
                {isParsingFile && (
                  <div className="rounded-2xl border border-[#c2e7ff] bg-[#eaf1fb] p-5 text-center space-y-3">
                    <Loader2 className="h-6 w-6 animate-spin text-[#0b57d0] mx-auto" />
                    <div>
                      <h4 className="text-sm font-bold text-[#001d35]">
                        Đang đọc và tổng hợp {selectedFiles.length} tài liệu bằng AI...
                      </h4>
                      <p className="text-xs text-[#5f6368] mt-0.5">
                        Tự động đồng bộ hóa các Phase, Task, Milestone và loại bỏ trùng lặp...
                      </p>
                    </div>
                  </div>
                )}

                {/* Parse Error Banner */}
                {parseError && (
                  <div className="rounded-2xl border border-[#f9dedc] bg-[#fdf2f2] p-4 text-xs text-[#b3261e] flex items-start gap-2.5">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <div>
                      <strong>Không thể phân tích file:</strong> {parseError}
                    </div>
                  </div>
                )}

                {/* Parsed Result Card */}
                {parsedPlan && (
                  <div className="rounded-2xl border border-[#ceead6] bg-[#f8fafd] p-4 space-y-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e6f4ea] text-[#137333]">
                          <FileCheck2 className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-[#1f1f1f]">
                            {parsedPlan.title || "Kế hoạch đã được trích xuất"}
                          </h4>
                          <p className="text-xs text-[#5f6368]">
                            Đã tổng hợp từ: <strong>{parsedPlan.total_files_count || selectedFiles.length} tệp tài liệu</strong>
                          </p>
                        </div>
                      </div>

                      <span className="rounded-full bg-[#e6f4ea] text-[#137333] border border-[#ceead6] text-[11px] font-bold px-2.5 py-1 shrink-0">
                        Độ khó: {parsedPlan.ai_analysis?.complexity_score || 6.5}/10
                      </span>
                    </div>

                    <p className="text-xs text-[#3c4043] bg-white p-3 rounded-xl border border-[#dadce0] leading-relaxed">
                      {parsedPlan.description}
                    </p>

                    {/* Breakdown Metrics */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-white p-2 rounded-xl border border-[#dadce0]">
                        <span className="text-base font-bold text-[#0b57d0]">
                          {parsedPlan.ai_analysis?.phases?.length || 0}
                        </span>
                        <span className="block text-[10px] text-[#5f6368]">Giai đoạn (Phase)</span>
                      </div>
                      <div className="bg-white p-2 rounded-xl border border-[#dadce0]">
                        <span className="text-base font-bold text-[#137333]">
                          {parsedPlan.ai_analysis?.phases?.reduce(
                            (acc: number, p: any) => acc + (p.tasks?.length || 0),
                            0
                          ) || 0}
                        </span>
                        <span className="block text-[10px] text-[#5f6368]">Công việc (Tasks)</span>
                      </div>
                      <div className="bg-white p-2 rounded-xl border border-[#dadce0]">
                        <span className="text-base font-bold text-[#b06000]">
                          {parsedPlan.ai_analysis?.prerequisites?.length || 0}
                        </span>
                        <span className="block text-[10px] text-[#5f6368]">Mục chuẩn bị</span>
                      </div>
                    </div>

                    {/* Extracted Phases List Preview */}
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {parsedPlan.ai_analysis?.phases?.map((p: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-[#e5e7eb] text-xs"
                        >
                          <div className="flex items-center gap-2 truncate pr-2">
                            <span className="font-bold text-[#0b57d0] text-[11px] shrink-0">
                              Phase {p.phase_number}
                            </span>
                            <span className="font-medium text-[#1f1f1f] truncate">{p.title}</span>
                          </div>
                          <span className="text-[11px] text-[#5f6368] shrink-0">
                            {p.tasks?.length || 0} tasks ({p.estimated_hours}h)
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="pt-2 flex items-center justify-between gap-3 border-t border-[#dadce0]">
                      <button
                        type="button"
                        onClick={() => setCreationMode("ideation")}
                        className="text-xs font-semibold text-[#0b57d0] hover:underline"
                      >
                        Chỉnh sửa thêm thông tin &rarr;
                      </button>

                      <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex items-center gap-2 rounded-full bg-[#0b57d0] hover:bg-[#0842a0] text-white px-5 py-2.5 text-xs font-semibold shadow-xs hover:shadow-md transition-all"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Tạo Dự Án Ngay Từ File Này</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* TAB 1: MANUAL IDEATION WITH TEMPLATES */
              <div>
                {/* Notice if parsed plan is currently active */}
                {parsedPlan && (
                  <div className="flex items-center justify-between bg-[#e6f4ea] border border-[#ceead6] text-[#137333] rounded-xl px-3.5 py-2 text-xs mb-4">
                    <span className="flex items-center gap-1.5 font-medium">
                      <FileCheck2 className="h-3.5 w-3.5 text-[#137333]" />
                      <span>
                        Đang áp dụng kế hoạch từ {selectedFiles.length > 1 ? `${selectedFiles.length} tệp tài liệu` : (selectedFiles[0]?.name || "tài liệu kế hoạch")}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setParsedPlan(null);
                        setSelectedFiles([]);
                      }}
                      className="text-[#b3261e] hover:underline font-semibold ml-2 cursor-pointer"
                    >
                      Bỏ file
                    </button>
                  </div>
                )}

            {/* Auto-saved draft restore notification */}
            {hasDraft && (
              <div className="flex items-center justify-between bg-[#eaf1fb] border border-[#c2e7ff] text-[#001d35] rounded-xl px-3.5 py-2 text-xs mb-4">
                <span className="flex items-center gap-1.5 font-medium">
                  <RotateCcw className="h-3.5 w-3.5 text-[#0b57d0]" />
                  <span>Đã khôi phục nội dung bạn đang nhập dở trước đó</span>
                </span>
                <button
                  type="button"
                  onClick={handleClearDraft}
                  className="text-[#0b57d0] hover:underline font-semibold ml-2 cursor-pointer"
                >
                  Xóa nháp
                </button>
              </div>
            )}

            {/* Quick Templates */}
            <div className="mb-4 rounded-2xl border border-[#e5e7eb] bg-[#f8fafd] p-3">
              <span className="text-xs font-semibold text-[#5f6368] block mb-2">
                💡 Gợi ý mẫu nhanh (Bấm để điền):
              </span>
              <div className="flex flex-wrap gap-2">
                {TEMPLATES.map((t, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyTemplate(t)}
                    className="rounded-full border border-[#dadce0] bg-white px-3 py-1 text-xs font-medium text-[#3c4043] hover:border-[#0b57d0] hover:text-[#0b57d0] hover:bg-[#eaf1fb] transition-all"
                  >
                    {t.title}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#1f1f1f] mb-1">
                  Tên dự án <span className="text-[#ea4335]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Chronomind - AI Dynamic Project Planner"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full h-10 rounded-xl border border-[#dadce0] bg-white px-3.5 text-sm text-[#1f1f1f] placeholder-[#80868b] focus:border-[#0b57d0] focus:outline-none focus:ring-2 focus:ring-[#0b57d0]/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1f1f1f] mb-1">
                  Mô tả ý tưởng & phạm vi dự án <span className="text-[#ea4335]">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Mô tả những gì bạn muốn làm, công nghệ dự kiến, hoặc ý tưởng sơ khai..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-[#dadce0] bg-white p-3.5 text-sm text-[#1f1f1f] placeholder-[#80868b] focus:border-[#0b57d0] focus:outline-none focus:ring-2 focus:ring-[#0b57d0]/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1f1f1f] mb-1">
                  Mục tiêu đầu ra cụ thể (Definition of Done)
                </label>
                <input
                  type="text"
                  placeholder="VD: Mạch chạy ổn định 30 ngày dùng pin hoặc Web app MVP có 3 tính năng chính"
                  value={targetGoal}
                  onChange={(e) => setTargetGoal(e.target.value)}
                  className="w-full h-10 rounded-xl border border-[#dadce0] bg-white px-3.5 text-sm text-[#1f1f1f] placeholder-[#80868b] focus:border-[#0b57d0] focus:outline-none focus:ring-2 focus:ring-[#0b57d0]/20 transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-[#1f1f1f]">
                      Quỹ thời gian rảnh
                    </label>
                    <span className="text-xs font-bold text-[#0b57d0] bg-[#eaf1fb] px-2.5 py-0.5 rounded-full">
                      {hoursPerWeek} giờ / tuần
                    </span>
                  </div>
                  <input
                    type="range"
                    min={2}
                    max={50}
                    step={1}
                    value={hoursPerWeek}
                    onChange={(e) => setHoursPerWeek(Number(e.target.value))}
                    className="w-full accent-[#0b57d0] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-[#5f6368]">
                    <span>Part-time (5h)</span>
                    <span>Tập trung (15h)</span>
                    <span>Full-time (40h)</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1f1f1f] mb-1">
                    Trình độ hiện tại
                  </label>
                  <select
                    value={skillLevel}
                    onChange={(e) => setSkillLevel(e.target.value)}
                    className="w-full h-10 rounded-xl border border-[#dadce0] bg-white px-3 text-sm text-[#1f1f1f] focus:border-[#0b57d0] focus:outline-none focus:ring-2 focus:ring-[#0b57d0]/20 transition-all"
                  >
                    <option value="Beginner">Người mới bắt đầu (Beginner)</option>
                    <option value="Intermediate">Có kinh nghiệm cơ bản (Intermediate)</option>
                    <option value="Advanced">Thành thạo / Chuyên nghiệp (Advanced)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1f1f1f] mb-1">
                  Công cụ & Thiết bị hiện có
                </label>
                <input
                  type="text"
                  placeholder="VD: Laptop Mac M1, tài khoản Vercel, mỏ hàn chì..."
                  value={toolsResources}
                  onChange={(e) => setToolsResources(e.target.value)}
                  className="w-full h-10 rounded-xl border border-[#dadce0] bg-white px-3.5 text-sm text-[#1f1f1f] placeholder-[#80868b] focus:border-[#0b57d0] focus:outline-none focus:ring-2 focus:ring-[#0b57d0]/20 transition-all"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#f1f3f4]">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full px-4 py-2 text-xs font-semibold text-[#5f6368] hover:bg-[#f1f3f4] transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 rounded-full bg-[#0b57d0] hover:bg-[#0842a0] px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:shadow-md transition-all"
                >
                  <span>Phân tích & Lập Kế Hoạch AI</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    )}
  </div>
</div>
  );
};
