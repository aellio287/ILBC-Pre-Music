import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface TrimSliderProps {
  duration: number;
  start: number;
  end: number;
  onStartChange: (val: number) => void;
  onEndChange: (val: number) => void;
  disabled?: boolean;
  isDarkMode: boolean;
}

const TrimSlider: React.FC<TrimSliderProps> = ({ duration, start, end, onStartChange, onEndChange, disabled, isDarkMode }) => {
  const [hoveringStart, setHoveringStart] = useState(false);
  const [hoveringEnd, setHoveringEnd] = useState(false);
  const [isDraggingStart, setIsDraggingStart] = useState(false);
  const [isDraggingEnd, setIsDraggingEnd] = useState(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms}`;
  };

  const getPercent = (val: number) => (val / duration) * 100;

  return (
    <div className="space-y-8 py-4">
      <div className="relative h-2 w-full bg-slate-500/10 rounded-full">
        {/* Selected Range Highlight */}
        <div 
          className="absolute h-full bg-blue-500/30 rounded-full"
          style={{ 
            left: `${getPercent(start)}%`, 
            right: `${100 - getPercent(end)}%` 
          }}
        />

        {/* Start Handle */}
        <div 
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 group"
          style={{ left: `${getPercent(start)}%` }}
          onMouseEnter={() => setHoveringStart(true)}
          onMouseLeave={() => !isDraggingStart && setHoveringStart(false)}
        >
          <AnimatePresence>
            {(hoveringStart || isDraggingStart) && (
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.8 }}
                animate={{ opacity: 1, y: -32, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.8 }}
                className="absolute left-1/2 -translate-x-1/2 px-2 py-1 bg-blue-600 text-white text-[10px] font-mono font-bold rounded shadow-lg whitespace-nowrap pointer-events-none"
              >
                {formatTime(start)}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-blue-600" />
              </motion.div>
            )}
          </AnimatePresence>
          <input
            type="range"
            min="0"
            max={duration}
            step="0.1"
            value={start}
            disabled={disabled}
            onChange={(e) => onStartChange(Math.min(parseFloat(e.target.value), end - 0.1))}
            onMouseDown={() => setIsDraggingStart(true)}
            onMouseUp={() => setIsDraggingStart(false)}
            className="absolute inset-0 w-6 h-6 -translate-x-1/2 -translate-y-1/2 opacity-0 cursor-pointer z-30"
          />
          <div className={`w-4 h-4 rounded-full border-2 transition-all ${
            isDraggingStart ? 'scale-125 bg-blue-500 border-white' : 'bg-white border-blue-500 group-hover:scale-110'
          } shadow-md`} />
        </div>

        {/* End Handle */}
        <div 
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 group"
          style={{ left: `${getPercent(end)}%` }}
          onMouseEnter={() => setHoveringEnd(true)}
          onMouseLeave={() => !isDraggingEnd && setHoveringEnd(false)}
        >
          <AnimatePresence>
            {(hoveringEnd || isDraggingEnd) && (
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.8 }}
                animate={{ opacity: 1, y: -32, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.8 }}
                className="absolute left-1/2 -translate-x-1/2 px-2 py-1 bg-blue-600 text-white text-[10px] font-mono font-bold rounded shadow-lg whitespace-nowrap pointer-events-none"
              >
                {formatTime(end)}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-blue-600" />
              </motion.div>
            )}
          </AnimatePresence>
          <input
            type="range"
            min="0"
            max={duration}
            step="0.1"
            value={end}
            disabled={disabled}
            onChange={(e) => onEndChange(Math.max(parseFloat(e.target.value), start + 0.1))}
            onMouseDown={() => setIsDraggingEnd(true)}
            onMouseUp={() => setIsDraggingEnd(false)}
            className="absolute inset-0 w-6 h-6 -translate-x-1/2 -translate-y-1/2 opacity-0 cursor-pointer z-30"
          />
          <div className={`w-4 h-4 rounded-full border-2 transition-all ${
            isDraggingEnd ? 'scale-125 bg-blue-500 border-white' : 'bg-white border-blue-500 group-hover:scale-110'
          } shadow-md`} />
        </div>
      </div>

      <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">
        <div className="flex flex-col gap-1">
          <span>Start Point</span>
          <span className="text-blue-500 font-mono">{formatTime(start)}</span>
        </div>
        <div className="text-center bg-blue-500/10 px-3 py-1 rounded-full text-blue-400">
          Duration: {formatTime(end - start)}
        </div>
        <div className="flex flex-col gap-1 items-end">
          <span>End Point</span>
          <span className="text-blue-500 font-mono">{formatTime(end)}</span>
        </div>
      </div>
    </div>
  );
};

export default TrimSlider;
