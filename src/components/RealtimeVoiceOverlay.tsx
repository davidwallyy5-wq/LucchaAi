import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  PhoneOff,
  Volume2,
  VolumeX,
  Sparkles,
  Clock,
  Radio,
  Sliders,
  Upload,
  Play,
  Pause,
  CheckCircle2,
  AlertCircle,
  FileAudio,
  X,
} from 'lucide-react';
import { Holographic3D } from './Holographic3D';
import { AIPersona, ChatMessage } from '../types/persona';

interface RealtimeVoiceOverlayProps {
  persona: AIPersona;
  onClose: () => void;
  onSendVoiceMessage: (text: string) => Promise<string>;
  onSyncCallDialogue?: (turns: Array<{ sender: 'user' | 'ai'; text: string }>) => void;
  messages: ChatMessage[];
  memories?: Array<{ id: string; text: string }>;
}

// Convert Float32Array PCM samples to 16-bit PCM little-endian Base64
function float32To16BitPCMBase64(float32Array: Float32Array): string {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);
  let offset = 0;
  for (let i = 0; i < float32Array.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Convert Base64 16-bit PCM to Float32Array for Web Audio API playback
function base64PCMToFloat32(base64: string): Float32Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const int16Array = new Int16Array(bytes.buffer);
  const float32Array = new Float32Array(int16Array.length);
  for (let i = 0; i < int16Array.length; i++) {
    float32Array[i] = int16Array[i] / 32768.0;
  }
  return float32Array;
}

export const RealtimeVoiceOverlay: React.FC<RealtimeVoiceOverlayProps> = ({
  persona,
  onClose,
  onSendVoiceMessage,
  onSyncCallDialogue,
  messages,
  memories = [],
}) => {
  const [callState, setCallState] = useState<'connecting' | 'listening' | 'speaking' | 'interrupted'>('connecting');
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [connectionMode, setConnectionMode] = useState<'live-gemini' | 'adaptive-fast'>('live-gemini');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [lastAIResponse, setLastAIResponse] = useState('');
  const [currentTimeFormatted, setCurrentTimeFormatted] = useState('');

  // Voice Reference Panel State
  const [isRefModalOpen, setIsRefModalOpen] = useState(false);
  const [voiceRefName, setVoiceRefName] = useState(() => {
    return localStorage.getItem('araan_voice_ref_name') || 'Calibrated Reference (Prompt Upload: "Hi, ami Araan...")';
  });
  const [driveUrlInput, setDriveUrlInput] = useState('');
  const [driveStatus, setDriveStatus] = useState<string | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  // Audio nodes & refs
  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const isComponentMounted = useRef<boolean>(true);
  const isSpeakingRef = useRef<boolean>(false);
  const callTranscriptRef = useRef<Array<{ sender: 'user' | 'ai'; text: string }>>([]);
  const accumulatedAiTurnText = useRef<string>('');

  // Fallback speech recognition ref
  const fallbackRecognitionRef = useRef<any>(null);
  const silenceTimeoutRef = useRef<any>(null);

  // Compute exact current local time information
  const getLocalTimeContext = () => {
    const now = new Date();
    const localTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const hours = now.getHours();
    let timeOfDay = 'Morning';
    if (hours >= 12 && hours < 17) timeOfDay = 'Afternoon';
    else if (hours >= 17 && hours < 20) timeOfDay = 'Evening';
    else if (hours >= 20 || hours < 6) timeOfDay = 'Night';

    const fullStr = `${localTime}, ${now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}`;
    return { localTime: fullStr, timeOfDay, rawHours: hours };
  };

  // Immediate barge-in / stop all playing audio
  const stopAllAudio = () => {
    for (const source of activeSourcesRef.current) {
      try {
        source.stop();
        source.disconnect();
      } catch {}
    }
    activeSourcesRef.current = [];
    nextStartTimeRef.current = 0;
    isSpeakingRef.current = false;

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  // Play incoming 24kHz PCM chunk with gapless scheduling
  const scheduleAudioChunk = (pcmBase64: string) => {
    if (isSpeakerMuted || !isComponentMounted.current) return;

    try {
      if (!outputAudioCtxRef.current || outputAudioCtxRef.current.state === 'closed') {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        outputAudioCtxRef.current = new AudioCtx({ sampleRate: 24000 });
      }

      const audioCtx = outputAudioCtxRef.current;
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      const float32Data = base64PCMToFloat32(pcmBase64);
      if (float32Data.length === 0) return;

      const audioBuffer = audioCtx.createBuffer(1, float32Data.length, 24000);
      audioBuffer.getChannelData(0).set(float32Data);

      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioCtx.destination);

      const currentTime = audioCtx.currentTime;
      if (nextStartTimeRef.current < currentTime) {
        nextStartTimeRef.current = currentTime;
      }

      source.start(nextStartTimeRef.current);
      nextStartTimeRef.current += audioBuffer.duration;

      activeSourcesRef.current.push(source);
      isSpeakingRef.current = true;
      setCallState('speaking');

      source.onended = () => {
        const index = activeSourcesRef.current.indexOf(source);
        if (index > -1) {
          activeSourcesRef.current.splice(index, 1);
        }
        if (activeSourcesRef.current.length === 0 && isComponentMounted.current) {
          isSpeakingRef.current = false;
          setCallState('listening');
        }
      };
    } catch (err) {
      console.warn('Error scheduling audio chunk:', err);
    }
  };

  // Fallback engine if Gemini Live WebSocket is restricted
  const startFallbackEngine = () => {
    setConnectionMode('adaptive-fast');
    setCallState('listening');

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    try {
      if (fallbackRecognitionRef.current) {
        fallbackRecognitionRef.current.abort();
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'bn-BD';

      recognition.onstart = () => {
        if (isComponentMounted.current && !isSpeakingRef.current) {
          setCallState('listening');
        }
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setLiveTranscript(transcript);

        // Instant local barge-in if AI is speaking
        stopAllAudio();

        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
        }
        if (transcript.trim().length > 0) {
          silenceTimeoutRef.current = setTimeout(() => {
            try {
              recognition.stop();
            } catch {}
          }, 500);
        }
      };

      recognition.onend = async () => {
        const finalTranscript = liveTranscript.trim();
        if (finalTranscript && isComponentMounted.current) {
          callTranscriptRef.current.push({ sender: 'user', text: finalTranscript });
          setLiveTranscript('');
          setCallState('connecting');

          try {
            const aiReply = await onSendVoiceMessage(finalTranscript);
            if (aiReply && isComponentMounted.current) {
              callTranscriptRef.current.push({ sender: 'ai', text: aiReply });
              setLastAIResponse(aiReply);
              setCallState('speaking');

              // Fast TTS fallback
              const res = await fetch('/api/voice/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: aiReply.slice(0, 150), persona }),
              });
              if (res.ok) {
                const data = await res.json();
                if (data.audio) {
                  const audio = new Audio(`data:audio/wav;base64,${data.audio}`);
                  audio.onended = () => {
                    if (isComponentMounted.current) {
                      setCallState('listening');
                      startFallbackEngine();
                    }
                  };
                  await audio.play();
                  return;
                }
              }
            }
          } catch {}

          if (isComponentMounted.current) {
            setCallState('listening');
            startFallbackEngine();
          }
        } else if (isComponentMounted.current && !isMuted) {
          setTimeout(() => {
            if (isComponentMounted.current && !isMuted) {
              try { recognition.start(); } catch {}
            }
          }, 200);
        }
      };

      fallbackRecognitionRef.current = recognition;
      recognition.start();
    } catch {}
  };

  // Start Gemini 3.8 Live WebSocket session
  useEffect(() => {
    isComponentMounted.current = true;
    const timeCtx = getLocalTimeContext();
    setCurrentTimeFormatted(`${timeCtx.localTime} · ${timeCtx.timeOfDay}`);

    // Pre-warm 24kHz AudioContext immediately on mount
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!outputAudioCtxRef.current || outputAudioCtxRef.current.state === 'closed') {
      outputAudioCtxRef.current = new AudioCtx({ sampleRate: 24000 });
    }
    if (outputAudioCtxRef.current.state === 'suspended') {
      outputAudioCtxRef.current.resume();
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/live`;

    let ws: WebSocket | null = null;
    let fallbackTimer: any = null;

    async function initLiveVoice() {
      try {
        // 1. Request microphone access with ultra-low latency settings
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 16000,
          },
        });
        micStreamRef.current = stream;

        // 2. Setup 16kHz Web Audio Context for microphone capture
        const inputCtx = new AudioCtx({ sampleRate: 16000 });
        inputAudioCtxRef.current = inputCtx;

        const source = inputCtx.createMediaStreamSource(stream);
        // Low-latency buffer: 1024 samples = 64ms at 16kHz
        const processor = inputCtx.createScriptProcessor(1024, 1, 1);
        processorRef.current = processor;

        source.connect(processor);
        processor.connect(inputCtx.destination);

        // 3. Connect to WebSocket
        ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        // Fallback safety timeout: if WS doesn't establish in 2.5s, gracefully switch to adaptive engine
        fallbackTimer = setTimeout(() => {
          if (ws?.readyState !== WebSocket.OPEN) {
            console.warn('Gemini Live WS timed out, switching to adaptive engine');
            startFallbackEngine();
          }
        }, 2600);

        ws.onopen = () => {
          clearTimeout(fallbackTimer);
          setCallState('listening');

          // Send initialization handshake with real-time clock, memories, & Araan voice calibration
          ws?.send(
            JSON.stringify({
              type: 'init',
              persona,
              voiceName: persona === 'Araan' ? 'Charon' : 'Aoede',
              voiceReference: {
                label: voiceRefName,
                notes:
                  persona === 'Araan'
                    ? 'Calibrated for an adult Bangladeshi male companion: calm, confident, warm, charismatic, and natural male voice.'
                    : 'Calibrated for an adult female companion: sweet, warm, soft, natural, and alluring female voice.',
              },
              memories: memories.map((m) => m.text),
              timeContext: {
                localTime: timeCtx.localTime,
                timeOfDay: timeCtx.timeOfDay,
              },
            })
          );
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            if (data.type === 'ready') {
              setCallState('listening');
            } else if (data.type === 'audio' && data.audio) {
              scheduleAudioChunk(data.audio);
            } else if (data.type === 'text' && data.text) {
              accumulatedAiTurnText.current += data.text;
              setLastAIResponse(accumulatedAiTurnText.current);
            } else if (data.type === 'interrupted') {
              // Instant model barge-in
              stopAllAudio();
              setCallState('listening');
            } else if (data.type === 'turnComplete') {
              if (accumulatedAiTurnText.current.trim()) {
                callTranscriptRef.current.push({
                  sender: 'ai',
                  text: accumulatedAiTurnText.current.trim(),
                });
                accumulatedAiTurnText.current = '';
              }
            } else if (data.type === 'fallback_required') {
              startFallbackEngine();
            }
          } catch (e) {
            console.warn('Error handling Live message:', e);
          }
        };

        ws.onerror = () => {
          clearTimeout(fallbackTimer);
          startFallbackEngine();
        };

        ws.onclose = () => {
          if (isComponentMounted.current && connectionMode === 'live-gemini') {
            startFallbackEngine();
          }
        };

        // 4. Capture microphone frames and stream 16-bit PCM little-endian Base64
        processor.onaudioprocess = (e) => {
          if (isMuted || !isComponentMounted.current) return;

          const channelData = e.inputBuffer.getChannelData(0);

          // Calculate energy RMS to detect user voice
          let sum = 0;
          for (let i = 0; i < channelData.length; i++) {
            sum += channelData[i] * channelData[i];
          }
          const rms = Math.sqrt(sum / channelData.length);

          // Realtime VAD: Instant local barge-in if user begins speaking while Araan is talking
          if (rms > 0.024 && isSpeakingRef.current) {
            stopAllAudio();
            setCallState('listening');
            if (ws?.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'interrupt' }));
            }
          }

          if (ws?.readyState === WebSocket.OPEN) {
            const pcmBase64 = float32To16BitPCMBase64(channelData);
            ws.send(JSON.stringify({ type: 'audio', audio: pcmBase64 }));
          }
        };
      } catch (err) {
        console.warn('Microphone or WebAudio error, starting adaptive fallback:', err);
        startFallbackEngine();
      }
    }

    initLiveVoice();

    return () => {
      isComponentMounted.current = false;
      clearTimeout(fallbackTimer);

      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }

      if (fallbackRecognitionRef.current) {
        try { fallbackRecognitionRef.current.abort(); } catch {}
      }

      // Stop mic tracks
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((track) => track.stop());
      }

      // Disconnect processor
      if (processorRef.current) {
        try { processorRef.current.disconnect(); } catch {}
      }

      if (inputAudioCtxRef.current && inputAudioCtxRef.current.state !== 'closed') {
        try { inputAudioCtxRef.current.close(); } catch {}
      }

      stopAllAudio();

      if (outputAudioCtxRef.current && outputAudioCtxRef.current.state !== 'closed') {
        try { outputAudioCtxRef.current.close(); } catch {}
      }

      if (wsRef.current) {
        try { wsRef.current.close(); } catch {}
      }
    };
  }, []);

  // Sync call conversation turns on end call
  const handleEndCall = () => {
    stopAllAudio();
    if (onSyncCallDialogue && callTranscriptRef.current.length > 0) {
      onSyncCallDialogue(callTranscriptRef.current);
    }
    onClose();
  };

  // Play a brief preview of Araan's calibrated voice
  const handlePlayVoicePreview = async () => {
    if (isPlayingPreview) {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current = null;
      }
      setIsPlayingPreview(false);
      return;
    }

    setIsPlayingPreview(true);
    try {
      const res = await fetch('/api/voice/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'হেই, কেমন আছো? তোমার গলার আওয়াজ শুনে মনটা ভালো হয়ে গেল।',
          persona,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.audio) {
          const audio = new Audio(`data:audio/wav;base64,${data.audio}`);
          previewAudioRef.current = audio;
          audio.onended = () => setIsPlayingPreview(false);
          audio.onerror = () => setIsPlayingPreview(false);
          await audio.play();
          return;
        }
      }
      setIsPlayingPreview(false);
    } catch {
      setIsPlayingPreview(false);
    }
  };

  // Handle direct file upload for custom voice reference
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const label = `Custom File: ${file.name} (${(file.size / 1024).toFixed(0)} KB)`;
      setVoiceRefName(label);
      localStorage.setItem('araan_voice_ref_name', label);
      setDriveStatus(`✓ Audio reference loaded: ${file.name}`);
    }
  };

  // Handle Google Drive / Direct URL link import
  const handleImportDriveUrl = () => {
    if (!driveUrlInput.trim()) return;
    if (driveUrlInput.includes('drive.google.com')) {
      setDriveStatus(
        'Note: Google Drive links require public view permissions ("Anyone with link can view"). If Google blocks direct streaming, please upload the downloaded audio file directly.'
      );
    } else {
      setDriveStatus('✓ Audio reference URL configured.');
    }
    const label = `URL Reference: ${driveUrlInput.slice(0, 30)}...`;
    setVoiceRefName(label);
    localStorage.setItem('araan_voice_ref_name', label);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between p-6 bg-[#f7f8fa]/95 backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-300">
      {/* Top Status & Real-Time Clock Bar */}
      <div className="w-full max-w-md flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-xs font-semibold text-slate-700 tracking-tight flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-emerald-500" />
            {connectionMode === 'live-gemini' ? 'Gemini 3.8 Live' : 'Adaptive Voice'} · {persona}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Voice Reference Settings Button */}
          <button
            onClick={() => setIsRefModalOpen(true)}
            className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600 bg-white/90 hover:bg-white px-2.5 py-1 rounded-full border border-slate-200/90 shadow-xs cursor-pointer transition-all hover:border-slate-300"
            title="Araan Voice Reference Settings"
          >
            <Sliders className="w-3 h-3 text-sky-600" />
            <span>Voice Ref</span>
          </button>

          {/* User Local Clock Context Badge */}
          {currentTimeFormatted && (
            <div className="flex items-center gap-1 text-[11px] text-slate-500 bg-white/80 px-2.5 py-1 rounded-full border border-slate-200/80 shadow-xs">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>{currentTimeFormatted}</span>
            </div>
          )}
        </div>
      </div>

      {/* Central 3D Holographic AI Companion Presence */}
      <div className="flex flex-col items-center justify-center my-auto text-center w-full max-w-sm">
        <div className="relative w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center">
          {/* Subtle Ambient Aura responding to voice state */}
          <div
            className={`absolute inset-0 rounded-full blur-2xl transition-all duration-500 ${
              callState === 'speaking'
                ? persona === 'Miku'
                  ? 'bg-sky-400/25 scale-110'
                  : 'bg-emerald-400/25 scale-110'
                : callState === 'listening'
                ? 'bg-slate-300/20 scale-95'
                : 'bg-amber-300/15 scale-90'
            }`}
          />

          <Holographic3D
            persona={persona}
            isListening={callState === 'listening'}
            isSpeaking={callState === 'speaking'}
            isThinking={callState === 'connecting'}
            size="normal"
          />
        </div>

        {/* State Indicator Badge */}
        <div className="mt-4">
          <span className="text-xs font-medium tracking-wide text-slate-500 capitalize flex items-center gap-1.5">
            {callState === 'listening' && (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-ping" />
                Listening to you...
              </>
            )}
            {callState === 'connecting' && (
              <>
                <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-spin" />
                Connecting audio channel...
              </>
            )}
            {callState === 'speaking' && (
              <>
                <Volume2 className="w-3.5 h-3.5 text-emerald-500 animate-bounce" />
                {persona} is speaking...
              </>
            )}
          </span>
        </div>

        {/* Live Subtitle Transcript */}
        <div className="mt-5 max-w-sm px-4 min-h-[44px] flex items-center justify-center text-center">
          {liveTranscript ? (
            <p className="text-sm text-slate-700 italic font-sans leading-relaxed">
              "{liveTranscript}"
            </p>
          ) : lastAIResponse ? (
            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed font-sans">
              {lastAIResponse}
            </p>
          ) : (
            <p className="text-xs text-slate-400 font-sans">বলো, আমি শুনছি...</p>
          )}
        </div>
      </div>

      {/* Bottom Floating Minimal Voice Controls */}
      <div className="w-full max-w-xs flex items-center justify-center gap-5 pb-6">
        {/* Mute Mic Button */}
        <button
          onClick={() => setIsMuted((prev) => !prev)}
          className={`p-3.5 rounded-full border transition-all duration-200 cursor-pointer shadow-sm ${
            isMuted
              ? 'bg-rose-50 text-rose-600 border-rose-200'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
          title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
        >
          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {/* End Call Button */}
        <button
          onClick={handleEndCall}
          className="p-4 rounded-full bg-rose-500 hover:bg-rose-600 text-white shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer scale-105 active:scale-95"
          title="End Call & Save Context"
        >
          <PhoneOff className="w-6 h-6" />
        </button>

        {/* Mute Speaker Button */}
        <button
          onClick={() => {
            if (!isSpeakerMuted) {
              stopAllAudio();
            }
            setIsSpeakerMuted((prev) => !prev);
          }}
          className={`p-3.5 rounded-full border transition-all duration-200 cursor-pointer shadow-sm ${
            isSpeakerMuted
              ? 'bg-amber-50 text-amber-600 border-amber-200'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
          title={isSpeakerMuted ? 'Unmute Speaker' : 'Mute Speaker'}
        >
          {isSpeakerMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      </div>

      {/* VOICE REFERENCE MANAGEMENT MODAL */}
      {isRefModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileAudio className="w-4 h-4 text-sky-600" />
                <h3 className="text-sm font-semibold text-slate-800">
                  {persona} Voice Reference
                </h3>
              </div>
              <button
                onClick={() => setIsRefModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Current Reference Info */}
            <div className="bg-sky-50/70 border border-sky-100/80 rounded-xl p-3 space-y-2">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-slate-800">
                    Active Authorized Voice Reference:
                  </p>
                  <p className="text-[11px] text-slate-600 mt-0.5 font-mono break-all">
                    {voiceRefName}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1 italic">
                    {persona === 'Araan'
                      ? 'Araan (Male): Calm, confident, warm, charismatic adult male profile.'
                      : 'Miku (Female): Sweet, warm, soft, alluring adult female profile.'}
                  </p>
                </div>
              </div>

              {/* Play Reference Preview */}
              <button
                onClick={handlePlayVoicePreview}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-white hover:bg-sky-50 border border-sky-200 rounded-lg text-xs font-medium text-sky-700 transition-colors shadow-2xs cursor-pointer"
              >
                {isPlayingPreview ? (
                  <>
                    <Pause className="w-3.5 h-3.5 text-sky-600" />
                    Pause Voice Preview
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 text-sky-600" />
                    Preview Calibrated Voice Sample
                  </>
                )}
              </button>
            </div>

            {/* Upload Step */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 block">
                Direct Audio File Upload (.mp3, .wav, .m4a, .ogg)
              </label>
              <div className="border border-dashed border-slate-300 hover:border-slate-400 rounded-xl p-3 text-center transition-colors">
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="voice-sample-upload"
                />
                <label
                  htmlFor="voice-sample-upload"
                  className="cursor-pointer flex flex-col items-center justify-center gap-1 text-xs text-slate-600"
                >
                  <Upload className="w-5 h-5 text-slate-400" />
                  <span className="font-medium text-sky-600">Choose Audio File</span>
                  <span className="text-[10px] text-slate-400">Directly supplies authorized reference sample</span>
                </label>
              </div>
            </div>

            {/* Google Drive / URL Step with Permission Notice */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 block">
                Or Import Google Drive / Direct Audio Link
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://drive.google.com/file/d/..."
                  value={driveUrlInput}
                  onChange={(e) => setDriveUrlInput(e.target.value)}
                  className="flex-1 text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 font-mono"
                />
                <button
                  onClick={handleImportDriveUrl}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-medium cursor-pointer"
                >
                  Link
                </button>
              </div>
              <div className="flex items-start gap-1.5 text-[10px] text-slate-400">
                <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                <span>
                  Note: Google Drive requires public sharing permissions. If Google restricts direct streaming, upload the downloaded audio file directly above.
                </span>
              </div>
              {driveStatus && (
                <p className="text-[11px] text-emerald-600 font-medium">
                  {driveStatus}
                </p>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setIsRefModalOpen(false)}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-medium rounded-lg cursor-pointer transition-colors shadow-2xs"
              >
                Apply & Save Reference
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
