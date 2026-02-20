
export interface FileMetadata {
  name: string;
  type: string;
  sizeMB: string;
  duration: string;
  bitrate?: string;
  sampleRate?: string;
}

export interface ConvertedFileInfo {
  url: string;
  name: string;
  duration: number;
  size: number;
  format: string;
}

export interface Track {
  id: string;
  file: File;
  displayName: string;
  metadata: FileMetadata | null;
  status: 'waiting' | 'processing' | 'done' | 'error';
  progress: number;
  error?: string;
  result?: ConvertedFileInfo;
  startTime: number;
  endTime: number;
  duration: number;
}
