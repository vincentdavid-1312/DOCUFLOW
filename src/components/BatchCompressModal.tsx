import React, { useState } from 'react';
import {
  X,
  Minimize2,
  CheckCircle2,
  Layers,
  ArrowRight,
  Sparkles,
  Download,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import { AppDocument } from '../types/document';
import { compressDocument, uint8ArrayToDataUri, downloadBlob } from '../utils/pdfEngine';

interface BatchCompressModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDocs: AppDocument[];
  onSaveBatchCompressed: (compressedDocs: AppDocument[]) => void;
}

export const BatchCompressModal: React.FC<BatchCompressModalProps> = ({
  isOpen,
  onClose,
  selectedDocs,
  onSaveBatchCompressed,
}) => {
  const [level, setLevel] = useState<'recommended' | 'extreme' | 'light'>('recommended');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0); // 0 to 100
  const [currentDocName, setCurrentDocName] = useState('');
  const [compressedResults, setCompressedResults] = useState<AppDocument[] | null>(null);

  if (!isOpen) return null;

  const totalOriginalBytes = selectedDocs.reduce((acc, d) => acc + (d.sizeBytes || 0), 0);
  const totalOriginalKb = (totalOriginalBytes / 1024).toFixed(0);

  const getEstimatedSavings = () => {
    switch (level) {
      case 'extreme':
        return 0.75;
      case 'light':
        return 0.25;
      default:
        return 0.5;
    }
  };

  const estimatedSavedKb = (Number(totalOriginalKb) * getEstimatedSavings()).toFixed(0);
  const estimatedTargetKb = (Number(totalOriginalKb) * (1 - getEstimatedSavings())).toFixed(0);

  const handleStartBatchCompression = async () => {
    setIsProcessing(true);
    setProgress(0);
    setCompressedResults(null);

    const qualityFactor = level === 'extreme' ? 0.3 : level === 'light' ? 0.8 : 0.6;
    const scaleFactor = level === 'extreme' ? 0.65 : level === 'light' ? 0.9 : 0.75;

    const newDocs: AppDocument[] = [];

    try {
      for (let i = 0; i < selectedDocs.length; i++) {
        const doc = selectedDocs[i];
        setCurrentDocName(doc.name);

        const result = await compressDocument(doc, qualityFactor, scaleFactor);
        const dataUri = uint8ArrayToDataUri(result.compressedBytes, 'application/pdf');

        const newCompressedDoc: AppDocument = {
          ...doc,
          id: `${doc.id}-comp-${Date.now()}`,
          name: `${doc.name.replace(/\.[^/.]+$/, '')}_compressed.pdf`,
          sizeBytes: result.estimatedSize,
          updatedAt: new Date().toISOString(),
          pdfDataUri: dataUri,
          isCloudSynced: false,
          tags: [...doc.tags, 'compressed'],
        };

        newDocs.push(newCompressedDoc);
        setProgress(Math.round(((i + 1) / selectedDocs.length) * 100));
      }

      setCompressedResults(newDocs);
      onSaveBatchCompressed(newDocs);
    } catch (err) {
      console.error('Batch compression error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadAll = () => {
    if (!compressedResults) return;
    compressedResults.forEach((doc) => {
      if (doc.pdfDataUri) {
        const a = document.createElement('a');
        a.href = doc.pdfDataUri;
        a.download = doc.name;
        a.click();
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Minimize2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Batch PDF Compression</h3>
              <p className="text-xs text-slate-400">
                Compress {selectedDocs.length} files simultaneously
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {!compressedResults ? (
            <>
              {/* Selected Files List Preview */}
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
                  Documents to Compress ({selectedDocs.length})
                </label>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {selectedDocs.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs"
                    >
                      <span className="font-medium text-slate-200 truncate max-w-[280px]">
                        {doc.name}
                      </span>
                      <span className="font-mono text-slate-400">
                        {(doc.sizeBytes / 1024).toFixed(0)} KB
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Compression Preset Selector */}
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5 block">
                  Compression Preset
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    {
                      id: 'extreme',
                      label: 'Extreme',
                      ratio: '~75% smaller',
                      desc: 'Smallest file size',
                    },
                    {
                      id: 'recommended',
                      label: 'Balanced',
                      ratio: '~50% smaller',
                      desc: 'Standard quality',
                    },
                    {
                      id: 'light',
                      label: 'Light',
                      ratio: '~25% smaller',
                      desc: 'Maximum resolution',
                    },
                  ].map((p) => {
                    const active = level === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setLevel(p.id as any)}
                        className={`p-3 rounded-2xl border text-left transition ${
                          active
                            ? 'bg-cyan-500/15 border-cyan-500 text-white shadow-md shadow-cyan-500/10'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <span className="text-xs font-bold block text-white">{p.label}</span>
                        <span className="text-[11px] font-mono text-cyan-400 block">{p.ratio}</span>
                        <span className="text-[10px] text-slate-500 block mt-0.5">{p.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Estimated Reduction Stats Box */}
              <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block">Total Original Size</span>
                  <span className="text-base font-bold font-mono text-white">
                    {totalOriginalKb} KB
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-cyan-400" />
                <div>
                  <span className="text-xs text-slate-400 block">Est. Target Size</span>
                  <span className="text-base font-bold font-mono text-cyan-300">
                    ~{estimatedTargetKb} KB
                  </span>
                </div>
                <div className="bg-cyan-500/20 px-2.5 py-1 rounded-xl text-xs font-bold text-cyan-300 border border-cyan-500/30">
                  Save ~{estimatedSavedKb} KB
                </div>
              </div>

              {/* Progress bar if processing */}
              {isProcessing && (
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300">Compressing: {currentDocName}...</span>
                    <span className="font-mono text-cyan-400 font-bold">{progress}%</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Results Screen */
            <div className="space-y-4 py-2 text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
                <FileCheck className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">
                  Batch Compression Complete!
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Successfully compressed {compressedResults.length} documents. Saved to your
                  library and ready for download.
                </p>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto text-left">
                {compressedResults.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-2.5 rounded-xl bg-slate-950 border border-emerald-500/20 flex items-center justify-between text-xs"
                  >
                    <span className="text-slate-200 font-medium truncate max-w-[260px]">
                      {doc.name}
                    </span>
                    <span className="font-mono text-emerald-400 font-bold">
                      {(doc.sizeBytes / 1024).toFixed(0)} KB
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end gap-2.5">
          {!compressedResults ? (
            <>
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStartBatchCompression}
                disabled={isProcessing}
                className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-lg shadow-cyan-600/25 transition flex items-center gap-1.5 disabled:opacity-50"
              >
                {isProcessing ? (
                  <span>Compressing {progress}%...</span>
                ) : (
                  <>
                    <Minimize2 className="w-3.5 h-3.5" />
                    <span>Compress {selectedDocs.length} Documents</span>
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleDownloadAll}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download All</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition"
              >
                Done &amp; View in Library
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
