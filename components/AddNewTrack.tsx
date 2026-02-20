import React, { useRef } from 'react';
import { Plus, Music } from 'lucide-react';
import { motion } from 'motion/react';

interface AddNewTrackProps {
  onFilesSelected: (files: File[]) => void;
  isDarkMode: boolean;
  disabled?: boolean;
}

const AddNewTrack: React.FC<AddNewTrackProps> = ({ onFilesSelected, isDarkMode, disabled }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleButtonClick = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length > 0) {
      onFilesSelected(files);
      // Reset input so the same file can be selected again if removed
      e.target.value = '';
    }
  };

  return (
    <div className="w-full">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="video/*,audio/*"
        multiple
      />
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={handleButtonClick}
        disabled={disabled}
        className={`w-full py-3 px-4 rounded-xl border-2 border-dashed transition-all flex items-center justify-center gap-2 group ${
          isDarkMode 
            ? 'border-slate-800 bg-slate-900/20 hover:border-blue-500/40 hover:bg-slate-900/40 text-slate-400 hover:text-blue-400' 
            : 'border-slate-200 bg-slate-50 hover:border-blue-400 hover:bg-blue-50 text-slate-500 hover:text-blue-600'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <div className={`p-1 rounded-lg transition-colors ${
          isDarkMode ? 'bg-slate-800 group-hover:bg-blue-500/20' : 'bg-white group-hover:bg-blue-100'
        }`}>
          <Plus className="w-4 h-4" />
        </div>
        <span className="text-sm font-bold tracking-tight">Add New Track</span>
        <Music className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition-opacity" />
      </motion.button>
    </div>
  );
};

export default AddNewTrack;
