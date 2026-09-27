import React from 'react';
import {
  FileText,
  Smartphone,
  Tablet,
  Laptop,
  Camera,
  RefreshCw,
  Bot,
  Globe,
  Share2,
  Upload,
  Image as ImageIcon,
} from 'lucide-react';

interface HeaderProps {
  deviceViewMode: 'responsive' | 'ios' | 'android' | 'desktop';
  setDeviceViewMode: (mode: 'responsive' | 'ios' | 'android' | 'desktop') => void;
  isSyncing: boolean;
  onTriggerSync: () => void;
  onOpenScanner: () => void;
  onOpenCloudModal: () => void;
  onOpenChat: () => void;
  onOpenShareWebsite: () => void;
  onOpenImageToPdf?: () => void;
  totalSizeMb: number;
}

export const Header: React.FC<HeaderProps> = ({
  deviceViewMode,
  setDeviceViewMode,
  isSyncing,
  onTriggerSync,
  onOpenScanner,
  onOpenCloudModal,
  onOpenChat,
  onOpenShareWebsite,
  onOpenImageToPdf,
  totalSizeMb,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Logo & Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/25 ring-1 ring-white/20">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                DocuFlow
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden xs:block">
              Mobile Scanner &bull; PDF Studio &bull; Gemini 3.1 Pro OCR
            </p>
          </div>
        </div>

        {/* Viewport Simulator Tabs */}
        <div className="hidden lg:flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800/80 text-xs">
          <button
            onClick={() => setDeviceViewMode('responsive')}
            className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1.5 ${
              deviceViewMode === 'responsive'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Desktop / Flexible View"
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>Responsive</span>
          </button>
          <button
            onClick={() => setDeviceViewMode('ios')}
            className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1.5 ${
              deviceViewMode === 'ios'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="iPhone 16 Pro Viewport & Safe-Area"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>iOS Mobile</span>
          </button>
          <button
            onClick={() => setDeviceViewMode('android')}
            className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1.5 ${
              deviceViewMode === 'android'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Android Pixel Viewport & Navigation"
          >
            <Tablet className="w-3.5 h-3.5" />
            <span>Android</span>
          </button>
        </div>

        {/* Right Actions: Website Link, Image to PDF, AI Chat, Cloud Sync & Quick Scan */}
        <div className="flex items-center gap-2">
          {/* Image to PDF Quick Action */}
          {onOpenImageToPdf && (
            <button
              onClick={onOpenImageToPdf}
              className="hidden md:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-semibold shadow-sm transition active:scale-95"
              title="Convert photos and images into a single PDF"
            >
              <ImageIcon className="w-3.5 h-3.5 text-purple-400" />
              <span>Image &rarr; PDF</span>
            </button>
          )}

          {/* Website / PWA Share Button */}
          <button
            onClick={onOpenShareWebsite}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold shadow-sm transition active:scale-95"
            title="Open Website Link, QR Code & PWA Install"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Website &amp; App</span>
          </button>

          {/* AI Copilot Button */}
          <button
            onClick={onOpenChat}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600/30 to-indigo-600/30 hover:from-purple-600/50 hover:to-indigo-600/50 border border-purple-500/40 text-purple-200 text-xs font-semibold shadow-sm transition active:scale-95"
            title="Open Gemini AI Document Chatbot"
          >
            <Bot className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">AI Copilot</span>
          </button>

          {/* Cloud Sync Status Button */}
          <button
            onClick={onOpenCloudModal}
            className="group flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-xs font-medium text-slate-300 transition"
            title="Cloud Storage Sync & Devices"
          >
            {isSyncing ? (
              <RefreshCw className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            )}
            <span className="hidden md:inline">
              {isSyncing ? 'Syncing...' : 'Cloud Synced'}
            </span>
            <span className="text-[10px] text-slate-400 hidden lg:inline">
              ({totalSizeMb.toFixed(1)} MB)
            </span>
          </button>

          {/* Scan Action */}
          <button
            onClick={onOpenScanner}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition transform active:scale-95"
          >
            <Camera className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Scan Doc</span>
            <span className="xs:hidden">Scan</span>
          </button>
        </div>
      </div>
    </header>
  );
};
