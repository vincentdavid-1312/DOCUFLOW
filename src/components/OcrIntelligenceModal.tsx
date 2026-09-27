import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Copy,
  Check,
  Download,
  FileText,
  Languages,
  FileCheck,
  BrainCircuit,
  Table,
  PenTool,
  RefreshCw,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { AppDocument, OCROutput } from '../types/document';
import { performDeepOCR, performDocAnalysis } from '../services/geminiService';
import { createPdfFromText, downloadBlob } from '../utils/pdfEngine';

interface OcrIntelligenceModalProps {
  document: AppDocument | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveOcrData: (docId: string, ocrData: OCROutput) => void;
}

export const OcrIntelligenceModal: React.FC<OcrIntelligenceModalProps> = ({
  document: doc,
  isOpen,
  onClose,
  onSaveOcrData,
}) => {
  if (!isOpen || !doc) return null;

  const [ocrData, setOcrData] = useState<OCROutput | null>(doc.ocrData || null);
  const [isLoading, setIsLoading] = useState<boolean>(!doc.ocrData);
  const [activeTab, setActiveTab] = useState<'formatted' | 'raw' | 'analysis' | 'entities'>('formatted');
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Deep Analysis state
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('Spanish');

  // Trigger OCR if not yet processed
  React.useEffect(() => {
    if (!doc.ocrData && isOpen) {
      runOcrProcess();
    } else if (doc.ocrData) {
      setOcrData(doc.ocrData);
    }
  }, [doc, isOpen]);

  const runOcrProcess = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      // Pick first page or combined pages
      const pageToScan = doc.pages[0]?.dataUrl;
      if (!pageToScan) {
        throw new Error('No page data available to perform OCR on.');
      }

      const result = await performDeepOCR({
        imageBase64: pageToScan,
        documentContext: `Document title: ${doc.name}`,
      });

      setOcrData(result);
      onSaveOcrData(doc.id, result);
    } catch (err: any) {
      console.error('Deep OCR failed:', err);
      setErrorMessage(err.message || 'Failed to complete OCR extraction.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyText = () => {
    if (!ocrData) return;
    navigator.clipboard.writeText(ocrData.extractedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    if (!ocrData) return;
    const blob = new Blob([ocrData.extractedText], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.name.replace(/\.[^/.]+$/, '')}_OCR.md`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const handleDownloadTxt = () => {
    if (!ocrData) return;
    const blob = new Blob([ocrData.extractedText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.name.replace(/\.[^/.]+$/, '')}_OCR.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const handleExportOcrAsPdf = async () => {
    if (!ocrData) return;
    const pdfBytes = await createPdfFromText(ocrData.title || doc.name, ocrData.extractedText);
    downloadBlob(pdfBytes, `${doc.name.replace(/\.[^/.]+$/, '')}_Clean_OCR.pdf`);
  };

  const handleRunAnalysis = async (task: 'summary' | 'translate' | 'simplify' | 'action_items') => {
    if (!ocrData?.extractedText) return;
    setIsAnalyzing(true);
    try {
      const res = await performDocAnalysis(ocrData.extractedText, task, selectedLanguage);
      setAnalysisResult(res);
      setActiveTab('analysis');
    } catch (err: any) {
      setAnalysisResult(`Analysis Error: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/95">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 text-white shadow-md shadow-indigo-500/20">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-100">
                  Deep OCR &amp; Intelligence
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Gemini 3.1 Pro (High Thinking)
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Source: {doc.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyText}
              disabled={!ocrData}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
              title="Copy Extracted Text"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden xs:inline">{copied ? 'Copied!' : 'Copy'}</span>
            </button>

            <button
              onClick={handleExportOcrAsPdf}
              disabled={!ocrData}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition"
              title="Export as Fresh Formatted PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Loading State with High Thinking Animation */}
        {isLoading && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-950 text-center">
            <div className="relative mb-6">
              <div className="w-20 h-20 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <BrainCircuit className="w-8 h-8 text-indigo-400 animate-pulse" />
              </div>
            </div>
            <h4 className="text-base font-bold text-slate-200 mb-2">
              Gemini 3.1 Pro Thinking Mode Active
            </h4>
            <p className="text-xs text-indigo-300 max-w-md font-mono bg-indigo-950/40 border border-indigo-500/30 rounded-lg p-3">
              Thinking Level: HIGH &bull; Inspecting typography, table boundaries, handwritten notes, and entity relationships...
            </p>
          </div>
        )}

        {/* Error message */}
        {errorMessage && (
          <div className="p-4 bg-red-950/40 border-b border-red-800 text-red-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={runOcrProcess}
              className="px-2.5 py-1 rounded bg-red-800 hover:bg-red-700 text-white font-medium"
            >
              Retry
            </button>
          </div>
        )}

        {/* OCR Result View */}
        {!isLoading && ocrData && (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-950">
            {/* Left Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden border-b md:border-b-0 md:border-r border-slate-800">
              {/* Tabs */}
              <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-slate-900/80 text-xs">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('formatted')}
                    className={`px-3 py-1.5 rounded-lg font-medium transition ${
                      activeTab === 'formatted'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Formatted Text
                  </button>
                  <button
                    onClick={() => setActiveTab('raw')}
                    className={`px-3 py-1.5 rounded-lg font-medium transition ${
                      activeTab === 'raw'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Raw Text
                  </button>
                  <button
                    onClick={() => setActiveTab('entities')}
                    className={`px-3 py-1.5 rounded-lg font-medium transition ${
                      activeTab === 'entities'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Entities &amp; Tables ({ocrData.entities.length})
                  </button>
                  {analysisResult && (
                    <button
                      onClick={() => setActiveTab('analysis')}
                      className={`px-3 py-1.5 rounded-lg font-medium transition ${
                        activeTab === 'analysis'
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'text-purple-400 hover:text-purple-300'
                      }`}
                    >
                      AI Analysis
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleDownloadMarkdown}
                    className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                    title="Download Markdown"
                  >
                    .md
                  </button>
                  <button
                    onClick={handleDownloadTxt}
                    className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                    title="Download Plain Text"
                  >
                    .txt
                  </button>
                </div>
              </div>

              {/* Tab Panel Content */}
              <div className="flex-1 p-4 overflow-y-auto font-sans text-slate-200 leading-relaxed text-sm">
                {activeTab === 'formatted' && (
                  <div className="prose prose-invert max-w-none space-y-3 font-mono text-xs sm:text-sm bg-slate-900/50 p-4 rounded-xl border border-slate-800/80 whitespace-pre-wrap">
                    {ocrData.extractedText}
                  </div>
                )}

                {activeTab === 'raw' && (
                  <textarea
                    value={ocrData.extractedText}
                    onChange={(e) =>
                      setOcrData({ ...ocrData, extractedText: e.target.value })
                    }
                    className="w-full h-full min-h-[350px] bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs font-mono text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                )}

                {activeTab === 'entities' && (
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Extracted Metadata &amp; Key-Value Pairs
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {ocrData.entities.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between"
                        >
                          <span className="text-[10px] uppercase font-bold text-indigo-400">
                            {item.label}
                          </span>
                          <span className="text-sm font-semibold text-slate-100 mt-1">
                            {item.value}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 mt-4">
                      <span className="text-xs font-bold text-slate-300">Scan Analytics</span>
                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="bg-slate-950 p-2 rounded-lg">
                          <span className="text-slate-400 text-[10px] block">Confidence</span>
                          <span className="text-emerald-400 font-bold">
                            {Math.round(ocrData.confidenceScore * 100)}%
                          </span>
                        </div>
                        <div className="bg-slate-950 p-2 rounded-lg">
                          <span className="text-slate-400 text-[10px] block">Tables</span>
                          <span className="text-indigo-400 font-bold">
                            {ocrData.tablesDetected}
                          </span>
                        </div>
                        <div className="bg-slate-950 p-2 rounded-lg">
                          <span className="text-slate-400 text-[10px] block">Language</span>
                          <span className="text-cyan-400 font-bold">
                            {ocrData.languageDetected}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'analysis' && analysisResult && (
                  <div className="bg-slate-900/90 border border-purple-500/30 rounded-xl p-4 whitespace-pre-wrap font-sans text-sm text-slate-200">
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-purple-500/20 text-purple-300 font-bold text-xs">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      <span>Gemini Intelligence Output</span>
                    </div>
                    {analysisResult}
                  </div>
                )}
              </div>
            </div>

            {/* Right Document Intelligence Sidebar */}
            <div className="w-full md:w-80 bg-slate-900/95 p-4 flex flex-col justify-between overflow-y-auto space-y-4">
              <div className="space-y-4">
                {/* Summary Card */}
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-indigo-400 block mb-1">
                    Document Summary
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {ocrData.summary}
                  </p>
                </div>

                {/* AI Transformation Actions */}
                <div>
                  <h4 className="text-xs font-bold text-slate-200 mb-2.5 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span>Deep Thinking Actions</span>
                  </h4>

                  <div className="space-y-1.5">
                    <button
                      onClick={() => handleRunAnalysis('action_items')}
                      disabled={isAnalyzing}
                      className="w-full py-2 px-3 rounded-lg bg-slate-800/90 hover:bg-slate-800 text-slate-200 text-xs font-medium border border-slate-700/80 flex items-center justify-between transition disabled:opacity-50"
                    >
                      <span>Extract Action Items &amp; Deadlines</span>
                      <FileCheck className="w-3.5 h-3.5 text-indigo-400" />
                    </button>

                    <button
                      onClick={() => handleRunAnalysis('simplify')}
                      disabled={isAnalyzing}
                      className="w-full py-2 px-3 rounded-lg bg-slate-800/90 hover:bg-slate-800 text-slate-200 text-xs font-medium border border-slate-700/80 flex items-center justify-between transition disabled:opacity-50"
                    >
                      <span>Explain in Plain English</span>
                      <BrainCircuit className="w-3.5 h-3.5 text-cyan-400" />
                    </button>

                    {/* Translation */}
                    <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-300">
                        <span className="flex items-center gap-1">
                          <Languages className="w-3 h-3 text-emerald-400" />
                          <span>Translate Doc:</span>
                        </span>
                        <select
                          value={selectedLanguage}
                          onChange={(e) => setSelectedLanguage(e.target.value)}
                          className="bg-slate-900 border border-slate-700 text-xs text-white rounded px-2 py-0.5 focus:outline-none"
                        >
                          <option value="Spanish">Spanish</option>
                          <option value="French">French</option>
                          <option value="German">German</option>
                          <option value="Japanese">Japanese</option>
                          <option value="Chinese (Mandarin)">Chinese</option>
                          <option value="Portuguese">Portuguese</option>
                          <option value="Arabic">Arabic</option>
                        </select>
                      </div>
                      <button
                        onClick={() => handleRunAnalysis('translate')}
                        disabled={isAnalyzing}
                        className="w-full py-1.5 px-2 rounded bg-indigo-600/30 hover:bg-indigo-600/40 text-indigo-300 text-xs font-medium border border-indigo-500/40 flex items-center justify-center gap-1 transition"
                      >
                        {isAnalyzing ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <span>Translate with Layout</span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Re-run button */}
              <div className="pt-2 border-t border-slate-800">
                <button
                  onClick={runOcrProcess}
                  className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 flex items-center justify-center gap-1.5 transition"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Re-scan with Gemini 3.1 Pro</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
