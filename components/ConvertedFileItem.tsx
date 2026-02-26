
import React, { useState, useRef, useEffect } from 'react';
import { ConvertedFileInfo } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Pause, 
  Download, 
  Edit2, 
  ChevronDown,
  FileAudio as FileIcon,
  Scissors,
  Clock
} from 'lucide-react';

interface ConvertedFileItemProps {
  file: ConvertedFileInfo;
  isDarkMode: boolean;
  isExpanded: boolean;
  onToggle: () => void;
}

const ConvertedFileItem: React.FC<ConvertedFileItemProps> = ({ file, isDarkMode, isExpanded, onToggle }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [customName, setCustomName] = useState(file.name);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [previewTime, setPreviewTime] = useState(0);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setCustomName(file.name);
  }, [file.name]);

  // Main player logic
  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (audioRef.current) {
      if (isPreviewPlaying) {
        previewAudioRef.current?.pause();
        setIsPreviewPlaying(false);
      }
      
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Preview player logic
  const togglePreviewPlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (previewAudioRef.current && file.startTime !== undefined && file.endTime !== undefined) {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      }

      if (isPreviewPlaying) {
        previewAudioRef.current.pause();
      } else {
        if (previewAudioRef.current.currentTime < file.startTime || previewAudioRef.current.currentTime >= file.endTime) {
          previewAudioRef.current.currentTime = file.startTime;
        }
        previewAudioRef.current.play();
      }
      setIsPreviewPlaying(!isPreviewPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handlePreviewTimeUpdate = () => {
    if (previewAudioRef.current && file.startTime !== undefined && file.endTime !== undefined) {
      setPreviewTime(previewAudioRef.current.currentTime);
      if (previewAudioRef.current.currentTime >= file.endTime) {
        previewAudioRef.current.pause();
        setIsPreviewPlaying(false);
        previewAudioRef.current.currentTime = file.startTime;
      }
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handlePreviewEnded = () => {
    setIsPreviewPlaying(false);
    if (file.startTime !== undefined) {
      setPreviewTime(file.startTime);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handlePreviewProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (previewAudioRef.current) {
      previewAudioRef.current.currentTime = time;
      setPreviewTime(time);
    }
  };

  // Setup preview audio
  useEffect(() => {
    let url = '';
    if (file.originalFile) {
      url = URL.createObjectURL(file.originalFile);
      previewAudioRef.current = new Audio(url);
      if (file.startTime !== undefined) {
        setPreviewTime(file.startTime);
      }
    }
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [file.originalFile, file.startTime]);

  const hasTrim = file.startTime !== undefined && file.endTime !== undefined && file.originalDuration !== undefined && (file.startTime > 0 || file.endTime < file.originalDuration);

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl overflow-hidden transition-all duration-300 ${
        isExpanded 
          ? (isDarkMode ? 'bg-slate-800/60 shadow-xl shadow-blue-500/5' : 'bg-white shadow-2xl shadow-blue-500/10')
          : (isDarkMode ? 'bg-slate-800/30 hover:bg-slate-800/50' : 'bg-white hover:bg-slate-50 shadow-sm')
      }`}
    >
      {/* Compact Row */}
      <div 
        onClick={onToggle}
        className="p-5 flex items-center gap-5 cursor-pointer select-none"
      >
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all ${
          isExpanded 
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
            : (isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-50 text-slate-500')
        }`}>
          <FileIcon className="w-6 h-6" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={`text-base font-bold truncate ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
              {customName}
            </p>
            {hasTrim && (
              <div className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-500 text-[10px] font-bold flex items-center gap-1">
                <Scissors className="w-3 h-3" />
                Trimmed
              </div>
            )}
          </div>
          <p className={`text-xs font-semibold ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
            {file.format.split(' ')[0]} • {(file.size / (1024 * 1024)).toFixed(2)} MB
          </p>
        </div>

        <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180 text-blue-500' : 'text-slate-400'}`}>
          <ChevronDown className="w-5 h-5" />
        </div>
      </div>

      {/* Expandable Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <div className="px-5 pb-6 pt-2 flex flex-col gap-6">
              <div className={`h-px ${isDarkMode ? 'bg-slate-700/50' : 'bg-slate-100'}`} />
              
              {/* Filename Edit */}
              <div className="flex flex-col gap-2">
                <label className={`text-xs font-bold ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Rename Track</label>
                <div className="flex items-center gap-3 group/input">
                  <div className={`p-2 rounded-xl transition-colors ${isDarkMode ? 'bg-slate-900 group-focus-within/input:text-blue-400' : 'bg-slate-50 group-focus-within/input:text-blue-600'}`}>
                    <Edit2 className="w-4 h-4" />
                  </div>
                  <input 
                    type="text" 
                    value={customName} 
                    onChange={(e) => setCustomName(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="Enter new filename..."
                    className={`flex-1 bg-transparent border-b-2 border-slate-700/30 outline-none text-sm font-bold py-2 transition-all ${
                      isDarkMode ? 'text-white border-slate-700 focus:border-blue-500' : 'text-slate-800 border-slate-100 focus:border-blue-500'
                    }`}
                  />
                </div>
              </div>

              {/* Trim Context (If applicable) */}
              {hasTrim && (
                <div className={`rounded-2xl p-4 space-y-3 ${isDarkMode ? 'bg-blue-500/5 border border-blue-500/10' : 'bg-blue-50 border border-blue-100'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Scissors className="w-4 h-4 text-blue-500" />
                      <span className={`text-xs font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>Trim Context</span>
                    </div>
                    <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isDarkMode ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-600'}`}>
                      Original: {formatTime(file.originalDuration || 0)}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <audio 
                      ref={previewAudioRef} 
                      onTimeUpdate={handlePreviewTimeUpdate} 
                      onEnded={handlePreviewEnded} 
                      className="hidden" 
                    />
                    <button 
                      onClick={togglePreviewPlay}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                        isPreviewPlaying 
                          ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' 
                          : isDarkMode ? 'bg-slate-800 text-blue-400 hover:bg-slate-700' : 'bg-white text-blue-600 shadow-sm hover:bg-slate-50'
                      }`}
                    >
                      {isPreviewPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                    </button>
                    
                    <div className="flex-1 space-y-1.5">
                      <div className="relative h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                        {/* Selected range highlight */}
                        <div 
                          className="absolute h-full bg-blue-500/30"
                          style={{ 
                            left: `${(file.startTime! / file.originalDuration!) * 100}%`,
                            width: `${((file.endTime! - file.startTime!) / file.originalDuration!) * 100}%`
                          }}
                        />
                        {/* Playback progress */}
                        <div 
                          className="absolute h-full bg-blue-500"
                          style={{ width: `${(previewTime / file.originalDuration!) * 100}%` }}
                        />
                      </div>
                      <div className={`flex justify-between text-[9px] font-bold ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                        <span>{formatTime(file.startTime!)}</span>
                        <span>{formatTime(file.endTime!)}</span>
                      </div>
                    </div>
                  </div>
                  <p className={`text-[10px] font-medium leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    This file was trimmed from the original source. You are playing the segment from {formatTime(file.startTime!)} to {formatTime(file.endTime!)}.
                  </p>
                </div>
              )}

              {/* Main Player */}
              <div className="space-y-2">
                <label className={`text-xs font-bold ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Converted Result</label>
                <div className={`rounded-2xl p-4 flex items-center gap-4 ${
                  isDarkMode ? 'bg-slate-900/40' : 'bg-slate-50'
                }`}>
                  <audio ref={audioRef} src={file.url} onTimeUpdate={handleTimeUpdate} onEnded={handleEnded} className="hidden" />
                  
                  <button 
                    onClick={togglePlay}
                    className="w-10 h-10 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl flex items-center justify-center shrink-0 transition-all shadow-lg shadow-blue-600/20 active:scale-90"
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                  </button>
                  
                  <div className="flex-1 space-y-2">
                    <input 
                      type="range" min="0" max={file.duration} step="0.01" value={currentTime} onChange={handleProgressChange}
                      onClick={(e) => e.stopPropagation()}
                      className={`w-full h-1.5 rounded-full appearance-none cursor-pointer accent-blue-600 ${isDarkMode ? 'bg-slate-700' : 'bg-slate-200'}`}
                    />
                    <div className={`flex justify-between text-[10px] font-mono font-bold ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(file.duration)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <a 
                href={file.url} 
                download={customName}
                onClick={(e) => e.stopPropagation()}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-[0.98] group"
              >
                <Download className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                Download Track
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ConvertedFileItem;
