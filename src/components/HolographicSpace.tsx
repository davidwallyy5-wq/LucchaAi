import React, { useRef, useEffect, useState } from 'react';
import { Holographic3D } from './Holographic3D';
import { AIPersona, ChatMessage } from '../types/persona';
import { Copy, Check, ChevronDown } from 'lucide-react';

interface HolographicSpaceProps {
  persona: AIPersona;
  messages: ChatMessage[];
  isListening: boolean;
  isThinking: boolean;
  isStreaming: boolean;
  onRetryMessage?: (msgId: string) => void;
}

export const HolographicSpace: React.FC<HolographicSpaceProps> = ({
  persona,
  messages,
  isListening,
  isThinking,
  isStreaming,
  onRetryMessage,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef<boolean>(true);
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState<boolean>(false);

  // Monitor scroll position: only track user intent, never force-scroll if user scrolled up
  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const isNear = distanceFromBottom <= 120;
    isNearBottomRef.current = isNear;
    setShowScrollBottomBtn(!isNear && messages.length > 2);
  };

  // Follow the newest streamed tokens ONLY if user is already near the bottom
  useEffect(() => {
    if (isNearBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: isStreaming ? 'auto' : 'smooth' });
    }
  }, [messages, isStreaming]);

  // Jump to newest message on manual demand
  const scrollToBottom = () => {
    isNearBottomRef.current = true;
    setShowScrollBottomBtn(false);
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Opening screen showing ONLY "Ami Luccha"
  if (!persona) {
    return (
      <div className="flex-1 w-full max-w-2xl mx-auto flex flex-col items-center justify-center px-4 select-none my-auto transition-opacity duration-700">
        <div className="relative mb-6 sm:mb-8">
          <Holographic3D persona={null} size="normal" isListening={isListening} />
        </div>

        <h1
          className="text-3xl sm:text-4xl md:text-5xl font-light tracking-tight text-slate-800 font-display"
          style={{
            fontFamily: "'Syne', sans-serif",
            letterSpacing: '-0.03em',
          }}
        >
          Ami Luccha
        </h1>
      </div>
    );
  }

  // Once Persona is chosen: Conversation Space
  return (
    <div className="flex-1 w-full flex flex-col h-full relative min-h-0 overflow-hidden">
      {messages.length === 0 ? (
        /* Empty State: Selected AI Persona identity */
        <div className="flex-1 w-full max-w-2xl mx-auto flex flex-col items-center justify-center px-4 py-8 sm:py-12 select-none my-auto animate-in fade-in duration-500">
          <div className="relative mb-5 sm:mb-7">
            <Holographic3D
              persona={persona}
              size="normal"
              isListening={isListening}
              isThinking={isThinking}
              isSpeaking={isStreaming}
            />
          </div>

          <h2
            className="text-2xl sm:text-3xl md:text-4xl font-light tracking-tight text-slate-800 font-display transition-colors duration-500"
            style={{
              fontFamily: "'Syne', sans-serif",
              letterSpacing: '-0.025em',
            }}
          >
            {persona}
          </h2>
          <p className="text-xs text-slate-400 mt-2 font-sans tracking-wide">
            {persona === 'Araan'
              ? 'কথা বলো আমার সাথে... আমি শুনছি'
              : 'আমি আছি তোমার সাথে, বলো না...'}
          </p>
        </div>
      ) : (
        /* Two-Way Smooth Scrollable Conversation Feed */
        <div className="flex-1 relative w-full h-full min-h-0">
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="absolute inset-0 overflow-y-auto overscroll-contain px-4 sm:px-6 pt-4 pb-6 space-y-4"
            style={{
              WebkitOverflowScrolling: 'touch',
            }}
          >
            <div className="w-full max-w-2xl mx-auto space-y-4">
              {/* Subtle compact Holographic visual anchor for the selected AI */}
              <div className="flex flex-col items-center justify-center py-2 opacity-90 transition-opacity">
                <Holographic3D
                  persona={persona}
                  size="compact"
                  isListening={isListening}
                  isThinking={isThinking}
                  isSpeaking={isStreaming}
                />
                <span
                  className="text-xs font-medium tracking-tight text-slate-600 mt-[-6px] font-display"
                  style={{ fontFamily: "'Syne', sans-serif" }}
                >
                  {persona}
                </span>
              </div>

              {/* Message List */}
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.sender === 'user' ? 'items-end' : 'items-start'
                  } animate-in fade-in slide-in-from-bottom-1 duration-200`}
                >
                  {msg.sender === 'user' ? (
                    <div className="max-w-[85%] sm:max-w-[75%] px-4.5 py-2.5 rounded-[20px] rounded-br-[4px] bg-slate-900 text-white text-[14.5px] font-normal leading-relaxed shadow-sm">
                      {msg.imageUrl && (
                        <img
                          src={msg.imageUrl}
                          alt="Uploaded media"
                          className="max-h-48 rounded-xl object-cover mb-2 border border-white/20"
                        />
                      )}
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    </div>
                  ) : (
                    /* Organic AI Response Bubble */
                    <div className="max-w-[88%] sm:max-w-[80%] px-4.5 py-3 rounded-[20px] rounded-bl-[4px] text-[14.5px] font-normal leading-relaxed text-slate-800 bg-white/80 backdrop-blur-xl border border-white/90 shadow-[0_3px_20px_rgba(20,35,55,0.04),inset_0_1px_2px_rgba(255,255,255,0.95)]">
                      {msg.text ? (
                        <>
                          <FormattedMessageContent text={msg.text} />
                          {msg.isStreaming && (
                            <span className="inline-block w-1.5 h-3.5 ml-1 bg-slate-400 animate-pulse align-middle" />
                          )}
                        </>
                      ) : isThinking ? (
                        <div className="flex items-center gap-1.5 py-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse" />
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse delay-150" />
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse delay-300" />
                        </div>
                      ) : (
                        <span className="inline-block w-1.5 h-3.5 bg-slate-400 animate-pulse align-middle" />
                      )}

                      {msg.error && (
                        <div className="mt-2 pt-2 border-t border-rose-100 flex items-center justify-between text-xs text-rose-500">
                          <span>Connection interrupted</span>
                          {onRetryMessage && (
                            <button
                              onClick={() => onRetryMessage(msg.id)}
                              className="font-medium underline hover:text-rose-700 cursor-pointer"
                            >
                              Retry
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              <div ref={bottomRef} className="h-2" />
            </div>
          </div>

          {/* Floating 'Scroll to Newest' Pill when user has scrolled upward */}
          {showScrollBottomBtn && (
            <button
              onClick={scrollToBottom}
              className="absolute bottom-4 right-6 sm:right-10 z-20 flex items-center gap-1 px-3 py-1.5 bg-white/95 hover:bg-white text-slate-700 rounded-full border border-slate-200/90 shadow-md text-xs font-medium cursor-pointer transition-all hover:scale-105 active:scale-95 animate-in fade-in zoom-in-95 duration-200"
            >
              <span>নিচে যান</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// Formats Markdown, Paragraphs and Code Blocks gracefully
function FormattedMessageContent({ text }: { text: string }) {
  if (!text) return null;

  // Split by markdown code blocks
  const parts = text.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-2">
      {parts.map((part, index) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const lines = part.slice(3, -3).trim().split('\n');
          const firstLine = lines[0].trim();
          const language = firstLine && !firstLine.includes(' ') ? firstLine : '';
          const code = language ? lines.slice(1).join('\n') : lines.join('\n');

          return <CodeBlock key={index} code={code} language={language} />;
        }

        return (
          <p key={index} className="whitespace-pre-wrap leading-relaxed">
            {part}
          </p>
        );
      })}
    </div>
  );
}

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-2 rounded-xl overflow-hidden border border-slate-200/80 bg-slate-900 text-slate-100 text-xs font-mono shadow-sm">
      <div className="flex items-center justify-between px-3 py-1 bg-slate-800/90 border-b border-slate-700/60 text-[11px] text-slate-400">
        <span className="font-semibold uppercase tracking-wider">{language || 'Code'}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 hover:text-slate-200 transition-colors cursor-pointer"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <pre className="p-3 overflow-x-auto leading-relaxed">{code}</pre>
    </div>
  );
}
