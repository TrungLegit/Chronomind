"use client";

import React, { useState } from "react";
import {
  Download,
  FileSpreadsheet,
  FileText,
  Calendar,
  ChevronDown,
  Headphones,
  ExternalLink,
  Sparkles,
  Check,
  X,
} from "lucide-react";
import { api } from "@/services/api";

interface ExportMenuProps {
  projectId: string;
  projectTitle: string;
}

export const ExportMenu: React.FC<ExportMenuProps> = ({ projectId, projectTitle }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showNotebookLMGuide, setShowNotebookLMGuide] = useState(false);

  const handleDownload = (type: "excel" | "word" | "ics" | "notebooklm") => {
    let url = "";
    if (type === "excel") url = api.getExportExcelUrl(projectId);
    else if (type === "word") url = api.getExportWordUrl(projectId);
    else if (type === "ics") url = api.getExportIcsUrl(projectId);
    else if (type === "notebooklm") {
      url = api.getExportNotebookLMUrl(projectId);
      setShowNotebookLMGuide(true);
    }

    window.location.href = url;
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-full border border-[#dadce0] bg-white px-4 py-2 text-xs font-semibold text-[#3c4043] hover:bg-[#f8fafd] hover:border-[#bdc1c6] shadow-xs transition-all"
      >
        <Download className="h-4 w-4 text-[#0b57d0]" />
        <span>Xuất Báo Cáo</span>
        <ChevronDown className="h-3.5 w-3.5 text-[#5f6368]" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-[#dadce0] bg-white p-2 shadow-xl z-40">
            <span className="px-3 py-1.5 text-[11px] font-bold text-[#5f6368] block">
              ĐỊNH DẠNG TẢI XUỐNG
            </span>

            {/* Excel WBS */}
            <button
              onClick={() => handleDownload("excel")}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs text-left text-[#1f1f1f] hover:bg-[#e6f4ea] transition-all"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e6f4ea] text-[#0f9d58] shrink-0 border border-[#ceead6]">
                <FileSpreadsheet className="h-4 w-4" />
              </div>
              <div>
                <strong className="block font-semibold text-[#1f1f1f]">Excel WBS (.xlsx)</strong>
                <span className="text-[11px] text-[#5f6368]">Kế hoạch chi tiết & tô màu tiến độ</span>
              </div>
            </button>

            {/* Word Report */}
            <button
              onClick={() => handleDownload("word")}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs text-left text-[#1f1f1f] hover:bg-[#eaf1fb] transition-all"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#eaf1fb] text-[#1a73e8] shrink-0 border border-[#c2e7ff]">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <strong className="block font-semibold text-[#1f1f1f]">Word Report (.docx)</strong>
                <span className="text-[11px] text-[#5f6368]">Báo cáo tổng kết dự án hoàn chỉnh</span>
              </div>
            </button>

            {/* iCalendar */}
            <button
              onClick={() => handleDownload("ics")}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs text-left text-[#1f1f1f] hover:bg-[#fef7e0] transition-all"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#fef7e0] text-[#b06000] shrink-0 border border-[#feefc3]">
                <Calendar className="h-4 w-4" />
              </div>
              <div>
                <strong className="block font-semibold text-[#1f1f1f]">Lịch iCalendar (.ics)</strong>
                <span className="text-[11px] text-[#5f6368]">Import vào Google Calendar & Apple/Outlook</span>
              </div>
            </button>

            {/* Google NotebookLM Source */}
            <div className="border-t border-[#f1f3f4] my-1" />

            <button
              onClick={() => handleDownload("notebooklm")}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs text-left text-[#1f1f1f] hover:bg-[#f3e8fd] transition-all"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f3e8fd] text-[#9333ea] shrink-0 border border-[#e9d5ff]">
                <Headphones className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <strong className="font-semibold text-[#1f1f1f]">Google NotebookLM (.md)</strong>
                  <span className="rounded-full bg-[#f3e8fd] text-[#9333ea] text-[10px] px-1.5 py-0.2 font-bold">
                    AI Podcast
                  </span>
                </div>
                <span className="text-[11px] text-[#5f6368]">Tạo Audio Overview 2 người đàm thoại</span>
              </div>
            </button>
          </div>
        </>
      )}

      {/* MODAL HƯỚNG DẪN NOTEBOOKLM AUDIO OVERVIEW */}
      {showNotebookLMGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-3xl border border-[#dadce0] bg-white p-6 shadow-2xl space-y-4">
            <button
              onClick={() => setShowNotebookLMGuide(false)}
              className="absolute right-4 top-4 rounded-full p-2 text-[#5f6368] hover:bg-[#f1f3f4] transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f3e8fd] text-[#9333ea] border border-[#e9d5ff]">
                <Headphones className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#1f1f1f]">Đã Tải Tệp Nguồn NotebookLM!</h3>
                <p className="text-xs text-[#5f6368]">
                  Dự án: <strong className="text-[#1f1f1f]">{projectTitle}</strong>
                </p>
              </div>
            </div>

            <p className="text-xs text-[#444746] leading-relaxed">
              Tệp Markdown vừa tải đã được tối ưu hóa sẵn cấu trúc Briefing Doc, bảng WBS, các rủi ro kỹ thuật và câu hỏi thảo luận để nạp vào Google NotebookLM.
            </p>

            {/* 3 Steps Guide */}
            <div className="space-y-2 bg-[#f8fafd] p-3.5 rounded-2xl border border-[#dadce0] text-xs text-[#3c4043]">
              <div className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#c2e7ff] text-[#001d35] font-bold text-[11px]">
                  1
                </span>
                <div>
                  Truy cập <strong><a href="https://notebooklm.google.com" target="_blank" rel="noreferrer" className="text-[#0b57d0] underline">notebooklm.google.com</a></strong> và bấm <em>"Tạo sổ tay mới"</em>.
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#c2e7ff] text-[#001d35] font-bold text-[11px]">
                  2
                </span>
                <div>
                  Kéo thả tệp <code>.md</code> vừa tải xuống vào phần <strong>Sources (Tài liệu nguồn)</strong>.
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#c2e7ff] text-[#001d35] font-bold text-[11px]">
                  3
                </span>
                <div>
                  Ở góc phải, bấm nút <strong>"Generate" (Tạo Audio Overview)</strong> để nghe 2 người dẫn chương trình AI thảo luận chuyên sâu về dự án của bạn!
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between gap-3">
              <a
                href="https://notebooklm.google.com"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 rounded-full bg-[#9333ea] hover:bg-[#7e22ce] text-white px-5 py-2.5 text-xs font-semibold shadow-xs transition-all"
              >
                <span>Mở Google NotebookLM</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>

              <button
                onClick={() => setShowNotebookLMGuide(false)}
                className="rounded-full border border-[#dadce0] bg-white px-4 py-2 text-xs font-semibold text-[#3c4043] hover:bg-[#f1f3f4] transition-all"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
