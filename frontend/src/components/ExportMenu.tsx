"use client";

import React, { useState } from "react";
import { Download, FileSpreadsheet, FileText, Calendar, ChevronDown } from "lucide-react";
import { api } from "@/services/api";

interface ExportMenuProps {
  projectId: string;
  projectTitle: string;
}

export const ExportMenu: React.FC<ExportMenuProps> = ({ projectId }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleDownload = (type: "excel" | "word" | "ics") => {
    let url = "";
    if (type === "excel") url = api.getExportExcelUrl(projectId);
    else if (type === "word") url = api.getExportWordUrl(projectId);
    else if (type === "ics") url = api.getExportIcsUrl(projectId);

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
          <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-[#dadce0] bg-white p-2 shadow-xl z-40">
            <span className="px-3 py-1.5 text-[11px] font-bold text-[#5f6368] block">
              ĐỊNH DẠNG TẢI XUỐNG
            </span>

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
          </div>
        </>
      )}
    </div>
  );
};
