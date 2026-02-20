
import React, { useState, useRef, useEffect } from 'react';
import { ConvertedFileInfo } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Music, 
  Download, 
  Play, 
  Pause, 
  FileAudio, 
  Clock, 
  HardDrive, 
  AudioWaveform,
  Edit2,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  FileAudio as FileIcon
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
  const [isEditing, setIsEditing] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setCustomName(file.name);
  }, [file.name]);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
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

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border overflow-hidden transition-all duration-300 ${
        isExpanded 
          ? (isDarkMode ? 'bg-slate-800/60 border-blue-500/50 shadow-lg shadow-blue-500/5' : 'bg-white border-blue-200 shadow-xl shadow-blue-500/5')
          : (isDarkMode ? 'bg-slate-800/30 border-slate-700/50 hover:bg-slate-800/50' : 'bg-white border-slate-100 hover:border-slate-200 shadow-sm')
      }`}
    >
      {/* Compact Row */}
      <div 
        onClick={onToggle}
        className="p-4 flex items-center gap-4 cursor-pointer select-none"
      >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all ${
          isExpanded 
            ? 'bg-blue-500 text-white' 
            : (isDarkMode ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-500')
        }`}>
          <FileIcon className="w-5 h-5" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={`text-sm font-bold truncate ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
              {customName}
            </p>
          </div>
          <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
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
            <div className="px-4 pb-4 pt-2 flex flex-col gap-4 border-t border-slate-700/10">
              {/* Filename Edit */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className={`text-[9px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Rename Track</label>
                  <span className="text-[8px] text-emerald-500 font-bold flex items-center gap-1">
                    <Check className="w-2.5 h-2.5" />
                    AUTO-SAVED
                  </span>
                </div>
                <div className="flex items-center gap-2 group/input">
                  <div className={`p-1.5 rounded-lg transition-colors ${isDarkMode ? 'bg-slate-900 group-focus-within/input:text-blue-400' : 'bg-slate-50 group-focus-within/input:text-blue-600'}`}>
                    <Edit2 className="w-3 h-3" />
                  </div>
                  <input 
                    type="text" 
                    value={customName} 
                    onChange={(e) => setCustomName(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="Enter new filename..."
                    className={`flex-1 bg-transparent border-b border-slate-700/30 outline-none text-xs font-bold py-1 transition-all ${
                      isDarkMode ? 'text-white border-slate-600 focus:border-blue-500' : 'text-slate-800 border-slate-200 focus:border-blue-500'
                    }`}
                  />
                </div>
              </div>

              {/* Player */}
              <div className={`rounded-xl p-3 flex items-center gap-3 ${
                isDarkMode ? 'bg-slate-900/40' : 'bg-slate-50'
              }`}>
                <audio ref={audioRef} src={file.url} onTimeUpdate={handleTimeUpdate} onEnded={handleEnded} className="hidden" />
                
                <button 
                  onClick={togglePlay}
                  className="w-8 h-8 bg-blue-600 hover:bg-blue-500 text-white rounded-full flex items-center justify-center shrink-0 transition-all shadow-md active:scale-90"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                </button>
                
                <div className="flex-1 space-y-1">
                  <input 
                    type="range" min="0" max={file.duration} step="0.01" value={currentTime} onChange={handleProgressChange}
                    onClick={(e) => e.stopPropagation()}
                    className={`w-full h-1 rounded-full appearance-none cursor-pointer accent-blue-600 ${isDarkMode ? 'bg-slate-700' : 'bg-slate-200'}`}
                  />
                  <div className={`flex justify-between text-[8px] font-mono font-bold ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(file.duration)}</span>
                  </div>
                </div>
              </div>

              <a 
                href={file.url} 
                download={customName}
                onClick={(e) => e.stopPropagation()}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 active:scale-[0.98] group"
              >
                <Download className="w-3.5 h-3.5 group-hover:translate-y-0.5 transition-transform" />
                Download Track
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

interface GeminiPanelProps {
  activeTrack: Track | null;
  setTracks: React.Dispatch<React.SetStateAction<Track[]>>;
  convertedFiles: ConvertedFileInfo[];
  isDarkMode: boolean;
}

const GeminiPanel: React.FC<GeminiPanelProps> = ({ activeTrack, setTracks, convertedFiles, isDarkMode }) => {
  const [activePreviewId, setActivePreviewId] = useState<string | null>(null);
  const [isTrimEnabled, setIsTrimEnabled] = useState(false);

  // Auto-expand the most recently converted file
  useEffect(() => {
    if (convertedFiles.length > 0) {
      setActivePreviewId(convertedFiles[0].url);
    }
  }, [convertedFiles.length]);

  return (
    <div className="glass-panel rounded-[2rem] p-8 flex flex-col gap-6 h-full min-h-[600px] shadow-2xl transition-all duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
            isDarkMode ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600 shadow-sm shadow-blue-500/10'
          }`}>
            <AudioWaveform className="w-7 h-7" />
          </div>
          <div className="flex flex-col">
            <h3 className={`text-xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Results</h3>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              {convertedFiles.length} {convertedFiles.length === 1 ? 'File' : 'Files'} Ready
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar flex flex-col gap-3">
        {/* Active Track Trim Section (Moved here) */}
        <AnimatePresence mode="wait">
          {activeTrack && activeTrack.status === 'waiting' && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`p-6 rounded-[2rem] border space-y-4 mb-4 ${
                isDarkMode ? 'bg-blue-500/5 border-blue-500/20' : 'bg-blue-50/50 border-blue-100 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Scissors className="w-4 h-4 text-blue-500" />
                  <div className="flex flex-col">
                    <label className={`text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Precision Trim</label>
                    <p className={`text-[9px] truncate max-w-[150px] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{activeTrack.displayName}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsTrimEnabled(!isTrimEnabled)}
                  className={`text-[10px] font-bold px-3 py-1 rounded-full transition-all ${
                    isTrimEnabled 
                      ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' 
                      : isDarkMode ? 'bg-slate-800 text-slate-500 hover:bg-slate-700' : 'bg-slate-200 text-slate-500 hover:bg-slate-300'
                  }`}
                >
                  {isTrimEnabled ? 'ACTIVE' : 'OFF'}
                </button>
              </div>

              {isTrimEnabled && (
                <div className="space-y-6 animate-fade-in-up">
                  <TrimSlider
                    duration={activeTrack.duration}
                    start={activeTrack.startTime}
                    end={activeTrack.endTime}
                    onStartChange={(val) => setTracks(prev => prev.map(f => f.id === activeTrack.id ? { ...f, startTime: val } : f))}
                    onEndChange={(val) => setTracks(prev => prev.map(f => f.id === activeTrack.id ? { ...f, endTime: val } : f))}
                    isDarkMode={isDarkMode}
                  />
                  <p className="text-[9px] text-center text-slate-500 font-medium italic">
                    Trim settings will be applied during conversion.
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="popLayout">
          {convertedFiles.length > 0 ? (
            convertedFiles.map((file, index) => (
              <ConvertedFileItem 
                key={`${file.url}-${index}`} 
                file={file} 
                isDarkMode={isDarkMode} 
                isExpanded={activePreviewId === file.url}
                onToggle={() => setActivePreviewId(activePreviewId === file.url ? null : file.url)}
              />
            ))
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`flex-1 flex flex-col items-center justify-center text-center p-12 rounded-[2rem] border-2 border-dashed transition-all ${
                isDarkMode ? 'bg-slate-900/20 border-slate-800/50' : 'bg-slate-50/50 border-slate-100'
              }`}
            >
               <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-6 animate-pulse-slow ${
                 isDarkMode ? 'bg-slate-800/50 text-slate-700' : 'bg-slate-100 text-slate-200'
               }`}>
                 <Music className="w-10 h-10" />
               </div>
               <p className={`text-base font-semibold ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>No results yet</p>
               <p className={`text-sm mt-2 max-w-[200px] ${isDarkMode ? 'text-slate-700' : 'text-slate-300'}`}>Convert files on the left to see them here.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default GeminiPanel;
