import React from 'react';
import { Download, Layers } from 'lucide-react';
import { motion } from 'motion/react';

interface DownloadAllButtonProps {
  onDownload: () => void;
  count: number;
  isDarkMode: boolean;
  disabled?: boolean;
}

const DownloadAllButton: React.FC<DownloadAllButtonProps> = ({ onDownload, count, isDarkMode, disabled }) => {
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onDownload}
      disabled={disabled}
      className={`w-full py-4 rounded-2xl font-bold text-base shadow-xl transition-all flex items-center justify-center gap-3 group ${
        isDarkMode 
          ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/20' 
          : 'bg-emerald-500 hover:bg-emerald-400 shadow-emerald-200/50'
      } text-white ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <div className="relative">
        <Download className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
        <Layers className="w-3 h-3 absolute -top-1 -right-1 opacity-50" />
      </div>
      Download All ({count} Files)
    </motion.button>
  );
};

export default DownloadAllButton;
