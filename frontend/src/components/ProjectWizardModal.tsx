"use client";

import React, { useState } from "react";
import { X, Clock, Zap, Wrench, Loader2, Terminal, ArrowRight } from "lucide-react";
import { ProjectCreateInput } from "@/types";

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
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetGoal, setTargetGoal] = useState("");
  const [hoursPerWeek, setHoursPerWeek] = useState(12);
  const [skillLevel, setSkillLevel] = useState("Intermediate");
  const [toolsResources, setToolsResources] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);

  if (!isOpen) return null;

  const loadingSteps = [
    "Khởi tạo AI Project Engine & phân tích ngữ cảnh ý tưởng...",
    "Tính toán độ khó kiến trúc & đối chiếu năng lực người dùng...",
    "Rà soát các điểm mù kỹ thuật (phần cứng, bug, bảo mật, API)...",
    "Thiết lập Checklist Chuẩn Bị (Prerequisites) tiền dự án...",
    "Phân rã giai đoạn WBS & gán Milestone theo mô hình BabyAGI...",
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
        title,
        description,
        target_goal: targetGoal || undefined,
        available_hours_per_week: hoursPerWeek,
        skill_level: skillLevel,
        tools_resources: toolsResources || undefined,
      });
      clearInterval(interval);
      onClose();
    } catch (err: any) {
      clearInterval(interval);
      alert(err.message || "Có lỗi xảy ra khi phân tích dự án.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-xl rounded-lg border border-white/[0.1] bg-[#0d111a] p-5 shadow-xl max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute right-3.5 top-3.5 rounded p-1 text-slate-400 hover:bg-white/[0.06] hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        {loading ? (
          <div className="py-10 text-center space-y-4">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-md border border-blue-500/30 bg-blue-500/10 text-blue-400">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>

            <div>
              <h3 className="font-mono text-sm font-semibold text-slate-100">
                AI ENGINE ĐANG PHÂN RÃ DỰ ÁN...
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                BabyAGI-inspired task prioritization & dynamic phasing
              </p>
            </div>

            <div className="mx-auto max-w-sm space-y-2 text-left pt-2">
              {loadingSteps.map((step, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-2 font-mono text-[11px] transition-colors ${
                    idx === loadingStep
                      ? "text-blue-400 font-medium"
                      : idx < loadingStep
                      ? "text-emerald-400"
                      : "text-slate-600"
                  }`}
                >
                  <span className="shrink-0">
                    {idx < loadingStep ? "✓" : idx === loadingStep ? "›" : "·"}
                  </span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-4 pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-blue-400 font-semibold mb-1">
                <Terminal className="h-3.5 w-3.5" /> AI FEASIBILITY & WBS BUILDER
              </div>
              <h2 className="text-lg font-bold text-slate-100">Khởi Tạo & Phân Rã Dự Án</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Nhập ý tưởng sơ bộ. AI sẽ tính độ khó, rủi ro tiềm ẩn và chia nhỏ các giai đoạn.
              </p>
            </div>

            {/* Quick Templates */}
            <div className="mb-4 rounded border border-white/[0.06] bg-[#090d16] p-2.5">
              <span className="font-mono text-[10px] uppercase font-semibold text-slate-400 block mb-1.5">
                Mẫu thử nghiệm nhanh:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {TEMPLATES.map((t, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyTemplate(t)}
                    className="rounded border border-white/[0.08] bg-[#121824] px-2 py-1 font-mono text-[11px] text-slate-300 hover:border-blue-500/50 hover:text-white transition-colors"
                  >
                    {t.title}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block font-mono text-[11px] font-semibold text-slate-300 mb-1">
                  TÊN DỰ ÁN <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Chronomind - AI Dynamic Project Planner"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-8.5 w-full rounded-md border border-white/[0.08] bg-[#121824] px-3 text-xs text-slate-100 placeholder:text-slate-500 shadow-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/40"
                />
              </div>

              <div>
                <label className="block font-mono text-[11px] font-semibold text-slate-300 mb-1">
                  MÔ TẢ Ý TƯỞNG & PHẠM VI <span className="text-rose-400">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Mô tả những gì bạn muốn làm, công nghệ dự kiến, hoặc ý tưởng sơ bộ..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-md border border-white/[0.08] bg-[#121824] p-3 text-xs text-slate-100 placeholder:text-slate-500 shadow-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/40"
                />
              </div>

              <div>
                <label className="block font-mono text-[11px] font-semibold text-slate-300 mb-1">
                  MỤC TIÊU ĐẦU RA (DEFINITION OF DONE)
                </label>
                <input
                  type="text"
                  placeholder="VD: Mạch hoạt động ổn định 30 ngày dùng pin hoặc Web MVP có 3 tính năng"
                  value={targetGoal}
                  onChange={(e) => setTargetGoal(e.target.value)}
                  className="h-8.5 w-full rounded-md border border-white/[0.08] bg-[#121824] px-3 text-xs text-slate-100 placeholder:text-slate-500 shadow-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/40"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-mono text-[11px] font-semibold text-slate-300">
                      QUỸ THỜI GIAN RẢNH
                    </label>
                    <span className="font-mono text-[11px] font-bold text-blue-400 tabular-nums">
                      {hoursPerWeek}h / tuần
                    </span>
                  </div>
                  <input
                    type="range"
                    min={2}
                    max={50}
                    step={1}
                    value={hoursPerWeek}
                    onChange={(e) => setHoursPerWeek(Number(e.target.value))}
                    className="w-full accent-blue-500 cursor-pointer"
                  />
                  <div className="flex justify-between font-mono text-[9px] text-slate-500">
                    <span>Part-time (5h)</span>
                    <span>Nghiêm túc (15h)</span>
                    <span>Full-time (40h)</span>
                  </div>
                </div>

                <div>
                  <label className="block font-mono text-[11px] font-semibold text-slate-300 mb-1">
                    TRÌNH ĐỘ KỸ THUẬT
                  </label>
                  <select
                    value={skillLevel}
                    onChange={(e) => setSkillLevel(e.target.value)}
                    className="h-8.5 w-full rounded-md border border-white/[0.08] bg-[#121824] px-2.5 text-xs text-slate-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/40"
                  >
                    <option value="Beginner">Người mới bắt đầu (Beginner)</option>
                    <option value="Intermediate">Có kinh nghiệm cơ bản (Intermediate)</option>
                    <option value="Advanced">Thành thạo / Chuyên gia (Advanced)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-mono text-[11px] font-semibold text-slate-300 mb-1">
                  CÔNG CỤ & TÀI NGUYÊN HIỆN CÓ
                </label>
                <input
                  type="text"
                  placeholder="VD: Laptop Linux, mỏ hàn, tài khoản Vercel..."
                  value={toolsResources}
                  onChange={(e) => setToolsResources(e.target.value)}
                  className="h-8.5 w-full rounded-md border border-white/[0.08] bg-[#121824] px-3 text-xs text-slate-100 placeholder:text-slate-500 shadow-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/40"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={onClose}
                  className="h-8 rounded-md px-3 text-xs font-mono text-slate-400 hover:bg-white/[0.06] hover:text-white transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="inline-flex h-8 items-center gap-1.5 rounded-md bg-blue-600 px-3.5 text-xs font-medium text-white shadow-xs hover:bg-blue-500 transition-colors"
                >
                  <span>Phân tích & Lập Kế Hoạch AI</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
