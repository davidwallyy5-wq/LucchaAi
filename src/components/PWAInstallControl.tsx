import React from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { X, Share, PlusSquare } from 'lucide-react';

export const PWAInstallControl: React.FC = () => {
  const {
    isInstallable,
    isInstalled,
    isIOS,
    showIOSPrompt,
    triggerInstall,
    closeIOSPrompt,
  } = usePWAInstall();

  // Hide completely if already installed or if installation is not supported
  if (isInstalled || !isInstallable) {
    return null;
  }

  return (
    <div className="relative">
      {/* Icon-Only Installation Control */}
      <button
        onClick={triggerInstall}
        className="group relative min-w-[34px] min-h-[34px] w-[34px] h-[34px] rounded-full flex items-center justify-center bg-white/70 hover:bg-white backdrop-blur-md border border-white/85 shadow-sm active:scale-95 transition-all duration-300"
        title="Install Luccha"
        aria-label="Install Luccha App"
      >
        {/* Subtle Ambient Pulse */}
        <span className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-sky-400/20 to-pink-400/20 blur-[3px] opacity-70 group-hover:opacity-100 transition-opacity" />

        {/* Premium Micro-Chip Liquid Icon */}
        <svg
          viewBox="0 0 24 24"
          className="w-4 h-4 relative z-10 text-slate-700 group-hover:text-slate-900 transition-colors"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Microchip Outer Die Frame */}
          <rect x="5" y="5" width="14" height="14" rx="3.5" stroke="currentColor" />
          {/* Internal Micro-Node Core */}
          <circle cx="12" cy="12" r="2.2" fill="url(#pwaChipGrad)" stroke="none" />
          {/* Micro Pins */}
          <line x1="9" y1="2" x2="9" y2="5" />
          <line x1="15" y1="2" x2="15" y2="5" />
          <line x1="9" y1="19" x2="9" y2="22" />
          <line x1="15" y1="19" x2="15" y2="22" />
          <line x1="2" y1="9" x2="5" y2="9" />
          <line x1="2" y1="15" x2="5" y2="15" />
          <line x1="19" y1="9" x2="22" y2="9" />
          <line x1="19" y1="15" x2="22" y2="15" />
          <defs>
            <linearGradient id="pwaChipGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#4fa6ce" />
              <stop offset="100%" stop-color="#ce729c" />
            </linearGradient>
          </defs>
        </svg>

        {/* Tiny connected indicator dot */}
        <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
      </button>

      {/* iOS Safari Graceful Installation Guide Popover */}
      {isIOS && showIOSPrompt && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-950/25 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-[24px] bg-white/95 backdrop-blur-2xl border border-white p-5 shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <img
                  src="/icons/icon-192x192.png"
                  alt="Luccha"
                  className="w-10 h-10 rounded-xl shadow-sm border border-slate-200/80"
                />
                <div>
                  <h4 className="text-[15px] font-semibold text-slate-800 tracking-tight">Luccha AI</h4>
                  <p className="text-xs text-slate-500 font-sans">Install on iOS Home Screen</p>
                </div>
              </div>
              <button
                onClick={closeIOSPrompt}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-slate-600 bg-slate-50/80 rounded-2xl p-3.5 border border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-white shadow-xs border border-slate-200 flex items-center justify-center shrink-0">
                  <Share className="w-3.5 h-3.5 text-sky-600" />
                </div>
                <span>
                  Tap <strong>Share</strong> in Safari menu bar
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-white shadow-xs border border-slate-200 flex items-center justify-center shrink-0">
                  <PlusSquare className="w-3.5 h-3.5 text-slate-700" />
                </div>
                <span>
                  Select <strong>Add to Home Screen</strong>
                </span>
              </div>
            </div>

            <button
              onClick={closeIOSPrompt}
              className="mt-4 w-full py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition shadow-sm"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
