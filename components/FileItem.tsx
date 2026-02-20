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
          ? (isDarkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.08)')
          : item.status === 'converting' 
            ? (isDarkMode ? 'rgba(59, 130, 246, 0.05)' : 'rgba(59, 130, 246, 0.02)')
            : 'transparent',
        transition: { duration: 0.5 }
      }}
      exit={{ opacity: 0, x: 20, scale: 0.95 }}
      onClick={() => onClick(item.id)}
      className={`p-4 rounded-2xl border flex flex-col gap-3 transition-all cursor-pointer group/card ${
        isActive
          ? 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
          : item.status === 'converting' 
            ? 'border-blue-500/50 ring-1 ring-blue-500/20' 
            : isDarkMode ? 'bg-slate-800/40 border-slate-700/50 hover:border-slate-600' : 'bg-white border-slate-100 shadow-sm hover:border-slate-200'
      }`}
    >
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
          item.status === 'done' ? 'bg-emerald-500/10 text-emerald-500' :
          item.status === 'error' ? 'bg-red-500/10 text-red-500' :
          isDarkMode ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-500'
        }`}>
          {item.status === 'done' ? <CheckCircle2 className="w-5 h-5" /> :
           item.status === 'processing' ? <Loader2 className="w-5 h-5 animate-spin" /> :
           item.status === 'error' ? <AlertCircle className="w-5 h-5" /> :
           item.file.type.startsWith('video/') ? <Video className="w-5 h-5" /> : <Music className="w-5 h-5" />}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <p className={`text-sm font-bold truncate ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
              {item.displayName}
            </p>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                item.status === 'done' ? 'bg-emerald-500/10 text-emerald-500' :
                item.status === 'processing' ? 'bg-blue-500 text-white' :
                item.status === 'error' ? 'bg-red-500/10 text-red-500' :
                isDarkMode ? 'bg-slate-700 text-slate-400' : 'bg-slate-200 text-slate-500'
              }`}>
                {item.status}
              </span>
            </div>
          </div>
          <p className="text-[10px] font-medium text-slate-500">
            {item.metadata?.sizeMB} MB • {item.metadata?.duration}
          </p>
        </div>

        <div className="flex items-center gap-1">
          {item.status === 'done' && item.result && (
            <a 
              href={item.result.url} 
              download={item.result.name}
              className={`p-1.5 rounded-lg transition-all ${
                isDarkMode ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
              }`}
            >
              <Download className="w-4 h-4" />
            </a>
          )}
          
          {!isQueueRunning && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onRemove(item.id);
              }}
              className={`p-1.5 rounded-lg transition-all ${
                isDarkMode ? 'hover:bg-red-500/20 text-slate-500 hover:text-red-400' : 'hover:bg-red-50 text-slate-400 hover:text-red-500'
              }`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {item.status === 'processing' && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-[9px] font-bold text-blue-500">
            <span>PROCESSING...</span>
            <span>{item.progress}%</span>
          </div>
          <div className="w-full h-1 bg-slate-500/10 rounded-full overflow-hidden">
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
