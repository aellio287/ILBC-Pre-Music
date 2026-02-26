import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, Scissors, Clock, AlertCircle } from 'lucide-react';

interface TrimSliderProps {
  file: File;
  duration: number;
  start: number;
  end: number;
  onStartChange: (val: number) => void;
  onEndChange: (val: number) => void;
  disabled?: boolean;
  isDarkMode: boolean;
}

// Helper functions
const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 10);
  return `${mins}:${secs.toString().padStart(2, '0')}.${ms}`;
};

const secondsToMinSec = (totalSeconds: number) => {
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.floor(totalSeconds % 60);
  return { mins, secs };
};

const minSecToSeconds = (mins: number, secs: number) => {
  return (mins * 60) + secs;
};

const TrimSlider: React.FC<TrimSliderProps> = ({ 
  file, 
  duration, 
  start, 
  end, 
  onStartChange, 
  onEndChange, 
  disabled, 
  isDarkMode 
}) => {
  const [peaks, setPeaks] = useState<number[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isDragging, setIsDragging] = useState<'start' | 'end' | null>(null);
  
  // Manual input states
  const [startInput, setStartInput] = useState(secondsToMinSec(start));
  const [endInput, setEndInput] = useState(secondsToMinSec(end));
  
  const containerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Sync manual inputs when start/end changes (from dragging)
  useEffect(() => {
    if (!isDragging) {
      setStartInput(secondsToMinSec(start));
      setEndInput(secondsToMinSec(end));
    }
  }, [start, end, isDragging]);

  // Generate peaks for waveform
  useEffect(() => {
    const generatePeaks = async () => {
      if (file.size > 200 * 1024 * 1024) {
        console.warn("File too large for waveform generation");
        return;
      }
      try {
        const arrayBuffer = await file.arrayBuffer();
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const decodedBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        
        const channelData = decodedBuffer.getChannelData(0);
        const samplesPerPixel = Math.floor(channelData.length / 200); // 200 bars
        const newPeaks = [];
        
        for (let i = 0; i < 200; i++) {
          let max = 0;
          for (let j = 0; j < samplesPerPixel; j++) {
            const val = Math.abs(channelData[i * samplesPerPixel + j]);
            if (val > max) max = val;
          }
          newPeaks.push(max);
        }
        
        setPeaks(newPeaks);
        await audioCtx.close();
      } catch (err) {
        console.error("Failed to generate peaks", err);
      }
    };

    generatePeaks();
  }, [file]);

  // Audio preview logic
  useEffect(() => {
    const url = URL.createObjectURL(file);
    audioRef.current = new Audio(url);
    
    const audio = audioRef.current;
    
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (audio.currentTime >= end) {
        audio.pause();
        setIsPlaying(false);
        audio.currentTime = start;
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.pause();
      URL.revokeObjectURL(url);
    };
  }, [file, start, end]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      if (audioRef.current.currentTime < start || audioRef.current.currentTime >= end) {
        audioRef.current.currentTime = start;
      }
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const time = (x / rect.width) * duration;
    
    if (isDragging === 'start') {
      onStartChange(Math.min(time, end - 0.1));
    } else {
      onEndChange(Math.max(time, start + 0.1));
    }
  }, [isDragging, duration, start, end, onStartChange, onEndChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(null);
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const x = Math.max(0, Math.min(touch.clientX - rect.left, rect.width));
    const time = (x / rect.width) * duration;
    
    if (isDragging === 'start') {
      onStartChange(Math.min(time, end - 0.1));
    } else {
      onEndChange(Math.max(time, start + 0.1));
    }
  }, [isDragging, duration, start, end, onStartChange, onEndChange]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove]);

  // Manual input handlers
  const handleStartInputChange = (field: 'mins' | 'secs', value: string) => {
    const num = parseInt(value) || 0;
    const clamped = field === 'secs' ? Math.min(59, Math.max(0, num)) : Math.max(0, num);
    
    const newStartInput = { ...startInput, [field]: clamped };
    setStartInput(newStartInput);
    
    const newSeconds = minSecToSeconds(newStartInput.mins, newStartInput.secs);
    const validSeconds = Math.min(newSeconds, end - 0.1);
    onStartChange(validSeconds);
  };

  const handleEndInputChange = (field: 'mins' | 'secs', value: string) => {
    const num = parseInt(value) || 0;
    const clamped = field === 'secs' ? Math.min(59, Math.max(0, num)) : Math.max(0, num);
    
    const newEndInput = { ...endInput, [field]: clamped };
    setEndInput(newEndInput);
    
    const newSeconds = minSecToSeconds(newEndInput.mins, newEndInput.secs);
    const validSeconds = Math.max(start + 0.1, Math.min(newSeconds, duration));
    onEndChange(validSeconds);
  };

  const startPos = (start / duration) * 100;
  const endPos = (end / duration) * 100;
  const currentPos = (currentTime / duration) * 100;
  const isInvalid = start >= end;

  return (
    <div className="space-y-8">
      {/* Waveform Container */}
      <div className="space-y-4">
        <div 
          ref={containerRef}
          className={`relative h-32 rounded-[2rem] overflow-hidden group select-none transition-all duration-300 shadow-inner ${
            isDarkMode ? 'bg-slate-900/40' : 'bg-slate-100/50'
          } ${isInvalid ? 'ring-2 ring-red-500/20' : ''}`}
        >
          {/* Waveform Visualization */}
          <div className="absolute inset-0 flex items-center justify-around px-4 gap-[1px]">
            {peaks.length > 0 ? (
              peaks.map((peak, i) => {
                const xPos = (i / peaks.length) * 100;
                const isSelected = xPos >= startPos && xPos <= endPos;
                return (
                  <div 
                    key={i}
                    className={`w-full rounded-full transition-all duration-500 ${
                      isSelected 
                        ? (isDarkMode ? 'bg-blue-500/60 shadow-[0_0_12px_rgba(59,130,246,0.2)]' : 'bg-blue-500/80')
                        : (isDarkMode ? 'bg-slate-700/20' : 'bg-slate-300/30')
                    }`}
                    style={{ height: `${Math.max(6, peak * 100)}%` }}
                  />
                );
              })
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                {file.size > 200 * 1024 * 1024 ? (
                  <p className={`text-xs font-semibold ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>
                    Waveform preview not available for large files
                  </p>
                ) : (
                  <div className="w-10 h-10 border-4 border-blue-500/10 border-t-blue-500 rounded-full animate-spin" />
                )}
              </div>
            )}
          </div>

          {/* Selected Area Overlay */}
          <div 
            className={`absolute inset-y-0 pointer-events-none transition-all duration-75 ${
              isInvalid ? 'bg-red-500/5' : 'bg-blue-500/5'
            }`}
            style={{ left: `${startPos}%`, right: `${100 - endPos}%` }}
          />

          {/* Playback Progress Line */}
          {isPlaying && (
            <div 
              className="absolute inset-y-0 w-0.5 bg-white z-30 shadow-[0_0_15px_rgba(255,255,255,1)] pointer-events-none"
              style={{ left: `${currentPos}%` }}
            />
          )}

          {/* Trim Handles */}
          <div 
            className="absolute inset-y-0 w-10 -ml-5 cursor-ew-resize z-40 flex items-center justify-center group/handle"
            style={{ left: `${startPos}%` }}
            onMouseDown={() => setIsDragging('start')}
            onTouchStart={() => setIsDragging('start')}
          >
            <div className={`w-2 h-16 rounded-full transition-all ${
              isDragging === 'start' ? 'bg-blue-400 scale-x-125' : 'bg-blue-500 group-hover/handle:bg-blue-400'
            } shadow-lg shadow-blue-500/40`} />
            <div className="absolute top-4 w-3 h-3 bg-white rounded-full shadow-md" />
            <div className="absolute bottom-4 w-3 h-3 bg-white rounded-full shadow-md" />
          </div>

          <div 
            className="absolute inset-y-0 w-10 -ml-5 cursor-ew-resize z-40 flex items-center justify-center group/handle"
            style={{ left: `${endPos}%` }}
            onMouseDown={() => setIsDragging('end')}
            onTouchStart={() => setIsDragging('end')}
          >
            <div className={`w-2 h-16 rounded-full transition-all ${
              isDragging === 'end' ? 'bg-blue-400 scale-x-125' : 'bg-blue-500 group-hover/handle:bg-blue-400'
            } shadow-lg shadow-blue-500/40`} />
            <div className="absolute top-4 w-3 h-3 bg-white rounded-full shadow-md" />
            <div className="absolute bottom-4 w-3 h-3 bg-white rounded-full shadow-md" />
          </div>
        </div>

        <div className="flex items-center justify-between px-2">
          <p className={`text-xs font-medium ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
            Drag handles to trim or use manual inputs below
          </p>
          <div className={`px-3 py-1 rounded-full flex items-center gap-2 ${isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
            <Clock className="w-3.5 h-3.5" />
            <span className="text-xs font-bold font-mono">{formatTime(end - start)}</span>
          </div>
        </div>
      </div>

      {/* Manual Inputs & Controls */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-10">
            {/* Start Input Group */}
            <div className="flex flex-col gap-2">
              <span className={`text-xs font-semibold ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Start Time</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={startInput.mins}
                  onChange={(e) => handleStartInputChange('mins', e.target.value)}
                  className={`w-14 h-10 rounded-xl text-center font-mono text-sm font-bold transition-all outline-none ${
                    isDarkMode 
                      ? 'bg-slate-800 text-blue-400 focus:bg-slate-700' 
                      : 'bg-white text-blue-600 shadow-sm focus:shadow-md'
                  }`}
                />
                <span className={`font-bold ${isDarkMode ? 'text-slate-700' : 'text-slate-300'}`}>:</span>
                <input
                  type="number"
                  value={startInput.secs}
                  onChange={(e) => handleStartInputChange('secs', e.target.value)}
                  className={`w-14 h-10 rounded-xl text-center font-mono text-sm font-bold transition-all outline-none ${
                    isDarkMode 
                      ? 'bg-slate-800 text-blue-400 focus:bg-slate-700' 
                      : 'bg-white text-blue-600 shadow-sm focus:shadow-md'
                  }`}
                />
              </div>
            </div>

            {/* End Input Group */}
            <div className="flex flex-col gap-2">
              <span className={`text-xs font-semibold ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>End Time</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={endInput.mins}
                  onChange={(e) => handleEndInputChange('mins', e.target.value)}
                  className={`w-14 h-10 rounded-xl text-center font-mono text-sm font-bold transition-all outline-none ${
                    isDarkMode 
                      ? 'bg-slate-800 text-blue-400 focus:bg-slate-700' 
                      : 'bg-white text-blue-600 shadow-sm focus:shadow-md'
                  }`}
                />
                <span className={`font-bold ${isDarkMode ? 'text-slate-700' : 'text-slate-300'}`}>:</span>
                <input
                  type="number"
                  value={endInput.secs}
                  onChange={(e) => handleEndInputChange('secs', e.target.value)}
                  className={`w-14 h-10 rounded-xl text-center font-mono text-sm font-bold transition-all outline-none ${
                    isDarkMode 
                      ? 'bg-slate-800 text-blue-400 focus:bg-slate-700' 
                      : 'bg-white text-blue-600 shadow-sm focus:shadow-md'
                  }`}
                />
              </div>
            </div>
          </div>
          
          <button
            onClick={togglePlay}
            disabled={disabled}
            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-lg active:scale-95 ${
              isPlaying 
                ? 'bg-blue-600 text-white shadow-blue-600/20' 
                : isDarkMode ? 'bg-slate-800 text-blue-400 hover:bg-slate-700' : 'bg-white text-blue-600 hover:bg-slate-50 shadow-sm'
            }`}
          >
            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
          </button>
        </div>

        {isInvalid && (
          <div className="flex items-center gap-3 px-2 text-red-500 animate-pulse">
            <AlertCircle className="w-4 h-4" />
            <span className="text-xs font-bold">Invalid Selection: End must be after start</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrimSlider;
