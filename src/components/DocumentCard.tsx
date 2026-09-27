import React from 'react';
import {
  FileText,
  Sparkles,
  Minimize2,
  ArrowRightLeft,
  Download,
  Trash2,
  CloudCheck,
  PenTool,
  Clock,
  Layers,
  Check,
  Square,
  CheckSquare,
  Paperclip,
} from 'lucide-react';
import { AppDocument } from '../types/document';
import { downloadBlob } from '../utils/pdfEngine';

interface DocumentCardProps {
  document: AppDocument;
  isSelected?: boolean;
  isBatchMode?: boolean;
  onToggleSelect?: (doc: AppDocument) => void;
  onOpenEditor: (doc: AppDocument) => void;
  onOpenOcr: (doc: AppDocument) => void;
  onOpenCompress: (doc: AppDocument) => void;
  onOpenConvert: (doc: AppDocument) => void;
  onOpenAttachments?: (doc: AppDocument) => void;
  onDeleteDocument: (id: string) => void;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({
  document: doc,
  isSelected = false,
  isBatchMode = false,
  onToggleSelect,
  onOpenEditor,
  onOpenOcr,
  onOpenCompress,
  onOpenConvert,
  onOpenAttachments,
  onDeleteDocument,
}) => {
  const thumbnail = doc.pages[0]?.dataUrl;
  const sizeKb = (doc.sizeBytes / 1024).toFixed(1);
  const attachmentsCount = doc.attachments?.length || 0;

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'invoices':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'contracts':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'notes':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default:
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
    }
  };

  const handleCardClick = () => {
    if (isBatchMode && onToggleSelect) {
      onToggleSelect(doc);
    } else {
      onOpenEditor(doc);
    }
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (doc.pdfDataUri) {
      const base64Data = doc.pdfDataUri.replace(/^data:application\/pdf;base64,/, '');
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      downloadBlob(bytes, doc.name);
    } else if (doc.pages.length > 0) {
      const a = window.document.createElement('a');
      a.href = doc.pages[0].dataUrl;
      a.download = doc.name;
      a.click();
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className={`group relative bg-slate-900 border rounded-2xl p-3.5 transition-all cursor-pointer flex flex-col justify-between ${
        isSelected
          ? 'border-indigo-500 ring-2 ring-indigo-500/40 bg-slate-900/90 shadow-lg shadow-indigo-500/10'
          : 'border-slate-800 hover:border-slate-700 hover:shadow-md hover:shadow-indigo-500/5'
      }`}
    >
      <div>
        {/* Thumbnail Preview Area */}
        <div className="relative aspect-[3/4] w-full rounded-xl bg-slate-950 overflow-hidden mb-3 border border-slate-800/80 group-hover:border-slate-700 transition">
          {thumbnail ? (
            <img
              src={thumbnail}
              alt={doc.name}
              className="w-full h-full object-cover transition transform group-hover:scale-102"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-600">
              <FileText className="w-10 h-10 mb-1" />
              <span className="text-[10px]">No Preview</span>
            </div>
          )}

          {/* Top Overlays: Batch Checkbox or Edit overlay */}
          <div className="absolute top-2 left-2 flex items-center gap-1.5">
            {/* Batch Selection Checkbox */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onToggleSelect) onToggleSelect(doc);
              }}
              className={`w-6 h-6 rounded-lg flex items-center justify-center transition shadow-md ${
                isSelected
                  ? 'bg-indigo-600 text-white ring-2 ring-indigo-400'
                  : isBatchMode
                  ? 'bg-slate-900/90 border border-slate-700 text-slate-400 hover:text-white hover:border-indigo-500'
                  : 'bg-slate-900/70 opacity-0 group-hover:opacity-100 border border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
              title={isSelected ? 'Deselect Document' : 'Select Document'}
            >
              {isSelected ? (
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              ) : (
                <Square className="w-3.5 h-3.5 opacity-60" />
              )}
            </button>

            {/* Cloud Sync indicator */}
            {doc.isCloudSynced && (
              <span
                className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center backdrop-blur-xs border border-emerald-500/30"
                title="Synced across devices"
              >
                <CloudCheck className="w-3 h-3" />
              </span>
            )}
          </div>

          {/* Badges on right side */}
          <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
            {/* Attachment indicator badge */}
            {attachmentsCount > 0 && (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  if (onOpenAttachments) onOpenAttachments(doc);
                }}
                className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-indigo-950/90 border border-indigo-500/40 text-indigo-300 text-[10px] font-semibold backdrop-blur-xs hover:bg-indigo-900 transition"
                title={`${attachmentsCount} attachment(s) attached`}
              >
                <Paperclip className="w-3 h-3" />
                <span>{attachmentsCount}</span>
              </span>
            )}

            {/* OCR Badge */}
            {doc.ocrData && (
              <span
                className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-purple-950/90 border border-purple-500/40 text-purple-300 text-[10px] font-semibold backdrop-blur-xs"
                title={`OCR Processed (${doc.ocrData.confidenceScore}% confidence)`}
              >
                <Sparkles className="w-2.5 h-2.5 text-purple-400" />
                <span>OCR</span>
              </span>
            )}
          </div>

          {/* Bottom hover bar for quick editor open */}
          <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between">
            <span className="text-[10px] font-medium text-indigo-300 flex items-center gap-1">
              <PenTool className="w-3 h-3" />
              <span>Edit PDF &bull; Sign</span>
            </span>
            <span className="text-[9px] text-slate-400">
              {new Date(doc.updatedAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Title & Metadata */}
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-1">
            <span
              className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border ${getCategoryBadgeClass(
                doc.category
              )}`}
            >
              {doc.category}
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-400">
                {doc.pageCount} {doc.pageCount === 1 ? 'pg' : 'pgs'}
              </span>
              <span className="text-slate-600">&bull;</span>
              <span className="text-[10px] font-mono text-slate-400">{sizeKb} KB</span>
            </div>
          </div>

          <h4
            className={`text-xs font-bold truncate transition-colors ${
              isSelected ? 'text-indigo-300' : 'text-slate-100 group-hover:text-indigo-300'
            }`}
            title={doc.name}
          >
            {doc.name}
          </h4>

          {doc.ocrData && (
            <p className="text-[11px] text-slate-400 line-clamp-1 italic">
              {doc.ocrData.summary}
            </p>
          )}
        </div>
      </div>

      {/* Action Buttons Toolbar */}
      <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-1">
        <div className="flex items-center gap-0.5 sm:gap-1">
          {/* Attachments */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onOpenAttachments) onOpenAttachments(doc);
            }}
            className={`p-1.5 rounded-lg transition ${
              attachmentsCount > 0
                ? 'text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title={`Attachments (${attachmentsCount})`}
          >
            <Paperclip className="w-3.5 h-3.5" />
          </button>

          {/* Deep OCR */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenOcr(doc);
            }}
            className="p-1.5 rounded-lg text-purple-400 hover:text-white hover:bg-purple-600/20 transition"
            title="Gemini 3.1 Pro High Thinking OCR"
          >
            <Sparkles className="w-3.5 h-3.5" />
          </button>

          {/* Compress */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenCompress(doc);
            }}
            className="p-1.5 rounded-lg text-cyan-400 hover:text-white hover:bg-cyan-600/20 transition"
            title="Compress PDF"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>

          {/* Convert */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenConvert(doc);
            }}
            className="p-1.5 rounded-lg text-indigo-400 hover:text-white hover:bg-indigo-600/20 transition"
            title="Convert Format"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
          </button>

          {/* Download */}
          <button
            onClick={handleDownload}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Download File"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Delete */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDeleteDocument(doc.id);
          }}
          className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition"
          title="Delete Document"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
