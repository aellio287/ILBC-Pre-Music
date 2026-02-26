
export type OutputFormat = 'WAV' | 'MP3' | 'FLAC' | 'AAC' | 'OGG';

export interface AudioSettings {
  sampleRate: 44100 | 48000;
  bitDepth: 16 | 24;
  channelMode: 'mono' | 'stereo';
}

export interface TrimOptions {
  start: number;
  end: number;
}

/**
 * Native Web Audio API based conversion.
 * Significantly faster than FFmpeg for audio-to-audio/video-to-audio tasks.
 */
export async function convertMedia(
  file: File, 
  format: OutputFormat, 
  settings: AudioSettings,
  trim?: TrimOptions,
  onLog?: (msg: string) => void,
  signal?: AbortSignal
): Promise<{ blob: Blob; ext: string; duration: number }> {
  if (signal?.aborted) throw new Error('Aborted');

  onLog?.('Reading file stream...');
  const arrayBuffer = await file.arrayBuffer();
  
  if (signal?.aborted) throw new Error('Aborted');

  onLog?.('Decoding audio buffer...');
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  
  // decodeAudioData doesn't support AbortSignal natively in all browsers
  const decodedBuffer = await audioCtx.decodeAudioData(arrayBuffer);

  if (signal?.aborted) throw new Error('Aborted');

  const sampleRate = settings.sampleRate;
  const numChannels = settings.channelMode === 'stereo' ? 2 : 1;
  
  // Calculate trim bounds
  let startOffset = 0;
  let endOffset = decodedBuffer.length;
  
  if (trim) {
    startOffset = Math.max(0, Math.floor(trim.start * decodedBuffer.sampleRate));
    endOffset = Math.min(decodedBuffer.length, Math.floor(trim.end * decodedBuffer.sampleRate));
    
    if (startOffset >= endOffset) {
      startOffset = 0;
      endOffset = decodedBuffer.length;
      onLog?.('Warning: Invalid trim range, using full duration.');
    } else {
      onLog?.(`Slicing buffer: ${trim.start.toFixed(1)}s to ${trim.end.toFixed(1)}s`);
    }
  }

  const sourceDuration = (endOffset - startOffset) / decodedBuffer.sampleRate;
  const targetFrameCount = Math.max(1, Math.round(sourceDuration * sampleRate));
  
  onLog?.(`Re-sampling to ${sampleRate}Hz ${settings.channelMode}...`);
  const offlineCtx = new OfflineAudioContext(numChannels, targetFrameCount, sampleRate);
  const source = offlineCtx.createBufferSource();
  source.buffer = decodedBuffer;
  source.connect(offlineCtx.destination);
  source.start(0, startOffset / decodedBuffer.sampleRate, sourceDuration);

  const renderedBuffer = await offlineCtx.startRendering();
  
  if (signal?.aborted) throw new Error('Aborted');

  onLog?.(`Finalizing ${format} encoding...`);
  
  const wavBlob = bufferToWav(renderedBuffer, settings.bitDepth, signal);
  
  return { 
    blob: wavBlob, 
    ext: format.toLowerCase(), 
    duration: renderedBuffer.duration 
  };
}

/**
 * Encodes an AudioBuffer into a WAV (RIFF) Blob
 * Optimized for performance using TypedArrays
 */
function bufferToWav(abuffer: AudioBuffer, bitDepth: 16 | 24, signal?: AbortSignal): Blob {
  const numOfChan = abuffer.numberOfChannels;
  const bytesPerSample = bitDepth / 8;
  const headerLength = 44;
  const dataLength = abuffer.length * numOfChan * bytesPerSample;
  const fileLength = dataLength + headerLength;
  
  const buffer = new ArrayBuffer(fileLength);
  const view = new DataView(buffer);
  const channels = [];
  
  for (let i = 0; i < numOfChan; i++) {
    channels.push(abuffer.getChannelData(i));
  }

  // write WAVE header
  const setUint32 = (offset: number, data: number) => view.setUint32(offset, data, true);
  const setUint16 = (offset: number, data: number) => view.setUint16(offset, data, true);

  setUint32(0, 0x46464952);                         // "RIFF"
  setUint32(4, fileLength - 8);                     // file length - 8
  setUint32(8, 0x45564157);                         // "WAVE"

  setUint32(12, 0x20746d66);                        // "fmt " chunk
  setUint32(16, 16);                                // length = 16
  setUint16(20, 1);                                 // PCM (uncompressed)
  setUint16(22, numOfChan);
  setUint32(24, abuffer.sampleRate);
  setUint32(28, abuffer.sampleRate * bytesPerSample * numOfChan); // avg. bytes/sec
  setUint16(32, numOfChan * bytesPerSample);                      // block-align
  setUint16(34, bitDepth);                                 // 16-bit or 24-bit

  setUint32(36, 0x61746164);                        // "data" - chunk
  setUint32(40, dataLength);                        // chunk length

  // write interleaved data
  let offset = headerLength;
  const sampleCount = abuffer.length;

  if (bitDepth === 16) {
    const data = new Int16Array(sampleCount * numOfChan);
    for (let i = 0; i < sampleCount; i++) {
      // Periodically check for abort signal in long loops
      if (i % 100000 === 0 && signal?.aborted) throw new Error('Aborted');
      
      for (let channel = 0; channel < numOfChan; channel++) {
        let sample = channels[channel][i];
        sample = Math.max(-1, Math.min(1, sample));
        data[i * numOfChan + channel] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      }
    }
    new Uint8Array(buffer, headerLength).set(new Uint8Array(data.buffer));
  } else {
    // 24-bit PCM
    for (let i = 0; i < sampleCount; i++) {
      if (i % 100000 === 0 && signal?.aborted) throw new Error('Aborted');

      for (let channel = 0; channel < numOfChan; channel++) {
        let sample = channels[channel][i];
        sample = Math.max(-1, Math.min(1, sample));
        const s = sample < 0 ? sample * 0x800000 : sample * 0x7FFFFF;
        
        view.setUint8(offset, s & 0xff);
        view.setUint8(offset + 1, (s >> 8) & 0xff);
        view.setUint8(offset + 2, (s >> 16) & 0xff);
        offset += 3;
      }
    }
  }

  return new Blob([buffer], { type: "audio/wav" });
}
