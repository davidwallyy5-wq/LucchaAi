import React, { useState } from 'react';
import { ThemeConfig, ThemeId } from '../types/theme';
import { THEME_CONFIGS } from '../data/themes';
import { Lock, Eye, Check, ChevronDown, Sparkles } from 'lucide-react';

interface UISelectorBarProps {
  currentTheme: ThemeConfig;
  onSelectTheme: (themeId: ThemeId) => void;
  onLockTheme: (themeId: ThemeId) => void;
}

export const UISelectorBar: React.FC<UISelectorBarProps> = ({
  currentTheme,
  onSelectTheme,
  onLockTheme,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-3xl select-none">
      {/* Floating Pill Header */}
      <div className="bg-white/80 backdrop-blur-xl border border-white/90 shadow-[0_8px_30px_rgba(20,30,45,0.08)] rounded-full px-3 py-1.5 flex items-center justify-between gap-2 transition-all">
        {/* Current Active Preview Tag */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 px-3 py-1 rounded-full hover:bg-black/[0.04] transition-colors text-left"
          title="Browse UI Variations"
        >
          <div
            className="w-2.5 h-2.5 rounded-full animate-pulse"
            style={{ backgroundColor: currentTheme.accentColor }}
          />
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-800 tracking-tight">
              {currentTheme.name}
            </span>
            <span className="text-[11px] text-slate-400 font-normal hidden sm:inline">
              (Preview Mode)
            </span>
          </div>
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />
        </button>

        {/* Lock Action Button */}
        <button
          onClick={() => onLockTheme(currentTheme.id)}
          className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-1.5 rounded-full text-xs font-medium tracking-tight shadow-sm active:scale-95 transition-all"
        >
          <Lock className="w-3 h-3" />
          <span>Lock This UI Design</span>
        </button>
      </div>

      {/* Expanded Selection Grid */}
      {isExpanded && (
        <div className="mt-2 p-3 bg-white/90 backdrop-blur-2xl border border-white/95 rounded-2xl shadow-[0_20px_45px_rgba(20,30,45,0.12)] animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between px-2 pb-2 border-b border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Select 1 of 8 UI Variations to Preview & Lock
            </span>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-xs text-slate-400 hover:text-slate-600 px-2 py-0.5"
            >
              Done
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
            {THEME_CONFIGS.map((t) => {
              const isSelected = t.id === currentTheme.id;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    onSelectTheme(t.id);
                  }}
                  className={`p-2.5 rounded-xl text-left transition-all relative flex flex-col justify-between ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-md'
                      : 'bg-white/60 hover:bg-white text-slate-700 hover:text-slate-900 border border-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: t.accentColor }}
                    />
                    {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <span className="text-xs font-medium tracking-tight truncate block w-full">
                    {t.name}
                  </span>
                  <span
                    className={`text-[10px] mt-0.5 line-clamp-1 ${
                      isSelected ? 'text-slate-300' : 'text-slate-400'
                    }`}
                  >
                    {t.material}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
