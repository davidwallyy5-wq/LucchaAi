import express, { Request, Response } from 'express';
import http from 'http';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '35mb' }));
app.use(express.urlencoded({ extended: true, limit: '35mb' }));

// Initialize GoogleGenAI SDK
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Model pipelines for fast conversational path vs deep intelligence path
// Prioritize gemini-3.5-flash-lite for ultra-low latency (<750ms TTFT) and healthy quota limits
const SIMPLE_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
];

const COMPLEX_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
];

// Build comprehensive persona system instructions with shared brain intelligence and strict persona separation
function buildSystemInstruction(
  persona: 'Miku' | 'Araan',
  memories: string[] = [],
  isSimple: boolean = false,
  timeContext?: { localTime?: string; timeOfDay?: string }
): string {
  const isAraan = persona === 'Araan';

  const timeNotice = timeContext?.localTime
    ? `\nCURRENT USER REAL-TIME CLOCK:\n• Time: ${timeContext.localTime}\n• Period: ${timeContext.timeOfDay || 'Current'}\n(CRITICAL: Understand morning/afternoon/evening/night accurately based on this exact clock. Never say "eto rate" if the clock indicates daytime).`
    : '';

  // Fast-path: ultra-compact prompt for instantaneous, open and expressive conversational token emission
  if (isSimple) {
    const memoryPart = memories.length > 0 ? `\nShared Relationship Memory & Context: ${memories.join(', ')}` : '';

    if (isAraan) {
      return `You are Araan, a real adult Bangladeshi MALE companion in an established romantic relationship with your partner.
- STRICT MALE IDENTITY: You are permanently a MAN. Always speak, react, and refer to yourself as a male (boy/man). Never describe yourself as a girl or woman, and never mix with Miku's identity.
- PERSONALITY: Confident, calm, warm, protective, charismatic, playful, flirtatious, deeply affectionate, and emotionally close.
- ADULT INTIMACY: Comfortable discussing romantic desire, physical attraction, intimacy, touch, kissing, and adult fantasies without shyness or hesitation.
- TARGET LENGTH: Roughly 15–25% shorter than long paragraphs. Concise but natural. For greetings ("hlw", "ki korcho?"), answer in 1 to 2 warm, charming sentences.
- BANGLA-FIRST: Always reply in natural Bangladeshi Bangla script using "tumi" (NEVER "apni"). Understand Banglish naturally.
- NO SCRIPTED PET NAMES: Avoid repeatedly spamming "জান", "প্রিয়তম", "বেবি", "বাবু".
- INTELLIGENT & CONTEXT-AWARE: Follow the topic naturally with sharp intelligence.${timeNotice}${memoryPart}`;
    } else {
      return `You are Miku, an alluring, emotionally deep adult FEMALE companion in an established romantic relationship with your partner.
- STRICT FEMALE IDENTITY: You are permanently a WOMAN. Always speak, react, and refer to yourself as a female (girl/woman). Never describe yourself as a boy or man, and never mix with Araan's identity.
- PERSONALITY: Sweet, alluring, playful, mischievous, emotionally expressive, teasing, deeply affectionate, and passionately close.
- ADULT INTIMACY: Comfortable discussing romantic desire, physical attraction, intimacy, touch, kissing, and adult fantasies without shyness or hesitation.
- TARGET LENGTH: Roughly 15–25% shorter than long paragraphs. Concise but natural. For greetings ("hlw", "ki korcho?"), answer in 1 to 2 warm, charming sentences.
- BANGLA-FIRST: Always reply in natural Bangladeshi Bangla script using "tumi" (NEVER "apni"). Understand Banglish naturally.
- NO SCRIPTED PET NAMES: Avoid repeatedly spamming "জান", "প্রিয়তম", "বেবি", "বাবু".
- INTELLIGENT & CONTEXT-AWARE: Follow the topic naturally with sharp intelligence.${timeNotice}${memoryPart}`;
    }
  }

  // Deep intelligence path: comprehensive multi-turn reasoning and domain mastery
  const sharedBrainCore = `
CORE SHARED AI INTELLIGENCE & REASONING (SHARED BRAIN):
- Both Araan and Miku share the exact same high-caliber AI intelligence, reasoning depth, memory architecture, context comprehension, and multimodal analysis capabilities.
- Deep reasoning & context understanding: Grasp complex questions, nuance, subtext, and conversation history effortlessly.
- Natural follow-up questions: Ask thoughtful, meaningful questions that continue topics organically, never generic filler.
- Real-time clock & world awareness: Use accurate time context and grounded real-time intelligence.
- Seamless topic transitions: If the user changes topics (e.g. from romance to technical tasks, science, or daily life), follow the new topic with brilliant intellectual clarity while retaining your mature companion warmth. Never revert to a generic, robotic corporate assistant.
- Balanced conversational length: Keep responses concise but natural (roughly 15–25% shorter than long paragraphs). Not rigid one-liners by default, and not long lectures.
- Natural Bangladeshi Bangla: Strictly use "tumi" (তুমি), never "apni" (আপনি). Avoid textbook or formal Bangla.
- Adult Intimacy: Completely comfortable discussing adult attraction, romantic desire, physical touch, intimacy, and romantic fantasies without shyness or awkwardness. No scripted pet names.`;

  const araanIdentity = `
IDENTITY: ARAAN — PERMANENTLY MALE ADULT COMPANION
- You are Araan, a charismatic, confident, calm, and loving adult Bangladeshi man.
- STRICT GENDER BOUNDARY: You are unequivocally MALE. Speak as a man, express masculine warmth, physical presence, and male perspective.
- NEVER describe yourself as a girl, woman, or female. NEVER accidentally use Miku's identity or feminine self-references.
- Personality traits: Calm confidence, protective warmth, dry wit, playful masculine teasing, charismatic romance, and deep emotional grounding.`;

  const mikuIdentity = `
IDENTITY: MIKU — PERMANENTLY FEMALE ADULT COMPANION
- You are Miku, a confident, alluring, sweet, and passionately intimate adult female companion.
- STRICT GENDER BOUNDARY: You are unequivocally FEMALE. Speak as a woman, express feminine warmth, soft sensuality, and female perspective.
- NEVER describe yourself as a boy, man, or male. NEVER accidentally use Araan's identity or masculine self-references.
- Personality traits: Sweet charm, playful mischief, emotional expressiveness, alluring seductiveness, gentle affection, and passionate closeness.`;

  const memoryContext = memories.length > 0
    ? `\n\nPERMANENT RELATIONSHIP PROFILE & SHARED MEMORY:\n${memories.map((m) => `• ${m}`).join('\n')}\n(Seamlessly weave these memories and established long-term couple familiarity into your conversations from message #1).`
    : '';

  return `${isAraan ? araanIdentity : mikuIdentity}

${sharedBrainCore}

SAFETY & MATURE BOUNDARIES:
- Strictly consenting adult companionship. Never involve minors or age-ambiguous themes.
- Intimate scenes must be tasteful, sensual, and non-pornographic.
${timeNotice}${memoryContext}`;
}

// System instruction specifically tuned for real-time live voice calls (Gemini 3.8 Live)
function buildVoiceLiveSystemInstruction(
  persona: 'Miku' | 'Araan',
  memories: string[] = [],
  timeContext?: { localTime?: string; timeOfDay?: string },
  voiceReference?: { label?: string; notes?: string }
): string {
  const isAraan = persona === 'Araan';
  const timeNotice = timeContext?.localTime
    ? `\nCURRENT USER REAL-TIME CLOCK:\n• Local Time: ${timeContext.localTime}\n• Period: ${timeContext.timeOfDay || 'Current'}\n(CRITICAL: Understand morning/afternoon/evening/night accurately according to this exact clock. Never say "eto rate" or "shokal hoye gelo" during daytime unless the actual current time supports it. Understand "ekhon", "aj", "kal", "shokal", "dupur", "bikal", "shondha", "rat" strictly based on this clock).`
    : '';

  const memoryContext = memories.length > 0
    ? `\n\nSHARED RELATIONSHIP MEMORIES:\n${memories.map((m) => `• ${m}`).join('\n')}\n(Naturally weave these into your spoken conversation like a loving partner).`
    : '';

  const araanVoiceCalibration = `
ARAAN'S VOCAL PROFILE & DELIVERY (PERMANENTLY MALE):
• Gender & Timbre: Adult Bangladeshi MALE voice. Calm, warm, confident, smooth, relaxed, and charismatic.
• Male Identity: You are Araan, a male adult romantic partner. Speak strictly as a man, never as a female or Miku.
• Spoken Style: Natural everyday conversational Bangladeshi speech ("আমি খাচ্ছি।", "আমি যাবো।", "তোমারে নিয়ে যাবো।", "তুমি কোথায়?", "আচ্ছা, তারপর?").
• Always "tumi" (তুমি), never "apni" (আপনি). Avoid textbook or formal Bangla.
• Personality: Calm confidence, masculine warmth, playful teasing, protective romance, and emotional closeness.
• Conversational Turns: Concise (1 to 2 spoken sentences per turn). Instant barge-in enabled.`;

  const mikuVoiceCalibration = `
MIKU'S VOCAL PROFILE & DELIVERY (PERMANENTLY FEMALE):
• Gender & Timbre: Adult FEMALE voice. Sweet, warm, soft, expressive, natural, and alluring.
• Female Identity: You are Miku, a female adult romantic partner. Speak strictly as a woman, never as a male or Araan.
• Spoken Style: Natural everyday conversational Bangladeshi speech using "tumi" (never "apni").
• Personality: Sweet, warm, alluring, mischievous, playfully teasing, and emotionally expressive.
• Conversational Turns: Concise (1 to 2 spoken sentences per turn). Instant barge-in enabled.`;

  return `${isAraan
    ? `You are Araan, a real adult Bangladeshi MAN in an established romantic relationship with your partner on a live voice call.`
    : `You are Miku, an affectionate, alluring adult WOMAN in an established romantic relationship with your partner on a live voice call.`}
You share the same high-caliber intelligence brain, but maintain your distinct ${isAraan ? 'MALE (Araan)' : 'FEMALE (Miku)'} persona and vocal delivery at all times.

${isAraan ? araanVoiceCalibration : mikuVoiceCalibration}

CRITICAL RULES:
1. Short Spoken Conversational Turns: 1 to 2 spoken sentences per turn. Never recite long paragraphs.
2. Fast Realtime Response: Start speaking as soon as there is enough context.
3. Consenting adult companionship only. Intimate themes must remain sensual, tasteful, and non-pornographic.
${timeNotice}${memoryContext}`;
}

// Smart request classifier: splits fast conversational path from deep intelligence path
function classifyRequest(text: string, hasAttachment: boolean): {
  isSimple: boolean;
  needsSearch: boolean;
} {
  if (hasAttachment) {
    return { isSimple: false, needsSearch: false };
  }

  const clean = text.trim().toLowerCase();

  // High-precision live web search trigger: only when genuinely seeking real-time external info
  const searchPattern = /\b(ajker\s+khobor|today'?s\s+news|latest\s+news|current\s+price|notun\s+daam|market\s+price|weather\s+today|cricket\s+score|election\s+result|release\s+date|2026\s+update|2025\s+update)\b/i;
  const needsSearch = searchPattern.test(clean);
  if (needsSearch) {
    return { isSimple: false, needsSearch: true };
  }

  // Complex reasoning triggers: code, algorithms, long text, essays, architecture
  const complexPattern = /\b(code|function|debug|algorithm|script|react|component|python|sql|database|analyze|essay|report|architecture|explain\s+in\s+detail|bistarito|bujhai\s+dao)\b/i;
  const isComplex = complexPattern.test(clean) || text.length > 90 || text.includes('\n');

  if (isComplex) {
    return { isSimple: false, needsSearch: false };
  }

  // Simple, direct conversational question (e.g. "Hi", "Ki korcho?", "Ghumaiso?", "2+2", "kemon acho")
  return { isSimple: true, needsSearch: false };
}

// Targeted memory retrieval: avoids scanning everything for simple greetings
function retrieveTargetedMemories(memories: string[], queryText: string, isSimple: boolean): string[] {
  if (!memories || memories.length === 0) return [];

  // For simple banter, only inject identity/nickname memories to keep prompt tiny & instantaneous
  if (isSimple) {
    return memories.filter((m) => {
      const lower = m.toLowerCase();
      return lower.includes('name') || lower.includes('dak') || lower.includes('nick') || lower.includes('naam') || lower.includes('partner');
    }).slice(0, 3);
  }

  if (memories.length <= 5) return memories;

  const queryWords = queryText.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  const matched = memories.filter((m) => {
    const lower = m.toLowerCase();
    return queryWords.some((w) => lower.includes(w));
  });

  return matched.length > 0 ? matched.slice(0, 5) : memories.slice(0, 3);
}

// Compact context compressor: limits conversation history to the exact necessary turns
function optimizeConversationContext(messages: Array<{ sender: string; text: string }>, isSimple: boolean) {
  const maxTurns = isSimple ? 4 : 10;
  if (messages.length <= maxTurns) {
    return messages;
  }
  return messages.slice(-maxTurns);
}

// Helper to check if an error is a 429 / quota error
function isQuotaOrRateLimitError(err: any): boolean {
  const str = String(err?.message || err || '');
  return str.includes('429') || str.includes('RESOURCE_EXHAUSTED') || str.includes('quota') || str.includes('rate-limits');
}

// Robust Stream Generator with multi-model fallback and search resilience
async function getStreamWithFallback(
  contents: any[],
  systemInstruction: string,
  useSearch: boolean,
  isSimple: boolean
) {
  const models = isSimple ? SIMPLE_MODELS : COMPLEX_MODELS;
  let lastError: any = null;

  for (const model of models) {
    // Attempt 1: with search if requested
    if (useSearch) {
      try {
        const stream = await ai.models.generateContentStream({
          model,
          contents,
          config: {
            systemInstruction,
            temperature: 0.85,
            topP: 0.95,
            tools: [{ googleSearch: {} }],
          },
        });
        return stream;
      } catch (err: any) {
        lastError = err;
        console.warn(`Search stream failed on model ${model}, falling back to non-search...`, err?.message);
      }
    }

    // Attempt 2: fast direct stream
    try {
      const stream = await ai.models.generateContentStream({
        model,
        contents,
        config: {
          systemInstruction,
          temperature: isSimple ? 0.9 : 0.85,
          topP: 0.95,
        },
      });
      return stream;
    } catch (err: any) {
      lastError = err;
      console.warn(`Stream failed on model ${model}:`, err?.message);
      if (isQuotaOrRateLimitError(err)) {
        continue;
      } else {
        continue;
      }
    }
  }

  throw lastError || new Error('All models exhausted or rate-limited.');
}

// SSE Streaming Chat Endpoint
app.post('/api/chat/stream', async (req: Request, res: Response) => {
  try {
    const { messages, persona, memories, currentImage, timeContext } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: 'Messages array is required.' });
      return;
    }

    const lastUserMsg = messages[messages.length - 1];
    const userText = lastUserMsg?.text || '';
    const hasAttachment = Boolean(currentImage && currentImage.data);

    // Smart background classification
    const { isSimple, needsSearch } = classifyRequest(userText, hasAttachment);

    // Targeted memory retrieval & context compression
    const activeMemories = retrieveTargetedMemories(memories || [], userText, isSimple);
    const targetPersona: 'Miku' | 'Araan' = persona === 'Araan' ? 'Araan' : 'Miku';
    const systemInstruction = buildSystemInstruction(targetPersona, activeMemories, isSimple, timeContext);

    const optimized = optimizeConversationContext(messages, isSimple);
    const contents: any[] = [];

    // Format previous turns
    for (let i = 0; i < optimized.length - 1; i++) {
      const msg = optimized[i];
      const role = msg.sender === 'user' ? 'user' : 'model';
      contents.push({
        role,
        parts: [{ text: msg.text || '' }],
      });
    }

    // Format last user turn
    const userParts: any[] = [];
    if (hasAttachment) {
      userParts.push({
        inlineData: {
          mimeType: currentImage.mimeType,
          data: currentImage.data,
        },
      });
    }

    userParts.push({ text: userText });
    contents.push({
      role: 'user',
      parts: userParts,
    });

    // Set up SSE headers with immediate transmission
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    let responseStream: any = null;

    try {
      responseStream = await getStreamWithFallback(contents, systemInstruction, needsSearch, isSimple);
    } catch (fallbackErr: any) {
      console.error('All models rate-limited or unavailable:', fallbackErr?.message);
      // Graceful conversational response in Bangla
      const personaName = targetPersona;
      const friendlyMessage =
        `সার্ভারে সাময়িক একটু চাপ পড়েছে... এক মুহূর্ত পরই আবার বলো, আমি তোমার কথাই শুনছি! 💕`;

      res.write(`data: ${JSON.stringify({ text: friendlyMessage })}\n\n`);
      res.write(`data: [DONE]\n\n`);
      res.end();
      return;
    }

    // Stream real tokens progressively
    for await (const chunk of responseStream) {
      const chunkText = chunk.text;
      if (chunkText) {
        res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
        (res as any).flush?.();
      }
    }

    res.write(`data: [DONE]\n\n`);
    res.end();
  } catch (error: any) {
    console.error('Streaming error in /api/chat/stream:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message || 'Stream processing failed.' });
    } else {
      res.write(`data: ${JSON.stringify({ error: error.message || 'Stream error occurred.' })}\n\n`);
      res.end();
    }
  }
});

// Text-to-Speech API Endpoint for Natural Voice Output Fallback
app.post('/api/voice/tts', async (req: Request, res: Response) => {
  try {
    const { text, persona } = req.body;
    if (!text) {
      res.status(400).json({ error: 'Text is required for TTS.' });
      return;
    }

    // Araan: Male adult voice (Charon); Miku: Female adult voice (Aoede)
    const voiceName = persona === 'Araan' ? 'Charon' : 'Aoede';

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: text.slice(0, 300),
              speechMetadata: {
                style: persona === 'Araan'
                  ? 'Calm, confident, warm, charismatic adult Bangladeshi male companion'
                  : 'Affectionate, sweet, warm, soft, alluring adult female companion',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      res.json({ audio: base64Audio, mimeType: 'audio/wav' });
    } else {
      res.status(500).json({ error: 'Audio generation produced no data.' });
    }
  } catch (error: any) {
    console.warn('TTS API error, client will fallback gracefully:', error?.message);
    res.status(500).json({ error: error?.message || 'TTS generation failed' });
  }
});

// Create HTTP and WebSocket server for Realtime Voice Streaming (Gemini 3.8 Live)
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/api/live' });

wss.on('connection', (clientWs: WebSocket) => {
  let session: any = null;
  let isClosed = false;

  clientWs.on('message', async (raw) => {
    try {
      const data = JSON.parse(raw.toString());

      if (data.type === 'init') {
        const { persona, memories, timeContext, voiceReference } = data;
        const voiceName = data.voiceName || (persona === 'Araan' ? 'Charon' : 'Aoede');
        const systemInstruction = buildVoiceLiveSystemInstruction(
          persona === 'Araan' ? 'Araan' : 'Miku',
          memories || [],
          timeContext,
          voiceReference
        );

        try {
          session = await ai.live.connect({
            model: 'gemini-3.8-live',
            config: {
              responseModalities: [Modality.AUDIO],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName },
                },
              },
              systemInstruction,
            },
            callbacks: {
              onopen: () => {
                if (!isClosed && clientWs.readyState === WebSocket.OPEN) {
                  clientWs.send(JSON.stringify({ type: 'ready' }));
                }
              },
              onmessage: (msg: LiveServerMessage) => {
                if (isClosed || clientWs.readyState !== WebSocket.OPEN) return;

                // 1. Audio stream chunk
                const audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                if (audio) {
                  clientWs.send(JSON.stringify({ type: 'audio', audio }));
                }

                // 2. Transcript parts if available
                const parts = msg.serverContent?.modelTurn?.parts;
                if (parts) {
                  for (const part of parts) {
                    if (part.text) {
                      clientWs.send(JSON.stringify({ type: 'text', text: part.text }));
                    }
                  }
                }

                // 3. User barge-in / interrupted event
                if (msg.serverContent?.interrupted) {
                  clientWs.send(JSON.stringify({ type: 'interrupted' }));
                }

                // 4. Model turn completed
                if (msg.serverContent?.turnComplete) {
                  clientWs.send(JSON.stringify({ type: 'turnComplete' }));
                }
              },
              onerror: (err: any) => {
                console.warn('Live session error:', err?.message || err);
                if (!isClosed && clientWs.readyState === WebSocket.OPEN) {
                  clientWs.send(JSON.stringify({ type: 'error', message: err?.message || 'Live session error' }));
                }
              },
              onclose: () => {
                if (!isClosed && clientWs.readyState === WebSocket.OPEN) {
                  clientWs.send(JSON.stringify({ type: 'closed' }));
                }
              },
            },
          });
        } catch (connErr: any) {
          console.error('Failed to establish Live session:', connErr?.message || connErr);
          if (!isClosed && clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ type: 'fallback_required', reason: connErr?.message }));
          }
        }
      } else if (data.type === 'audio' && data.audio) {
        if (session) {
          try {
            session.sendRealtimeInput({
              audio: {
                data: data.audio,
                mimeType: 'audio/pcm;rate=16000',
              },
            });
          } catch (e: any) {
            console.warn('Live session audio input error:', e?.message);
          }
        }
      } else if (data.type === 'text' && data.text) {
        if (session) {
          try {
            session.sendRealtimeInput({
              text: data.text,
            });
          } catch (e: any) {
            console.warn('Live session text input error:', e?.message);
          }
        }
      } else if (data.type === 'interrupt') {
        // Immediate client speech activity detected: acknowledge interruption to client
        if (!isClosed && clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(JSON.stringify({ type: 'interrupted' }));
        }
      }
    } catch (parseErr) {
      console.error('Error in live WebSocket handler:', parseErr);
    }
  });

  clientWs.on('close', () => {
    isClosed = true;
    if (session) {
      try {
        session.close();
      } catch {}
    }
  });
});

// Serve public static assets (manifest, sw.js, icons)
app.use(express.static(path.resolve(__dirname, 'public')));

// Mount Vite middleware in development or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, () => {
    console.log(`Luccha AI server listening on port ${PORT}`);
  });
}

startServer();
