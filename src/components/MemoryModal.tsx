import React, { useState } from 'react';
import { X, Trash2, Plus, Sparkles, BookOpen, RotateCcw } from 'lucide-react';
import { MemoryItem, AIPersona } from '../types/persona';

interface MemoryModalProps {
  persona: AIPersona;
  memories: MemoryItem[];
  onClose: () => void;
  onAddMemory: (text: string) => void;
  onDeleteMemory: (id: string) => void;
  onClearAllMemories: () => void;
  onClearConversationHistory: () => void;
  onResetPersona: () => void;
}

export const MemoryModal: React.FC<MemoryModalProps> = ({
  persona,
  memories,
  onClose,
  onAddMemory,
  onDeleteMemory,
  onClearAllMemories,
  onClearConversationHistory,
  onResetPersona,
}) => {
  const [newMemoryText, setNewMemoryText] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemoryText.trim()) return;
    onAddMemory(newMemoryText.trim());
    setNewMemoryText('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white/95 backdrop-blur-2xl rounded-3xl border border-white/90 shadow-[0_20px_50px_rgba(20,30,45,0.12)] p-6 flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-slate-700" />
            <h3
              className="text-base font-semibold text-slate-800 tracking-tight font-display"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              {persona}'s Memory & Controls
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Add Memory Input */}
        <form onSubmit={handleAdd} className="mt-4 flex items-center gap-2">
          <input
            type="text"
            value={newMemoryText}
            onChange={(e) => setNewMemoryText(e.target.value)}
            placeholder={`Add a memory for ${persona} (e.g. "Nickname: Joy", "Likes astrophysics")...`}
            className="flex-1 text-xs px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200/80 outline-none text-slate-800 placeholder:text-slate-400 focus:border-slate-400 focus:bg-white transition-all font-sans"
          />
          <button
            type="submit"
            disabled={!newMemoryText.trim()}
            className="px-3.5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 disabled:opacity-40 transition-all flex items-center gap-1 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </form>

        {/* Memory List */}
        <div className="flex-1 overflow-y-auto my-4 space-y-2.5 pr-1">
          {memories.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              <Sparkles className="w-5 h-5 mx-auto mb-2 text-slate-300" />
              <span>No memories stored yet. Luccha remembers important preferences naturally or you can add them above.</span>
            </div>
          ) : (
            memories.map((item) => (
              <div
                key={item.id}
                className="group flex items-center justify-between p-3 rounded-2xl bg-white border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:border-slate-200 transition-all"
              >
                <div className="flex-1 pr-3">
                  <p className="text-xs text-slate-800 font-sans leading-relaxed">{item.text}</p>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">{item.createdAt}</span>
                </div>
                <button
                  onClick={() => onDeleteMemory(item.id)}
                  className="opacity-60 group-hover:opacity-100 text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                  title="Delete memory"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Global Management Actions */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={onClearAllMemories}
              disabled={memories.length === 0}
              className="text-xs text-rose-600 hover:text-rose-700 disabled:opacity-40 px-2.5 py-1.5 rounded-lg hover:bg-rose-50 transition-colors"
            >
              Clear All Memories
            </button>
            <button
              onClick={onClearConversationHistory}
              className="text-xs text-slate-600 hover:text-slate-900 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Clear Chat History
            </button>
          </div>

          <button
            onClick={onResetPersona}
            className="text-xs text-slate-500 hover:text-slate-800 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-1"
            title="Reset Persona choice and return to 'Ami Luccha'"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Persona</span>
          </button>
        </div>
      </div>
    </div>
  );
};
