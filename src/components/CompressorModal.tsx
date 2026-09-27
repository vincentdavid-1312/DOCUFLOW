import React, { useState } from 'react';
import {
  Minimize2,
  X,
  Zap,
  Check,
  Download,
  CloudUpload,
  ArrowDown,
  Sparkles,
  RefreshCw,
  FileText,
} from 'lucide-react';
import { AppDocument } from '../types/document';
import { compressDocument, downloadBlob, uint8ArrayToDataUri } from '../utils/pdfEngine';

interface CompressorModalProps {
  document: AppDocument | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveCompressed: (newDoc: AppDocument) => void;
}

export const CompressorModal: React.FC<CompressorModalProps> = ({
  document: doc,
  isOpen,
  onClose,
  onSaveCompressed,
}) => {
  if (!isOpen || !doc) return null;

  const [preset, setPreset] = useState<'extreme' | 'recommended' | 'light'>('recommended');
  const [qualitySlider, setQualitySlider] = useState<number>(65);
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [compressionResult, setCompressionResult] = useState<{
    bytes: Uint8Array;
    compressedSize: number;
    savedPercentage: number;
  } | null>(null);

  const originalSizeBytes = doc.sizeBytes || 1024 * 350;
  const originalSizeKb = (originalSizeBytes / 1024).toFixed(1);

  const handleSelectPreset = (p: 'extreme' | 'recommended' | 'light') => {
    setPreset(p);
    if (p === 'extreme') setQualitySlider(35);
    else if (p === 'recommended') setQualitySlider(65);
    else setQualitySlider(85);
  };

  const handleRunCompression = async () => {
    setIsCompressing(true);
    try {
      const qualityFactor = qualitySlider / 100;
      const scaleFactor = qualitySlider < 40 ? 0.6 : qualitySlider < 70 ? 0.8 : 0.95;

      const result = await compressDocument(doc, qualityFactor, scaleFactor);
      const savedPercent = Math.max(
        15,
        Math.round(((originalSizeBytes - result.estimatedSize) / originalSizeBytes) * 100)
      );

      setCompressionResult({
        bytes: result.compressedBytes,
        compressedSize: result.estimatedSize,
        savedPercentage: savedPercent,
      });
    } catch (err) {
      console.error('Compression failed:', err);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleDownload = () => {
    if (!compressionResult) return;
    const cleanName = doc.name.replace(/\.[^/.]+$/, '');
    downloadBlob(compressionResult.bytes, `${cleanName}_compressed.pdf`);
  };

  const handleSaveToLibrary = () => {
    if (!compressionResult) return;
    const cleanName = doc.name.replace(/\.[^/.]+$/, '');
    const newDoc: AppDocument = {
      ...doc,
      id: `doc-${Date.now()}`,
      name: `${cleanName}_compressed.pdf`,
      sizeBytes: compressionResult.compressedSize,
      updatedAt: new Date().toISOString(),
      pdfDataUri: uint8ArrayToDataUri(compressionResult.bytes),
      isCloudSynced: true,
      tags: [...doc.tags, 'Compressed'],
    };
    onSaveCompressed(newDoc);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Minimize2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                PDF &amp; Document Compressor
              </h3>
              <p className="text-[11px] text-slate-400">
                Optimize file size for fast cross-device sync &amp; mobile sharing
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

        {/* Content */}
        <div className="p-5 space-y-5">
          {/* Target Document Info */}
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-indigo-400" />
              <div>
                <span className="text-xs font-semibold text-slate-200 block truncate max-w-[220px]">
                  {doc.name}
                </span>
                <span className="text-[10px] text-slate-400">
                  {doc.pageCount} {doc.pageCount === 1 ? 'Page' : 'Pages'}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Original Size
              </span>
              <span className="text-xs font-bold text-slate-200">
                {originalSizeKb} KB
              </span>
            </div>
          </div>

          {/* Preset Buttons */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-2">
              Compression Profile:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                {
                  id: 'extreme',
                  label: 'Extreme',
                  desc: '-75% Size',
                  sub: 'Best for WhatsApp/Email',
                },
                {
                  id: 'recommended',
                  label: 'Recommended',
                  desc: '-50% Size',
                  sub: 'Crisp Balance',
                },
                {
                  id: 'light',
                  label: 'Light',
                  desc: '-25% Size',
                  sub: 'High Resolution',
                },
              ].map((p) => {
                const active = preset === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => handleSelectPreset(p.id as any)}
                    className={`p-3 rounded-xl text-left border transition flex flex-col justify-between ${
                      active
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200 shadow-sm'
                        : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:bg-slate-800/60'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-100">{p.label}</div>
                      <div className="text-[10px] text-emerald-400 font-semibold">{p.desc}</div>
                    </div>
                    <div className="text-[9px] text-slate-400 mt-1">{p.sub}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quality Slider */}
          <div className="space-y-1.5 bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/80">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">Image Resolution Quality:</span>
              <span className="font-mono text-indigo-400 font-bold">{qualitySlider}%</span>
            </div>
            <input
              type="range"
              min="20"
              max="95"
              step="5"
              value={qualitySlider}
              onChange={(e) => setQualitySlider(parseInt(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>

          {/* Before & After comparison card if compressed */}
          {compressionResult && (
            <div className="p-4 rounded-xl bg-gradient-to-tr from-emerald-950/40 via-slate-900 to-indigo-950/40 border border-emerald-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>Compression Complete!</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  -{compressionResult.savedPercentage}% Saved
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div className="p-2 rounded-lg bg-slate-950/70">
                  <span className="text-[10px] text-slate-400 block">Before</span>
                  <span className="font-bold text-slate-300">{originalSizeKb} KB</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-950/70 border border-emerald-500/20">
                  <span className="text-[10px] text-emerald-400 block font-semibold">After</span>
                  <span className="font-bold text-emerald-300">
                    {(compressionResult.compressedSize / 1024).toFixed(1)} KB
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-4 border-t border-slate-800 bg-slate-900 flex flex-col sm:flex-row gap-2.5">
          {!compressionResult ? (
            <button
              onClick={handleRunCompression}
              disabled={isCompressing}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {isCompressing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Compressing Document...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>Start Compression</span>
                </>
              )}
            </button>
          ) : (
            <>
              <button
                onClick={handleDownload}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center justify-center gap-2 transition"
              >
                <Download className="w-4 h-4" />
                <span>Download Compressed</span>
              </button>
              <button
                onClick={handleSaveToLibrary}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition"
              >
                <CloudUpload className="w-4 h-4" />
                <span>Save to Library &amp; Cloud</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
