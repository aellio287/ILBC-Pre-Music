
import React, { useState, useRef, ChangeEvent, DragEvent } from 'react';
import { convertMedia, OutputFormat, TrimOptions } from '../utils/audioConverter';
import { ConvertedFileInfo } from '../App';

interface ConverterProps {
  onStart: () => void;
  onComplete: (fileInfo: ConvertedFileInfo | null) => void;
  isConverting: boolean;
  isDarkMode: boolean;
}

const MAX_FILE_SIZE_MB = 150;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const Converter: React.FC<ConverterProps> = ({ onStart, onComplete, isConverting, isDarkMode }) => {
  const [file, setFile] = useState<File | null>(null);
  const [fileDuration, setFileDuration] = useState<number>(0);
  const [targetFormat, setTargetFormat] = useState<OutputFormat>('keyboard');
  const [progress, setProgress] = useState(0);
  const [log, setLog] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showSizeWarning, setShowSizeWarning] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  // Trimming states
  const [isTrimEnabled, setIsTrimEnabled] = useState(false);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const formats: { id: OutputFormat; name: string; desc: string; speed: 'instant' }[] = [
    { id: 'keyboard', name: 'Keyboard WAV', desc: 'Mono 44.1kHz 16bit', speed: 'instant' },
    { id: 'stereo', name: 'WAV Stereo', desc: '44.1kHz 16bit', speed: 'instant' },
  ];

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const validateFile = (selectedFile: File) => {
    setError(null);
    setShowSizeWarning(selectedFile.size > MAX_FILE_SIZE_BYTES);
    setFile(selectedFile);
    setProgress(0);
    setLog('');
    setIsTrimEnabled(false);

    // Extract duration
    const url = URL.createObjectURL(selectedFile);
    const tempAudio = new Audio(url);
    tempAudio.addEventListener('loadedmetadata', () => {
      setFileDuration(tempAudio.duration);
      setTrimStart(0);
      setTrimEnd(tempAudio.duration);
      URL.revokeObjectURL(url);
    });
    // Fallback for some video types
    tempAudio.addEventListener('error', () => {
       setFileDuration(0);
    });
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      validateFile(selectedFile);
    }
  };

  const handleFormatChange = (id: OutputFormat) => {
    setTargetFormat(id);
    if (progress === 100) {
      setProgress(0);
      setLog('');
    }
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && (droppedFile.type.startsWith('audio/') || droppedFile.type.startsWith('video/'))) {
      validateFile(droppedFile);
    } else {
      setError("Please drop a valid audio or video file.");
    }
  };

  const startConversion = async () => {
    if (!file) return;
    
    try {
      onStart();
      setError(null);
      setProgress(10);
      setLog('Starting native processor...');

      const trimOptions: TrimOptions | undefined = isTrimEnabled ? { start: trimStart, end: trimEnd } : undefined;

      const result = await convertMedia(file, targetFormat, trimOptions, (msg) => {
        setLog(msg);
      });

      const url = URL.createObjectURL(result.blob);
      const name = file.name.split('.').slice(0, -1).join('.') + '.' + result.ext;
      
      setProgress(100);
      onComplete({
        url,
        name,
        duration: result.duration,
        size: result.blob.size,
        format: formats.find(f => f.id === targetFormat)?.name || result.ext.toUpperCase()
      });

    } catch (err: any) {
      console.error(err);
      setError("Conversion failed. The file format might not be supported by your browser.");
      onComplete(null); 
    }
  };

  return (
    <div className="glass-panel rounded-[2rem] p-8 flex flex-col gap-8 shadow-2xl transition-all duration-500">
      <div className="flex flex-col gap-2">
        <h2 className={`text-2xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Conversion Studio</h2>
        <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Your files stay with you always</p>
      </div>

      {!file ? (
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
            <svg className={`w-10 h-10 ${isDragging ? 'text-white' : isDarkMode ? 'text-slate-500 group-hover:text-blue-400' : 'text-slate-400 group-hover:text-blue-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <div className="text-center space-y-1">
            <p className={`text-xl font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>Drop media here</p>
            <p className="text-sm text-slate-500">Video or Audio. Lightning fast conversion.</p>
          </div>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="video/*,audio/*" />
        </div>
      ) : (
        <div className="flex flex-col gap-8 animate-fade-in-up">
          {/* File Card */}
          <div className={`p-6 rounded-[1.5rem] border flex items-center gap-5 transition-all group ${
            isDarkMode ? 'bg-slate-800/40 border-slate-700/50 shadow-inner' : 'bg-white border-slate-100 shadow-xl shadow-slate-200/50'
          }`}>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-all ${
              isDarkMode ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'
            }`}>
              <svg className={`w-7 h-7 ${isConverting ? 'animate-pulse' : 'group-hover:scale-110 transition-transform'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-base font-bold truncate ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{file.name}</p>
              <p className={`text-xs font-medium ${showSizeWarning ? 'text-amber-500' : 'text-slate-500'}`}>
                {(file.size / (1024 * 1024)).toFixed(2)} MB • {fileDuration ? formatTime(fileDuration) : 'Analyzing...'}
              </p>
            </div>
            {!isConverting && (
              <button 
                onClick={() => { setFile(null); setShowSizeWarning(false); }}
                className={`p-2.5 rounded-xl transition-all ${
                  isDarkMode ? 'hover:bg-red-500/20 text-slate-500 hover:text-red-400' : 'hover:bg-red-50 text-slate-400 hover:text-red-500'
                }`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Trimming Section */}
          {!isConverting && progress !== 100 && (
            <div className={`p-6 rounded-[1.5rem] border space-y-4 ${
              isDarkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-100'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758L5 19m0-14l4.121 4.121" />
                  </svg>
                  <label className={`text-[11px] font-bold uppercase tracking-[0.15em] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Precision Trim</label>
                </div>
                <button 
                  onClick={() => setIsTrimEnabled(!isTrimEnabled)}
                  className={`text-xs font-bold px-3 py-1 rounded-full transition-all ${
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
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-[10px] font-bold text-slate-500">START</span>
                        <span className="text-[10px] font-mono font-bold text-blue-500">{formatTime(trimStart)}</span>
                      </div>
                      <input 
                        type="range" min="0" max={fileDuration} step="0.1" value={trimStart}
                        onChange={(e) => setTrimStart(Math.min(parseFloat(e.target.value), trimEnd - 0.1))}
                        className="w-full h-1.5 bg-slate-700 rounded-full appearance-none accent-blue-500 cursor-pointer"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-[10px] font-bold text-slate-500">END</span>
                        <span className="text-[10px] font-mono font-bold text-blue-500">{formatTime(trimEnd)}</span>
                      </div>
                      <input 
                        type="range" min="0" max={fileDuration} step="0.1" value={trimEnd}
                        onChange={(e) => setTrimEnd(Math.max(parseFloat(e.target.value), trimStart + 0.1))}
                        className="w-full h-1.5 bg-slate-700 rounded-full appearance-none accent-blue-500 cursor-pointer"
                      />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-slate-500 font-medium">Trimmed Duration: <span className="text-blue-400">{formatTime(trimEnd - trimStart)}</span></p>
                  </div>
                </div>
              )}
            </div>
          )}

          {showSizeWarning && !isConverting && (
            <div className={`p-4 rounded-2xl border flex items-start gap-3 animate-fade-in-up ${
              isDarkMode ? 'bg-amber-500/10 border-amber-500/20 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}>
              <svg className="w-5 h-5 shrink-0 mt-0.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-bold">Large File Mode</p>
                <p className="text-xs leading-relaxed opacity-80">This may take a moment to decode in-memory.</p>
              </div>
            </div>
          )}

          <div className="space-y-4">
             <label className={`text-[11px] font-bold uppercase tracking-[0.15em] pl-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Output Quality</label>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               {formats.map((f) => (
                 <button
                    key={f.id}
                    onClick={() => handleFormatChange(f.id)}
                    disabled={isConverting}
                    className={`flex flex-col text-left p-5 rounded-2xl border-2 transition-all relative group overflow-hidden ${
                      targetFormat === f.id 
                        ? 'border-blue-500 bg-blue-500/5 ring-4 ring-blue-500/10' 
                        : isDarkMode ? 'border-slate-800 bg-slate-900/40 hover:border-slate-700' : 'border-slate-100 bg-slate-50 hover:border-slate-200'
                    }`}
                 >
                   <div className="flex justify-between items-center w-full mb-1">
                     <span className={`text-base font-bold ${targetFormat === f.id ? 'text-blue-500' : isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{f.name}</span>
                     <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                       targetFormat === f.id ? 'bg-blue-500 text-white' : isDarkMode ? 'bg-slate-800 text-slate-500' : 'bg-slate-200 text-slate-500'
                     }`}>⚡ {f.speed}</span>
                   </div>
                   <span className="text-xs text-slate-500 font-medium">{f.desc}</span>
                 </button>
               ))}
             </div>
          </div>

          {isConverting && (
            <div className="p-8 glass-panel rounded-3xl border border-blue-500/20 flex flex-col items-center gap-6 animate-fade-in-up">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-blue-500/10 border-t-blue-500 rounded-full animate-spin"></div>
              </div>
              <div className="text-center space-y-1 w-full overflow-hidden">
                <p className="text-lg font-bold gradient-text">Processing Audio...</p>
                <p className="text-xs font-mono text-slate-500 animate-pulse truncate px-4">{log || 'Preparing...'}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-500 text-sm font-medium flex items-center gap-3 animate-fade-in-up">
              <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {error}
            </div>
          )}

          {!isConverting && progress !== 100 && (
            <button 
              onClick={startConversion}
              className={`w-full py-5 rounded-2xl font-bold text-lg shadow-2xl transition-all flex items-center justify-center gap-3 group transform active:scale-[0.98] ${
                showSizeWarning 
                  ? 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 shadow-amber-500/20' 
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-500/30'
              } text-white`}
            >
              Convert to WAV
              <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </button>
          )}

          {progress === 100 && !isConverting && (
             <button 
                onClick={() => { setFile(null); setShowSizeWarning(false); setProgress(0); setLog(''); setIsTrimEnabled(false); }}
                className={`w-full py-5 rounded-2xl font-bold text-lg transition-all border-2 ${
                  isDarkMode 
                    ? 'bg-slate-800/50 hover:bg-slate-800 text-slate-300 border-slate-700/50' 
                    : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-100 shadow-sm'
                }`}
             >
               Choose others
             </button>
          )}
        </div>
      )}
    </div>
  );
};

export default Converter;
