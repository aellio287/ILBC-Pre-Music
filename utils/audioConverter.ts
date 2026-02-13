
export type OutputFormat = 'keyboard' | 'stereo';

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
  trim?: TrimOptions,
  onLog?: (msg: string) => void
): Promise<{ blob: Blob; ext: string; duration: number }> {
  onLog?.('Reading file stream...');
  const arrayBuffer = await file.arrayBuffer();
  
  onLog?.('Decoding audio buffer...');
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const decodedBuffer = await audioCtx.decodeAudioData(arrayBuffer);

  const sampleRate = 44100;
  const numChannels = format === 'keyboard' ? 1 : 2;
  
  // Calculate trim bounds
  let startOffset = 0;
  let endOffset = decodedBuffer.length;
  
  if (trim) {
    startOffset = Math.floor(trim.start * decodedBuffer.sampleRate);
    endOffset = Math.floor(trim.end * decodedBuffer.sampleRate);
    onLog?.(`Slicing buffer: ${trim.start.toFixed(1)}s to ${trim.end.toFixed(1)}s`);
  }

  const frameCount = endOffset - startOffset;
  
  onLog?.('Re-sampling for high-fidelity...');
  const offlineCtx = new OfflineAudioContext(numChannels, frameCount, sampleRate);
  const source = offlineCtx.createBufferSource();
  source.buffer = decodedBuffer;
  source.connect(offlineCtx.destination);
  source.start(0, startOffset / decodedBuffer.sampleRate, frameCount / decodedBuffer.sampleRate);

  const renderedBuffer = await offlineCtx.startRendering();
  
  onLog?.('Finalizing WAV encoding...');
  const wavBlob = bufferToWav(renderedBuffer);
  
  return { 
    blob: wavBlob, 
    ext: 'wav', 
    duration: renderedBuffer.duration 
  };
}

/**
 * Encodes an AudioBuffer into a WAV (RIFF) Blob
 */
function bufferToWav(abuffer: AudioBuffer): Blob {
  const numOfChan = abuffer.numberOfChannels;
  const length = abuffer.length * numOfChan * 2 + 44;
  const buffer = new ArrayBuffer(length);
  const view = new DataView(buffer);
  const channels = [];
  let i;
  let sample;
  let offset = 0;
  let pos = 0;

  // write WAVE header
  setUint32(0x46464952);                         // "RIFF"
  setUint32(length - 8);                         // file length - 8
  setUint32(0x45564157);                         // "WAVE"

  setUint32(0x20746d66);                         // "fmt " chunk
  setUint32(16);                                 // length = 16
  setUint16(1);                                  // PCM (uncompressed)
  setUint16(numOfChan);
  setUint32(abuffer.sampleRate);
  setUint32(abuffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
  setUint16(numOfChan * 2);                      // block-align
  setUint16(16);                                 // 16-bit (hardcoded for compatibility)

  setUint32(0x61746164);                         // "data" - chunk
  setUint32(length - pos - 4);                   // chunk length

  // write interleaved data
  for (i = 0; i < abuffer.numberOfChannels; i++) {
    channels.push(abuffer.getChannelData(i));
  }

  while (pos < length) {
    for (i = 0; i < numOfChan; i++) {             // interleave channels
      sample = Math.max(-1, Math.min(1, channels[i][offset])); // clamp
      sample = (sample < 0 ? sample * 0x8000 : sample * 0x7FFF); // scale to 16-bit
      view.setInt16(pos, sample, true);          // write 16-bit sample
      pos += 2;
    }
    offset++;                                     // next sample
  }

  return new Blob([buffer], { type: "audio/wav" });

  function setUint16(data: number) {
    view.setUint16(pos, data, true);
    pos += 2;
  }

  function setUint32(data: number) {
    view.setUint32(pos, data, true);
    pos += 4;
  }
}
