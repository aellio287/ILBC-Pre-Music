
import React, { useState, useEffect, useRef } from 'react';
import { ConvertedFileInfo } from '../App';

interface GeminiPanelProps {
  convertedFile: ConvertedFileInfo | null;
  isDarkMode: boolean;
}

const GeminiPanel: React.FC<GeminiPanelProps> = ({ convertedFile, isDarkMode }) => {
  const [customName, setCustomName] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (convertedFile) {
      setCustomName(convertedFile.name);
      setIsPlaying(false);
      setCurrentTime(0);
    }
  }, [convertedFile]);

  const togglePlay = () => {
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
    <div className="glass-panel rounded-[2rem] p-8 flex flex-col gap-6 h-full min-h-[480px] shadow-2xl transition-all duration-500">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
          isDarkMode ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600 shadow-sm shadow-blue-500/10'
        }`}>
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h3 className={`text-xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Ready for Download</h3>
      </div>

      {convertedFile ? (
        <div className="flex flex-col gap-8 animate-fade-in-up">
          {/* Enhanced Metadata Grid */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Time', val: formatTime(convertedFile.duration), icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
              { label: 'Weight', val: `${(convertedFile.size / (1024 * 1024)).toFixed(2)} MB`, icon: 'M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3' },
              { label: 'Codec', val: convertedFile.format.split(' ')[0], icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' }
            ].map((item, idx) => (
              <div key={idx} className={`p-4 rounded-2xl border flex flex-col items-center justify-center text-center transition-all ${
                isDarkMode ? 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/60' : 'bg-white border-slate-100 shadow-sm hover:shadow-md'
              }`}>
                <span className={`text-[9px] font-bold uppercase tracking-[0.2em] mb-2 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  {item.label}
                </span>
                <span className={`text-sm font-bold truncate w-full ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>{item.val}</span>
              </div>
            ))}
          </div>

          {/* Desktop-like Player */}
          <div className={`border rounded-[1.5rem] p-5 flex flex-col gap-5 transition-all ${
            isDarkMode ? 'bg-slate-900/60 border-slate-700/50 shadow-inner' : 'bg-slate-50 border-slate-200'
          }`}>
            <audio ref={audioRef} src={convertedFile.url} onTimeUpdate={handleTimeUpdate} onEnded={handleEnded} className="hidden" />
            
            <div className="flex items-center gap-5">
              <button 
                onClick={togglePlay}
                className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-full flex items-center justify-center shrink-0 transition-all shadow-xl shadow-blue-500/20 active:scale-90"
              >
                {isPlaying ? (
                  <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5 0a1 1 0 012 0v4a1 1 0 11-2 0V8z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-7 h-7 ml-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
              
              <div className="flex-1 space-y-2">
                <input 
                  type="range" min="0" max={convertedFile.duration} step="0.01" value={currentTime} onChange={handleProgressChange}
                  className={`w-full h-1.5 rounded-full appearance-none cursor-pointer accent-blue-600 ${isDarkMode ? 'bg-slate-700' : 'bg-slate-200'}`}
                />
                <div className={`flex justify-between text-[11px] font-mono font-bold ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(convertedFile.duration)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className={`text-[11px] font-bold uppercase tracking-[0.15em] pl-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Filename</label>
              <input 
                type="text" value={customName} onChange={(e) => setCustomName(e.target.value)}
                className={`w-full border-2 rounded-2xl px-5 py-4 text-base focus:outline-none focus:border-blue-500 transition-all ${
                  isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-800 shadow-sm'
                }`}
              />
            </div>

            <a 
              href={convertedFile.url} download={customName}
              className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold text-lg shadow-2xl shadow-emerald-900/20 transition-all flex items-center justify-center gap-3 active:scale-[0.98] group"
            >
              <svg className="w-6 h-6 transform group-hover:translate-y-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download
            </a>
          </div>
        </div>
      ) : (
        <div className={`flex-1 flex flex-col items-center justify-center text-center p-12 rounded-[2rem] border-2 border-dashed transition-all ${
          isDarkMode ? 'bg-slate-900/20 border-slate-800/50' : 'bg-slate-50/50 border-slate-100'
        }`}>
           <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-6 animate-pulse-slow ${
             isDarkMode ? 'bg-slate-800/50 text-slate-700' : 'bg-slate-100 text-slate-200'
           }`}>
             <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
             </svg>
           </div>
           <p className={`text-base font-semibold ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>No conversion results yet</p>
           <p className={`text-sm mt-2 max-w-[200px] ${isDarkMode ? 'text-slate-700' : 'text-slate-300'}`}>Upload a file on the left to begin extraction.</p>
        </div>
      )}
    </div>
  );
};

export default GeminiPanel;
