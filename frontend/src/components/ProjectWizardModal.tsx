"use client";

import React, { useState } from "react";
import { X, Clock, Zap, Wrench, Loader2, Sparkles, ArrowRight } from "lucide-react";
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
            <div className="mb-5 pb-3 border-b border-[#f1f3f4]">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#0b57d0] mb-1">
                <Sparkles className="h-4 w-4" /> AI FEASIBILITY & TIMELINE PLANNER
              </div>
              <h2 className="text-xl font-bold text-[#1f1f1f]">Khởi Tạo Kế Hoạch Dự Án</h2>
              <p className="text-xs text-[#5f6368] mt-0.5">
                Nhập ý tưởng sơ bộ. AI sẽ tính độ khó, rủi ro tiềm ẩn và tự động chia nhỏ các giai đoạn.
              </p>
            </div>

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
    </div>
  );
};
