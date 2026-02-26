import React, { useState } from 'react';
import { ChevronDown, Settings2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AudioSettings } from '../utils/audioConverter';

interface AdvancedSettingsProps {
  settings: AudioSettings;
  onChange: (settings: AudioSettings) => void;
  disabled?: boolean;
  isDarkMode: boolean;
}

const AdvancedSettings: React.FC<AdvancedSettingsProps> = ({ settings, onChange, disabled, isDarkMode }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateSetting = <K extends keyof AudioSettings>(key: K, value: AudioSettings[K]) => {
    onChange({ ...settings, [key]: value });
  };

  return (
    <div className={`rounded-2xl transition-all shadow-sm ${
      isDarkMode ? 'bg-slate-900/40' : 'bg-white'
    }`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-5 cursor-pointer group"
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl transition-colors ${isDarkMode ? 'bg-slate-800' : 'bg-slate-50'} group-hover:bg-blue-500/10`}>
            <Settings2 className={`w-4 h-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'} group-hover:text-blue-500 transition-colors`} />
          </div>
          <span className={`text-sm font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
            Advanced Settings
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'} ${isExpanded ? 'rotate-180 text-blue-500' : ''}`} />
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-5 pt-0 space-y-6">
              <div className={`h-px ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`} />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Sample Rate */}
                <div className="space-y-3">
                  <label className={`text-xs font-bold ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Sample Rate</label>
                  <div className={`flex gap-1 p-1 rounded-xl ${isDarkMode ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                    {[44100, 48000].map((rate) => (
                      <button
                        key={rate}
                        disabled={disabled}
                        onClick={() => updateSetting('sampleRate', rate as 44100 | 48000)}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                          settings.sampleRate === rate
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                            : isDarkMode ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        {rate / 1000}kHz
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bit Depth */}
                <div className="space-y-3">
                  <label className={`text-xs font-bold ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Bit Depth</label>
                  <div className={`flex gap-1 p-1 rounded-xl ${isDarkMode ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                    {[16, 24].map((depth) => (
                      <button
                        key={depth}
                        disabled={disabled}
                        onClick={() => updateSetting('bitDepth', depth as 16 | 24)}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                          settings.bitDepth === depth
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                            : isDarkMode ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        {depth}bit
                      </button>
                    ))}
                  </div>
                </div>

                {/* Channels */}
                <div className="space-y-3">
                  <label className={`text-xs font-bold ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Channels</label>
                  <div className={`flex gap-1 p-1 rounded-xl ${isDarkMode ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                    {['mono', 'stereo'].map((mode) => (
                      <button
                        key={mode}
                        disabled={disabled}
                        onClick={() => updateSetting('channelMode', mode as 'mono' | 'stereo')}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all capitalize ${
                          settings.channelMode === mode
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                            : isDarkMode ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdvancedSettings;
