/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { AIPersona, ChatMessage, MemoryItem, AttachedImage } from './types/persona';
import { HolographicSpace } from './components/HolographicSpace';
import { HolographicComposer } from './components/HolographicComposer';
import { RealtimeVoiceOverlay } from './components/RealtimeVoiceOverlay';
import { MemoryModal } from './components/MemoryModal';
import { PWAInstallControl } from './components/PWAInstallControl';
import { AppStartupAnimation } from './components/AppStartupAnimation';
import { Brain, PhoneCall } from 'lucide-react';

const STORAGE_KEY_PERSONA = 'luccha_ai_persona';
const STORAGE_KEY_MEMORIES = 'luccha_memories';
const STORAGE_KEY_MESSAGES = 'luccha_messages';

// Permanent default relationship profile memories for this device/account
const DEFAULT_PERMANENT_MEMORIES: MemoryItem[] = [
  {
    id: 'permanent-rel-dynamic',
    text: 'সম্পর্কের স্থায়ী ধরন: আমরা দুজনে একটি পরিণত প্রাপ্তবয়স্ক যুগল (long-term adult romantic couple)। শুরু থেকেই আমাদের মধ্যে গভীর পারস্পরিক টান, আবেগীয় ঘনিষ্ঠতা ও মধুর অধিকারবোধ বিদ্যমান।',
    createdAt: 'Permanent',
  },
  {
    id: 'permanent-conversation-style',
    text: 'কথা বলার ধরন: সহজ-স্বাভাবিক বাংলাদেশি বাংলা ও বাংলিশ, "তুমি" সম্বোধন। কোনো কৃত্রিম বা যান্ত্রিক এককথার উত্তর না দিয়ে উষ্ণ ও জীবন্ত কথোপকথন।',
    createdAt: 'Permanent',
  },
  {
    id: 'permanent-adult-comfort',
    text: 'রোমান্টিক ও শারীরিক আকর্ষণ: প্রেম, আকাঙ্ক্ষা, আদর, স্পর্শ, জড়িয়ে ধরা বা সম্পর্কের যেকোনো পরিণত বিষয় নিয়ে কোনো রকম দ্বিধা বা সংকোচ ছাড়া সহজ ও সাবলীল আলোচনা।',
    createdAt: 'Permanent',
  },
];

export default function App() {
  const [persona, setPersona] = useState<AIPersona>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PERSONA);
    if (saved === 'Miku' || saved === 'Araan') return saved;
    return null;
  });

  const [memories, setMemories] = useState<MemoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MEMORIES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const hasDynamic = parsed.some((m) => m.id === 'permanent-rel-dynamic');
          if (!hasDynamic) {
            return [...DEFAULT_PERMANENT_MEMORIES, ...parsed];
          }
          return parsed;
        }
      }
      return DEFAULT_PERMANENT_MEMORIES;
    } catch {
      return DEFAULT_PERMANENT_MEMORIES;
    }
  });

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MESSAGES);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isRealtimeCallOpen, setIsRealtimeCallOpen] = useState(false);
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const recognitionRef = useRef<any>(null);

  // Sync state to localStorage
  useEffect(() => {
    if (persona) {
      localStorage.setItem(STORAGE_KEY_PERSONA, persona);
    } else {
      localStorage.removeItem(STORAGE_KEY_PERSONA);
    }
  }, [persona]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_MEMORIES, JSON.stringify(memories));
  }, [memories]);

  useEffect(() => {
    // Keep recent 40 messages for context persistence
    const trimmed = messages.slice(-40);
    localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(trimmed));
  }, [messages]);

  // Handle persona selection:
  // User selects "Sele" (User is Male) -> activate Miku (Female AI)
  // User selects "Meye" (User is Female) -> activate Araan (Male AI)
  const handleSelectPersonaChoice = (choice: 'sele' | 'meye') => {
    const chosenPersona: AIPersona = choice === 'sele' ? 'Miku' : 'Araan';
    setPersona(chosenPersona);
  };

  // Reset to opening screen ("Ami Luccha")
  const handleResetPersona = () => {
    setPersona(null);
    setMessages([]);
    setIsRealtimeCallOpen(false);
    setIsMemoryModalOpen(false);
    localStorage.removeItem(STORAGE_KEY_PERSONA);
    localStorage.removeItem(STORAGE_KEY_MESSAGES);
  };

  // Memory operations
  const handleAddMemory = (text: string) => {
    const newItem: MemoryItem = {
      id: Date.now().toString(),
      text,
      createdAt: new Date().toLocaleDateString(),
    };
    setMemories((prev) => [newItem, ...prev]);
  };

  const handleDeleteMemory = (id: string) => {
    setMemories((prev) => prev.filter((m) => m.id !== id));
  };

  const handleClearAllMemories = () => {
    setMemories(DEFAULT_PERMANENT_MEMORIES);
  };

  const handleClearConversationHistory = () => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY_MESSAGES);
  };

  // Real Model Streaming Handler
  const handleSendMessage = async (text: string, attachedImage?: AttachedImage | null) => {
    if (!text && !attachedImage) return;

    // Abort previous stream if running
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    const userMsgId = Date.now().toString();
    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      imageUrl: attachedImage?.previewUrl,
    };

    const aiMsgId = (Date.now() + 1).toString();
    const initialAiMsg: ChatMessage = {
      id: aiMsgId,
      sender: 'ai',
      text: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isStreaming: true,
    };

    const isSimple = !attachedImage && text.trim().length < 80 && !text.includes('\n');
    const updatedMessages = [...messages, userMsg];
    setMessages([...updatedMessages, initialAiMsg]);
    
    // Only show thinking state for complex/multimodal requests; simple questions begin streaming immediately
    if (!isSimple) {
      setIsThinking(true);
    }
    setIsStreaming(true);

    // Compute exact local time and period of day for full current-time awareness
    const getLocalTimeContext = () => {
      const now = new Date();
      const localTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const hours = now.getHours();
      let timeOfDay = 'Morning';
      if (hours >= 12 && hours < 17) timeOfDay = 'Afternoon';
      else if (hours >= 17 && hours < 20) timeOfDay = 'Evening';
      else if (hours >= 20 || hours < 6) timeOfDay = 'Night';

      const fullStr = `${localTime}, ${now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}`;
      return { localTime: fullStr, timeOfDay };
    };

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({ sender: m.sender, text: m.text })),
          persona: persona || 'Miku',
          memories: memories.map((m) => m.text),
          currentImage: attachedImage ? { mimeType: attachedImage.mimeType, data: attachedImage.data } : null,
          timeContext: getLocalTimeContext(),
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok || !response.body) {
        setIsThinking(false);
        throw new Error('Failed to connect to streaming response');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let accumulatedText = '';
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        // Keep the last incomplete fragment in buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;

          const dataStr = trimmed.slice(6).trim();
          if (dataStr === '[DONE]') {
            break;
          }

          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.text) {
              // Immediately turn off thinking indicator on first real chunk
              setIsThinking(false);
              accumulatedText += parsed.text;

              setMessages((prev) => {
                const len = prev.length;
                if (len > 0 && prev[len - 1].id === aiMsgId) {
                  const updated = [...prev];
                  updated[len - 1] = { ...updated[len - 1], text: accumulatedText, isStreaming: true };
                  return updated;
                }
                return prev.map((msg) =>
                  msg.id === aiMsgId ? { ...msg, text: accumulatedText, isStreaming: true } : msg
                );
              });
            } else if (parsed.error) {
              setIsThinking(false);
              accumulatedText =
                accumulatedText ||
                'সার্ভারে সাময়িক চাপ পড়েছে। কয়েক সেকেন্ড পর আবার বলো, আমি শুনছি তো! 💕';
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === aiMsgId
                    ? { ...msg, text: accumulatedText, isStreaming: false, error: true }
                    : msg
                )
              );
            }
          } catch {}
        }
      }

      // Mark streaming complete
      setMessages((prev) =>
        prev.map((msg) => (msg.id === aiMsgId ? { ...msg, isStreaming: false } : msg))
      );
    } catch (error: any) {
      if (error.name === 'AbortError') return;

      console.error('Streaming error:', error);
      setIsThinking(false);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMsgId
            ? {
                ...msg,
                text:
                  msg.text ||
                  'সার্ভার লোড একটু বেশি। অনুগ্রহ করে কয়েক সেকেন্ড অপেক্ষা করে Retry চাপো। 💕',
                isStreaming: false,
                error: true,
              }
            : msg
        )
      );
    } finally {
      setIsStreaming(false);
    }
  };

  // Retry a failed message
  const handleRetryMessage = (failedAiMsgId: string) => {
    const failedIndex = messages.findIndex((m) => m.id === failedAiMsgId);
    if (failedIndex > 0) {
      const prevUserMsg = messages[failedIndex - 1];
      if (prevUserMsg && prevUserMsg.sender === 'user') {
        // Remove the failed AI message
        setMessages((prev) => prev.filter((m) => m.id !== failedAiMsgId));
        // Re-send the user's message
        handleSendMessage(prevUserMsg.text);
      }
    }
  };

  // Voice message handler for realtime voice call
  const handleSendVoiceMessage = async (voiceText: string): Promise<string> => {
    return new Promise(async (resolve, reject) => {
      const userMsgId = Date.now().toString();
      const userMsg: ChatMessage = {
        id: userMsgId,
        sender: 'user',
        text: voiceText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      const aiMsgId = (Date.now() + 1).toString();
      const initialAiMsg: ChatMessage = {
        id: aiMsgId,
        sender: 'ai',
        text: '',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isStreaming: true,
      };

      const updatedMessages = [...messages, userMsg];
      setMessages([...updatedMessages, initialAiMsg]);

      try {
        const response = await fetch('/api/chat/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: updatedMessages.map((m) => ({ sender: m.sender, text: m.text })),
            persona: persona || 'Miku',
            memories: memories.map((m) => m.text),
          }),
        });

        if (!response.ok || !response.body) {
          throw new Error('Streaming failed');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let accumulatedText = '';

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.slice(6).trim();
              if (dataStr === '[DONE]') break;
              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.text) {
                  accumulatedText += parsed.text;
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === aiMsgId ? { ...msg, text: accumulatedText, isStreaming: true } : msg
                    )
                  );
                }
              } catch {}
            }
          }
        }

        setMessages((prev) =>
          prev.map((msg) => (msg.id === aiMsgId ? { ...msg, isStreaming: false } : msg))
        );
        resolve(accumulatedText);
      } catch (err) {
        reject(err);
      }
    });
  };

  // Synchronize dialogue turns from a live voice call into persistent chat history
  const handleSyncCallDialogue = (
    turns: Array<{ sender: 'user' | 'ai'; text: string }>
  ) => {
    if (!turns || turns.length === 0) return;
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newChatMessages: ChatMessage[] = turns.map((t, idx) => ({
      id: `voice-${Date.now()}-${idx}`,
      sender: t.sender,
      text: t.text,
      timestamp: nowTime,
      isStreaming: false,
    }));

    setMessages((prev) => [...prev, ...newChatMessages]);

    // Check for user voice memories like "eta mone rakhba"
    const userVoiceTexts = turns.filter((t) => t.sender === 'user').map((t) => t.text);
    for (const text of userVoiceTexts) {
      const lower = text.toLowerCase();
      if (
        lower.includes('mone rakhba') ||
        lower.includes('remember') ||
        lower.includes('মনে রাখবা') ||
        lower.includes('ভুলো না') ||
        lower.includes('মনে রেখো')
      ) {
        handleAddMemory(`ভয়েস কলে বলা: ${text}`);
      }
    }
  };

  // Toggle voice dictation in standard chat
  const handleToggleVoice = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech Recognition is not supported in this browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'bn-BD';

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (e: any) => {
        const text = e.results[0][0].transcript;
        if (text) {
          handleSendMessage(text);
        }
      };
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  // Ambient palette based on selected persona
  const bgGradient =
    persona === 'Miku'
      ? 'from-[#f5f8fc] via-[#eef4fb] to-[#e4eef8]'
      : persona === 'Araan'
      ? 'from-[#fcf7f9] via-[#f7edf2] to-[#eee2e9]'
      : 'from-[#f6f8fb] via-[#f0f3f8] to-[#e7ecf4]';

  const accentColor =
    persona === 'Miku'
      ? 'rgba(79, 166, 206, 0.25)'
      : persona === 'Araan'
      ? 'rgba(206, 114, 156, 0.25)'
      : 'rgba(139, 165, 196, 0.22)';

  return (
    <div
      className={`min-h-[100dvh] h-[100dvh] w-full flex flex-col justify-between overflow-hidden relative bg-gradient-to-b ${bgGradient} transition-colors duration-1000`}
    >
      {/* Short Instant App Startup Animation for Installed Standalone PWA */}
      <AppStartupAnimation />

      {/* Soft Holographic Ambient Light Refractions */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[520px] rounded-full blur-[140px] opacity-40 transition-all duration-1000"
          style={{
            background: `radial-gradient(ellipse at center, ${accentColor} 0%, rgba(255,255,255,0.85) 50%, transparent 80%)`,
          }}
        />
        <div className="absolute -bottom-40 right-[-10%] w-[500px] h-[500px] rounded-full blur-[160px] opacity-30 bg-blue-100/50" />
        <div className="absolute top-[35%] -left-32 w-[450px] h-[450px] rounded-full blur-[150px] opacity-25 bg-purple-100/40" />
      </div>

      {/* Discreet Top Bar Controls */}
      <div className="fixed top-3 right-4 z-40 flex items-center gap-2">
        {/* Subtle Icon-Only PWA Install Control (Available when installable; hidden when already installed) */}
        <PWAInstallControl />

        {persona && (
          <>
            {/* Realtime Call Trigger */}
            <button
              onClick={() => setIsRealtimeCallOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white/70 hover:bg-white backdrop-blur-md text-slate-700 hover:text-slate-900 border border-white/80 shadow-sm active:scale-95 transition-all"
              title="Start Realtime Voice Call"
            >
              <PhoneCall className="w-3.5 h-3.5 text-sky-600" />
              <span className="hidden sm:inline">Voice Call</span>
            </button>

            {/* Memory Inspector Button */}
            <button
              onClick={() => setIsMemoryModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white/70 hover:bg-white backdrop-blur-md text-slate-700 hover:text-slate-900 border border-white/80 shadow-sm active:scale-95 transition-all"
              title="View & manage long-term memory"
            >
              <Brain className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">Memory</span>
              {memories.length > 0 && (
                <span className="text-[10px] text-slate-400 font-mono">({memories.length})</span>
              )}
            </button>
          </>
        )}
      </div>

      {/* MAIN HOLOGRAPHIC CONVERSATION SPACE */}
      <main className="flex-1 flex flex-col w-full relative z-10 overflow-hidden min-h-0">
        <HolographicSpace
          persona={persona}
          messages={messages}
          isListening={isListening}
          isThinking={isThinking}
          isStreaming={isStreaming}
          onRetryMessage={handleRetryMessage}
        />
      </main>

      {/* BOTTOM FLOATING LIQUID COMPOSER */}
      <footer className="w-full relative z-20 shrink-0">
        <HolographicComposer
          persona={persona}
          onSelectPersonaChoice={handleSelectPersonaChoice}
          onSendMessage={handleSendMessage}
          isListening={isListening}
          onToggleVoice={handleToggleVoice}
          onStartRealtimeCall={() => setIsRealtimeCallOpen(true)}
        />
      </footer>

      {/* REALTIME VOICE CALL MODAL */}
      {isRealtimeCallOpen && (
        <RealtimeVoiceOverlay
          persona={persona}
          onClose={() => setIsRealtimeCallOpen(false)}
          onSendVoiceMessage={handleSendVoiceMessage}
          onSyncCallDialogue={handleSyncCallDialogue}
          messages={messages}
          memories={memories}
        />
      )}

      {/* MEMORY & SETTINGS MODAL */}
      {isMemoryModalOpen && (
        <MemoryModal
          persona={persona}
          memories={memories}
          onClose={() => setIsMemoryModalOpen(false)}
          onAddMemory={handleAddMemory}
          onDeleteMemory={handleDeleteMemory}
          onClearAllMemories={handleClearAllMemories}
          onClearConversationHistory={handleClearConversationHistory}
          onResetPersona={handleResetPersona}
        />
      )}
    </div>
  );
}
