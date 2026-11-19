"use client";

import React, { useState } from "react";
import { Sparkles, X, BrainCircuit, Clock, Zap, Wrench, AlertCircle, Loader2 } from "lucide-react";
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
    "Khởi tạo AI Project Manager & đọc hiểu ý tưởng...",
    "Đánh giá độ khó kỹ thuật & đối chiếu trình độ người dùng...",
    "Rà soát các điểm mù (Blind spots), rủi ro mua sắm & debug...",
    "Thiết lập Checklist Chuẩn bị (Prerequisites) tiền dự án...",
    "Tự động chia Phases & thiết lập cấu trúc WBS tối ưu...",
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

    // Step animation timer
    const interval = setInterval(() => {
      setLoadingStep((prev) => (prev < loadingSteps.length - 1 ? prev + 1 : prev));
    }, 1200);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        {loading ? (
          <div className="py-12 text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600/20 text-indigo-400">
              <BrainCircuit className="h-8 w-8 animate-pulse text-indigo-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">AI Project Manager Đang Phân Tích...</h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto mb-8">
              Hệ thống đang cấu trúc hóa ý tưởng của bạn thành lộ trình khả thi với các điểm mù cần chú ý.
            </p>

            <div className="mx-auto max-w-md space-y-3 text-left">
              {loadingSteps.map((step, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-3 text-xs transition-all ${
                    idx === loadingStep
                      ? "text-indigo-400 font-semibold"
                      : idx < loadingStep
                      ? "text-emerald-400"
                      : "text-slate-600"
                  }`}
                >
                  {idx < loadingStep ? (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                      ✓
                    </span>
                  ) : idx === loadingStep ? (
                    <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
                  ) : (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-slate-500">
                      {idx + 1}
                    </span>
                  )}
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-6">
              <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
                <Sparkles className="h-4 w-4" /> AI Project & Feasibility Analyzer
              </div>
              <h2 className="text-2xl font-bold text-white">Khởi Tạo & Lập Kế Hoạch Dự Án</h2>
              <p className="text-sm text-slate-400">
                Nhập ý tưởng của bạn (kể cả sơ khai). AI sẽ tính toán độ khó, rủi ro tiềm ẩn và chia nhỏ lộ trình.
              </p>
            </div>

            {/* Quick Templates */}
            <div className="mb-6 rounded-xl border border-slate-800 bg-slate-950/50 p-3">
              <span className="text-xs font-medium text-slate-400 block mb-2">Gợi ý mẫu nhanh (Click để điền):</span>
              <div className="flex flex-wrap gap-2">
                {TEMPLATES.map((t, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyTemplate(t)}
                    className="rounded-lg border border-slate-700 bg-slate-800/60 px-2.5 py-1 text-xs text-slate-300 transition hover:border-indigo-500 hover:bg-indigo-950/40 hover:text-white"
                  >
                    💡 {t.title}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tên dự án <span className="text-pink-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Chronomind - AI Project Planner"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Mô tả ý tưởng & phạm vi dự án <span className="text-pink-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Mô tả những gì bạn muốn làm, công nghệ dự kiến, hoặc ý tưởng sơ bộ..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Mục tiêu đầu ra cụ thể (Target Goal / Definition of Done)
                </label>
                <input
                  type="text"
                  placeholder="VD: Bản demo hoạt động có 3 tính năng chính, có video 2 phút demo"
                  value={targetGoal}
                  onChange={(e) => setTargetGoal(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Work capacity & skill */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-indigo-400" /> Quỹ thời gian rảnh / tuần
                    </label>
                    <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                      {hoursPerWeek} giờ/tuần
                    </span>
                  </div>
                  <input
                    type="range"
                    min={2}
                    max={50}
                    step={1}
                    value={hoursPerWeek}
                    onChange={(e) => setHoursPerWeek(Number(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                    <span>Part-time (5h)</span>
                    <span>Tập trung (15h)</span>
                    <span>Full-time (40h)</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5 text-amber-400" /> Trình độ của bạn
                  </label>
                  <select
                    value={skillLevel}
                    onChange={(e) => setSkillLevel(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="Beginner">Người mới bắt đầu (Beginner - Cần học nhiều)</option>
                    <option value="Intermediate">Đã có kinh nghiệm cơ bản (Intermediate)</option>
                    <option value="Advanced">Thành thạo / Chuyên nghiệp (Advanced)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Wrench className="h-3.5 w-3.5 text-slate-400" /> Công cụ, thiết bị & tài nguyên hiện có
                </label>
                <input
                  type="text"
                  placeholder="VD: Laptop Mac M1, tài khoản Vercel, chưa có board mạch hay server"
                  value={toolsResources}
                  onChange={(e) => setToolsResources(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:from-indigo-500 hover:to-violet-500"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Phân tích & Lập Kế Hoạch AI</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
