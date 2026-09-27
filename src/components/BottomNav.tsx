import React from 'react';
import {
  FolderOpen,
  Camera,
  Sparkles,
  Minimize2,
  CloudCheck,
} from 'lucide-react';

interface BottomNavProps {
  currentTab: 'library' | 'ocr' | 'tools' | 'cloud';
  setCurrentTab: (tab: 'library' | 'ocr' | 'tools' | 'cloud') => void;
  onOpenScanner: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  setCurrentTab,
  onOpenScanner,
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800/80 px-4 py-2 pb-safe">
      <div className="max-w-md mx-auto flex items-center justify-between relative">
        {/* Library Tab */}
        <button
          onClick={() => setCurrentTab('library')}
          className={`flex-1 flex flex-col items-center gap-1 py-1 transition ${
            currentTab === 'library'
              ? 'text-indigo-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FolderOpen className="w-5 h-5" />
          <span className="text-[10px]">Files</span>
        </button>

        {/* OCR Tab */}
        <button
          onClick={() => setCurrentTab('ocr')}
          className={`flex-1 flex flex-col items-center gap-1 py-1 transition ${
            currentTab === 'ocr'
              ? 'text-indigo-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-5 h-5 text-purple-400" />
          <span className="text-[10px]">Deep OCR</span>
        </button>

        {/* Center Floating Camera Shutter */}
        <div className="flex-1 flex justify-center -mt-6">
          <button
            onClick={onOpenScanner}
            className="w-14 h-14 rounded-full bg-gradient-to-tr from-cyan-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-xl shadow-indigo-600/40 ring-4 ring-slate-900 transition transform active:scale-90 hover:scale-105"
            title="Scan Document"
          >
            <Camera className="w-6 h-6" />
          </button>
        </div>

        {/* Tools & Compress Tab */}
        <button
          onClick={() => setCurrentTab('tools')}
          className={`flex-1 flex flex-col items-center gap-1 py-1 transition ${
            currentTab === 'tools'
              ? 'text-indigo-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Minimize2 className="w-5 h-5 text-cyan-400" />
          <span className="text-[10px]">Tools</span>
        </button>

        {/* Cloud Sync Tab */}
        <button
          onClick={() => setCurrentTab('cloud')}
          className={`flex-1 flex flex-col items-center gap-1 py-1 transition ${
            currentTab === 'cloud'
              ? 'text-indigo-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <CloudCheck className="w-5 h-5 text-emerald-400" />
          <span className="text-[10px]">Sync</span>
        </button>
      </div>
    </div>
  );
};
