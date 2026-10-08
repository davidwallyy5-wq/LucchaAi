import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Mic, Paperclip, Check } from 'lucide-react';
import { ThemeConfig, UserGender, UserAssignedName } from '../types/theme';

interface LiquidComposerProps {
  theme: ThemeConfig;
  userGender: UserGender;
  userAssignedName: UserAssignedName;
  onSelectGender: (gender: 'sele' | 'meye') => void;
  onSendMessage: (text: string) => void;
  onFocusChange?: (focused: boolean) => void;
}

export const LiquidComposer: React.FC<LiquidComposerProps> = ({
  theme,
  userGender,
  userAssignedName,
  onSelectGender,
  onSendMessage,
  onFocusChange,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showFirstInteraction, setShowFirstInteraction] = useState(false);
  const [justSelectedName, setJustSelectedName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // If gender is already saved, we never show the question
  const hasSelectedGender = userGender !== null;

  const handleComposerClick = () => {
    if (!hasSelectedGender) {
      setShowFirstInteraction(true);
      return;
    }
    inputRef.current?.focus();
  };

  const handleSelectChoice = (gender: 'sele' | 'meye', e: React.MouseEvent) => {
    e.stopPropagation();
    const assigned = gender === 'sele' ? 'Miku' : 'Araan';
    setJustSelectedName(assigned);
    onSelectGender(gender);

    // After a brief smooth feedback, focus input
    setTimeout(() => {
      setShowFirstInteraction(false);
      setJustSelectedName(null);
      inputRef.current?.focus();
    }, 1200);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasSelectedGender) {
      setShowFirstInteraction(true);
      return;
    }
    if (!inputValue.trim()) return;
    onSendMessage(inputValue.trim());
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  useEffect(() => {
    onFocusChange?.(isFocused || showFirstInteraction);
  }, [isFocused, showFirstInteraction, onFocusChange]);

  return (
    <div className="w-full max-w-2xl mx-auto px-4 pb-4 sm:pb-6 select-none relative z-30">
      {/* Liquid Glass Floating Composer Container */}
      <div
        onClick={handleComposerClick}
        className={`relative transition-all duration-500 rounded-[28px] sm:rounded-[32px] p-[1.5px] cursor-text ${
          isFocused ? 'scale-[1.008]' : 'hover:scale-[1.003]'
        }`}
        style={{
          background: isFocused
            ? `linear-gradient(135deg, rgba(255,255,255,0.95), ${theme.accentColor}33, rgba(255,255,255,0.8))`
            : 'linear-gradient(135deg, rgba(255,255,255,0.85), rgba(220,230,242,0.45), rgba(255,255,255,0.7))',
        }}
      >
        {/* Soft liquid refraction ambient under-glow */}
        <div
          className="absolute -inset-1 rounded-[34px] blur-xl opacity-25 pointer-events-none transition-opacity duration-500"
          style={{
            background: `radial-gradient(ellipse at 50% 100%, ${theme.accentColor}, transparent 70%)`,
            opacity: isFocused ? 0.4 : 0.18,
          }}
        />

        {/* Inner Glass Vessel */}
        <div
          className={`relative rounded-[27px] sm:rounded-[31px] transition-all duration-300 ${theme.composerStyle} overflow-hidden`}
        >
          {/* Subtle liquid sheen line at top border */}
          <div className="absolute top-0 left-12 right-12 h-[1px] bg-gradient-to-r from-transparent via-white to-transparent opacity-80" />

          {/* FIRST CHATBOX INTERACTION: "Tumi sele na meye?" */}
          {(!hasSelectedGender && showFirstInteraction) || justSelectedName ? (
            <div
              className="py-5 px-6 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in zoom-in-95 duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                  style={{ backgroundColor: `${theme.accentColor}18` }}
                >
                  {justSelectedName ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Sparkles className="w-4 h-4" style={{ color: theme.accentColor }} />
                  )}
                </div>
                <div>
                  {justSelectedName ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-800">
                        স্বাগতম, <span className="font-semibold text-slate-900">{justSelectedName}</span>
                      </span>
                    </div>
                  ) : (
                    <span className="text-[15px] font-medium tracking-tight text-slate-800 font-sans">
                      Tumi sele na meye?
                    </span>
                  )}
                </div>
              </div>

              {!justSelectedName && (
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={(e) => handleSelectChoice('sele', e)}
                    className="flex-1 sm:flex-none min-h-[44px] px-6 py-2.5 rounded-full text-xs font-medium tracking-wide transition-all duration-200 bg-white/80 hover:bg-white text-slate-700 hover:text-slate-900 border border-slate-200/80 hover:border-slate-300 shadow-[0_2px_8px_rgba(0,0,0,0.03)] active:scale-95"
                  >
                    <span>Sele</span>
                    <span className="text-[10px] text-slate-400 ml-1.5 font-normal">→ Miku</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => handleSelectChoice('meye', e)}
                    className="flex-1 sm:flex-none min-h-[44px] px-6 py-2.5 rounded-full text-xs font-medium tracking-wide transition-all duration-200 bg-white/80 hover:bg-white text-slate-700 hover:text-slate-900 border border-slate-200/80 hover:border-slate-300 shadow-[0_2px_8px_rgba(0,0,0,0.03)] active:scale-95"
                  >
                    <span>Meye</span>
                    <span className="text-[10px] text-slate-400 ml-1.5 font-normal">→ Araan</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Standard Fluid Conversation Input */
            <form onSubmit={handleSubmit} className="flex items-center px-4 py-2 sm:py-2.5 gap-2">
              {/* Minimal attachment/voice affordance */}
              <button
                type="button"
                aria-label="Add attachment"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-black/[0.03] transition-all duration-200 active:scale-95 shrink-0"
              >
                <Paperclip className="w-4 h-4 opacity-75" />
              </button>

              {/* Text Input */}
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onFocus={() => {
                  if (!hasSelectedGender) {
                    setShowFirstInteraction(true);
                  } else {
                    setIsFocused(true);
                  }
                }}
                onBlur={() => setIsFocused(false)}
                onKeyDown={handleKeyDown}
                placeholder={
                  userAssignedName
                    ? `${userAssignedName}, ask Luccha anything...`
                    : 'Ask Luccha anything...'
                }
                className="flex-1 bg-transparent border-0 outline-none text-[15px] text-slate-800 placeholder:text-slate-400/80 px-2 py-3 font-sans min-w-0"
              />

              {/* Minimal Audio Input Affordance */}
              <button
                type="button"
                aria-label="Voice input"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-black/[0.03] transition-all duration-200 active:scale-95 shrink-0"
              >
                <Mic className="w-4 h-4 opacity-75" />
              </button>

              {/* Send Button */}
              <button
                type="submit"
                aria-label="Send message"
                disabled={!inputValue.trim() && hasSelectedGender}
                className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full transition-all duration-300 shrink-0 ${
                  inputValue.trim()
                    ? 'bg-slate-900 text-white shadow-md shadow-slate-900/15 hover:bg-slate-800 active:scale-95'
                    : 'text-slate-400 hover:text-slate-600 bg-black/[0.02]'
                }`}
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
