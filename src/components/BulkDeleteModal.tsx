import React from 'react';
import { Trash2, X, AlertTriangle } from 'lucide-react';
import { AppDocument } from '../types/document';

interface BulkDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDocs: AppDocument[];
  onConfirmDelete: () => void;
}

export const BulkDeleteModal: React.FC<BulkDeleteModalProps> = ({
  isOpen,
  onClose,
  selectedDocs,
  onConfirmDelete,
}) => {
  if (!isOpen) return null;

  const totalBytes = selectedDocs.reduce((acc, d) => acc + (d.sizeBytes || 0), 0);
  const totalKb = (totalBytes / 1024).toFixed(0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Delete {selectedDocs.length} Documents?</h3>
              <p className="text-xs text-slate-400">
                This will free up ~{totalKb} KB of local and cloud storage
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

        {/* List */}
        <div className="p-5 max-h-56 overflow-y-auto space-y-2">
          <p className="text-xs text-slate-300 mb-2">
            The following files will be permanently removed from your library:
          </p>
          {selectedDocs.map((doc) => (
            <div
              key={doc.id}
              className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs"
            >
              <span className="text-slate-200 font-medium truncate max-w-[260px]">
                {doc.name}
              </span>
              <span className="font-mono text-slate-500">
                {(doc.sizeBytes / 1024).toFixed(0)} KB
              </span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirmDelete();
              onClose();
            }}
            className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-lg shadow-red-600/25 transition flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Confirm Delete ({selectedDocs.length})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
