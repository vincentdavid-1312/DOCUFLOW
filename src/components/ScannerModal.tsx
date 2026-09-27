import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  X,
  Upload,
  Check,
  RotateCw,
  Sparkles,
  Layers,
  Trash2,
  Plus,
  RefreshCw,
  FileCheck,
  Sliders,
  Eye,
} from 'lucide-react';
import { FilterType, applyImageFilter, rotateImageCanvas } from '../utils/imageFilters';
import { AppDocument, DocumentPage } from '../types/document';
import { createPdfFromPages, uint8ArrayToDataUri } from '../utils/pdfEngine';

interface ScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveDocument: (doc: AppDocument, triggerOcr?: boolean) => void;
}

export const ScannerModal: React.FC<ScannerModalProps> = ({
  isOpen,
  onClose,
  onSaveDocument,
}) => {
  const [useCamera, setUseCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedPages, setCapturedPages] = useState<DocumentPage[]>([]);
  const [activePageIndex, setActivePageIndex] = useState<number>(0);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('magic');
  const [docTitle, setDocTitle] = useState('New Document Scan');
  const [isProcessingFilter, setIsProcessingFilter] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize camera stream when camera mode is active
  useEffect(() => {
    if (isOpen && useCamera) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, useCamera]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access not supported in this browser.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.warn('Camera error:', err);
      setCameraError(err.message || 'Unable to access camera. Please check permissions.');
      setUseCamera(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const captureFrameFromCamera = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);

    // Apply active filter right away
    applyImageFilter(dataUrl, selectedFilter).then((filteredUrl) => {
      const newPage: DocumentPage = {
        pageNumber: capturedPages.length + 1,
        dataUrl: filteredUrl,
        rotation: 0,
      };
      const updated = [...capturedPages, newPage];
      setCapturedPages(updated);
      setActivePageIndex(updated.length - 1);
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = async () => {
        const rawUrl = reader.result as string;
        const filteredUrl = await applyImageFilter(rawUrl, selectedFilter);
        setCapturedPages((prev) => {
          const next = [
            ...prev,
            {
              pageNumber: prev.length + 1,
              dataUrl: filteredUrl,
              rotation: 0,
            },
          ];
          setActivePageIndex(next.length - 1);
          return next;
        });
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleApplyFilter = async (filter: FilterType) => {
    setSelectedFilter(filter);
    if (capturedPages.length === 0) return;

    setIsProcessingFilter(true);
    const currentPage = capturedPages[activePageIndex];
    const newUrl = await applyImageFilter(currentPage.dataUrl, filter);

    setCapturedPages((prev) =>
      prev.map((p, idx) => (idx === activePageIndex ? { ...p, dataUrl: newUrl } : p))
    );
    setIsProcessingFilter(false);
  };

  const handleRotateCurrent = async () => {
    if (capturedPages.length === 0) return;
    const currentPage = capturedPages[activePageIndex];
    const rotated = await rotateImageCanvas(currentPage.dataUrl, 90);
    setCapturedPages((prev) =>
      prev.map((p, idx) => (idx === activePageIndex ? { ...p, dataUrl: rotated } : p))
    );
  };

  const handleDeleteCurrentPage = () => {
    if (capturedPages.length === 0) return;
    const updated = capturedPages.filter((_, idx) => idx !== activePageIndex);
    const renumbered = updated.map((p, i) => ({ ...p, pageNumber: i + 1 }));
    setCapturedPages(renumbered);
    setActivePageIndex(Math.max(0, activePageIndex - 1));
  };

  const handleSave = async (triggerOcr: boolean = false) => {
    if (capturedPages.length === 0) return;

    const pdfBytes = await createPdfFromPages(capturedPages, [], 'A4');
    const pdfDataUri = uint8ArrayToDataUri(pdfBytes);

    const newDoc: AppDocument = {
      id: `doc-${Date.now()}`,
      name: `${docTitle.endsWith('.pdf') ? docTitle : `${docTitle}.pdf`}`,
      category: 'scans',
      type: 'pdf',
      sizeBytes: pdfBytes.byteLength,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      pageCount: capturedPages.length,
      pages: capturedPages,
      pdfDataUri,
      annotations: [],
      tags: ['Scan', 'Mobile Upload'],
      isCloudSynced: true,
      deviceId: 'device-current',
      favorite: false,
    };

    onSaveDocument(newDoc, triggerOcr);
    onClose();
    // Reset state
    setCapturedPages([]);
    setActivePageIndex(0);
  };

  if (!isOpen) return null;

  const currentPage = capturedPages[activePageIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-indigo-400" />
            <input
              type="text"
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              className="bg-transparent font-semibold text-slate-100 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded px-1.5 py-0.5 border border-transparent hover:border-slate-700"
              placeholder="Document name..."
            />
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Body */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-[380px]">
          {/* Viewport Area */}
          <div className="flex-1 relative bg-slate-950 flex items-center justify-center overflow-hidden p-4">
            {useCamera ? (
              <div className="relative w-full h-full max-w-lg flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-contain rounded-lg shadow-xl"
                />
                {/* Document scanner bounding frame */}
                <div className="absolute inset-8 border-2 border-indigo-400/60 rounded-xl pointer-events-none flex flex-col justify-between p-3">
                  <div className="flex justify-between">
                    <div className="w-5 h-5 border-t-2 border-l-2 border-indigo-400"></div>
                    <div className="w-5 h-5 border-t-2 border-r-2 border-indigo-400"></div>
                  </div>
                  <div className="text-center text-xs text-indigo-300 font-medium bg-slate-950/70 px-3 py-1 rounded-full self-center">
                    Align document inside frame
                  </div>
                  <div className="flex justify-between">
                    <div className="w-5 h-5 border-b-2 border-l-2 border-indigo-400"></div>
                    <div className="w-5 h-5 border-b-2 border-r-2 border-indigo-400"></div>
                  </div>
                </div>

                {/* Shutter Button */}
                <button
                  onClick={captureFrameFromCamera}
                  className="absolute bottom-6 self-center w-16 h-16 rounded-full bg-white ring-4 ring-indigo-500/50 flex items-center justify-center shadow-2xl transition transform active:scale-90 hover:scale-105"
                  title="Capture Document Page"
                >
                  <div className="w-12 h-12 rounded-full border-2 border-slate-900 bg-white"></div>
                </button>
              </div>
            ) : currentPage ? (
              <div className="relative max-h-full max-w-full flex items-center justify-center">
                <img
                  src={currentPage.dataUrl}
                  alt={`Page ${currentPage.pageNumber}`}
                  className="max-h-[60vh] max-w-full object-contain rounded-lg shadow-2xl border border-slate-800"
                />
                {isProcessingFilter && (
                  <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center rounded-lg">
                    <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin" />
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center p-8 max-w-sm">
                <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-4">
                  <Camera className="w-8 h-8" />
                </div>
                <h4 className="text-base font-semibold text-slate-200 mb-1">
                  Ready to Scan Document
                </h4>
                <p className="text-xs text-slate-400 mb-5">
                  Use your device camera with live edge detection, or import photos from your files.
                </p>
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  <button
                    onClick={() => setUseCamera(true)}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Open Camera</span>
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 border border-slate-700"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Import Image / File</span>
                  </button>
                </div>
                {cameraError && (
                  <p className="mt-3 text-[11px] text-amber-400 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                    {cameraError}
                  </p>
                )}
              </div>
            )}

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*,.pdf"
              multiple
              className="hidden"
            />
          </div>

          {/* Right Control & Filter Sidebar */}
          <div className="w-full md:w-80 bg-slate-900 border-t md:border-t-0 md:border-l border-slate-800 p-4 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-4">
              {/* Camera / Upload Switcher */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setUseCamera(!useCamera)}
                  className={`py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 border transition ${
                    useCamera
                      ? 'bg-indigo-600 text-white border-indigo-500'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>{useCamera ? 'Close Camera' : 'Live Camera'}</span>
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 transition"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Add File</span>
                </button>
              </div>

              {/* Pages Thumbnail Reel */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Pages ({capturedPages.length})</span>
                  </span>
                  {capturedPages.length > 0 && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={handleRotateCurrent}
                        className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded"
                        title="Rotate Page"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={handleDeleteCurrentPage}
                        className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded"
                        title="Delete Current Page"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {capturedPages.length > 0 ? (
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                    {capturedPages.map((page, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          setUseCamera(false);
                          setActivePageIndex(idx);
                        }}
                        className={`relative flex-shrink-0 w-16 h-20 rounded-lg overflow-hidden border cursor-pointer transition ${
                          activePageIndex === idx && !useCamera
                            ? 'border-indigo-500 ring-2 ring-indigo-500/40'
                            : 'border-slate-800 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={page.dataUrl}
                          alt={`Thumb ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute bottom-0.5 right-0.5 bg-black/75 px-1 py-0.2 rounded text-[9px] font-mono text-white">
                          #{idx + 1}
                        </span>
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        setUseCamera(true);
                      }}
                      className="flex-shrink-0 w-16 h-20 rounded-lg border-2 border-dashed border-slate-700 hover:border-indigo-500 text-slate-400 hover:text-indigo-400 flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Scan +</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 text-center text-xs text-slate-400">
                    No pages captured yet
                  </div>
                )}
              </div>

              {/* Document Filters */}
              {capturedPages.length > 0 && (
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-2">
                    Enhancement Filter:
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { id: 'magic', label: 'Magic Color', icon: Sparkles },
                      { id: 'bw', label: 'B&W Document', icon: Sliders },
                      { id: 'grayscale', label: 'Grayscale', icon: Eye },
                      { id: 'original', label: 'Original', icon: RotateCw },
                      { id: 'blueprint', label: 'Blueprint', icon: Layers },
                    ].map((f) => {
                      const Icon = f.icon;
                      const active = selectedFilter === f.id;
                      return (
                        <button
                          key={f.id}
                          onClick={() => handleApplyFilter(f.id as FilterType)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
                            active
                              ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/50'
                              : 'bg-slate-800/60 text-slate-400 border border-slate-800 hover:bg-slate-800'
                          }`}
                        >
                          <Icon className="w-3 h-3 text-indigo-400" />
                          <span>{f.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-slate-800 space-y-2">
              <button
                disabled={capturedPages.length === 0}
                onClick={() => handleSave(true)}
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-indigo-500 hover:from-cyan-500 hover:to-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Save &amp; Run Gemini High OCR</span>
              </button>

              <button
                disabled={capturedPages.length === 0}
                onClick={() => handleSave(false)}
                className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 text-xs font-semibold border border-slate-700 flex items-center justify-center gap-2 transition"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save to PDF Library</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
