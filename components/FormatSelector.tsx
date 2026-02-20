import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { OutputFormat } from '../utils/audioConverter';

interface FormatSelectorProps {
  value: OutputFormat;
  onChange: (format: OutputFormat) => void;
  disabled?: boolean;
  isDarkMode: boolean;
}

const formats: OutputFormat[] = ['WAV', 'MP3', 'FLAC', 'AAC', 'OGG'];

const FormatSelector: React.FC<FormatSelectorProps> = ({ value, onChange, disabled, isDarkMode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`flex items-center justify-between gap-2 px-4 py-2 rounded-xl border-2 transition-all min-w-[100px] ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        } ${
          isDarkMode 
            ? 'bg-slate-900/40 border-slate-800 hover:border-slate-700 text-slate-200' 
            : 'bg-slate-50 border-slate-100 hover:border-slate-200 text-slate-700'
        }`}
      >
        <span className="font-bold text-sm">{value}</span>
        <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 4, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className={`absolute z-50 top-full left-0 w-full rounded-xl border shadow-2xl overflow-hidden ${
              isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
            }`}
          >
            {formats.map((f) => (
              <button
                key={f}
                onClick={() => {
                  onChange(f);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium transition-colors ${
                  value === f 
                    ? isDarkMode ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'
                    : isDarkMode ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {f}
                {value === f && <Check className="w-3.5 h-3.5" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FormatSelector;
