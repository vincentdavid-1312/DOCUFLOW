import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import {
  X,
  Share2,
  Copy,
  Check,
  Globe,
  Smartphone,
  Monitor,
  ExternalLink,
  QrCode,
  Sparkles,
  DownloadCloud,
  CheckCircle2,
  ShieldCheck,
  WifiOff,
} from 'lucide-react';

interface ShareWebsiteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShareWebsiteModal: React.FC<ShareWebsiteModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [activePlatform, setActivePlatform] = useState<'ios' | 'android' | 'desktop'>('ios');
  const [webUrl, setWebUrl] = useState('');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = window.location.href;
      setWebUrl(url);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && webUrl && canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        webUrl,
        {
          width: 180,
          margin: 1.5,
          color: {
            dark: '#0f172a',
            light: '#ffffff',
          },
        },
        (error) => {
          if (error) console.error('Failed to generate QR Code:', error);
        }
      );
    }
  }, [isOpen, webUrl]);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(webUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'DocuFlow - Document & PDF Studio',
          text: 'Scan, edit PDFs, extract text with high-thinking OCR, and sync files across all your devices on the web!',
          url: webUrl,
        });
      } catch {
        // Ignored if cancelled
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Available Everywhere as a Website
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Live & Ready
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Access your documents, scanner, and tools on any phone, tablet, or browser
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Quick URL & Copy / Share Card */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 space-y-3">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-indigo-400" />
              Direct Website Link
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-slate-900/90 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-indigo-200 truncate select-all">
                {webUrl || 'https://ais-pre-jdvrmnihpqrf63eicq53wp-208726295390.asia-southeast1.run.app'}
              </div>
              <button
                onClick={handleCopy}
                className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-colors flex-shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
              {typeof navigator !== 'undefined' && 'share' in navigator && (
                <button
                  onClick={handleNativeShare}
                  className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors flex-shrink-0"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Share</span>
                </button>
              )}
            </div>
          </div>

          {/* QR Code Scan & Open Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center bg-gradient-to-br from-indigo-950/30 to-slate-900/40 border border-indigo-500/20 rounded-xl p-4">
            <div className="flex flex-col items-center justify-center p-3 bg-white rounded-xl shadow-lg border border-slate-200 max-w-[200px] mx-auto sm:mx-0">
              <canvas ref={canvasRef} className="rounded" />
              <span className="text-[10px] font-semibold text-slate-600 mt-1 flex items-center gap-1">
                <QrCode className="w-3 h-3 text-indigo-600" /> Point Camera to Open
              </span>
            </div>

            <div className="space-y-2 text-center sm:text-left">
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-300 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20">
                <Sparkles className="w-3.5 h-3.5" /> Open Instantly on Mobile
              </div>
              <h3 className="text-sm font-bold text-white">Scan with Your Phone Camera</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Scan the QR code with your iPhone or Android camera app to open DocuFlow directly in Safari or Chrome. No app store installation required!
              </p>
            </div>
          </div>

          {/* Cross-Platform Web & PWA Install Instructions */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <DownloadCloud className="w-4 h-4 text-cyan-400" />
              Install as a Web App (PWA)
            </h3>

            {/* Platform Selector */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setActivePlatform('ios')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
                  activePlatform === 'ios'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                iOS (iPhone / iPad)
              </button>
              <button
                onClick={() => setActivePlatform('android')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
                  activePlatform === 'android'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                Android
              </button>
              <button
                onClick={() => setActivePlatform('desktop')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
                  activePlatform === 'desktop'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                Mac / Windows
              </button>
            </div>

            {/* Platform Instructions Box */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 text-xs space-y-2.5 text-slate-300">
              {activePlatform === 'ios' && (
                <div className="space-y-2">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">
                      1
                    </span>
                    <p>Open this URL in <strong>Apple Safari</strong> on your iPhone or iPad.</p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">
                      2
                    </span>
                    <p>Tap the <strong>Share</strong> button (box with an upward arrow) at the bottom.</p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">
                      3
                    </span>
                    <p>Scroll down and select <strong>"Add to Home Screen"</strong>.</p>
                  </div>
                  <p className="text-[11px] text-indigo-300/80 pt-1 border-t border-slate-800/80">
                    DocuFlow will open full-screen like a native iOS app with full camera and cloud sync access!
                  </p>
                </div>
              )}

              {activePlatform === 'android' && (
                <div className="space-y-2">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">
                      1
                    </span>
                    <p>Open this URL in <strong>Google Chrome</strong> on your Android device.</p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">
                      2
                    </span>
                    <p>Tap the <strong>three dots menu (⋮)</strong> in the top-right corner.</p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">
                      3
                    </span>
                    <p>Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</p>
                  </div>
                </div>
              )}

              {activePlatform === 'desktop' && (
                <div className="space-y-2">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">
                      1
                    </span>
                    <p>In Chrome, Edge, or Brave, look at the right side of the address bar.</p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">
                      2
                    </span>
                    <p>Click the <strong>Install DocuFlow</strong> icon (computer monitor with download arrow).</p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">
                      3
                    </span>
                    <p>DocuFlow launches in its own dedicated, distraction-free desktop window.</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Web Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <div className="text-[11px] leading-tight text-slate-300">
                <strong className="block text-white">No App Store Needed</strong>
                Runs directly in web browsers
              </div>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              <div className="text-[11px] leading-tight text-slate-300">
                <strong className="block text-white">Client-Side Privacy</strong>
                PDF editing runs in your browser
              </div>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-2.5">
              <WifiOff className="w-4 h-4 text-indigo-400 flex-shrink-0" />
              <div className="text-[11px] leading-tight text-slate-300">
                <strong className="block text-white">Offline Ready</strong>
                Service Worker shell caching
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Works on Chrome, Safari, Edge, Firefox, iOS, and Android
          </span>
          <div className="flex items-center gap-2">
            <a
              href={webUrl || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <span>Open in New Window</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
