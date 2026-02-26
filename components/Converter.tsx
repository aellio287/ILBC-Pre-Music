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
  List,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import FormatSelector from './FormatSelector';
import AdvancedSettings from './AdvancedSettings';
import DownloadAllButton from './DownloadAllButton';
import FileItem, { QueueFile } from './FileItem';
import AddNewTrack from './AddNewTrack';
import TrimSlider from './TrimSlider';
import ConvertedFileItem from './ConvertedFileItem';

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

const MAX_FILE_SIZE_MB = 1024;
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
  const [isTrimEnabled, setIsTrimEnabled] = useState(true);
  const [activePreviewId, setActivePreviewId] = useState<string | null>(null);
  
  const activeFile = tracks.find(f => f.id === activeTrackId) || (tracks.length > 0 ? tracks[0] : null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

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
          if (selectedFile.size < 200 * 1024 * 1024) { // Increased limit to 200MB for analysis
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
    const validFiles: File[] = [];
    const errors: string[] = [];

    newFiles.forEach(f => {
      if (f.size > MAX_FILE_SIZE_BYTES) {
        errors.push(`${f.name} is too large (max ${MAX_FILE_SIZE_MB}MB)`);
      } else if (!f.type.startsWith('audio/') && !f.type.startsWith('video/')) {
        errors.push(`${f.name} is not a valid audio or video file`);
      } else {
        validFiles.push(f);
      }
    });

    if (errors.length > 0) {
      setError(errors.join('. '));
    }

    if (validFiles.length === 0) return;

    // 1. Create unique IDs and initial objects immediately for responsive UI
    const initialItems: Track[] = validFiles.map(f => ({
      id: typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11),
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
    abortControllerRef.current = new AbortController();

    const waitingFiles = tracks.filter(f => f.status === 'waiting' || f.status === 'error');
    
    for (const item of waitingFiles) {
      if (abortControllerRef.current.signal.aborted) break;

      setTracks(prev => prev.map(f => f.id === item.id ? { ...f, status: 'processing', progress: 10 } : f));
      setLog(`Processing: ${item.file.name}`);

      try {
        const trimOptions: TrimOptions | undefined = item.startTime > 0 || item.endTime < item.duration
          ? { start: item.startTime, end: item.endTime } 
          : undefined;

        const result = await convertMedia(
          item.file, 
          targetFormat, 
          audioSettings, 
          trimOptions, 
          (msg) => setLog(msg),
          abortControllerRef.current.signal
        );

        const url = URL.createObjectURL(result.blob);
        const namePart = item.displayName.includes('.') ? item.displayName.substring(0, item.displayName.lastIndexOf('.')) : item.displayName;
        const name = namePart + '.' + result.ext;
        
        const convertedInfo: ConvertedFileInfo = {
          url,
          name,
          duration: result.duration,
          size: result.blob.size,
          format: `${targetFormat} (${audioSettings.sampleRate/1000}kHz ${audioSettings.bitDepth}bit ${audioSettings.channelMode})`,
          originalFile: item.file,
          startTime: item.startTime,
          endTime: item.endTime,
          originalDuration: item.duration
        };

        onComplete(item.id, convertedInfo);

      } catch (err: any) {
        if (err.message === 'Aborted') {
          setTracks(prev => prev.map(f => f.status === 'processing' ? { ...f, status: 'waiting' } : f));
          break;
        }
        console.error(err);
        setTracks(prev => prev.map(f => f.id === item.id ? { ...f, status: 'error', error: "Failed" } : f));
      }
    }

    setIsQueueRunning(false);
    setLog(abortControllerRef.current.signal.aborted ? 'Conversion stopped.' : 'All tasks completed.');
    abortControllerRef.current = null;
  };

  const stopBatchConversion = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
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

  const isAnyTrimInvalid = tracks.some(t => t.status === 'waiting' && t.isTrimValid === false);
  const convertedFiles = tracks.filter(t => t.status === 'done' && t.result).map(t => t.result!);

  // Auto-expand the most recently converted file
  useEffect(() => {
    if (convertedFiles.length > 0 && !activePreviewId) {
      setActivePreviewId(convertedFiles[convertedFiles.length - 1].url);
    }
  }, [convertedFiles.length, activePreviewId]);

  return (
    <div className="flex flex-col gap-10 w-full max-w-4xl mx-auto">
      <div className={`rounded-[2.5rem] p-8 lg:p-12 flex flex-col gap-10 shadow-xl transition-all duration-500 ${
        isDarkMode ? 'bg-slate-900/50 backdrop-blur-xl' : 'bg-white/80 backdrop-blur-xl'
      }`}>
        <div className="flex flex-col gap-3 text-center">
          <h2 className={`text-4xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Convert Your Audio Easily</h2>
          <p className={`text-base font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Upload, trim, and download in just a few clicks.</p>
        </div>

        {tracks.length === 0 ? (
          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`group cursor-pointer rounded-[2.5rem] p-24 lg:p-32 flex flex-col items-center gap-8 transition-all duration-500 ${
              isDragging 
                ? 'bg-blue-500/10 scale-[1.02] shadow-[0_0_60px_rgba(59,130,246,0.1)]' 
                : isDarkMode 
                  ? 'bg-slate-800/30 hover:bg-slate-800/50' 
                  : 'bg-slate-50 hover:bg-slate-100'
            }`}
          >
            <div className={`w-28 h-28 rounded-[2rem] flex items-center justify-center transition-all duration-700 ${
              isDragging ? 'bg-blue-500 rotate-12 scale-110 shadow-2xl shadow-blue-500/40' : isDarkMode ? 'bg-slate-800 group-hover:bg-slate-700' : 'bg-white shadow-sm group-hover:shadow-md'
            }`}>
              <Upload className={`w-14 h-14 transition-all duration-500 ${isDragging ? 'text-white' : isDarkMode ? 'text-slate-500 group-hover:text-blue-400' : 'text-slate-400 group-hover:text-blue-500'}`} />
            </div>
            <div className="text-center space-y-2">
              <p className={`text-2xl font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>Upload your audio file to start</p>
              <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Drag and drop or click to browse. Multiple files supported.</p>
            </div>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="video/*,audio/*" multiple />
          </div>
        ) : (
          <div className="flex flex-col gap-10 animate-fade-in-up">
            {/* 1. Upload Section (File List) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  {tracks.length === 1 ? 'Current File' : 'Current Files'}
                </h3>
                <div className={`px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 ${
                  isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'
                }`}>
                  <List className="w-3 h-3" />
                  {tracks.length} {tracks.length === 1 ? 'File' : 'Files'}
                </div>
              </div>
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
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
            </div>

            {/* 2. Trim Section */}
            <AnimatePresence mode="wait">
              {activeFile && activeFile.status === 'waiting' && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className={`p-8 rounded-[2rem] space-y-6 shadow-sm ${
                    isDarkMode ? 'bg-slate-800/40' : 'bg-slate-50/80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isDarkMode ? 'bg-slate-800 text-blue-400' : 'bg-white text-blue-500 shadow-sm'
                      }`}>
                        <Scissors className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col">
                        <label className={`text-xs font-semibold ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Precision Trim</label>
                        <p className={`text-sm font-bold truncate max-w-[240px] ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{activeFile.displayName}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setIsTrimEnabled(!isTrimEnabled)}
                      className={`text-xs font-bold px-5 py-2 rounded-full transition-all ${
                        isTrimEnabled 
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                          : isDarkMode ? 'bg-slate-700 text-slate-400 hover:bg-slate-600' : 'bg-white text-slate-500 hover:bg-slate-50 shadow-sm'
                      }`}
                    >
                      {isTrimEnabled ? 'Active' : 'Disabled'}
                    </button>
                  </div>

                  {isTrimEnabled && (
                    <div className="pt-2">
                      {activeFile.duration > 0 ? (
                        <TrimSlider
                          file={activeFile.file}
                          duration={activeFile.duration}
                          start={activeFile.startTime}
                          end={activeFile.endTime}
                          onStartChange={(val) => setTracks(prev => prev.map(f => f.id === activeFile.id ? { ...f, startTime: val } : f))}
                          onEndChange={(val) => setTracks(prev => prev.map(f => f.id === activeFile.id ? { ...f, endTime: val } : f))}
                          onValidationChange={(isValid) => setTracks(prev => prev.map(f => f.id === activeFile.id ? { ...f, isTrimValid: isValid } : f))}
                          isDarkMode={isDarkMode}
                        />
                      ) : (
                        <div className={`h-48 rounded-[2rem] flex flex-col items-center justify-center gap-4 transition-all ${
                          isDarkMode ? 'bg-slate-900/40' : 'bg-slate-100/50'
                        }`}>
                          <div className="w-10 h-10 border-4 border-blue-500/10 border-t-blue-500 rounded-full animate-spin" />
                          <div className="flex flex-col items-center gap-1">
                            <p className={`text-sm font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Analyzing Audio...</p>
                            <p className={`text-xs font-medium ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Extracting metadata and generating waveform</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* 3. Output Format Section */}
            <div className="space-y-8">
               <div className="flex items-center justify-between px-2">
                 <label className={`text-sm font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Output Format</label>
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

            {/* 4. Convert Button */}
            <div className="space-y-6 pt-4">
              {isQueueRunning && (
                <div className={`p-10 rounded-[2rem] flex flex-col items-center gap-6 shadow-sm ${
                  isDarkMode ? 'bg-slate-800/40' : 'bg-slate-50/80'
                }`}>
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-blue-500/10 border-t-blue-500 rounded-full animate-spin"></div>
                  </div>
                  <div className="text-center space-y-2 w-full overflow-hidden">
                    <p className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Converting your file…</p>
                    <p className="text-sm font-medium text-slate-500 animate-pulse truncate px-4">Please wait a moment.</p>
                  </div>
                  
                  <button 
                    onClick={stopBatchConversion}
                    className="mt-2 px-8 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl font-bold text-sm transition-all active:scale-95"
                  >
                    Stop Converting
                  </button>
                </div>
              )}

              {error && (
                <div className="p-5 bg-red-500/5 rounded-2xl text-red-500 text-sm font-bold flex items-center gap-4 animate-fade-in-up">
                  <AlertCircle className="w-6 h-6 shrink-0" />
                  {error}
                </div>
              )}

              {!isQueueRunning && tracks.some(f => f.status === 'waiting' || f.status === 'error') && (
                <button 
                  onClick={startBatchConversion}
                  disabled={isQueueRunning || isAnyTrimInvalid}
                  className={`w-full py-6 rounded-2xl font-bold text-xl shadow-xl transition-all flex items-center justify-center gap-3 group transform active:scale-[0.98] ${
                    isAnyTrimInvalid 
                      ? 'bg-slate-800 text-slate-600 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/20 text-white'
                  }`}
                >
                  Convert {tracks.filter(f => f.status === 'waiting' || f.status === 'error').length} Files
                  <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </button>
              )}
            </div>

            {/* 5. Results Section */}
            <AnimatePresence>
              {convertedFiles.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-8 pt-10 border-t border-slate-800/10"
                >
                  <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isDarkMode ? 'bg-slate-800 text-blue-400' : 'bg-slate-50 text-blue-600'
                      }`}>
                        <AudioWaveform className="w-6 h-6" />
                      </div>
                      <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Results</h3>
                    </div>
                    <span className="text-xs font-bold text-slate-500">
                      {convertedFiles.length} {convertedFiles.length === 1 ? 'File' : 'Files'} Ready
                    </span>
                  </div>
                  
                  <div className="flex flex-col gap-4">
                    {convertedFiles.map((file, index) => (
                      <ConvertedFileItem 
                        key={`${file.url}-${index}`} 
                        file={file} 
                        isDarkMode={isDarkMode} 
                        isExpanded={activePreviewId === file.url}
                        onToggle={() => setActivePreviewId(activePreviewId === file.url ? null : file.url)}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 6. Final Actions Section */}
            {!isQueueRunning && tracks.length > 0 && tracks.every(f => f.status === 'done') && (
              <div className="space-y-6 animate-fade-in-up pt-10 border-t border-slate-800/10">
                <div className={`p-8 rounded-[2rem] flex flex-col items-center gap-4 text-center shadow-sm ${
                  isDarkMode ? 'bg-emerald-500/5' : 'bg-emerald-50/50'
                }`}>
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                  </div>
                  <div>
                    <h4 className={`text-xl font-bold ${isDarkMode ? 'text-emerald-400' : 'text-emerald-800'}`}>Conversion Complete</h4>
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Your files are ready for download.</p>
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
                  className={`w-full py-6 rounded-2xl font-bold text-lg transition-all ${
                    isDarkMode 
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' 
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  Start New Batch
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
