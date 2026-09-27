import React, { useState, useRef } from 'react';
import {
  ArrowRightLeft,
  X,
  FileText,
  Image as ImageIcon,
  FileCode,
  Download,
  Check,
  Upload,
  RefreshCw,
  Plus,
  Trash2,
  Layers,
} from 'lucide-react';
import { AppDocument, DocumentPage } from '../types/document';
import { createPdfFromText, createPdfFromPages, downloadBlob, uint8ArrayToDataUri } from '../utils/pdfEngine';

interface ConverterModalProps {
  document: AppDocument | null;
  isOpen: boolean;
  onClose: () => void;
  onAddConvertedDocument: (doc: AppDocument) => void;
  initialMode?: 'image_to_pdf' | 'text_to_pdf' | 'pdf_to_images' | 'pdf_to_text';
}

export const ConverterModal: React.FC<ConverterModalProps> = ({
  document: doc,
  isOpen,
  onClose,
  onAddConvertedDocument,
  initialMode,
}) => {
  if (!isOpen) return null;

  const [conversionType, setConversionType] = useState<
    'image_to_pdf' | 'text_to_pdf' | 'pdf_to_images' | 'pdf_to_text'
  >(initialMode || (doc?.type === 'image' ? 'image_to_pdf' : 'image_to_pdf'));

  const [textInput, setTextInput] = useState<string>(
    doc?.ocrData?.extractedText ||
      `# Executive Project Brief\n\n## Overview\nThis document outlines our cross-platform document intelligence and compression pipeline.\n\n- Real-time mobile scanning\n- High thinking Gemini OCR\n- Instant cloud synchronization`
  );

  const [docName, setDocName] = useState(
    doc ? `${doc.name.replace(/\.[^/.]+$/, '')}_converted` : 'Converted_Document'
  );

  // For Image to PDF workflow:
  const [selectedImages, setSelectedImages] = useState<
    Array<{ id: string; name: string; dataUrl: string; sizeKb: number }>
  >(
    doc?.pages && doc.pages.length > 0
      ? doc.pages.map((p, i) => ({
          id: `img-${i}`,
          name: `Page ${i + 1}`,
          dataUrl: p.dataUrl,
          sizeKb: Math.round(p.dataUrl.length * 0.75 / 1024),
        }))
      : []
  );

  const [pageSize, setPageSize] = useState<'A4' | 'LETTER' | 'FIT'>('A4');
  const [isConverting, setIsConverting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setSelectedImages((prev) => [
          ...prev,
          {
            id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            name: file.name,
            dataUrl,
            sizeKb: Math.round(file.size / 1024),
          },
        ]);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (id: string) => {
    setSelectedImages((prev) => prev.filter((img) => img.id !== id));
  };

  const handleConvert = async () => {
    setIsConverting(true);
    setSuccessMessage(null);
    try {
      if (conversionType === 'image_to_pdf') {
        if (selectedImages.length === 0) {
          alert('Please upload at least one image to convert to PDF.');
          setIsConverting(false);
          return;
        }

        const pages: DocumentPage[] = selectedImages.map((img, idx) => ({
          pageNumber: idx + 1,
          dataUrl: img.dataUrl,
          rotation: 0,
        }));

        const pdfBytes = await createPdfFromPages(pages, [], pageSize);
        const fileName = docName.endsWith('.pdf') ? docName : `${docName}.pdf`;
        downloadBlob(pdfBytes, fileName);

        const newDoc: AppDocument = {
          id: `doc-${Date.now()}`,
          name: fileName,
          category: 'pdfs',
          type: 'pdf',
          sizeBytes: pdfBytes.byteLength,
          updatedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          pageCount: pages.length,
          pages,
          pdfDataUri: uint8ArrayToDataUri(pdfBytes),
          annotations: [],
          tags: ['Image to PDF', 'Converted'],
          isCloudSynced: true,
          deviceId: 'device-current',
        };

        onAddConvertedDocument(newDoc);
        setSuccessMessage(`Converted ${selectedImages.length} image(s) into PDF! Downloaded & saved to Library.`);
      } else if (conversionType === 'text_to_pdf') {
        const pdfBytes = await createPdfFromText(docName, textInput);
        const fileName = docName.endsWith('.pdf') ? docName : `${docName}.pdf`;
        downloadBlob(pdfBytes, fileName);

        // Also add to app library
        const newDoc: AppDocument = {
          id: `doc-${Date.now()}`,
          name: fileName,
          category: 'pdfs',
          type: 'pdf',
          sizeBytes: pdfBytes.byteLength,
          updatedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          pageCount: 1,
          pages: [
            {
              pageNumber: 1,
              dataUrl:
                'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1130"><rect width="800" height="1130" fill="#ffffff"/></svg>',
              rotation: 0,
            },
          ],
          pdfDataUri: uint8ArrayToDataUri(pdfBytes),
          annotations: [],
          tags: ['Converted', 'Text to PDF'],
          isCloudSynced: true,
          deviceId: 'device-current',
        };
        onAddConvertedDocument(newDoc);
        setSuccessMessage('Converted & saved to Library and downloaded successfully!');
      } else if (conversionType === 'pdf_to_text') {
        const textContent = doc?.ocrData?.extractedText || textInput;
        const blob = new Blob([textContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${docName}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        setSuccessMessage('Extracted text downloaded as .txt!');
      } else if (conversionType === 'pdf_to_images') {
        if (doc && doc.pages.length > 0) {
          doc.pages.forEach((p, idx) => {
            const a = document.createElement('a');
            a.href = p.dataUrl;
            a.download = `${docName}_page_${idx + 1}.jpg`;
            a.click();
          });
          setSuccessMessage(`Exported ${doc.pages.length} page(s) as high-res images!`);
        } else {
          setSuccessMessage('No pages available to export.');
        }
      }
    } catch (err: any) {
      console.error('Conversion error:', err);
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                Document &amp; File Converter
              </h3>
              <p className="text-[11px] text-slate-400">
                Convert Images to PDF, Text/Markdown to PDF, or extract Images &amp; Text
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

        {/* Form Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Target Document Name */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Output File Name:
            </label>
            <input
              type="text"
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>

          {/* Mode Selector */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Conversion Workflow:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {/* Image to PDF */}
              <button
                type="button"
                onClick={() => setConversionType('image_to_pdf')}
                className={`p-2.5 rounded-xl text-center border text-xs font-medium transition flex flex-col items-center gap-1.5 ${
                  conversionType === 'image_to_pdf'
                    ? 'bg-purple-600/25 border-purple-500 text-purple-200 shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <ImageIcon className="w-4 h-4 text-purple-400" />
                <span className="font-semibold">Image &rarr; PDF</span>
              </button>

              {/* Text to PDF */}
              <button
                type="button"
                onClick={() => setConversionType('text_to_pdf')}
                className={`p-2.5 rounded-xl text-center border text-xs font-medium transition flex flex-col items-center gap-1.5 ${
                  conversionType === 'text_to_pdf'
                    ? 'bg-purple-600/25 border-purple-500 text-purple-200 shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <FileCode className="w-4 h-4 text-cyan-400" />
                <span>Text &rarr; PDF</span>
              </button>

              {/* PDF to Images */}
              <button
                type="button"
                onClick={() => setConversionType('pdf_to_images')}
                className={`p-2.5 rounded-xl text-center border text-xs font-medium transition flex flex-col items-center gap-1.5 ${
                  conversionType === 'pdf_to_images'
                    ? 'bg-purple-600/25 border-purple-500 text-purple-200 shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <Layers className="w-4 h-4 text-emerald-400" />
                <span>PDF &rarr; Images</span>
              </button>

              {/* PDF to Text */}
              <button
                type="button"
                onClick={() => setConversionType('pdf_to_text')}
                className={`p-2.5 rounded-xl text-center border text-xs font-medium transition flex flex-col items-center gap-1.5 ${
                  conversionType === 'pdf_to_text'
                    ? 'bg-purple-600/25 border-purple-500 text-purple-200 shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <FileText className="w-4 h-4 text-amber-400" />
                <span>PDF &rarr; Text</span>
              </button>
            </div>
          </div>

          {/* Workflow 1: Image to PDF (Photos/Scans to PDF) */}
          {conversionType === 'image_to_pdf' && (
            <div className="space-y-3 p-4 bg-slate-950/70 border border-slate-800/80 rounded-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-200">
                    Image to PDF Studio
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Upload one or multiple images (JPG, PNG, WEBP) to compile into a clean PDF
                  </p>
                </div>

                <div className="flex items-center gap-1 text-[11px] text-slate-400 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">
                  <span>Size:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(e.target.value as any)}
                    className="bg-transparent text-indigo-400 font-semibold focus:outline-none"
                  >
                    <option value="A4" className="bg-slate-900 text-white">A4 (Standard)</option>
                    <option value="LETTER" className="bg-slate-900 text-white">US Letter</option>
                    <option value="FIT" className="bg-slate-900 text-white">Fit to Image</option>
                  </select>
                </div>
              </div>

              {/* Image Grid / Upload Box */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                {selectedImages.map((img, idx) => (
                  <div
                    key={img.id}
                    className="relative group rounded-xl border border-slate-800 bg-slate-900 overflow-hidden flex flex-col"
                  >
                    <div className="h-24 bg-slate-950 flex items-center justify-center relative">
                      <img
                        src={img.dataUrl}
                        alt={img.name}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-1 left-1 bg-black/75 px-1.5 py-0.5 rounded text-[9px] font-mono text-white">
                        #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeImage(img.id)}
                        className="absolute top-1 right-1 p-1 bg-red-600/90 hover:bg-red-600 text-white rounded opacity-0 group-hover:opacity-100 transition shadow"
                        title="Remove image"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="p-1.5">
                      <p className="text-[10px] font-medium text-slate-200 truncate">{img.name}</p>
                      <p className="text-[9px] text-slate-500">{img.sizeKb} KB</p>
                    </div>
                  </div>
                ))}

                {/* Upload Button Box */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-32 rounded-xl border-2 border-dashed border-slate-800 hover:border-purple-500 text-slate-400 hover:text-purple-300 bg-slate-900/40 hover:bg-purple-950/10 flex flex-col items-center justify-center gap-1.5 transition text-xs"
                >
                  <div className="p-2 rounded-lg bg-slate-800 group-hover:bg-purple-900/40">
                    <Plus className="w-4 h-4 text-purple-400" />
                  </div>
                  <span className="font-semibold text-[11px]">Upload Image(s)</span>
                  <span className="text-[9px] text-slate-500">JPG, PNG, HEIC, WEBP</span>
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />

              {selectedImages.length > 0 && (
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>{selectedImages.length} page(s) ready</span>
                  <button
                    type="button"
                    onClick={() => setSelectedImages([])}
                    className="text-red-400 hover:underline"
                  >
                    Clear all images
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Workflow 2: Text/Markdown to PDF */}
          {conversionType === 'text_to_pdf' && (
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Markdown / Plain Text Content:
              </label>
              <textarea
                rows={6}
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Enter text or markdown to render as PDF..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
          )}

          {/* Workflow 3: PDF to Images */}
          {conversionType === 'pdf_to_images' && (
            <div className="p-4 bg-slate-950/70 border border-slate-800/80 rounded-2xl text-xs text-slate-300 space-y-2">
              <h4 className="font-bold text-slate-100 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-cyan-400" />
                <span>Extract High-Res Pages as Images</span>
              </h4>
              <p className="text-[11px] text-slate-400">
                Extracts every page of "{doc?.name || 'Selected Document'}" into separate high-resolution JPEG images.
              </p>
              {doc && (
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-[11px]">
                  <span>Total Pages to Extract:</span>
                  <span className="font-bold text-white">{doc.pages.length} Pages</span>
                </div>
              )}
            </div>
          )}

          {/* Workflow 4: PDF to Text */}
          {conversionType === 'pdf_to_text' && (
            <div className="p-4 bg-slate-950/70 border border-slate-800/80 rounded-2xl text-xs text-slate-300 space-y-2">
              <h4 className="font-bold text-slate-100 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>Extract Text Content</span>
              </h4>
              <p className="text-[11px] text-slate-400">
                Export OCR-recognized text, table contents, and form fields into a downloadable .txt file.
              </p>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-800 bg-slate-900">
          <button
            onClick={handleConvert}
            disabled={isConverting || (conversionType === 'image_to_pdf' && selectedImages.length === 0)}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            {isConverting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>
              {conversionType === 'image_to_pdf'
                ? `Convert ${selectedImages.length} Image${selectedImages.length === 1 ? '' : 's'} to PDF`
                : 'Convert & Save'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
