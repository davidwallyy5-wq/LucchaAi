import React, { useRef, useEffect } from 'react';
import { Luccha3DEntity } from './Luccha3DEntity';
import { ThemeConfig, UserAssignedName } from '../types/theme';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'luccha';
  text: string;
  timestamp: string;
}

interface ConversationSpaceProps {
  theme: ThemeConfig;
  messages: ChatMessage[];
  isInteracting: boolean;
  userAssignedName: UserAssignedName;
}

export const ConversationSpace: React.FC<ConversationSpaceProps> = ({
  theme,
  messages,
  isInteracting,
  userAssignedName,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <div className="flex-1 w-full max-w-3xl mx-auto flex flex-col justify-center px-4 sm:px-6 relative">
      {/* When no messages have been sent yet: Iconic Minimal Opening */}
      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center my-auto py-8 sm:py-16 text-center select-none transition-all duration-700 animate-in fade-in zoom-in-95">
          {/* Central 3D Physical Entity */}
          <div className="relative mb-6 sm:mb-8">
            <Luccha3DEntity theme={theme} isInteracting={isInteracting} />
          </div>

          {/* Central AI Identity - Exactly "Ami Luccha" */}
          <h1
            className="text-3xl sm:text-4xl md:text-5xl font-light tracking-tight text-slate-800 font-display transition-colors duration-500"
            style={{
              fontFamily: "'Syne', sans-serif",
              letterSpacing: '-0.03em',
            }}
          >
            Ami Luccha
          </h1>
        </div>
      ) : (
        /* Conversation Feed with pristine typographic hierarchy */
        <div className="flex-1 flex flex-col justify-end pt-16 pb-8 space-y-6 overflow-y-auto">
          {/* Subtle compact 3D Identity anchor at top of conversation */}
          <div className="flex flex-col items-center justify-center pt-2 pb-6 opacity-85 transition-opacity">
            <div className="scale-75 origin-center">
              <Luccha3DEntity theme={theme} isInteracting={isInteracting} />
            </div>
            <span
              className="text-base font-light tracking-tight text-slate-700 mt-[-10px] font-display"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              Ami Luccha
            </span>
          </div>

          {/* Message bubbles */}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.sender === 'user' ? 'items-end' : 'items-start'
              } animate-in fade-in slide-in-from-bottom-2 duration-300`}
            >
              {msg.sender === 'user' ? (
                <div className="max-w-[85%] sm:max-w-[75%] px-5 py-3 rounded-[22px] rounded-br-[6px] bg-slate-900 text-white text-[15px] font-normal leading-relaxed shadow-sm">
                  {msg.text}
                </div>
              ) : (
                <div
                  className={`max-w-[85%] sm:max-w-[75%] px-5 py-3.5 rounded-[22px] rounded-bl-[6px] text-[15px] font-normal leading-relaxed text-slate-800 ${theme.borderStyle} bg-white/75 backdrop-blur-xl`}
                >
                  <p>{msg.text}</p>
                </div>
              )}
            </div>
          ))}

          <div ref={bottomRef} className="h-2" />
        </div>
      )}
    </div>
  );
};
