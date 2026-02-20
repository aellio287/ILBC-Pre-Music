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
    <div className={`rounded-2xl border transition-all ${
      isDarkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-100'
    }`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 cursor-pointer group"
      >
        <div className="flex items-center gap-2">
          <Settings2 className={`w-4 h-4 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'} group-hover:text-blue-500 transition-colors`} />
          <span className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Advanced Settings
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'} ${isExpanded ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 space-y-4">
              <div className="h-px bg-slate-500/10 mb-4" />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Sample Rate */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Sample Rate</label>
                  <div className="flex gap-1 p-1 rounded-lg bg-slate-500/5">
                    {[44100, 48000].map((rate) => (
                      <button
                        key={rate}
                        disabled={disabled}
                        onClick={() => updateSetting('sampleRate', rate as 44100 | 48000)}
                        className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all ${
                          settings.sampleRate === rate
                            ? 'bg-blue-500 text-white shadow-sm'
                            : isDarkMode ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        {rate / 1000}kHz
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bit Depth */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Bit Depth</label>
                  <div className="flex gap-1 p-1 rounded-lg bg-slate-500/5">
                    {[16, 24].map((depth) => (
                      <button
                        key={depth}
                        disabled={disabled}
                        onClick={() => updateSetting('bitDepth', depth as 16 | 24)}
                        className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all ${
                          settings.bitDepth === depth
                            ? 'bg-blue-500 text-white shadow-sm'
                            : isDarkMode ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        {depth}bit
                      </button>
                    ))}
                  </div>
                </div>

                {/* Channels */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Channels</label>
                  <div className="flex gap-1 p-1 rounded-lg bg-slate-500/5">
                    {['mono', 'stereo'].map((mode) => (
                      <button
                        key={mode}
                        disabled={disabled}
                        onClick={() => updateSetting('channelMode', mode as 'mono' | 'stereo')}
                        className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all capitalize ${
                          settings.channelMode === mode
                            ? 'bg-blue-500 text-white shadow-sm'
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
