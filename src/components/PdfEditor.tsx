import React, { useState, useRef, useEffect } from 'react';
import {
  FileText,
  X,
  RotateCw,
  Trash2,
  ArrowLeft,
  ArrowRight,
  PenTool,
  Stamp,
  Type,
  Download,
  Sparkles,
  Check,
  Calendar,
  Eraser,
  Sliders,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Plus,
  Paperclip,
  Image as ImageIcon,
} from 'lucide-react';
import { AppDocument, DocAnnotation, DocumentPage } from '../types/document';
import { createPdfFromPages, downloadBlob, uint8ArrayToDataUri } from '../utils/pdfEngine';
import { rotateImageCanvas } from '../utils/imageFilters';

interface PdfEditorProps {
  document: AppDocument | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateDocument: (updated: AppDocument) => void;
  onTriggerOcr: (doc: AppDocument) => void;
  onOpenAttachments?: (doc: AppDocument) => void;
}

export const PdfEditor: React.FC<PdfEditorProps> = ({
  document: doc,
  isOpen,
  onClose,
  onUpdateDocument,
  onTriggerOcr,
  onOpenAttachments,
}) => {
  if (!isOpen || !doc) return null;

  const [activePageIndex, setActivePageIndex] = useState<number>(0);
  const [pages, setPages] = useState<DocumentPage[]>(doc.pages);
  const [annotations, setAnnotations] = useState<DocAnnotation[]>(doc.annotations || []);
  const [isDrawingSignature, setIsDrawingSignature] = useState(false);
  const [isAddingWatermark, setIsAddingWatermark] = useState(false);
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.2);
  const [isAddingText, setIsAddingText] = useState(false);
  const [customText, setCustomText] = useState('');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isExporting, setIsExporting] = useState(false);

  // File input for inserting additional image pages into the PDF
  const addPageInputRef = useRef<HTMLInputElement | null>(null);

  // Signature canvas refs
  const sigCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isPainting = useRef(false);

  // Sync state when doc changes
  useEffect(() => {
    setPages(doc.pages);
    setAnnotations(doc.annotations || []);
    setActivePageIndex(0);
  }, [doc]);

  // Signature drawing logic
  useEffect(() => {
    if (isDrawingSignature && sigCanvasRef.current) {
      const canvas = sigCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, [isDrawingSignature]);

  const startDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    isPainting.current = true;
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const drawStroke = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isPainting.current || !sigCanvasRef.current) return;
    const canvas = sigCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDraw = () => {
    isPainting.current = false;
  };

  const clearSignature = () => {
    if (!sigCanvasRef.current) return;
    const ctx = sigCanvasRef.current.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, sigCanvasRef.current.width, sigCanvasRef.current.height);
  };

  const applySignature = () => {
    if (!sigCanvasRef.current) return;
    const sigDataUrl = sigCanvasRef.current.toDataURL('image/png');
    const newAnn: DocAnnotation = {
      id: `ann-${Date.now()}`,
      pageNumber: activePageIndex + 1,
      type: 'signature',
      x: 65,
      y: 80,
      content: sigDataUrl,
    };
    const updatedAnns = [...annotations, newAnn];
    setAnnotations(updatedAnns);
    setIsDrawingSignature(false);
  };

  const applyWatermark = () => {
    const newAnn: DocAnnotation = {
      id: `ann-${Date.now()}`,
      pageNumber: activePageIndex + 1,
      type: 'watermark',
      x: 50,
      y: 50,
      content: watermarkText,
      opacity: watermarkOpacity,
      rotation: 35,
    };
    setAnnotations([...annotations, newAnn]);
    setIsAddingWatermark(false);
  };

  const applyTextAnnotation = () => {
    if (!customText.trim()) return;
    const newAnn: DocAnnotation = {
      id: `ann-${Date.now()}`,
      pageNumber: activePageIndex + 1,
      type: 'text',
      x: 10,
      y: 15,
      content: customText,
      fontSize: 12,
    };
    setAnnotations([...annotations, newAnn]);
    setCustomText('');
    setIsAddingText(false);
  };

  const applyDateStamp = () => {
    const newAnn: DocAnnotation = {
      id: `ann-${Date.now()}`,
      pageNumber: activePageIndex + 1,
      type: 'date',
      x: 10,
      y: 8,
      content: `Approved: ${new Date().toLocaleDateString()}`,
      fontSize: 11,
    };
    setAnnotations([...annotations, newAnn]);
  };

  const removeAnnotation = (id: string) => {
    setAnnotations(annotations.filter((a) => a.id !== id));
  };

  const handleRotatePage = async () => {
    const currentPage = pages[activePageIndex];
    const rotated = await rotateImageCanvas(currentPage.dataUrl, 90);
    const updated = pages.map((p, idx) =>
      idx === activePageIndex ? { ...p, dataUrl: rotated } : p
    );
    setPages(updated);
  };

  const handleMovePage = (dir: -1 | 1) => {
    const targetIdx = activePageIndex + dir;
    if (targetIdx < 0 || targetIdx >= pages.length) return;
    const reordered = [...pages];
    const temp = reordered[activePageIndex];
    reordered[activePageIndex] = reordered[targetIdx];
    reordered[targetIdx] = temp;
    // Renumber
    const renumbered = reordered.map((p, i) => ({ ...p, pageNumber: i + 1 }));
    setPages(renumbered);
    setActivePageIndex(targetIdx);
  };

  const handleDeletePage = () => {
    if (pages.length <= 1) return;
    const updated = pages.filter((_, idx) => idx !== activePageIndex);
    const renumbered = updated.map((p, i) => ({ ...p, pageNumber: i + 1 }));
    setPages(renumbered);
    setActivePageIndex(Math.max(0, activePageIndex - 1));
  };

  // Add new Image as a new page inside this PDF
  const handleAddImageAsPage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setPages((prev) => {
          const newPage: DocumentPage = {
            pageNumber: prev.length + 1,
            dataUrl,
            rotation: 0,
          };
          const next = [...prev, newPage];
          setActivePageIndex(next.length - 1);
          return next;
        });
      };
      reader.readAsDataURL(file);
    });

    if (addPageInputRef.current) {
      addPageInputRef.current.value = '';
    }
  };

  const handleSaveAndExport = async (download: boolean = false) => {
    setIsExporting(true);
    try {
      const pdfBytes = await createPdfFromPages(pages, annotations, 'A4');
      const pdfDataUri = uint8ArrayToDataUri(pdfBytes);

      const updatedDoc: AppDocument = {
        ...doc,
        pages,
        annotations,
        pageCount: pages.length,
        sizeBytes: pdfBytes.byteLength,
        pdfDataUri,
        updatedAt: new Date().toISOString(),
        isCloudSynced: false,
      };

      onUpdateDocument(updatedDoc);

      if (download) {
        downloadBlob(pdfBytes, doc.name);
      }
    } finally {
      setIsExporting(false);
    }
  };

  const currentPage = pages[activePageIndex];
  const activePageAnns = annotations.filter((a) => a.pageNumber === activePageIndex + 1);
  const attachmentsCount = doc.attachments?.length || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[94vh]">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/95">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 truncate max-w-xs sm:max-w-md">
                {doc.name}
              </h3>
              <p className="text-[11px] text-slate-400">
                Page {activePageIndex + 1} of {pages.length} &bull; {(doc.sizeBytes / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Manage Attachments Button */}
            {onOpenAttachments && (
              <button
                onClick={() => onOpenAttachments(doc)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition"
                title="View & Upload Attachments"
              >
                <Paperclip className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">Attachments</span>
                {attachmentsCount > 0 && (
                  <span className="px-1.5 py-0.2 bg-indigo-600/40 text-indigo-300 rounded text-[10px] font-semibold">
                    {attachmentsCount}
                  </span>
                )}
              </button>
            )}

            {/* Run OCR */}
            <button
              onClick={() => {
                onTriggerOcr(doc);
              }}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 hover:from-purple-500 hover:to-indigo-500 transition"
              title="Run Deep OCR with Gemini 3.1 Pro Thinking Mode"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Deep OCR (High Thinking)</span>
            </button>

            {/* Save & Download */}
            <button
              onClick={() => handleSaveAndExport(true)}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Export PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar for Page Manipulation & Tools */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-slate-950/70 text-xs gap-2 overflow-x-auto">
          {/* Page Reorder, Rotation, and Add Image Page */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleMovePage(-1)}
              disabled={activePageIndex === 0}
              className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30"
              title="Move Page Backward"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-mono text-slate-400 px-1">
              {activePageIndex + 1}/{pages.length}
            </span>
            <button
              onClick={() => handleMovePage(1)}
              disabled={activePageIndex === pages.length - 1}
              className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30"
              title="Move Page Forward"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-slate-800 mx-1"></div>
            <button
              onClick={handleRotatePage}
              className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 flex items-center gap-1"
              title="Rotate 90 degrees"
            >
              <RotateCw className="w-4 h-4" />
              <span className="hidden sm:inline">Rotate</span>
            </button>
            <button
              onClick={handleDeletePage}
              disabled={pages.length <= 1}
              className="p-1.5 rounded text-red-400 hover:text-red-300 hover:bg-red-500/10 disabled:opacity-30"
              title="Delete Page"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            {/* Add Image as Page Button */}
            <button
              onClick={() => addPageInputRef.current?.click()}
              className="p-1.5 rounded text-indigo-400 hover:text-white hover:bg-indigo-600/20 flex items-center gap-1 ml-1"
              title="Insert Image as new PDF page"
            >
              <ImageIcon className="w-4 h-4" />
              <span className="hidden sm:inline">+ Page</span>
            </button>

            <input
              ref={addPageInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleAddImageAsPage}
              className="hidden"
            />
          </div>

          {/* Annotations & Stamps */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsDrawingSignature(true)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 font-medium transition"
            >
              <PenTool className="w-3.5 h-3.5 text-indigo-400" />
              <span>Sign</span>
            </button>

            <button
              onClick={() => setIsAddingWatermark(true)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 font-medium transition"
            >
              <Stamp className="w-3.5 h-3.5 text-amber-400" />
              <span>Watermark</span>
            </button>

            <button
              onClick={() => setIsAddingText(true)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 font-medium transition"
            >
              <Type className="w-3.5 h-3.5 text-cyan-400" />
              <span>Text</span>
            </button>

            <button
              onClick={applyDateStamp}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 font-medium transition hidden sm:flex"
            >
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <span>Date Stamp</span>
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setZoomLevel(Math.max(0.7, zoomLevel - 0.15))}
              className="p-1 rounded text-slate-400 hover:text-white"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono text-slate-400 w-8 text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel(Math.min(1.8, zoomLevel + 0.15))}
              className="p-1 rounded text-slate-400 hover:text-white"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Canvas & Document Display Area */}
        <div className="flex-1 relative bg-slate-950 overflow-auto flex items-center justify-center p-4">
          {currentPage && (
            <div
              className="relative shadow-2xl transition-transform duration-200 bg-white"
              style={{
                transform: `scale(${zoomLevel})`,
                transformOrigin: 'center center',
              }}
            >
              <img
                src={currentPage.dataUrl}
                alt={`Page ${currentPage.pageNumber}`}
                className="max-h-[66vh] max-w-[80vw] object-contain select-none pointer-events-none"
              />

              {/* Render Annotations on Page */}
              {activePageAnns.map((ann) => (
                <div
                  key={ann.id}
                  className="absolute group border border-dashed border-indigo-400/50 bg-indigo-500/5 p-1 rounded cursor-move"
                  style={{
                    left: `${ann.x}%`,
                    top: `${ann.y}%`,
                    transform: ann.rotation ? `rotate(${ann.rotation}deg)` : undefined,
                    opacity: ann.opacity ?? 1,
                  }}
                >
                  <button
                    onClick={() => removeAnnotation(ann.id)}
                    className="absolute -top-3 -right-3 w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-md"
                    title="Remove item"
                  >
                    &times;
                  </button>
                  {ann.type === 'signature' && (
                    <img src={ann.content} alt="Signature" className="h-10 w-auto" />
                  )}
                  {ann.type === 'watermark' && (
                    <span className="text-3xl sm:text-5xl font-black text-red-600/35 tracking-widest uppercase pointer-events-none">
                      {ann.content}
                    </span>
                  )}
                  {(ann.type === 'text' || ann.type === 'date') && (
                    <span className="text-xs font-semibold text-slate-900 bg-white/90 px-1 py-0.5 rounded shadow-xs">
                      {ann.content}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Floating Signature Drawing Pad Modal */}
          {isDrawingSignature && (
            <div className="absolute inset-0 z-40 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-2xl w-full max-w-md">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                    <PenTool className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Draw Digital Signature</span>
                  </h4>
                  <button
                    onClick={() => setIsDrawingSignature(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="bg-white rounded-lg p-2 border border-slate-300">
                  <canvas
                    ref={sigCanvasRef}
                    width={380}
                    height={160}
                    onMouseDown={startDraw}
                    onMouseMove={drawStroke}
                    onMouseUp={stopDraw}
                    onTouchStart={startDraw}
                    onTouchMove={drawStroke}
                    onTouchEnd={stopDraw}
                    className="w-full h-40 touch-none bg-white cursor-crosshair"
                  />
                  <div className="text-[10px] text-slate-400 text-center border-t border-slate-200 pt-1">
                    Sign using finger or mouse above line
                  </div>
                </div>
                <div className="flex justify-between items-center mt-3">
                  <button
                    onClick={clearSignature}
                    className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white flex items-center gap-1"
                  >
                    <Eraser className="w-3 h-3" />
                    <span>Clear</span>
                  </button>
                  <button
                    onClick={applySignature}
                    className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1 shadow"
                  >
                    <Check className="w-3 h-3" />
                    <span>Place Signature</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Watermark Dialog */}
          {isAddingWatermark && (
            <div className="absolute inset-0 z-40 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-2xl w-full max-w-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                    <Stamp className="w-3.5 h-3.5 text-amber-400" />
                    <span>Configure Watermark</span>
                  </h4>
                  <button
                    onClick={() => setIsAddingWatermark(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div>
                  <label className="text-[11px] text-slate-300 block mb-1">Stamp Text:</label>
                  <input
                    type="text"
                    value={watermarkText}
                    onChange={(e) => setWatermarkText(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white uppercase focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    {['CONFIDENTIAL', 'APPROVED', 'DRAFT', 'PAID', 'DO NOT COPY'].map((preset) => (
                      <button
                        key={preset}
                        onClick={() => setWatermarkText(preset)}
                        className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                    <span>Opacity:</span>
                    <span>{Math.round(watermarkOpacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.05"
                    max="0.5"
                    step="0.05"
                    value={watermarkOpacity}
                    onChange={(e) => setWatermarkOpacity(parseFloat(e.target.value))}
                    className="w-full accent-amber-500"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setIsAddingWatermark(false)}
                    className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={applyWatermark}
                    className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold"
                  >
                    Apply Watermark
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Text Annotation Dialog */}
          {isAddingText && (
            <div className="absolute inset-0 z-40 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-2xl w-full max-w-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                    <Type className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Add Text Annotation</span>
                  </h4>
                  <button
                    onClick={() => setIsAddingText(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="Enter notes, reference number, or stamp..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setIsAddingText(false)}
                    className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={applyTextAnnotation}
                    className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold"
                  >
                    Add Text
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Page Thumbnails Tray */}
        <div className="p-3 border-t border-slate-800 bg-slate-900 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-2xl">
            {pages.map((p, idx) => (
              <div
                key={idx}
                onClick={() => setActivePageIndex(idx)}
                className={`relative flex-shrink-0 w-12 h-16 rounded overflow-hidden cursor-pointer border transition ${
                  activePageIndex === idx
                    ? 'border-indigo-500 ring-2 ring-indigo-500/40'
                    : 'border-slate-800 opacity-60 hover:opacity-100'
                }`}
              >
                <img src={p.dataUrl} alt={`p${idx}`} className="w-full h-full object-cover" />
                <span className="absolute bottom-0 right-0 bg-black/80 text-[8px] font-mono px-1 text-white">
                  {idx + 1}
                </span>
              </div>
            ))}

            {/* Quick Add Page thumbnail button */}
            <button
              onClick={() => addPageInputRef.current?.click()}
              className="flex-shrink-0 w-12 h-16 rounded border-2 border-dashed border-slate-700 hover:border-indigo-500 text-slate-400 hover:text-indigo-400 flex flex-col items-center justify-center gap-1 transition text-[9px]"
              title="Add Image Page"
            >
              <Plus className="w-4 h-4" />
              <span>+ Image</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSaveAndExport(false)}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
