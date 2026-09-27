import React, { useState, useRef } from 'react';
import {
  Paperclip,
  X,
  Upload,
  File,
  FileText,
  Image as ImageIcon,
  Download,
  Trash2,
  ExternalLink,
  Plus,
  Check,
  Eye,
} from 'lucide-react';
import { AppDocument, DocAttachment } from '../types/document';

interface DocumentAttachmentsModalProps {
  document: AppDocument | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateDocument: (updated: AppDocument) => void;
}

export const DocumentAttachmentsModal: React.FC<DocumentAttachmentsModalProps> = ({
  document: doc,
  isOpen,
  onClose,
  onUpdateDocument,
}) => {
  if (!isOpen || !doc) return null;

  const [attachments, setAttachments] = useState<DocAttachment[]>(doc.attachments || []);
  const [previewAttachment, setPreviewAttachment] = useState<DocAttachment | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadSuccess(null);
    const newItems: DocAttachment[] = [];

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const newAttachment: DocAttachment = {
          id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: file.name,
          type: file.type || 'application/octet-stream',
          sizeBytes: file.size,
          dataUrl,
          uploadedAt: new Date().toISOString(),
        };

        newItems.push(newAttachment);

        if (newItems.length === files.length) {
          const updatedList = [...attachments, ...newItems];
          setAttachments(updatedList);
          onUpdateDocument({
            ...doc,
            attachments: updatedList,
            updatedAt: new Date().toISOString(),
            isCloudSynced: false,
          });
          setUploadSuccess(`Uploaded ${files.length} attachment(s) successfully!`);
        }
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeleteAttachment = (attId: string) => {
    const filtered = attachments.filter((a) => a.id !== attId);
    setAttachments(filtered);
    if (previewAttachment?.id === attId) {
      setPreviewAttachment(null);
    }
    onUpdateDocument({
      ...doc,
      attachments: filtered,
      updatedAt: new Date().toISOString(),
      isCloudSynced: false,
    });
  };

  const handleDownload = (att: DocAttachment) => {
    const a = window.document.createElement('a');
    a.href = att.dataUrl;
    a.download = att.name;
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <ImageIcon className="w-5 h-5 text-cyan-400" />;
    if (mimeType.includes('pdf')) return <FileText className="w-5 h-5 text-red-400" />;
    return <File className="w-5 h-5 text-indigo-400" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/95">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Paperclip className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                <span>Attachments &amp; Files</span>
                <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded-full text-slate-400 font-normal">
                  {attachments.length}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 truncate max-w-xs">
                For: <span className="text-slate-200 font-medium">{doc.name}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Upload Drop Zone / Button */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-800 hover:border-indigo-500/60 bg-slate-950/60 hover:bg-indigo-950/10 rounded-2xl p-4 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 group"
          >
            <div className="p-2.5 rounded-xl bg-indigo-600/15 text-indigo-400 group-hover:scale-105 transition-transform">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-200">
                Click to upload attachments
              </p>
              <p className="text-[10px] text-slate-400">
                Receipts, contracts, images, supporting notes, PDFs, or spreadsheets
              </p>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />

          {uploadSuccess && (
            <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{uploadSuccess}</span>
            </div>
          )}

          {/* Attachments List */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-400">
              Linked Attachments ({attachments.length}):
            </h4>

            {attachments.length === 0 ? (
              <div className="p-6 text-center rounded-xl bg-slate-950/40 border border-slate-800/80">
                <Paperclip className="w-6 h-6 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-400">No attachments uploaded yet</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Attach invoices, photos, or appendixes to this document
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {attachments.map((att) => (
                  <div
                    key={att.id}
                    className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/90 hover:border-slate-700 transition flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                        {getFileIcon(att.type)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-200 truncate group-hover:text-indigo-300 transition-colors">
                          {att.name}
                        </p>
                        <p className="text-[10px] text-slate-500 flex items-center gap-2">
                          <span>{formatSize(att.sizeBytes)}</span>
                          <span>&bull;</span>
                          <span>{new Date(att.uploadedAt).toLocaleDateString()}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {/* View Image Preview if image */}
                      {att.type.startsWith('image/') && (
                        <button
                          type="button"
                          onClick={() => setPreviewAttachment(att)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                          title="Preview Image"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Download */}
                      <button
                        type="button"
                        onClick={() => handleDownload(att)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                        title="Download Attachment"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => handleDeleteAttachment(att.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition"
                        title="Delete Attachment"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Image Preview modal if opened */}
          {previewAttachment && (
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300 truncate">
                  Preview: {previewAttachment.name}
                </span>
                <button
                  type="button"
                  onClick={() => setPreviewAttachment(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="max-h-56 overflow-hidden rounded-xl border border-slate-800 flex items-center justify-center bg-black/60">
                <img
                  src={previewAttachment.dataUrl}
                  alt={previewAttachment.name}
                  className="max-h-52 object-contain"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-900 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Total {attachments.length} attachment{attachments.length === 1 ? '' : 's'} linked
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/25 transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
