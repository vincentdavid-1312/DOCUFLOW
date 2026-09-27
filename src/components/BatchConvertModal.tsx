import React, { useState } from 'react';
import {
  X,
  ArrowRightLeft,
  Layers,
  FileText,
  Download,
  CheckCircle2,
  FileCheck2,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { AppDocument } from '../types/document';
import {
  mergeMultipleDocuments,
  uint8ArrayToDataUri,
  downloadBlob,
} from '../utils/pdfEngine';

interface BatchConvertModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDocs: AppDocument[];
  onAddConvertedDocument: (doc: AppDocument) => void;
}

export const BatchConvertModal: React.FC<BatchConvertModalProps> = ({
  isOpen,
  onClose,
  selectedDocs,
  onAddConvertedDocument,
}) => {
  const [convertMode, setConvertMode] = useState<'merge_pdf' | 'consolidated_md' | 'export_images'>('merge_pdf');
  const [mergedTitle, setMergedTitle] = useState(`DocuFlow_Binder_${new Date().toISOString().slice(0, 10)}`);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const totalPages = selectedDocs.reduce((acc, d) => acc + (d.pageCount || 1), 0);

  const handleExecuteBatchConvert = async () => {
    setIsProcessing(true);
    setSuccessMessage(null);

    try {
      if (convertMode === 'merge_pdf') {
        const mergedBytes = await mergeMultipleDocuments(selectedDocs, mergedTitle);
        const dataUri = uint8ArrayToDataUri(mergedBytes, 'application/pdf');

        // Collect all pages for preview
        const allPages = selectedDocs.flatMap((d) => d.pages);

        const newDoc: AppDocument = {
          id: `merged-${Date.now()}`,
          name: `${mergedTitle.endsWith('.pdf') ? mergedTitle : `${mergedTitle}.pdf`}`,
          category: 'pdfs',
          type: 'pdf',
          sizeBytes: mergedBytes.byteLength,
          updatedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          pageCount: allPages.length,
          pages: allPages,
          pdfDataUri: dataUri,
          annotations: [],
          tags: ['merged', 'binder'],
          isCloudSynced: false,
          deviceId: 'local',
        };

        onAddConvertedDocument(newDoc);
        downloadBlob(mergedBytes, newDoc.name, 'application/pdf');
        setSuccessMessage(`Merged ${selectedDocs.length} documents (${allPages.length} pages) into "${newDoc.name}"!`);
      } else if (convertMode === 'consolidated_md') {
        // Generate consolidated Markdown summary & text dossier
        let mdContent = `# ${mergedTitle}\n\n`;
        mdContent += `*Generated on ${new Date().toLocaleString()} by DocuFlow Batch Studio*\n`;
        mdContent += `*Includes ${selectedDocs.length} documents, ${totalPages} total pages*\n\n`;
        mdContent += `## Table of Contents\n\n`;

        selectedDocs.forEach((d, idx) => {
          mdContent += `${idx + 1}. **${d.name}** (${d.category.toUpperCase()}, ${d.pageCount} pages)\n`;
        });
        mdContent += `\n---\n\n`;

        selectedDocs.forEach((d, idx) => {
          mdContent += `## Document ${idx + 1}: ${d.name}\n\n`;
          mdContent += `- **Category**: ${d.category}\n`;
          mdContent += `- **Pages**: ${d.pageCount}\n`;
          mdContent += `- **Size**: ${(d.sizeBytes / 1024).toFixed(1)} KB\n\n`;

          if (d.ocrData) {
            mdContent += `### Executive Summary\n${d.ocrData.summary}\n\n`;
            if (d.ocrData.entities?.length > 0) {
              mdContent += `### Key Extracted Entities\n`;
              d.ocrData.entities.forEach((ent) => {
                mdContent += `- **${ent.label}**: ${ent.value}\n`;
              });
              mdContent += `\n`;
            }
            mdContent += `### Full Extracted Content\n\n${d.ocrData.extractedText}\n\n`;
          } else {
            mdContent += `*No OCR transcribed text available for this document scan.*\n\n`;
          }
          mdContent += `---\n\n`;
        });

        const blob = new Blob([mdContent], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${mergedTitle}.md`;
        a.click();
        URL.revokeObjectURL(url);
        setSuccessMessage(`Exported consolidated Markdown dossier for ${selectedDocs.length} documents!`);
      } else if (convertMode === 'export_images') {
        // Export each page as image
        let exportedCount = 0;
        for (const doc of selectedDocs) {
          doc.pages.forEach((page, pIdx) => {
            const a = document.createElement('a');
            a.href = page.dataUrl;
            a.download = `${doc.name.replace(/\.[^/.]+$/, '')}_pg${pIdx + 1}.jpg`;
            a.click();
            exportedCount++;
          });
        }
        setSuccessMessage(`Downloaded ${exportedCount} high-resolution image pages!`);
      }
    } catch (err: any) {
      console.error('Batch convert error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Batch Conversion &amp; Merge</h3>
              <p className="text-xs text-slate-400">
                Transform {selectedDocs.length} documents ({totalPages} pages)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* Conversion Mode Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => setConvertMode('merge_pdf')}
              className={`p-3.5 rounded-2xl border text-left transition ${
                convertMode === 'merge_pdf'
                  ? 'bg-indigo-600/15 border-indigo-500 text-white shadow-md shadow-indigo-500/10'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <Layers className="w-5 h-5 text-indigo-400 mb-2" />
              <span className="text-xs font-bold block text-white">Merge to 1 PDF</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Combine all pages into one binder
              </span>
            </button>

            <button
              type="button"
              onClick={() => setConvertMode('consolidated_md')}
              className={`p-3.5 rounded-2xl border text-left transition ${
                convertMode === 'consolidated_md'
                  ? 'bg-purple-600/15 border-purple-500 text-white shadow-md shadow-purple-500/10'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <FileText className="w-5 h-5 text-purple-400 mb-2" />
              <span className="text-xs font-bold block text-white">Export Markdown</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Consolidated text &amp; summaries
              </span>
            </button>

            <button
              type="button"
              onClick={() => setConvertMode('export_images')}
              className={`p-3.5 rounded-2xl border text-left transition ${
                convertMode === 'export_images'
                  ? 'bg-amber-600/15 border-amber-500 text-white shadow-md shadow-amber-500/10'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <Download className="w-5 h-5 text-amber-400 mb-2" />
              <span className="text-xs font-bold block text-white">Export Images</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                All pages as JPEG image assets
              </span>
            </button>
          </div>

          {/* Title Input */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
              Output File Name
            </label>
            <input
              type="text"
              value={mergedTitle}
              onChange={(e) => setMergedTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
            />
          </div>

          {/* Selected Documents Checklist */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
              Files Included in Order ({selectedDocs.length})
            </label>
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {selectedDocs.map((doc, idx) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-5 h-5 rounded-md bg-slate-800 text-slate-400 flex items-center justify-center font-mono text-[10px]">
                      {idx + 1}
                    </span>
                    <span className="font-medium text-slate-200 truncate max-w-[260px]">
                      {doc.name}
                    </span>
                  </div>
                  <span className="text-slate-400 text-[11px] whitespace-nowrap">
                    {doc.pageCount} {doc.pageCount === 1 ? 'page' : 'pages'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Success Feedback */}
          {successMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2.5 text-xs text-emerald-300">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleExecuteBatchConvert}
            disabled={isProcessing}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/25 transition flex items-center gap-1.5 disabled:opacity-50"
          >
            {isProcessing ? (
              <span>Processing Conversion...</span>
            ) : (
              <>
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>
                  {convertMode === 'merge_pdf'
                    ? 'Merge & Download Master PDF'
                    : convertMode === 'consolidated_md'
                    ? 'Download Consolidated Markdown'
                    : 'Download All Images'}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
