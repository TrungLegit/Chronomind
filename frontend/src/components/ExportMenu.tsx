"use client";

import React, { useState } from "react";
import { Download, FileSpreadsheet, FileText, ChevronDown, Check } from "lucide-react";
import { api } from "@/services/api";

interface ExportMenuProps {
  projectId: string;
  projectTitle: string;
}

export const ExportMenu: React.FC<ExportMenuProps> = ({ projectId, projectTitle }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownload = (type: "excel" | "word") => {
    setDownloading(type);
    const url = type === "excel" ? api.getExportExcelUrl(projectId) : api.getExportWordUrl(projectId);
    window.location.href = url;
    setTimeout(() => {
      setDownloading(null);
      setIsOpen(false);
    }, 1500);
  };

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-xl bg-slate-800 border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition shadow-sm"
      >
        <Download className="h-4 w-4 text-indigo-400" />
        <span>Xuất Báo Cáo & WBS</span>
        <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-800 bg-slate-900 p-2 shadow-2xl z-40 animate-in fade-in zoom-in-95">
            <div className="px-3 py-2 border-b border-slate-800 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Định dạng xuất báo cáo
              </span>
            </div>

            <button
              onClick={() => handleDownload("excel")}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-xs text-left text-slate-200 hover:bg-slate-800 hover:text-emerald-400 transition"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <FileSpreadsheet className="h-4 w-4" />
              </div>
              <div>
                <strong className="block font-semibold">Bảng kế hoạch Excel (.xlsx)</strong>
                <span className="text-[10px] text-slate-400">WBS, thời gian, conditional format màu sắc</span>
              </div>
            </button>

            <button
              onClick={() => handleDownload("word")}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-xs text-left text-slate-200 hover:bg-slate-800 hover:text-blue-400 transition"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <strong className="block font-semibold">Báo cáo Word (.docx)</strong>
                <span className="text-[10px] text-slate-400">Status report hoàn chỉnh, AI review & bảng biểu</span>
              </div>
            </button>
          </div>
        </>
      )}
    </div>
  );
};
