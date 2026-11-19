"use client";

import React, { useState } from "react";
import { Download, FileSpreadsheet, FileText, ChevronDown } from "lucide-react";
import { api } from "@/services/api";

interface ExportMenuProps {
  projectId: string;
  projectTitle: string;
}

export const ExportMenu: React.FC<ExportMenuProps> = ({ projectId }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleDownload = (type: "excel" | "word") => {
    const url = type === "excel" ? api.getExportExcelUrl(projectId) : api.getExportWordUrl(projectId);
    window.location.href = url;
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex h-8 items-center gap-1.5 rounded-md border border-white/[0.08] bg-[#121824] px-3 font-mono text-xs text-slate-200 hover:bg-white/[0.06] transition-colors shadow-xs"
      >
        <Download className="h-3.5 w-3.5 text-blue-400" />
        <span>Xuất Báo Cáo</span>
        <ChevronDown className="h-3 w-3 text-slate-500" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-1.5 w-60 rounded-md border border-white/[0.1] bg-[#0d111a] p-1.5 shadow-xl z-40">
            <span className="px-2 py-1 font-mono text-[10px] uppercase font-semibold text-slate-500 block">
              ĐỊNH DẠNG TẢI VỀ
            </span>

            <button
              onClick={() => handleDownload("excel")}
              className="flex w-full items-center gap-2.5 rounded px-2 py-2 text-xs text-left text-slate-200 hover:bg-white/[0.06] hover:text-emerald-400 transition-colors"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-400 shrink-0" />
              <div>
                <strong className="block font-medium text-xs">Excel WBS (.xlsx)</strong>
                <span className="text-[10px] text-slate-400">Bảng phân rã công việc & tô màu tiến độ</span>
              </div>
            </button>

            <button
              onClick={() => handleDownload("word")}
              className="flex w-full items-center gap-2.5 rounded px-2 py-2 text-xs text-left text-slate-200 hover:bg-white/[0.06] hover:text-blue-400 transition-colors"
            >
              <FileText className="h-4 w-4 text-blue-400 shrink-0" />
              <div>
                <strong className="block font-medium text-xs">Word Report (.docx)</strong>
                <span className="text-[10px] text-slate-400">Báo cáo tình trạng dự án chuẩn chỉnh</span>
              </div>
            </button>
          </div>
        </>
      )}
    </div>
  );
};
