import React from 'react';
import {
  CloudCheck,
  CloudUpload,
  RefreshCw,
  Smartphone,
  Tablet,
  Laptop,
  X,
  HardDrive,
  ShieldCheck,
  CheckCircle2,
  Share2,
} from 'lucide-react';
import { KNOWN_DEVICES, getOrCreateDeviceId } from '../services/cloudSyncService';
import { AppDocument } from '../types/document';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  documents: AppDocument[];
  isSyncing: boolean;
  onTriggerSync: () => void;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  isOpen,
  onClose,
  documents,
  isSyncing,
  onTriggerSync,
}) => {
  if (!isOpen) return null;

  const currentDeviceId = getOrCreateDeviceId();
  const totalBytes = documents.reduce((acc, d) => acc + (d.sizeBytes || 0), 0);
  const totalMb = (totalBytes / (1024 * 1024)).toFixed(2);
  const syncedCount = documents.filter((d) => d.isCloudSynced).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CloudCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                Cloud Sync &amp; Device Network
              </h3>
              <p className="text-[11px] text-slate-400">
                Multi-device synchronization &bull; Firestore encrypted backup
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

        {/* Body */}
        <div className="p-5 space-y-5">
          {/* Storage Quota Card */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <HardDrive className="w-4 h-4 text-indigo-400" />
                <span>Cloud Storage Footprint</span>
              </span>
              <span className="font-mono text-indigo-400 font-bold">{totalMb} MB / 15 GB Free</span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full"
                style={{ width: `${Math.max(4, Math.min(100, (parseFloat(totalMb) / 150) * 100))}%` }}
              ></div>
            </div>

            <div className="flex justify-between items-center text-[11px] text-slate-400 pt-1">
              <span>{syncedCount} of {documents.length} docs backed up</span>
              <span className="flex items-center gap-1 text-emerald-400 font-medium">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>AES-256 Encrypted</span>
              </span>
            </div>
          </div>

          {/* Connected Devices */}
          <div>
            <span className="text-xs font-bold text-slate-300 block mb-2.5">
              Active Synchronized Devices
            </span>
            <div className="space-y-2">
              {KNOWN_DEVICES.map((dev) => {
                const Icon =
                  dev.platform === 'ios'
                    ? Smartphone
                    : dev.platform === 'android'
                    ? Tablet
                    : Laptop;
                return (
                  <div
                    key={dev.id}
                    className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-slate-800 text-indigo-400">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-200">{dev.name}</span>
                          {dev.isCurrent && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-500/20 text-indigo-300">
                              This Device
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400">
                          Active: {dev.lastSeen}
                        </span>
                      </div>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex justify-between items-center">
          <div className="text-[11px] text-slate-400">
            Current Device ID: <span className="font-mono text-slate-300">{currentDeviceId.slice(0, 14)}...</span>
          </div>
          <button
            onClick={onTriggerSync}
            disabled={isSyncing}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Cloud Now'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
