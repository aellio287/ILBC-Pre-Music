import React, { useState, useRef, useEffect } from 'react';
import { 
  Music, 
  Video, 
  CheckCircle2, 
  Loader2, 
  AlertCircle, 
  X, 
  Download, 
  Edit2, 
  Check, 
  Trash2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ConvertedFileInfo, Track } from '../types';

export type QueueFile = Track;

interface FileItemProps {
  item: QueueFile;
  isDarkMode: boolean;
  isQueueRunning: boolean;
  isActive: boolean;
  onRemove: (id: string) => void;
  onClick: (id: string) => void;
}

const FileItem: React.FC<FileItemProps> = ({ 
  item, 
  isDarkMode, 
  isQueueRunning, 
  isActive,
  onRemove, 
  onClick
}) => {
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, x: -20, backgroundColor: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)' }}
      animate={{ 
        opacity: 1, 
        x: 0, 
        backgroundColor: isActive 
          ? (isDarkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(241, 245, 249, 0.8)')
          : item.status === 'processing' 
            ? (isDarkMode ? 'rgba(30, 41, 59, 0.4)' : 'rgba(241, 245, 249, 0.4)')
            : isDarkMode ? 'rgba(30, 41, 59, 0.2)' : 'rgba(248, 250, 252, 0.5)',
        transition: { duration: 0.5 }
      }}
      exit={{ opacity: 0, x: 20, scale: 0.95 }}
      onClick={() => onClick(item.id)}
      className={`p-5 rounded-2xl flex flex-col gap-4 transition-all cursor-pointer group/card ${
        isActive
          ? 'shadow-lg ring-2 ring-blue-500/20'
          : item.status === 'processing' 
            ? 'shadow-sm' 
            : 'hover:shadow-md'
      }`}
    >
      <div className="flex items-center gap-5">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
          item.status === 'done' ? 'bg-emerald-500/10 text-emerald-500' :
          item.status === 'error' ? 'bg-red-500/10 text-red-500' :
          isActive ? 'bg-blue-500 text-white' :
          isDarkMode ? 'bg-slate-800 text-slate-500 group-hover/card:text-slate-400' : 'bg-white text-slate-400 group-hover/card:text-slate-500 shadow-sm'
        }`}>
          {item.status === 'done' ? <CheckCircle2 className="w-6 h-6" /> :
           item.status === 'processing' ? <Loader2 className="w-6 h-6 animate-spin" /> :
           item.status === 'error' ? <AlertCircle className="w-6 h-6" /> :
           item.file.type.startsWith('video/') ? <Video className="w-6 h-6" /> : <Music className="w-6 h-6" />}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <p className={`text-base font-bold truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              {item.displayName}
            </p>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wide ${
                item.status === 'done' ? 'bg-emerald-500/10 text-emerald-500' :
                item.status === 'processing' ? 'bg-blue-500 text-white' :
                item.status === 'error' ? 'bg-red-500/10 text-red-500' :
                isDarkMode ? 'bg-slate-800 text-slate-500' : 'bg-slate-200 text-slate-600'
              }`}>
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </span>
            </div>
          </div>
          <p className={`text-xs font-medium ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
            {item.metadata?.sizeMB} MB • {item.metadata?.duration}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isQueueRunning && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onRemove(item.id);
              }}
              className={`p-2 rounded-xl transition-all ${
                isDarkMode ? 'hover:bg-red-500/10 text-slate-600 hover:text-red-400' : 'hover:bg-red-50 text-slate-300 hover:text-red-500'
              }`}
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {item.status === 'done' && item.result && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="pt-1"
        >
          <a 
            href={item.result.url} 
            download={item.result.name}
            onClick={(e) => e.stopPropagation()}
            className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm ${
              isDarkMode 
                ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' 
                : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-500/20'
            }`}
          >
            <Download className="w-4 h-4" />
            Download Converted File
          </a>
        </motion.div>
      )}

      {item.status === 'processing' && (
        <div className="space-y-2">
          <div className="flex justify-between text-[10px] font-bold text-blue-500">
            <span>Processing...</span>
            <span>{item.progress}%</span>
          </div>
          <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${item.progress}%` }}
              className="h-full bg-blue-500"
            />
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default FileItem;
