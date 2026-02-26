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
        className={`flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl transition-all min-w-[120px] shadow-sm ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        } ${
          isDarkMode 
            ? 'bg-slate-800/50 hover:bg-slate-800 text-slate-200' 
            : 'bg-white hover:bg-slate-50 text-slate-700'
        }`}
      >
        <span className="font-bold text-sm tracking-wide">{value}</span>
        <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180 text-blue-500' : 'text-slate-400'}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 8, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className={`absolute z-50 top-full left-0 w-full rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl border ${
              isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-slate-100'
            }`}
          >
            {formats.map((f) => (
              <button
                key={f}
                onClick={() => {
                  onChange(f);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-3 text-sm font-semibold transition-all ${
                  value === f 
                    ? isDarkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600'
                    : isDarkMode ? 'text-slate-400 hover:bg-slate-800/50' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {f}
                {value === f && <Check className="w-4 h-4" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FormatSelector;
