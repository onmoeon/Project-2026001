
import React, { useState } from 'react';
import { Sparkles, Loader2, Wand2 } from 'lucide-react';
import { PromptSetting } from '../types';
import { enhanceText } from '../services/geminiService';

interface DossierInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'textarea';
  placeholder?: string;
  enableAI?: boolean;
  aiConfig?: PromptSetting;
  context?: string;
  userCanEnhance?: boolean;
  apiKey?: string; // Restored
}

export const DossierInput: React.FC<DossierInputProps> = ({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  enableAI = false,
  aiConfig,
  context,
  userCanEnhance = true,
  apiKey
}) => {
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEnhance = async () => {
    if (!value.trim()) return;
    if (!aiConfig) {
      setError("AI Config missing");
      return;
    }

    setIsEnhancing(true);
    setError(null);
    try {
      const enhanced = await enhanceText(value, aiConfig, context, apiKey);
      onChange(enhanced);
    } catch (err: any) {
      setError(err.message || "Failed to enhance");
    } finally {
      setIsEnhancing(false);
    }
  };

  return (
    <div className="mb-4 group">
      <div className="flex justify-between items-center mb-1.5">
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {label}
        </label>
        {enableAI && userCanEnhance && value.trim().length > 0 && (
          <button
            onClick={handleEnhance}
            disabled={isEnhancing}
            className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 transition-colors disabled:opacity-50"
            title="Enhance with AI"
          >
            {isEnhancing ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Sparkles className="w-3 h-3" />
            )}
            <span className="font-medium">{isEnhancing ? 'Processing...' : 'Enhance'}</span>
          </button>
        )}
      </div>

      <div className="relative">
        {type === 'textarea' ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={5}
            className={`w-full bg-white border ${error ? 'border-red-300' : 'border-slate-200'} rounded-sm px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-mono resize-y`}
            placeholder={placeholder}
          />
        ) : (
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full bg-white border ${error ? 'border-red-300' : 'border-slate-200'} rounded-sm px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-mono`}
            placeholder={placeholder}
          />
        )}

        {/* Visual cue for focus state or AI ready */}
        <div className="absolute right-2 bottom-2 pointer-events-none opacity-0 group-focus-within:opacity-100 transition-opacity">
          <Wand2 className="w-4 h-4 text-slate-300" />
        </div>
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
};
