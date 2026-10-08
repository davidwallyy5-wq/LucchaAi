import React, { useState, useRef } from 'react';
import { Send, Mic, MicOff, Sparkles, Check, Paperclip, X, PhoneCall } from 'lucide-react';
import { AIPersona, AttachedImage } from '../types/persona';

interface HolographicComposerProps {
  persona: AIPersona;
  onSelectPersonaChoice: (choice: 'sele' | 'meye') => void;
  onSendMessage: (text: string, image?: AttachedImage | null) => void;
  isListening: boolean;
  onToggleVoice: () => void;
  onStartRealtimeCall: () => void;
  onInteractionStart?: () => void;
}

export const HolographicComposer: React.FC<HolographicComposerProps> = ({
  persona,
  onSelectPersonaChoice,
  onSendMessage,
  isListening,
  onToggleVoice,
  onStartRealtimeCall,
  onInteractionStart,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showPersonaPrompt, setShowPersonaPrompt] = useState(false);
  const [confirmingPersona, setConfirmingPersona] = useState<string | null>(null);
  const [attachedImage, setAttachedImage] = useState<AttachedImage | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasPersona = persona !== null;

  const handleContainerClick = (e: React.MouseEvent) => {
    // If the click is inside a button, input, or already handled, do not re-focus
    const target = e.target as HTMLElement | null;
    if (target?.closest('button, input, form')) {
      return;
    }
    onInteractionStart?.();
    if (!hasPersona) {
      setShowPersonaPrompt(true);
      return;
    }
    inputRef.current?.focus();
  };

  const handleChoosePersona = (choice: 'sele' | 'meye', e: React.MouseEvent) => {
    e.stopPropagation();
    // User selects "Sele" -> activate Miku; User selects "Meye" -> activate Araan
    const personaName = choice === 'sele' ? 'Miku' : 'Araan';
    setConfirmingPersona(personaName);

    setTimeout(() => {
      onSelectPersonaChoice(choice);
      setShowPersonaPrompt(false);
      setConfirmingPersona(null);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }, 700);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64String = (reader.result as string).split(',')[1];
      setAttachedImage({
        name: file.name,
        mimeType: file.type || 'image/png',
        data: base64String,
        previewUrl: URL.createObjectURL(file),
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!hasPersona) {
      setShowPersonaPrompt(true);
      return;
    }
    const textToSend = inputValue.trim();
    if (!textToSend && !attachedImage) return;

    // Immediately remove focus from input and activeElement to dismiss Android/mobile virtual keyboard
    if (inputRef.current) {
      inputRef.current.blur();
    }
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setIsFocused(false);

    onSendMessage(textToSend, attachedImage);
    setInputValue('');
    setAttachedImage(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const accentColor =
    persona === 'Miku'
      ? '#4fa6ce'
      : persona === 'Araan'
      ? '#ce729c'
      : '#7d9cb8';

  return (
    <div className="w-full max-w-2xl mx-auto px-4 pb-4 sm:pb-6 select-none relative z-30">
      {/* Attached Image Preview */}
      {attachedImage && (
        <div className="mb-2 px-3 py-1.5 bg-white/80 backdrop-blur-xl border border-white/90 rounded-2xl inline-flex items-center gap-2 shadow-sm animate-in fade-in slide-in-from-bottom-2">
          <img
            src={attachedImage.previewUrl}
            alt="Upload Preview"
            className="w-8 h-8 rounded-lg object-cover border border-slate-200"
          />
          <span className="text-xs text-slate-700 max-w-[140px] truncate">{attachedImage.name}</span>
          <button
            onClick={() => setAttachedImage(null)}
            className="text-slate-400 hover:text-rose-500 p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Liquid-Glass Holographic Floating Vessel */}
      <div
        onClick={handleContainerClick}
        className={`relative transition-all duration-500 rounded-[28px] sm:rounded-[32px] p-[1.5px] cursor-text ${
          isFocused || isListening ? 'scale-[1.008]' : 'hover:scale-[1.002]'
        }`}
        style={{
          background:
            isFocused || isListening
              ? `linear-gradient(135deg, rgba(255,255,255,0.96), ${accentColor}40, rgba(255,255,255,0.85))`
              : 'linear-gradient(135deg, rgba(255,255,255,0.88), rgba(225,235,248,0.5), rgba(255,255,255,0.75))',
        }}
      >
        {/* Soft Holographic Glow Backdrop */}
        <div
          className="absolute -inset-1 rounded-[34px] blur-xl opacity-20 pointer-events-none transition-opacity duration-500"
          style={{
            background: `radial-gradient(ellipse at 50% 100%, ${accentColor}, transparent 70%)`,
            opacity: isFocused || isListening ? 0.45 : 0.18,
          }}
        />

        {/* Inner Glass Shell */}
        <div className="relative rounded-[27px] sm:rounded-[31px] bg-white/70 backdrop-blur-2xl border border-white/85 shadow-[0_12px_40px_rgba(30,45,65,0.06),inset_0_1px_3px_rgba(255,255,255,0.98)] overflow-hidden transition-all duration-300">
          {/* Subtle Top Caustic Hairline */}
          <div className="absolute top-0 left-10 right-10 h-[1px] bg-gradient-to-r from-transparent via-white to-transparent opacity-90" />

          {/* FIRST CHAT OPEN INTERACTION: "Tumi sele na meye?" */}
          {(!hasPersona && showPersonaPrompt) || confirmingPersona ? (
            <div
              className="py-4 sm:py-4.5 px-5 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 animate-in fade-in zoom-in-95 duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                  style={{ backgroundColor: `${accentColor}18` }}
                >
                  {confirmingPersona ? (
                    <Check className="w-4 h-4 text-emerald-600 animate-in zoom-in" />
                  ) : (
                    <Sparkles className="w-4 h-4" style={{ color: accentColor }} />
                  )}
                </div>

                <div>
                  {confirmingPersona ? (
                    <span className="text-[15px] font-medium text-slate-800 tracking-tight">
                      {confirmingPersona}
                    </span>
                  ) : (
                    <span className="text-[15px] font-medium tracking-tight text-slate-800 font-sans">
                      Tumi sele na meye?
                    </span>
                  )}
                </div>
              </div>

              {!confirmingPersona && (
                <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={(e) => handleChoosePersona('sele', e)}
                    className="flex-1 sm:flex-none min-h-[44px] px-6 py-2.5 rounded-full text-xs font-medium tracking-wide transition-all duration-200 bg-white/80 hover:bg-white text-slate-800 hover:text-slate-950 border border-slate-200/80 hover:border-slate-300 shadow-[0_2px_8px_rgba(0,0,0,0.03)] active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <span>Sele</span>
                    <span className="text-[11px] text-rose-500 font-normal">→ Miku</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => handleChoosePersona('meye', e)}
                    className="flex-1 sm:flex-none min-h-[44px] px-6 py-2.5 rounded-full text-xs font-medium tracking-wide transition-all duration-200 bg-white/80 hover:bg-white text-slate-800 hover:text-slate-950 border border-slate-200/80 hover:border-slate-300 shadow-[0_2px_8px_rgba(0,0,0,0.03)] active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <span>Meye</span>
                    <span className="text-[11px] text-sky-600 font-normal">→ Araan</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Permanent Conversation Input Interface */
            <form onSubmit={handleSubmit} className="flex items-center px-3 sm:px-4 py-2 sm:py-2.5 gap-1.5 sm:gap-2">
              {/* Attachment / Multimodal Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-black/[0.03] transition-colors shrink-0"
                title="Attach photo, screenshot, or document"
              >
                <Paperclip className="w-4 h-4 opacity-75" />
              </button>

              {/* Text Input Field */}
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onFocus={() => {
                  if (!hasPersona) {
                    setShowPersonaPrompt(true);
                  } else {
                    setIsFocused(true);
                  }
                }}
                onBlur={() => setIsFocused(false)}
                onKeyDown={handleKeyDown}
                enterKeyHint="send"
                autoComplete="off"
                autoCorrect="off"
                placeholder={
                  persona ? `${persona}-কে কিছু বলো...` : 'Type a message...'
                }
                className="flex-1 bg-transparent border-0 outline-none text-[15px] text-slate-800 placeholder:text-slate-400/80 px-2 py-3 font-sans min-w-0"
              />

              {/* Realtime Call Trigger Button */}
              {persona && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartRealtimeCall();
                  }}
                  className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-full text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors shrink-0"
                  title="Realtime Voice Call"
                >
                  <PhoneCall className="w-4 h-4 opacity-75" />
                </button>
              )}

              {/* Dictation / Voice Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleVoice();
                }}
                aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
                className={`min-h-[40px] min-w-[40px] flex items-center justify-center rounded-full transition-all duration-200 active:scale-95 shrink-0 ${
                  isListening
                    ? 'bg-rose-50 text-rose-600 animate-pulse'
                    : 'text-slate-400 hover:text-slate-600 hover:bg-black/[0.03]'
                }`}
                title="Voice input"
              >
                {isListening ? (
                  <MicOff className="w-4 h-4 text-rose-500" />
                ) : (
                  <Mic className="w-4 h-4 opacity-75" />
                )}
              </button>

              {/* Send Control Affordance */}
              <button
                type="submit"
                aria-label="Send message"
                disabled={(!inputValue.trim() && !attachedImage) && hasPersona}
                onPointerDown={(e) => {
                  e.stopPropagation();
                }}
                onClick={(e) => {
                  e.stopPropagation();
                }}
                className={`min-h-[40px] min-w-[40px] flex items-center justify-center rounded-full transition-all duration-300 shrink-0 ${
                  inputValue.trim() || attachedImage
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
