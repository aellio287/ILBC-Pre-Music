
import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  buffer: AudioBuffer;
  isDarkMode: boolean;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ buffer, isDarkMode }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const data = buffer.getChannelData(0);
    const step = Math.ceil(data.length / canvas.width);
    const amp = canvas.height / 2;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    ctx.moveTo(0, amp);
    
    // Waveform line color
    ctx.strokeStyle = isDarkMode ? '#60a5fa' : '#3b82f6';
    ctx.lineWidth = 1;

    for (let i = 0; i < canvas.width; i++) {
      let min = 1.0;
      let max = -1.0;
      for (let j = 0; j < step; j++) {
        const datum = data[i * step + j];
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }
      ctx.lineTo(i, (1 + min) * amp);
      ctx.lineTo(i, (1 + max) * amp);
    }

    ctx.stroke();

    // Secondary layer glow/overlay
    ctx.beginPath();
    ctx.strokeStyle = isDarkMode ? 'rgba(168, 85, 247, 0.4)' : 'rgba(168, 85, 247, 0.2)';
    ctx.lineWidth = 2;
    for (let i = 0; i < canvas.width; i += 2) {
       let max = 0;
       for (let j = 0; j < step; j++) {
          const val = Math.abs(data[i * step + j]);
          if(val > max) max = val;
       }
       ctx.moveTo(i, amp - max * amp * 0.8);
       ctx.lineTo(i, amp + max * amp * 0.8);
    }
    ctx.stroke();

  }, [buffer, isDarkMode]);

  return (
    <canvas 
      ref={canvasRef} 
      width={1200} 
      height={300} 
      className="w-full h-full object-cover opacity-80"
    />
  );
};

export default AudioVisualizer;
