export type PersonaChoice = 'sele' | 'meye';
export type AIPersona = 'Miku' | 'Araan' | null;

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  imageUrl?: string;
  isStreaming?: boolean;
  error?: boolean;
}

export interface MemoryItem {
  id: string;
  text: string;
  createdAt: string;
}

export interface AttachedImage {
  name: string;
  mimeType: string;
  data: string; // base64
  previewUrl: string;
}
