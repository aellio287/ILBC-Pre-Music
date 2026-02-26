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
        className={`w-full py-4 px-4 rounded-2xl transition-all flex items-center justify-center gap-3 group shadow-sm ${
          isDarkMode 
            ? 'bg-slate-800/40 hover:bg-slate-800/60 text-slate-400 hover:text-blue-400' 
            : 'bg-white hover:bg-slate-50 text-slate-500 hover:text-blue-600 shadow-sm'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <div className={`p-2 rounded-xl transition-colors ${
          isDarkMode ? 'bg-slate-800 group-hover:bg-blue-500/10' : 'bg-slate-50 group-hover:bg-blue-50'
        }`}>
          <Plus className="w-5 h-5" />
        </div>
        <span className="text-base font-bold tracking-tight">Add New Track</span>
        <Music className="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity" />
      </motion.button>
    </div>
  );
};

export default AddNewTrack;
