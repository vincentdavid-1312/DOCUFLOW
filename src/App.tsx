import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Camera,
  FolderOpen,
  Sparkles,
  Minimize2,
  ArrowRightLeft,
  CloudCheck,
  Filter,
  FileText,
  SlidersHorizontal,
  RefreshCw,
  HardDrive,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  Layers,
  ArrowUpDown,
  CheckSquare,
  Square,
  Bot,
  Loader2,
  AlertCircle,
  Globe,
  X,
} from 'lucide-react';
import { AppDocument, DocumentCategory, OCROutput } from './types/document';
import { INITIAL_SAMPLE_DOCUMENTS } from './utils/sampleDocuments';
import {
  loadSavedDocuments,
  saveDocumentsLocally,
  syncDocumentsWithCloud,
} from './services/cloudSyncService';
import { performDeepOCR } from './services/geminiService';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { DocumentCard } from './components/DocumentCard';
import { ScannerModal } from './components/ScannerModal';
import { PdfEditor } from './components/PdfEditor';
import { OcrIntelligenceModal } from './components/OcrIntelligenceModal';
import { CompressorModal } from './components/CompressorModal';
import { ConverterModal } from './components/ConverterModal';
import { CloudSyncModal } from './components/CloudSyncModal';
import { BatchActionBar } from './components/BatchActionBar';
import { BatchCompressModal } from './components/BatchCompressModal';
import { BatchConvertModal } from './components/BatchConvertModal';
import { BulkDeleteModal } from './components/BulkDeleteModal';
import { GeminiChatModal } from './components/GeminiChatModal';
import { ShareWebsiteModal } from './components/ShareWebsiteModal';
import { DocumentAttachmentsModal } from './components/DocumentAttachmentsModal';

export default function App() {
  // Documents state
  const [documents, setDocuments] = useState<AppDocument[]>(() => {
    const saved = loadSavedDocuments();
    return saved && saved.length > 0 ? saved : INITIAL_SAMPLE_DOCUMENTS;
  });

  // UI Navigation & Filters
  const [currentTab, setCurrentTab] = useState<'library' | 'ocr' | 'tools' | 'cloud'>('library');
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deviceViewMode, setDeviceViewMode] = useState<'responsive' | 'ios' | 'android' | 'desktop'>('responsive');

  // Batch Processing State
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [isBatchCompressOpen, setIsBatchCompressOpen] = useState(false);
  const [isBatchConvertOpen, setIsBatchConvertOpen] = useState(false);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  const [isBatchOcrRunning, setIsBatchOcrRunning] = useState(false);
  const [batchOcrProgress, setBatchOcrProgress] = useState<{
    current: number;
    total: number;
    docName: string;
  } | null>(null);

  // Modals state
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isPdfEditorOpen, setIsPdfEditorOpen] = useState(false);
  const [isOcrOpen, setIsOcrOpen] = useState(false);
  const [isCompressOpen, setIsCompressOpen] = useState(false);
  const [isConvertOpen, setIsConvertOpen] = useState(false);
  const [converterInitialMode, setConverterInitialMode] = useState<
    'image_to_pdf' | 'text_to_pdf' | 'pdf_to_images' | 'pdf_to_text' | undefined
  >(undefined);
  const [isAttachmentsOpen, setIsAttachmentsOpen] = useState(false);
  const [isCloudModalOpen, setIsCloudModalOpen] = useState(false);
  const [isShareWebsiteOpen, setIsShareWebsiteOpen] = useState(false);
  const [showWebBanner, setShowWebBanner] = useState(true);

  // Active target document for individual modals
  const [selectedDoc, setSelectedDoc] = useState<AppDocument | null>(null);

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);

  // Persist documents to local storage on change
  useEffect(() => {
    saveDocumentsLocally(documents);
  }, [documents]);

  // Initial cloud sync trigger
  useEffect(() => {
    handleTriggerSync();
  }, []);

  const handleTriggerSync = async () => {
    setIsSyncing(true);
    try {
      const res = await syncDocumentsWithCloud(documents);
      if (res.success) {
        setDocuments((prev) => prev.map((d) => ({ ...d, isCloudSynced: true })));
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveScannedDocument = (newDoc: AppDocument, triggerOcr?: boolean) => {
    setDocuments((prev) => [newDoc, ...prev]);
    if (triggerOcr) {
      setSelectedDoc(newDoc);
      setIsOcrOpen(true);
    }
  };

  const handleUpdateDocument = (updated: AppDocument) => {
    setDocuments((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
  };

  const handleDeleteDocument = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    setSelectedDocIds((prev) => prev.filter((docId) => docId !== id));
  };

  const handleSaveOcrData = (docId: string, ocrData: OCROutput) => {
    setDocuments((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, ocrData, isCloudSynced: false } : d))
    );
  };

  const handleAddConvertedDocument = (newDoc: AppDocument) => {
    setDocuments((prev) => [newDoc, ...prev]);
    setSelectedDocIds([]);
    setIsBatchMode(false);
  };

  const handleSaveCompressed = (compressedDoc: AppDocument) => {
    setDocuments((prev) => [compressedDoc, ...prev]);
  };

  // Batch Handlers
  const handleToggleSelect = (doc: AppDocument) => {
    setSelectedDocIds((prev) => {
      const exists = prev.includes(doc.id);
      const updated = exists ? prev.filter((id) => id !== doc.id) : [...prev, doc.id];
      if (updated.length > 0) setIsBatchMode(true);
      return updated;
    });
  };

  const handleSelectAll = () => {
    setSelectedDocIds(filteredDocuments.map((d) => d.id));
    setIsBatchMode(true);
  };

  const handleClearSelection = () => {
    setSelectedDocIds([]);
    setIsBatchMode(false);
  };

  const handleConfirmBulkDelete = () => {
    setDocuments((prev) => prev.filter((d) => !selectedDocIds.includes(d.id)));
    setSelectedDocIds([]);
    setIsBatchMode(false);
    setIsBulkDeleteOpen(false);
  };

  const handleSaveBatchCompressed = (newDocs: AppDocument[]) => {
    setDocuments((prev) => [...newDocs, ...prev]);
    setSelectedDocIds([]);
    setIsBatchMode(false);
  };

  const handleBatchOcr = async () => {
    const targetDocs = documents.filter((d) => selectedDocIds.includes(d.id) && d.pages.length > 0);
    if (targetDocs.length === 0) return;

    setIsBatchOcrRunning(true);
    try {
      for (let i = 0; i < targetDocs.length; i++) {
        const doc = targetDocs[i];
        setBatchOcrProgress({ current: i + 1, total: targetDocs.length, docName: doc.name });

        try {
          const ocrResult = await performDeepOCR({
            imageBase64: doc.pages[0].dataUrl,
            documentContext: doc.name,
          });

          setDocuments((prev) =>
            prev.map((d) =>
              d.id === doc.id ? { ...d, ocrData: ocrResult, isCloudSynced: false } : d
            )
          );
        } catch (docErr) {
          console.warn(`OCR error for ${doc.name}:`, docErr);
        }
      }
    } finally {
      setIsBatchOcrRunning(false);
      setBatchOcrProgress(null);
    }
  };

  // Filter & Search Documents
  const filteredDocuments = documents.filter((doc) => {
    const matchesCategory =
      selectedCategory === 'all' ||
      doc.category === selectedCategory ||
      (selectedCategory === 'ocr' && doc.ocrData);

    const matchesSearch =
      searchQuery.trim() === '' ||
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (doc.ocrData && doc.ocrData.extractedText.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  const selectedDocsList = documents.filter((d) => selectedDocIds.includes(d.id));

  const totalBytes = documents.reduce((acc, d) => acc + (d.sizeBytes || 0), 0);
  const totalMb = totalBytes / (1024 * 1024);

  // App Content Wrapper
  const renderAppContent = () => (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 pb-24 sm:pb-12">
      {/* Top Header */}
      <Header
        deviceViewMode={deviceViewMode}
        setDeviceViewMode={setDeviceViewMode}
        isSyncing={isSyncing}
        onTriggerSync={handleTriggerSync}
        onOpenScanner={() => setIsScannerOpen(true)}
        onOpenCloudModal={() => setIsCloudModalOpen(true)}
        onOpenChat={() => setIsAiChatOpen(true)}
        onOpenShareWebsite={() => setIsShareWebsiteOpen(true)}
        onOpenImageToPdf={() => {
          setSelectedDoc(null);
          setConverterInitialMode('image_to_pdf');
          setIsConvertOpen(true);
        }}
        totalSizeMb={totalMb}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-4 sm:py-6 space-y-6">
        {/* Live Website & Cross-Device PWA Access Banner */}
        {showWebBanner && (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-950/80 via-slate-900 to-cyan-950/40 border border-indigo-500/30 p-3.5 sm:p-4 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white flex-shrink-0 shadow-md shadow-indigo-600/20">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs sm:text-sm font-bold text-white">
                    Live Web App &bull; Accessible on Any Browser or Phone
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Online &amp; PWA
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Open DocuFlow in Apple Safari on iOS or Google Chrome on Android. Supports camera scanning, PDF editing, and cross-device sync.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
              <button
                onClick={() => setIsShareWebsiteOpen(true)}
                className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition active:scale-95"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Website Link &amp; QR</span>
              </button>
              <button
                onClick={() => setShowWebBanner(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                title="Dismiss banner"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Hero Quick Action Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5">
          {/* Quick Scan */}
          <button
            onClick={() => setIsScannerOpen(true)}
            className="group relative p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-indigo-900/40 via-slate-900 to-slate-900 border border-indigo-500/30 hover:border-indigo-500/60 transition-all shadow-sm hover:shadow-indigo-500/10 text-left flex flex-col justify-between"
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform mb-2">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-bold text-white block">Camera Scan</span>
              <span className="text-[10px] text-slate-400">Auto-crop &amp; B&amp;W filters</span>
            </div>
          </button>

          {/* Deep OCR */}
          <button
            onClick={() => {
              if (documents.length > 0) {
                setSelectedDoc(documents[0]);
                setIsOcrOpen(true);
              } else {
                setIsScannerOpen(true);
              }
            }}
            className="group relative p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-purple-900/40 via-slate-900 to-slate-900 border border-purple-500/30 hover:border-purple-500/60 transition-all shadow-sm hover:shadow-purple-500/10 text-left flex flex-col justify-between"
          >
            <div className="w-9 h-9 rounded-xl bg-purple-600/30 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform mb-2">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-bold text-white block flex items-center gap-1">
                <span>Deep OCR</span>
                <span className="text-[9px] font-semibold px-1 py-0.2 bg-purple-500/20 text-purple-300 rounded">
                  Thinking
                </span>
              </span>
              <span className="text-[10px] text-slate-400">Extract tables &amp; forms</span>
            </div>
          </button>

          {/* PDF Compressor */}
          <button
            onClick={() => {
              if (documents.length > 0) {
                setSelectedDoc(documents[0]);
                setIsCompressOpen(true);
              } else {
                setIsScannerOpen(true);
              }
            }}
            className="group relative p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-cyan-900/40 via-slate-900 to-slate-900 border border-cyan-500/30 hover:border-cyan-500/60 transition-all shadow-sm hover:shadow-cyan-500/10 text-left flex flex-col justify-between"
          >
            <div className="w-9 h-9 rounded-xl bg-cyan-600/30 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform mb-2">
              <Minimize2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-bold text-white block">Compress PDF</span>
              <span className="text-[10px] text-slate-400">Reduce size up to -75%</span>
            </div>
          </button>

          {/* Format Converter */}
          <button
            onClick={() => {
              setSelectedDoc(documents[0] || null);
              setConverterInitialMode('image_to_pdf');
              setIsConvertOpen(true);
            }}
            className="group relative p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-emerald-900/40 via-slate-900 to-slate-900 border border-emerald-500/30 hover:border-emerald-500/60 transition-all shadow-sm hover:shadow-emerald-500/10 text-left flex flex-col justify-between"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-600/30 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform mb-2">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-bold text-white block">Image to PDF</span>
              <span className="text-[10px] text-slate-400">Photos &bull; Files &bull; Converter</span>
            </div>
          </button>
        </div>

        {/* Search, Filter & Batch Selector Toolbar */}
        <div className="space-y-2.5">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search documents, tags, or extracted text..."
                className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-9.5 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Batch Mode & Quick Select Bar */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (isBatchMode) {
                    handleClearSelection();
                  } else {
                    setIsBatchMode(true);
                  }
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                  isBatchMode
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                }`}
              >
                <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
                <span>{isBatchMode ? 'Exit Batch Mode' : 'Batch Select'}</span>
                {selectedDocIds.length > 0 && (
                  <span className="w-4 h-4 rounded-full bg-white text-indigo-700 text-[10px] font-bold flex items-center justify-center">
                    {selectedDocIds.length}
                  </span>
                )}
              </button>

              {isBatchMode && (
                <>
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs border border-slate-800 transition"
                  >
                    Select All ({filteredDocuments.length})
                  </button>
                  {selectedDocIds.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearSelection}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white text-xs border border-slate-800 transition"
                    >
                      Deselect
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs">
            {[
              { id: 'all', label: 'All Files' },
              { id: 'scans', label: 'Scans' },
              { id: 'invoices', label: 'Invoices' },
              { id: 'contracts', label: 'Contracts' },
              { id: 'notes', label: 'Notes' },
              { id: 'ocr', label: 'OCR Transcribed' },
            ].map((cat) => {
              const active = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id as DocumentCategory)}
                  className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition ${
                    active
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Batch OCR In-Progress Notification */}
        {isBatchOcrRunning && batchOcrProgress && (
          <div className="p-3.5 rounded-2xl bg-purple-950/40 border border-purple-500/40 flex items-center justify-between gap-3 text-xs text-purple-200 animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
              <span>
                Running High Thinking OCR on <strong>{batchOcrProgress.docName}</strong> (
                {batchOcrProgress.current} of {batchOcrProgress.total})...
              </span>
            </div>
            <span className="font-mono text-purple-300 font-bold">
              {Math.round((batchOcrProgress.current / batchOcrProgress.total) * 100)}%
            </span>
          </div>
        )}

        {/* Documents Grid / Library */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <FolderOpen className="w-3.5 h-3.5 text-indigo-400" />
              <span>
                {selectedCategory === 'all'
                  ? 'All Documents'
                  : `${selectedCategory.toUpperCase()} Documents`}{' '}
                ({filteredDocuments.length})
              </span>
            </h3>
            <span className="text-[11px] text-slate-500">
              Auto-synced across iOS, Android &amp; Web
            </span>
          </div>

          {filteredDocuments.length > 0 ? (
            <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4">
              {filteredDocuments.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  document={doc}
                  isSelected={selectedDocIds.includes(doc.id)}
                  isBatchMode={isBatchMode}
                  onToggleSelect={handleToggleSelect}
                  onOpenEditor={(d) => {
                    setSelectedDoc(d);
                    setIsPdfEditorOpen(true);
                  }}
                  onOpenOcr={(d) => {
                    setSelectedDoc(d);
                    setIsOcrOpen(true);
                  }}
                  onOpenCompress={(d) => {
                    setSelectedDoc(d);
                    setIsCompressOpen(true);
                  }}
                  onOpenConvert={(d) => {
                    setSelectedDoc(d);
                    setConverterInitialMode('image_to_pdf');
                    setIsConvertOpen(true);
                  }}
                  onOpenAttachments={(d) => {
                    setSelectedDoc(d);
                    setIsAttachmentsOpen(true);
                  }}
                  onDeleteDocument={handleDeleteDocument}
                />
              ))}
            </div>
          ) : (
            <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80">
              <FileText className="w-12 h-12 text-slate-700 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-slate-300 mb-1">
                No matching documents found
              </h4>
              <p className="text-xs text-slate-500 mb-4">
                Scan a new document using your camera or import a file to get started.
              </p>
              <button
                onClick={() => setIsScannerOpen(true)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-md shadow-indigo-600/25"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Scan First Document</span>
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Floating AI Copilot Trigger */}
      <button
        onClick={() => setIsAiChatOpen(true)}
        className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-30 p-3 sm:px-4 sm:py-3 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-xl shadow-purple-900/50 border border-purple-400/40 flex items-center gap-2 group transition active:scale-95"
        title="Ask DocuFlow AI Copilot"
      >
        <Bot className="w-5 h-5 group-hover:rotate-12 transition-transform" />
        <span className="text-xs font-bold hidden sm:inline">Ask AI</span>
        {selectedDocIds.length > 0 && (
          <span className="px-1.5 py-0.2 rounded-full bg-cyan-400 text-slate-950 text-[10px] font-bold">
            {selectedDocIds.length}
          </span>
        )}
      </button>

      {/* Mobile-first Bottom Navigation */}
      <BottomNav
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          setCurrentTab(tab);
          if (tab === 'ocr') {
            if (documents.length > 0) {
              setSelectedDoc(documents[0]);
              setIsOcrOpen(true);
            } else {
              setIsScannerOpen(true);
            }
          } else if (tab === 'tools') {
            setSelectedDoc(documents[0] || null);
            setIsCompressOpen(true);
          } else if (tab === 'cloud') {
            setIsCloudModalOpen(true);
          }
        }}
        onOpenScanner={() => setIsScannerOpen(true)}
      />

      {/* Batch Action Bar */}
      <BatchActionBar
        selectedDocs={selectedDocsList}
        onClearSelection={handleClearSelection}
        onOpenBulkDelete={() => setIsBulkDeleteOpen(true)}
        onOpenBatchCompress={() => setIsBatchCompressOpen(true)}
        onOpenBatchConvert={() => setIsBatchConvertOpen(true)}
        onOpenBatchOcr={handleBatchOcr}
        onOpenAiChat={() => setIsAiChatOpen(true)}
      />

      {/* Modals */}
      <ScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onSaveDocument={handleSaveScannedDocument}
      />

      <PdfEditor
        document={selectedDoc}
        isOpen={isPdfEditorOpen}
        onClose={() => setIsPdfEditorOpen(false)}
        onUpdateDocument={handleUpdateDocument}
        onTriggerOcr={(d) => {
          setIsPdfEditorOpen(false);
          setSelectedDoc(d);
          setIsOcrOpen(true);
        }}
        onOpenAttachments={(d) => {
          setSelectedDoc(d);
          setIsAttachmentsOpen(true);
        }}
      />

      <OcrIntelligenceModal
        document={selectedDoc}
        isOpen={isOcrOpen}
        onClose={() => setIsOcrOpen(false)}
        onSaveOcrData={handleSaveOcrData}
      />

      <CompressorModal
        document={selectedDoc}
        isOpen={isCompressOpen}
        onClose={() => setIsCompressOpen(false)}
        onSaveCompressed={handleSaveCompressed}
      />

      <ConverterModal
        document={selectedDoc}
        isOpen={isConvertOpen}
        initialMode={converterInitialMode}
        onClose={() => {
          setIsConvertOpen(false);
          setConverterInitialMode(undefined);
        }}
        onAddConvertedDocument={handleAddConvertedDocument}
      />

      {/* Document Attachments Modal */}
      <DocumentAttachmentsModal
        document={selectedDoc}
        isOpen={isAttachmentsOpen}
        onClose={() => setIsAttachmentsOpen(false)}
        onUpdateDocument={handleUpdateDocument}
      />

      <CloudSyncModal
        isOpen={isCloudModalOpen}
        onClose={() => setIsCloudModalOpen(false)}
        documents={documents}
        isSyncing={isSyncing}
        onTriggerSync={handleTriggerSync}
      />

      {/* Batch Specific Modals */}
      <BatchCompressModal
        isOpen={isBatchCompressOpen}
        onClose={() => setIsBatchCompressOpen(false)}
        selectedDocs={selectedDocsList}
        onSaveBatchCompressed={handleSaveBatchCompressed}
      />

      <BatchConvertModal
        isOpen={isBatchConvertOpen}
        onClose={() => setIsBatchConvertOpen(false)}
        selectedDocs={selectedDocsList}
        onAddConvertedDocument={handleAddConvertedDocument}
      />

      <BulkDeleteModal
        isOpen={isBulkDeleteOpen}
        onClose={() => setIsBulkDeleteOpen(false)}
        selectedDocs={selectedDocsList}
        onConfirmDelete={handleConfirmBulkDelete}
      />

      {/* Multi-Turn Gemini AI Chat Assistant */}
      <GeminiChatModal
        isOpen={isAiChatOpen}
        onClose={() => setIsAiChatOpen(false)}
        allDocuments={documents}
        initialAttachedDocIds={selectedDocIds}
      />

      {/* Website & Cross-Device PWA Access Modal */}
      <ShareWebsiteModal
        isOpen={isShareWebsiteOpen}
        onClose={() => setIsShareWebsiteOpen(false)}
      />
    </div>
  );

  // Return simulated mobile frame if user selects iOS or Android mode
  if (deviceViewMode === 'ios') {
    return (
      <div className="min-h-screen bg-slate-900 py-6 px-2 flex flex-col items-center justify-center">
        <div className="text-center mb-3 text-xs text-slate-400 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
          <span>iPhone 16 Pro Simulator (Touch &amp; Safe-Area Active)</span>
          <button
            onClick={() => setDeviceViewMode('responsive')}
            className="text-indigo-400 hover:underline ml-2"
          >
            Exit Frame
          </button>
        </div>

        <div className="relative w-full max-w-[410px] h-[850px] bg-slate-950 rounded-[50px] p-3 shadow-2xl ring-12 ring-slate-800/80 border-4 border-slate-700/60 overflow-hidden flex flex-col">
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-full z-40 flex items-center justify-end px-3">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-800"></div>
          </div>
          <div className="w-full h-full rounded-[40px] overflow-y-auto overflow-x-hidden pt-7">
            {renderAppContent()}
          </div>
        </div>
      </div>
    );
  }

  if (deviceViewMode === 'android') {
    return (
      <div className="min-h-screen bg-slate-900 py-6 px-2 flex flex-col items-center justify-center">
        <div className="text-center mb-3 text-xs text-slate-400 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Google Pixel 9 Pro Simulator (Android Material Theme)</span>
          <button
            onClick={() => setDeviceViewMode('responsive')}
            className="text-indigo-400 hover:underline ml-2"
          >
            Exit Frame
          </button>
        </div>

        <div className="relative w-full max-w-[420px] h-[860px] bg-slate-950 rounded-[44px] p-2.5 shadow-2xl ring-10 ring-slate-800 border-2 border-slate-700 overflow-hidden flex flex-col">
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-4 h-4 bg-black rounded-full z-40 border border-slate-900"></div>
          <div className="w-full h-full rounded-[36px] overflow-y-auto overflow-x-hidden pt-6">
            {renderAppContent()}
          </div>
        </div>
      </div>
    );
  }

  return renderAppContent();
}
