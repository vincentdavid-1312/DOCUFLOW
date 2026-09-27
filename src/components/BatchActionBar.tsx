import React from 'react';
import {
  Trash2,
  Minimize2,
  ArrowRightLeft,
  Sparkles,
  Bot,
  X,
  Layers,
  CheckSquare,
  FileCheck2,
} from 'lucide-react';
import { AppDocument } from '../types/document';

interface BatchActionBarProps {
  selectedDocs: AppDocument[];
  onClearSelection: () => void;
  onOpenBulkDelete: () => void;
  onOpenBatchCompress: () => void;
  onOpenBatchConvert: () => void;
  onOpenBatchOcr: () => void;
  onOpenAiChat: () => void;
}

export const BatchActionBar: React.FC<BatchActionBarProps> = ({
  selectedDocs,
  onClearSelection,
  onOpenBulkDelete,
  onOpenBatchCompress,
  onOpenBatchConvert,
  onOpenBatchOcr,
  onOpenAiChat,
}) => {
  if (selectedDocs.length === 0) return null;

  const totalBytes = selectedDocs.reduce((acc, d) => acc + (d.sizeBytes || 0), 0);
  const totalKb = (totalBytes / 1024).toFixed(0);

  return (
    <div className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="bg-slate-900/95 backdrop-blur-md border border-indigo-500/40 shadow-2xl shadow-indigo-950/60 rounded-2xl p-2.5 sm:p-3 flex items-center justify-between gap-2">
        {/* Selection Count Pill */}
        <div className="flex items-center gap-2 pl-1 sm:pl-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
            <CheckSquare className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs sm:text-sm font-bold text-white">
                {selectedDocs.length} {selectedDocs.length === 1 ? 'Doc' : 'Docs'}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                {totalKb} KB
              </span>
            </div>
            <span className="text-[10px] text-slate-400 hidden xs:inline">Batch Actions Ready</span>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {/* Ask AI Copilot */}
          <button
            onClick={onOpenAiChat}
            className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-purple-900/30 transition active:scale-95"
            title="Ask Gemini Chatbot about selected documents"
          >
            <Bot className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ask AI</span>
          </button>

          {/* Batch Compress */}
          <button
            onClick={onOpenBatchCompress}
            className="flex items-center gap-1 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 hover:text-white text-xs font-medium transition active:scale-95"
            title="Batch Compress PDFs"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Compress</span>
          </button>

          {/* Batch Convert / Merge */}
          <button
            onClick={onOpenBatchConvert}
            className="flex items-center gap-1 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-indigo-300 hover:text-white text-xs font-medium transition active:scale-95"
            title="Batch Convert or Merge into Single PDF"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Convert / Merge</span>
          </button>

          {/* Batch OCR */}
          <button
            onClick={onOpenBatchOcr}
            className="flex items-center gap-1 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 hover:text-white text-xs font-medium transition active:scale-95"
            title="Run Deep OCR on selected scans"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">OCR</span>
          </button>

          {/* Bulk Delete */}
          <button
            onClick={onOpenBulkDelete}
            className="p-2 sm:px-2.5 sm:py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 hover:text-red-300 text-xs font-medium transition active:scale-95"
            title="Delete Selected Documents"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {/* Clear Selection */}
          <button
            onClick={onClearSelection}
            className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition"
            title="Clear Selection"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
