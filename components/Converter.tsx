import React, { useState, useRef, ChangeEvent, DragEvent, useEffect, useCallback } from 'react';
import { convertMedia, OutputFormat, TrimOptions, AudioSettings } from '../utils/audioConverter';
import { ConvertedFileInfo, Track, FileMetadata } from '../types';
import { 
  FileText, 
  Music, 
  Clock, 
  HardDrive, 
  Activity, 
  AudioWaveform, 
  X, 
  Upload, 
  Video, 
  Scissors,
  Zap,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Download,
  Loader2,
  List
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import FormatSelector from './FormatSelector';
import AdvancedSettings from './AdvancedSettings';
import TrimSlider from './TrimSlider';
import DownloadAllButton from './DownloadAllButton';
import FileItem, { QueueFile } from './FileItem';
import AddNewTrack from './AddNewTrack';

interface ConverterProps {
  tracks: Track[];
  setTracks: React.Dispatch<React.SetStateAction<Track[]>>;
  activeTrackId: string | null;
  setActiveTrackId: (id: string | null) => void;
  onStart: () => void;
  onComplete: (trackId: string, fileInfo: ConvertedFileInfo) => void;
  onClear: () => void;
  isConverting: boolean;
  isDarkMode: boolean;
}

const MAX_FILE_SIZE_MB = 150;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const Converter: React.FC<ConverterProps> = ({ 
  tracks, 
  setTracks, 
  activeTrackId,
  setActiveTrackId,
  onStart, 
  onComplete, 
  onClear,
  isConverting, 
  isDarkMode 
}) => {
  const [isQueueRunning, setIsQueueRunning] = useState(false);
  const [targetFormat, setTargetFormat] = useState<OutputFormat>('WAV');
  const [audioSettings, setAudioSettings] = useState<AudioSettings>({
    sampleRate: 44100,
    bitDepth: 16,
    channelMode: 'stereo'
  });
  const [log, setLog] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Trimming states removed (moved to GeminiPanel)
  
  const activeFile = tracks.find(f => f.id === activeTrackId) || (tracks.length > 0 ? tracks[0] : null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const extractMetadata = useCallback(async (selectedFile: File): Promise<FileMetadata> => {
    const fileType = selectedFile.name.split('.').pop()?.toUpperCase() || 'Unknown';
    const sizeMB = (selectedFile.size / (1024 * 1024)).toFixed(2);

    return new Promise((resolve) => {
      const url = URL.createObjectURL(selectedFile);
      const isVideo = selectedFile.type.startsWith('video/');
      const media = isVideo ? document.createElement('video') : new Audio();
      media.src = url;
      media.preload = 'metadata';
      
      const timeout = setTimeout(() => {
        cleanup();
        resolve({
          name: selectedFile.name,
          type: fileType,
          sizeMB: sizeMB,
          duration: 'Unknown',
        });
      }, 10000); // Increased timeout to 10s

      const cleanup = () => {
        clearTimeout(timeout);
        URL.revokeObjectURL(url);
        media.remove();
      };

      media.onloadedmetadata = async () => {
        const duration = media.duration;
        if (isNaN(duration) || duration === Infinity || duration <= 0) {
          cleanup();
          resolve({
            name: selectedFile.name,
            type: fileType,
            sizeMB: sizeMB,
            duration: 'Unknown',
          });
          return;
        }

        const formattedDuration = formatTime(duration);
        const bitrate = Math.round((selectedFile.size * 8) / (duration * 1000));

        let sampleRate = 'Analyzing...';
        try {
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          if (selectedFile.size < 50 * 1024 * 1024) { // Increased limit to 50MB
            const arrayBuffer = await selectedFile.arrayBuffer();
            const decodedBuffer = await audioCtx.decodeAudioData(arrayBuffer);
            sampleRate = `${decodedBuffer.sampleRate} Hz`;
          } else {
            sampleRate = 'Large file';
          }
        } catch (e) {}

        cleanup();
        resolve({
          name: selectedFile.name,
          type: fileType,
          sizeMB: sizeMB,
          duration: formattedDuration,
          bitrate: bitrate > 0 ? `${bitrate} kbps` : 'Unknown',
          sampleRate
        });
      };

      media.onerror = () => {
        cleanup();
        resolve({
          name: selectedFile.name,
          type: fileType,
          sizeMB: sizeMB,
          duration: 'Unknown',
        });
      };
    });
  }, []);

  const addFilesToQueue = useCallback(async (newFiles: File[]) => {
    // 1. Create unique IDs and initial objects immediately for responsive UI
    const initialItems: Track[] = newFiles.map(f => ({
      id: crypto.randomUUID(),
      file: f,
      displayName: f.name,
      metadata: null,
      status: 'waiting',
      progress: 0,
      startTime: 0,
      endTime: 0,
      duration: 0
    }));

    // 2. Append to queue immediately using functional update
    setTracks(prev => {
      const updated = [...prev, ...initialItems];
      if (prev.length === 0 && initialItems.length > 0) {
        setActiveTrackId(initialItems[0].id);
      }
      return updated;
    });

    // 3. Extract metadata asynchronously for each file without blocking the UI
    initialItems.forEach(async (item) => {
      try {
        const meta = await extractMetadata(item.file);
        let duration = 0;
        if (meta.duration && meta.duration !== 'Unknown') {
          const parts = meta.duration.split(':').map(Number);
          if (parts.length === 2) {
            duration = (parts[0] * 60) + parts[1];
          } else if (parts.length === 3) {
            duration = (parts[0] * 3600) + (parts[1] * 60) + parts[2];
          }
        }

        setTracks(prev => prev.map(f => f.id === item.id ? {
          ...f,
          metadata: meta,
          duration: duration,
          endTime: duration
        } : f));
      } catch (err) {
        console.error("Metadata extraction failed for", item.file.name, err);
      }
    });
  }, [extractMetadata, setTracks]);

  const handleFileChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []) as File[];
    if (selectedFiles.length > 0) {
      addFilesToQueue(selectedFiles);
    }
    // Reset input so same file can be selected again
    if (e.target) e.target.value = '';
  }, [addFilesToQueue]);

  const removeFromQueue = (id: string) => {
    if (isQueueRunning) return;
    setTracks(prev => {
      const item = prev.find(i => i.id === id);
      if (item?.result?.url) {
        URL.revokeObjectURL(item.result.url);
      }
      const filtered = prev.filter(i => i.id !== id);
      if (activeTrackId === id) {
        setActiveTrackId(filtered.length > 0 ? filtered[0].id : null);
      }
      return filtered;
    });
  };

  const startBatchConversion = async () => {
    if (tracks.length === 0 || isQueueRunning) return;
    
    setIsQueueRunning(true);
    onStart();
    setError(null);

    const waitingFiles = tracks.filter(f => f.status === 'waiting' || f.status === 'error');
    
    for (const item of waitingFiles) {
      setTracks(prev => prev.map(f => f.id === item.id ? { ...f, status: 'processing', progress: 10 } : f));
      setLog(`Processing: ${item.file.name}`);

      try {
        const trimOptions: TrimOptions | undefined = item.startTime > 0 || item.endTime < item.duration
          ? { start: item.startTime, end: item.endTime } 
          : undefined;

        const result = await convertMedia(item.file, targetFormat, audioSettings, trimOptions, (msg) => {
          setLog(msg);
        });

        const url = URL.createObjectURL(result.blob);
        const namePart = item.displayName.includes('.') ? item.displayName.substring(0, item.displayName.lastIndexOf('.')) : item.displayName;
        const name = namePart + '.' + result.ext;
        
        const convertedInfo: ConvertedFileInfo = {
          url,
          name,
          duration: result.duration,
          size: result.blob.size,
          format: `${targetFormat} (${audioSettings.sampleRate/1000}kHz ${audioSettings.bitDepth}bit ${audioSettings.channelMode})`
        };

        onComplete(item.id, convertedInfo);

      } catch (err: any) {
        console.error(err);
        setTracks(prev => prev.map(f => f.id === item.id ? { ...f, status: 'error', error: "Failed" } : f));
      }
    }

    setIsQueueRunning(false);
    setLog('All tasks completed.');
  };

  const handleFormatChange = (format: OutputFormat) => {
    setTargetFormat(format);
  };

  const handleDownloadAll = () => {
    const completedItems = tracks.filter(item => item.status === 'done' && item.result);
    completedItems.forEach((item, index) => {
      setTimeout(() => {
        const link = document.createElement('a');
        link.href = item.result!.url;
        link.download = item.result!.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, index * 250);
    });
  };

  const clearQueue = () => {
    if (isQueueRunning) return;
    onClear();
    setLog('');
  };

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    // Convert FileList to Array
    const droppedFiles = (Array.from(e.dataTransfer.files) as File[]).filter(f => 
      f.type.startsWith('audio/') || f.type.startsWith('video/')
    );

    if (droppedFiles.length > 0) {
      addFilesToQueue(droppedFiles);
    } else {
      setError("Please drop valid audio or video files.");
    }
  }, [addFilesToQueue]);

  return (
    <div className="flex flex-col gap-8">
      <div className="glass-panel rounded-[2rem] p-8 flex flex-col gap-8 shadow-2xl transition-all duration-500">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h2 className={`text-2xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Conversion Studio</h2>
            {tracks.length > 0 && (
              <div className={`px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 ${
                isDarkMode ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'
              }`}>
                <List className="w-3 h-3" />
                {tracks.length} FILES IN QUEUE
              </div>
            )}
          </div>
          <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Batch process your media with precision</p>
        </div>

        {tracks.length === 0 ? (
          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`group cursor-pointer border-2 border-dashed rounded-[1.5rem] p-16 flex flex-col items-center gap-6 transition-all duration-300 ${
              isDragging 
                ? 'border-blue-500 bg-blue-500/10 scale-[1.02] shadow-[0_0_40px_rgba(59,130,246,0.1)]' 
                : isDarkMode 
                  ? 'border-slate-800 bg-slate-900/40 hover:border-blue-500/40 hover:bg-slate-900/60' 
                  : 'border-slate-200 bg-white hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/5'
            }`}
          >
            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center transition-all duration-500 ${
              isDragging ? 'bg-blue-500 rotate-12 scale-110' : isDarkMode ? 'bg-slate-800 group-hover:bg-slate-700' : 'bg-slate-50 group-hover:bg-blue-50'
            }`}>
              <Upload className={`w-10 h-10 ${isDragging ? 'text-white' : isDarkMode ? 'text-slate-500 group-hover:text-blue-400' : 'text-slate-400 group-hover:text-blue-500'}`} />
            </div>
            <div className="text-center space-y-1">
              <p className={`text-xl font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>Drop media here</p>
              <p className="text-sm text-slate-500">Multiple files supported. Lightning fast.</p>
            </div>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="video/*,audio/*" multiple />
          </div>
        ) : (
          <div className="flex flex-col gap-8 animate-fade-in-up">
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              <AnimatePresence mode="popLayout">
                {tracks.map((item) => (
                  <FileItem
                    key={item.id}
                    item={item}
                    isDarkMode={isDarkMode}
                    isQueueRunning={isQueueRunning}
                    isActive={activeTrackId === item.id || (activeTrackId === null && tracks[0]?.id === item.id)}
                    onRemove={removeFromQueue}
                    onClick={setActiveTrackId}
                  />
                ))}
              </AnimatePresence>
            </div>

            {!isQueueRunning && (
              <AddNewTrack 
                onFilesSelected={addFilesToQueue} 
                isDarkMode={isDarkMode} 
                disabled={isQueueRunning}
              />
            )}

            <div className="space-y-4">
               <div className="flex items-center justify-between pl-1">
                 <label className={`text-[11px] font-bold uppercase tracking-[0.15em] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Output Format</label>
                 <FormatSelector 
                   value={targetFormat} 
                   onChange={handleFormatChange} 
                   disabled={isQueueRunning} 
                   isDarkMode={isDarkMode} 
                 />
               </div>
               
               <AdvancedSettings 
                 settings={audioSettings} 
                 onChange={setAudioSettings} 
                 disabled={isQueueRunning} 
                 isDarkMode={isDarkMode} 
               />
            </div>

            {isQueueRunning && (
              <div className="p-8 glass-panel rounded-3xl border border-blue-500/20 flex flex-col items-center gap-6 animate-fade-in-up">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-blue-500/10 border-t-blue-500 rounded-full animate-spin"></div>
                </div>
                <div className="text-center space-y-1 w-full overflow-hidden">
                  <p className="text-lg font-bold gradient-text">Batch Processing...</p>
                  <p className="text-xs font-mono text-slate-500 animate-pulse truncate px-4">{log || 'Preparing...'}</p>
                </div>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-500 text-sm font-medium flex items-center gap-3 animate-fade-in-up">
                <AlertCircle className="w-5 h-5 shrink-0" />
                {error}
              </div>
            )}

            {!isQueueRunning && tracks.some(f => f.status === 'waiting' || f.status === 'error') && (
              <button 
                onClick={startBatchConversion}
                disabled={isQueueRunning}
                className={`w-full py-5 rounded-2xl font-bold text-lg shadow-2xl transition-all flex items-center justify-center gap-3 group transform active:scale-[0.98] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-500/30 text-white`}
              >
                Convert {tracks.filter(f => f.status === 'waiting' || f.status === 'error').length} Files
                <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </button>
            )}

            {!isQueueRunning && tracks.length > 0 && tracks.every(f => f.status === 'done') && (
              <div className="space-y-4 animate-fade-in-up">
                <div className={`p-6 rounded-2xl border flex flex-col items-center gap-3 text-center ${
                  isDarkMode ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'
                }`}>
                  <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                  <div>
                    <h4 className={`text-lg font-bold ${isDarkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>All Files Converted!</h4>
                    <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Your batch is ready for download.</p>
                  </div>
                </div>

                {tracks.length > 1 && (
                  <DownloadAllButton 
                    onDownload={handleDownloadAll} 
                    count={tracks.length} 
                    isDarkMode={isDarkMode} 
                  />
                )}
                
                <button 
                  onClick={clearQueue}
                  className={`w-full py-5 rounded-2xl font-bold text-lg transition-all border-2 ${
                    isDarkMode 
                      ? 'bg-slate-800/50 hover:bg-slate-800 text-slate-300 border-slate-700/50' 
                      : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-100 shadow-sm'
                  }`}
                >
                  Clear Queue & Start New
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Converter;
