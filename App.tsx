import React, { useState } from 'react';
import Header from './components/Header';
import Converter from './components/Converter';
import GeminiPanel from './components/GeminiPanel';

export interface ConvertedFileInfo {
  url: string;
  name: string;
  duration: number;
  size: number;
  format: string;
}

const App: React.FC = () => {
  const [isConverting, setIsConverting] = useState(false);
  const [convertedFile, setConvertedFile] = useState<ConvertedFileInfo | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);

  const handleConversionStart = () => {
    setIsConverting(true);
    setConvertedFile(null);
  };

  const handleConversionComplete = (fileInfo: ConvertedFileInfo | null) => {
    setIsConverting(false);
    setConvertedFile(fileInfo);
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
                onStart={handleConversionStart} 
                onComplete={handleConversionComplete}
                isConverting={isConverting}
                isDarkMode={isDarkMode}
              />
            </div>

            <aside className="lg:col-span-4">
              <GeminiPanel convertedFile={convertedFile} isDarkMode={isDarkMode} />
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