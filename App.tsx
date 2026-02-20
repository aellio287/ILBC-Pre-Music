import React, { useState } from 'react';
import Header from './components/Header';
import Converter from './components/Converter';
import GeminiPanel from './components/GeminiPanel';
import { Track } from './types';

const App: React.FC = () => {
  const [isConverting, setIsConverting] = useState(false);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [activeTrackId, setActiveTrackId] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);

  const handleConversionStart = () => {
    setIsConverting(true);
  };

  const handleConversionComplete = (trackId: string, result: any) => {
    setTracks(prev => prev.map(t => t.id === trackId ? { ...t, status: 'done', progress: 100, result } : t));
    setIsConverting(false);
  };

  const handleClearTracks = () => {
    tracks.forEach(track => {
      if (track.result?.url) {
        URL.revokeObjectURL(track.result.url);
      }
    });
    setTracks([]);
    setActiveTrackId(null);
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <div className={`${isDarkMode ? 'dark' : 'light'} min-h-screen transition-colors duration-300`}>
      <div className="min-h-screen relative overflow-hidden bg-app">
        {/* Background Decor */}
        <div className={`absolute top-[-10%] left-[-10%] w-[40%] h-[40%] ${isDarkMode ? 'bg-blue-600/10' : 'bg-blue-400/10'} blur-[120px] rounded-full animate-pulse-slow`}></div>
        <div className={`absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] ${isDarkMode ? 'bg-purple-600/10' : 'bg-purple-400/10'} blur-[120px] rounded-full animate-pulse-slow`}></div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 py-8 lg:py-12 flex flex-col gap-8">
          <Header isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
          
          <main className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 flex flex-col gap-6">
              <Converter 
                tracks={tracks}
                setTracks={setTracks}
                activeTrackId={activeTrackId}
                setActiveTrackId={setActiveTrackId}
                onStart={handleConversionStart} 
                onComplete={handleConversionComplete}
                onClear={handleClearTracks}
                isConverting={isConverting}
                isDarkMode={isDarkMode}
              />
            </div>

            <aside className="lg:col-span-4">
              <GeminiPanel 
                activeTrack={tracks.find(t => t.id === activeTrackId) || null}
                setTracks={setTracks}
                convertedFiles={tracks.filter(t => t.status === 'done' && t.result).map(t => t.result!)} 
                isDarkMode={isDarkMode} 
              />
            </aside>
          </main>

          <footer className="mt-auto pt-12 text-center text-slate-500 text-sm">
            <p>Created with love and harmony by ILBC Pre-Music</p>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default App;