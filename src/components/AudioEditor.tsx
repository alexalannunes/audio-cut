import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  Download,
  Plus,
  Minus,
  FastForward,
  Rewind,
} from 'lucide-react';
import { AudioMetadata, CutMode, ExportFormat, ResolvedLanguage } from '../types/audio';
import { I18N } from '../i18n/translations';
import { formatTime, parseTimeToSeconds, formatBytes } from '../utils/audioEncoder';

interface AudioEditorProps {
  resolvedLang: ResolvedLanguage;
  audioBuffer: AudioBuffer;
  metadata: AudioMetadata;
  onBack: () => void;
  onExport: (format: ExportFormat, mode: CutMode, crossfade: boolean, start: number, end: number) => void;
  onShowToast: (text: string, type?: 'info' | 'success' | 'error') => void;
}

export const AudioEditor: React.FC<AudioEditorProps> = ({
  resolvedLang,
  audioBuffer,
  metadata,
  onBack,
  onExport,
  onShowToast,
}) => {
  const t = I18N[resolvedLang];

  // Estado da seleção e corte
  const [selectionStart, setSelectionStart] = useState<number>(() => {
    return metadata.duration > 15
      ? Math.round(metadata.duration * 0.15 * 100) / 100
      : Math.round(metadata.duration * 0.2 * 100) / 100;
  });

  const [selectionEnd, setSelectionEnd] = useState<number>(() => {
    return metadata.duration > 15
      ? Math.round(metadata.duration * 0.55 * 100) / 100
      : Math.round(metadata.duration * 0.8 * 100) / 100;
  });

  const [cutMode, setCutMode] = useState<CutMode>('exclude');
  const [crossfade, setCrossfade] = useState<boolean>(true);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('mp3');

  // Inputs editáveis de tempo
  const [startTimeInput, setStartTimeInput] = useState<string>(() => formatTime(selectionStart, true));
  const [endTimeInput, setEndTimeInput] = useState<string>(() => formatTime(selectionEnd, true));

  // Reprodução
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playheadTime, setPlayheadTime] = useState<number>(0);

  // Estado ativo de toque / arraste
  const [activeDrag, setActiveDrag] = useState<'left' | 'right' | 'body' | null>(null);

  // Refs de áudio e DOM
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const playbackStartOffsetRef = useRef<number>(0);
  const playbackStartedAtRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const peaksRef = useRef<Float32Array | null>(null);

  // Arraste
  const draggingRef = useRef<'left' | 'right' | 'body' | null>(null);
  const dragStartXRef = useRef<number>(0);
  const dragStartLeftRef = useRef<number>(0);
  const dragStartRightRef = useRef<number>(0);

  // Inicializa AudioContext
  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioCtx();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  // Precomputa picos da forma de onda
  useEffect(() => {
    const totalSamples = audioBuffer.length;
    const numBuckets = 1400;
    const blockSize = Math.floor(totalSamples / numBuckets) || 1;

    const channel0 = audioBuffer.getChannelData(0);
    const channel1 = audioBuffer.numberOfChannels > 1 ? audioBuffer.getChannelData(1) : null;

    const peaks = new Float32Array(numBuckets);

    for (let i = 0; i < numBuckets; i++) {
      const start = i * blockSize;
      const end = Math.min(start + blockSize, totalSamples);
      let maxVal = 0;

      for (let j = start; j < end; j += 4) {
        const val0 = Math.abs(channel0[j]);
        const val = channel1 ? (val0 + Math.abs(channel1[j])) * 0.5 : val0;
        if (val > maxVal) maxVal = val;
      }
      peaks[i] = Math.min(1.0, maxVal);
    }

    peaksRef.current = peaks;
  }, [audioBuffer]);

  // Redesenho da Waveform no Canvas
  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !peaksRef.current) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = '#0d0d10';
    ctx.fillRect(0, 0, width, height);

    const rulerHeight = 26 * dpr;
    const waveHeight = height - rulerHeight;
    const centerY = waveHeight / 2;

    const duration = metadata.duration;
    const peaks = peaksRef.current;

    const barWidth = 3 * dpr;
    const barGap = 1.5 * dpr;
    const step = barWidth + barGap;
    const totalBars = Math.floor(width / step);

    for (let i = 0; i < totalBars; i++) {
      const x = i * step;
      const timeAtBar = (x / width) * duration;

      const peakIndex = Math.min(
        peaks.length - 1,
        Math.floor((i / totalBars) * peaks.length)
      );
      const rawPeak = peaks[peakIndex] || 0.05;
      const peak = Math.max(0.06, Math.pow(rawPeak, 0.85));

      const barH = peak * (waveHeight * 0.86);
      const topY = centerY - barH / 2;

      let isKept = false;
      if (cutMode === 'exclude') {
        isKept = timeAtBar < selectionStart || timeAtBar > selectionEnd;
      } else {
        isKept = timeAtBar >= selectionStart && timeAtBar <= selectionEnd;
      }

      ctx.fillStyle = isKept ? '#1a7cff' : '#3a3d4d';

      const radius = Math.min(barWidth / 2, barH / 2);
      ctx.beginPath();
      ctx.roundRect(x, topY, barWidth, barH, radius);
      ctx.fill();
    }

    // Régua de tempo
    ctx.fillStyle = '#131317';
    ctx.fillRect(0, waveHeight, width, rulerHeight);

    ctx.strokeStyle = '#23232b';
    ctx.lineWidth = 1 * dpr;
    ctx.beginPath();
    ctx.moveTo(0, waveHeight);
    ctx.lineTo(width, waveHeight);
    ctx.stroke();

    let markerInterval = 5;
    if (duration < 10) markerInterval = 1;
    else if (duration < 30) markerInterval = 2;
    else if (duration < 60) markerInterval = 5;
    else if (duration < 180) markerInterval = 10;
    else if (duration < 600) markerInterval = 30;
    else markerInterval = 60;

    ctx.font = `${10 * dpr}px 'JetBrains Mono', monospace`;
    ctx.fillStyle = '#7a7d8e';
    ctx.textAlign = 'center';

    for (let tSec = 0; tSec <= duration; tSec += markerInterval) {
      const x = (tSec / duration) * width;
      ctx.beginPath();
      ctx.moveTo(x, waveHeight);
      ctx.lineTo(x, waveHeight + 5 * dpr);
      ctx.strokeStyle = '#3a3c48';
      ctx.stroke();

      ctx.fillText(formatTime(tSec, false), x, waveHeight + 17 * dpr);
    }
  }, [cutMode, metadata.duration, selectionEnd, selectionStart]);

  // Redesenha no resize e quando a seleção mudar
  useEffect(() => {
    drawWaveform();
    const handleResize = () => drawWaveform();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawWaveform]);

  // Stop de áudio
  const stopAudioSourceOnly = useCallback(() => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
        sourceNodeRef.current.disconnect();
      } catch (e) {}
      sourceNodeRef.current = null;
    }
  }, []);

  const stopPlayback = useCallback(() => {
    setIsPlaying(false);
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    stopAudioSourceOnly();
  }, [stopAudioSourceOnly]);

  // Iniciar reprodução de um ponto
  const startPlayback = useCallback(
    (offsetSec: number) => {
      stopAudioSourceOnly();

      const audioCtx = getAudioContext();
      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioCtx.destination);
      sourceNodeRef.current = source;

      let effectiveOffset = offsetSec;
      if (cutMode === 'extract') {
        if (effectiveOffset < selectionStart || effectiveOffset >= selectionEnd) {
          effectiveOffset = selectionStart;
        }
      } else if (cutMode === 'exclude') {
        if (effectiveOffset >= selectionStart && effectiveOffset < selectionEnd) {
          effectiveOffset = selectionEnd;
        }
      }

      playbackStartOffsetRef.current = effectiveOffset;
      playbackStartedAtRef.current = audioCtx.currentTime;
      setPlayheadTime(effectiveOffset);

      source.start(0, effectiveOffset);
      setIsPlaying(true);

      const loop = () => {
        const elapsed = audioCtx.currentTime - playbackStartedAtRef.current;
        const currentPos = playbackStartOffsetRef.current + elapsed;

        setPlayheadTime(currentPos);

        if (cutMode === 'extract') {
          if (currentPos >= selectionEnd) {
            stopPlayback();
            setPlayheadTime(selectionStart);
            return;
          }
        } else if (cutMode === 'exclude') {
          if (currentPos >= selectionStart && currentPos < selectionEnd) {
            startPlayback(selectionEnd);
            return;
          } else if (currentPos >= metadata.duration) {
            stopPlayback();
            setPlayheadTime(0);
            return;
          }
        }

        animFrameRef.current = requestAnimationFrame(loop);
      };

      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = requestAnimationFrame(loop);
    },
    [audioBuffer, cutMode, getAudioContext, metadata.duration, selectionEnd, selectionStart, stopAudioSourceOnly, stopPlayback]
  );

  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      stopPlayback();
    } else {
      startPlayback(playheadTime);
    }
  }, [isPlaying, playheadTime, startPlayback, stopPlayback]);

  // Tecla de espaço = Play/Pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlayPause();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlayPause]);

  // Limpeza ao desmontar
  useEffect(() => {
    return () => {
      stopPlayback();
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, [stopPlayback]);

  // Conversão coordenada X para segundos
  const xToSeconds = (clientX: number) => {
    if (!containerRef.current) return 0;
    const rect = containerRef.current.getBoundingClientRect();
    const clampedX = Math.max(0, Math.min(clientX - rect.left, rect.width));
    return (clampedX / rect.width) * metadata.duration;
  };

  // Arraste de alças e corpo
  const handlePointerDown = (type: 'left' | 'right' | 'body', e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    draggingRef.current = type;
    setActiveDrag(type);
    dragStartXRef.current = e.clientX;
    dragStartLeftRef.current = selectionStart;
    dragStartRightRef.current = selectionEnd;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;

    const minDuration = 0.1;
    const type = draggingRef.current;

    if (type === 'left') {
      let newStart = xToSeconds(e.clientX);
      newStart = Math.max(0, Math.min(newStart, selectionEnd - minDuration));
      const rounded = Math.round(newStart * 100) / 100;
      setSelectionStart(rounded);
      setStartTimeInput(formatTime(rounded, true));
    } else if (type === 'right') {
      let newEnd = xToSeconds(e.clientX);
      newEnd = Math.max(selectionStart + minDuration, Math.min(newEnd, metadata.duration));
      const rounded = Math.round(newEnd * 100) / 100;
      setSelectionEnd(rounded);
      setEndTimeInput(formatTime(rounded, true));
    } else if (type === 'body') {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const deltaX = e.clientX - dragStartXRef.current;
      const deltaSec = (deltaX / rect.width) * metadata.duration;

      const selWidth = dragStartRightRef.current - dragStartLeftRef.current;
      let newStart = dragStartLeftRef.current + deltaSec;
      let newEnd = dragStartRightRef.current + deltaSec;

      if (newStart < 0) {
        newStart = 0;
        newEnd = selWidth;
      } else if (newEnd > metadata.duration) {
        newEnd = metadata.duration;
        newStart = metadata.duration - selWidth;
      }

      const rStart = Math.round(newStart * 100) / 100;
      const rEnd = Math.round(newEnd * 100) / 100;
      setSelectionStart(rStart);
      setSelectionEnd(rEnd);
      setStartTimeInput(formatTime(rStart, true));
      setEndTimeInput(formatTime(rEnd, true));
    }
  };

  const handlePointerUp = () => {
    draggingRef.current = null;
    setActiveDrag(null);
  };

  // Clique no container do waveform para reposicionar cursor
  const handleContainerClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('.selection-handle') || target.closest('.selection-rect')) {
      return;
    }
    const clickedSec = xToSeconds(e.clientX);
    const clamped = Math.max(0, Math.min(clickedSec, metadata.duration));
    setPlayheadTime(clamped);
    if (isPlaying) {
      startPlayback(clamped);
    }
  };

  // Validação manual dos inputs de tempo
  const handleTimeInputCommit = () => {
    const startSec = parseTimeToSeconds(startTimeInput);
    const endSec = parseTimeToSeconds(endTimeInput);

    if (startSec === null || endSec === null) {
      onShowToast(t.toastInvalidTimeFormat, 'error');
      setStartTimeInput(formatTime(selectionStart, true));
      setEndTimeInput(formatTime(selectionEnd, true));
      return;
    }

    if (startSec < 0 || endSec > metadata.duration || startSec >= endSec) {
      onShowToast(t.toastInvalidTimeRange, 'error');
      setStartTimeInput(formatTime(selectionStart, true));
      setEndTimeInput(formatTime(selectionEnd, true));
      return;
    }

    const rStart = Math.round(startSec * 100) / 100;
    const rEnd = Math.round(endSec * 100) / 100;
    setSelectionStart(rStart);
    setSelectionEnd(rEnd);
    setStartTimeInput(formatTime(rStart, true));
    setEndTimeInput(formatTime(rEnd, true));
  };

  // Micro-ajustes (steppers rápidos) para tela de toque (mobile)
  const nudgeStart = (deltaSec: number) => {
    const minDuration = 0.1;
    let nextStart = selectionStart + deltaSec;
    nextStart = Math.max(0, Math.min(nextStart, selectionEnd - minDuration));
    const rStart = Math.round(nextStart * 100) / 100;
    setSelectionStart(rStart);
    setStartTimeInput(formatTime(rStart, true));
  };

  const nudgeEnd = (deltaSec: number) => {
    const minDuration = 0.1;
    let nextEnd = selectionEnd + deltaSec;
    nextEnd = Math.max(selectionStart + minDuration, Math.min(nextEnd, metadata.duration));
    const rEnd = Math.round(nextEnd * 100) / 100;
    setSelectionEnd(rEnd);
    setEndTimeInput(formatTime(rEnd, true));
  };

  // Pular 5s no áudio
  const skipTime = (delta: number) => {
    const next = Math.max(0, Math.min(metadata.duration, playheadTime + delta));
    setPlayheadTime(next);
    if (isPlaying) {
      startPlayback(next);
    }
  };

  // Duração final calculada
  const finalDuration =
    cutMode === 'extract'
      ? Math.max(0, selectionEnd - selectionStart)
      : Math.max(0, metadata.duration - (selectionEnd - selectionStart));

  // Cálculo da posição percentual da seleção
  const leftPercent = metadata.duration > 0 ? (selectionStart / metadata.duration) * 100 : 0;
  const widthPercent =
    metadata.duration > 0 ? ((selectionEnd - selectionStart) / metadata.duration) * 100 : 0;
  const playheadPercent = metadata.duration > 0 ? (playheadTime / metadata.duration) * 100 : 0;

  return (
    <div className="flex flex-1 flex-col pb-36 sm:pb-32 pt-2 sm:pt-4">
      <div className="mx-auto w-full max-w-5xl px-3 sm:px-6">
        {/* Barra de Topo do Editor */}
        <div className="mb-4 flex items-center justify-between rounded-xl border border-[#2c2d36] bg-[#1c1c22] p-2.5 sm:p-4">
          <div className="flex items-center gap-2.5 sm:gap-4 overflow-hidden">
            <button
              type="button"
              onClick={() => {
                stopPlayback();
                onBack();
              }}
              title={t.btnBackTitle}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#2c2d36] bg-[#23232b] text-white transition active:scale-95 hover:border-[#3a3b47]"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <div className="flex flex-col truncate">
              <span className="truncate text-xs sm:text-base font-semibold text-white">
                {metadata.fileName}
              </span>
              <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-[#9ea0ad]">
                <span>{formatBytes(metadata.fileSize)}</span>
                <span className="opacity-40">•</span>
                <span>{(metadata.sampleRate / 1000).toFixed(1)} kHz</span>
                <span className="opacity-40">•</span>
                <span>{metadata.numberOfChannels === 1 ? t.channelsMono : t.channelsStereo}</span>
              </div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2 text-xs text-[#676977]">
            <kbd className="rounded border border-[#2c2d36] bg-[#23232b] px-1.5 py-0.5 font-mono text-[11px] text-[#9ea0ad]">
              Espaço
            </kbd>
            <span>{t.shortcutHint}</span>
          </div>
        </div>

        {/* Grid Principal: Waveform e Sidebar */}
        <div className="grid gap-4 sm:gap-5 lg:grid-cols-[1fr_330px] items-start">
          {/* Waveform Panel */}
          <div className="flex flex-col gap-3 sm:gap-4 rounded-xl border border-[#2c2d36] bg-[#1c1c22] p-3.5 sm:p-5">
            {/* Waveform Canvas & Interactive Box */}
            <div
              ref={containerRef}
              onClick={handleContainerClick}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className="relative h-48 sm:h-56 w-full cursor-pointer select-none overflow-hidden rounded-xl border border-[#1a1a22] bg-[#0d0d10] touch-none shadow-inner"
            >
              <canvas ref={canvasRef} className="block h-full w-full" />

              {/* Caixa de Seleção Amarela */}
              <div
                style={{
                  left: `${leftPercent}%`,
                  width: `${widthPercent}%`,
                }}
                onPointerDown={(e) => handlePointerDown('body', e)}
                className={`selection-rect absolute top-0 bottom-0 border-y-2 border-[#f5c518] bg-[#f5c518]/15 touch-none ${
                  activeDrag === 'body' ? 'cursor-grabbing bg-[#f5c518]/25' : 'cursor-grab'
                }`}
              >
                {/* Alça Esquerda (com área de toque expandida para mobile) */}
                <div
                  onPointerDown={(e) => handlePointerDown('left', e)}
                  title={t.handleLeftTitle}
                  className="selection-handle absolute top-0 bottom-0 left-0 -translate-x-1/2 flex w-10 sm:w-8 cursor-ew-resize items-center justify-center touch-none z-30"
                >
                  {/* Barra visível da alça */}
                  <div
                    className={`h-full w-3.5 sm:w-3 rounded-l-md bg-[#f5c518] shadow-md flex items-center justify-center transition-transform ${
                      activeDrag === 'left' ? 'scale-110 bg-[#ffe066]' : ''
                    }`}
                  >
                    <div className="h-5 w-0.5 rounded bg-[#141418]/70 shadow-[2px_0_0_#141418]" />
                  </div>

                  {/* Tooltip de tempo flutuante acima do polegar */}
                  <div
                    className={`pointer-events-none absolute -top-9 sm:-top-8 left-1/2 -translate-x-1/2 rounded bg-[#1c1c24] px-1.5 py-0.5 font-mono text-[10px] sm:text-[11px] font-bold text-[#f5c518] border border-[#f5c518] shadow-xl transition-opacity z-40 ${
                      activeDrag === 'left' ? 'opacity-100 scale-105' : 'opacity-0'
                    }`}
                  >
                    {formatTime(selectionStart, true)}
                  </div>
                </div>

                {/* Alça Direita (com área de toque expandida para mobile) */}
                <div
                  onPointerDown={(e) => handlePointerDown('right', e)}
                  title={t.handleRightTitle}
                  className="selection-handle absolute top-0 bottom-0 right-0 translate-x-1/2 flex w-10 sm:w-8 cursor-ew-resize items-center justify-center touch-none z-30"
                >
                  {/* Barra visível da alça */}
                  <div
                    className={`h-full w-3.5 sm:w-3 rounded-r-md bg-[#f5c518] shadow-md flex items-center justify-center transition-transform ${
                      activeDrag === 'right' ? 'scale-110 bg-[#ffe066]' : ''
                    }`}
                  >
                    <div className="h-5 w-0.5 rounded bg-[#141418]/70 shadow-[2px_0_0_#141418]" />
                  </div>

                  {/* Tooltip de tempo flutuante acima do polegar */}
                  <div
                    className={`pointer-events-none absolute -top-9 sm:-top-8 left-1/2 -translate-x-1/2 rounded bg-[#1c1c24] px-1.5 py-0.5 font-mono text-[10px] sm:text-[11px] font-bold text-[#f5c518] border border-[#f5c518] shadow-xl transition-opacity z-40 ${
                      activeDrag === 'right' ? 'opacity-100 scale-105' : 'opacity-0'
                    }`}
                  >
                    {formatTime(selectionEnd, true)}
                  </div>
                </div>
              </div>

              {/* Cursor de Reprodução (Playhead) */}
              <div
                style={{ left: `${playheadPercent}%` }}
                className="pointer-events-none absolute top-0 bottom-0 w-0.5 -translate-x-1/2 bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)] z-20"
              >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 border-x-4 border-x-transparent border-t-[6px] border-t-white" />
              </div>
            </div>

            {/* Controles de Reprodução Otimizados para Toque */}
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Botão de retroceder 5s */}
                <button
                  type="button"
                  onClick={() => skipTime(-5)}
                  title="-5s"
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#2c2d36] bg-[#23232b] text-[#9ea0ad] transition active:scale-90 hover:text-white"
                >
                  <Rewind className="h-4 w-4" />
                </button>

                {/* Botão Grande de Play / Pause */}
                <button
                  type="button"
                  onClick={togglePlayPause}
                  title={t.btnPlayTitle}
                  className="flex h-13 w-13 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-[#1a7cff] text-white shadow-lg shadow-[#1a7cff]/35 transition active:scale-90 hover:bg-[#1468dc]"
                >
                  {isPlaying ? (
                    <Pause className="h-6 w-6 fill-current" />
                  ) : (
                    <Play className="h-6 w-6 fill-current translate-x-0.5" />
                  )}
                </button>

                {/* Botão de avançar 5s */}
                <button
                  type="button"
                  onClick={() => skipTime(5)}
                  title="+5s"
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#2c2d36] bg-[#23232b] text-[#9ea0ad] transition active:scale-90 hover:text-white"
                >
                  <FastForward className="h-4 w-4" />
                </button>

                {/* Rewind para início do corte */}
                <button
                  type="button"
                  onClick={() => {
                    const target = cutMode === 'extract' ? selectionStart : 0;
                    setPlayheadTime(target);
                    if (isPlaying) startPlayback(target);
                  }}
                  title={t.btnRewindTitle}
                  className="hidden xs:flex h-10 w-10 items-center justify-center rounded-xl border border-[#2c2d36] bg-[#23232b] text-[#9ea0ad] transition active:scale-90 hover:border-[#3a3b47] hover:text-white"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              </div>

              {/* Contador de Tempo Digital */}
              <div className="font-mono text-sm sm:text-base font-bold text-white bg-[#23232b] px-3 py-1.5 rounded-lg border border-[#2c2d36]">
                <span className="text-white">{formatTime(playheadTime, false)}</span>
                <span className="text-[#676977]"> / </span>
                <span className="text-[#676977]">{formatTime(metadata.duration, false)}</span>
              </div>
            </div>
          </div>

          {/* Painel Lateral de Configurações */}
          <div className="flex flex-col gap-4 sm:gap-5 rounded-xl border border-[#2c2d36] bg-[#1c1c22] p-4 sm:p-5">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#676977]">
                {t.cutModeTitle}
              </span>

              {/* Modos de corte */}
              <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5">
                {/* Excluir */}
                <label
                  onClick={() => setCutMode('exclude')}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition select-none ${
                    cutMode === 'exclude'
                      ? 'border-[#1a7cff] bg-[#1a7cff]/10 shadow-sm shadow-[#1a7cff]/20'
                      : 'border-[#2c2d36] bg-[#23232b] hover:border-[#3a3b47]'
                  }`}
                >
                  <input
                    type="radio"
                    name="cutMode"
                    value="exclude"
                    checked={cutMode === 'exclude'}
                    onChange={() => setCutMode('exclude')}
                    className="mt-0.5 h-4 w-4 accent-[#1a7cff] cursor-pointer"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs sm:text-sm font-semibold text-white">{t.modeExcludeLabel}</span>
                    <span className="text-[11px] text-[#9ea0ad] mt-0.5 leading-snug">{t.modeExcludeSub}</span>
                  </div>
                </label>

                {/* Extrair */}
                <label
                  onClick={() => setCutMode('extract')}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition select-none ${
                    cutMode === 'extract'
                      ? 'border-[#1a7cff] bg-[#1a7cff]/10 shadow-sm shadow-[#1a7cff]/20'
                      : 'border-[#2c2d36] bg-[#23232b] hover:border-[#3a3b47]'
                  }`}
                >
                  <input
                    type="radio"
                    name="cutMode"
                    value="extract"
                    checked={cutMode === 'extract'}
                    onChange={() => setCutMode('extract')}
                    className="mt-0.5 h-4 w-4 accent-[#1a7cff] cursor-pointer"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs sm:text-sm font-semibold text-white">{t.modeExtractLabel}</span>
                    <span className="text-[11px] text-[#9ea0ad] mt-0.5 leading-snug">{t.modeExtractSub}</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Ajuste numérico de tempo com Steppers para Mobile */}
            <div>
              <span className="text-xs font-medium text-[#9ea0ad]">{t.timeSectionLabel}</span>

              <div className="mt-2 grid grid-cols-2 gap-3">
                {/* Bloco de Início */}
                <div className="flex flex-col gap-1.5 rounded-lg border border-[#2c2d36] bg-[#23232b] p-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-[#70adff]">
                      {t.timeStartLabel}
                    </span>
                    <span className="text-[10px] text-[#676977]">mm:ss.cc</span>
                  </div>

                  <input
                    type="text"
                    value={startTimeInput}
                    onChange={(e) => setStartTimeInput(e.target.value)}
                    onBlur={handleTimeInputCommit}
                    onKeyDown={(e) => e.key === 'Enter' && handleTimeInputCommit()}
                    className="w-full rounded border border-[#3a3b47] bg-[#1c1c22] px-2 py-1.5 text-center font-mono text-sm font-bold text-white outline-none focus:border-[#f5c518]"
                  />

                  {/* Micro-botões rápidos de ajuste (+/- 0.1s e 1s) */}
                  <div className="grid grid-cols-2 gap-1 pt-1">
                    <button
                      type="button"
                      onClick={() => nudgeStart(-0.1)}
                      className="flex items-center justify-center rounded bg-[#1c1c22] py-1 text-[11px] font-mono text-[#9ea0ad] hover:text-white active:scale-90"
                    >
                      -0.1s
                    </button>
                    <button
                      type="button"
                      onClick={() => nudgeStart(0.1)}
                      className="flex items-center justify-center rounded bg-[#1c1c22] py-1 text-[11px] font-mono text-[#9ea0ad] hover:text-white active:scale-90"
                    >
                      +0.1s
                    </button>
                  </div>
                </div>

                {/* Bloco de Fim */}
                <div className="flex flex-col gap-1.5 rounded-lg border border-[#2c2d36] bg-[#23232b] p-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-[#f5c518]">
                      {t.timeEndLabel}
                    </span>
                    <span className="text-[10px] text-[#676977]">mm:ss.cc</span>
                  </div>

                  <input
                    type="text"
                    value={endTimeInput}
                    onChange={(e) => setEndTimeInput(e.target.value)}
                    onBlur={handleTimeInputCommit}
                    onKeyDown={(e) => e.key === 'Enter' && handleTimeInputCommit()}
                    className="w-full rounded border border-[#3a3b47] bg-[#1c1c22] px-2 py-1.5 text-center font-mono text-sm font-bold text-white outline-none focus:border-[#f5c518]"
                  />

                  {/* Micro-botões rápidos de ajuste (+/- 0.1s e 1s) */}
                  <div className="grid grid-cols-2 gap-1 pt-1">
                    <button
                      type="button"
                      onClick={() => nudgeEnd(-0.1)}
                      className="flex items-center justify-center rounded bg-[#1c1c22] py-1 text-[11px] font-mono text-[#9ea0ad] hover:text-white active:scale-90"
                    >
                      -0.1s
                    </button>
                    <button
                      type="button"
                      onClick={() => nudgeEnd(0.1)}
                      className="flex items-center justify-center rounded bg-[#1c1c22] py-1 text-[11px] font-mono text-[#9ea0ad] hover:text-white active:scale-90"
                    >
                      +0.1s
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Checkbox Atenuação Cruzada */}
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-[#2c2d36] bg-[#23232b] p-3 select-none active:border-[#3a3b47]">
              <input
                type="checkbox"
                checked={crossfade}
                onChange={(e) => setCrossfade(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded accent-[#1a7cff] cursor-pointer shrink-0"
              />
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-white">{t.crossfadeLabel}</span>
                <span className="text-[11px] leading-relaxed text-[#9ea0ad] mt-0.5">
                  {t.crossfadeDesc}
                </span>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Barra Inferior Fixa de Saída e Exportação com suporte a Safe-Area no Mobile */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#2c2d36] bg-[#141418]/95 backdrop-blur-md px-3.5 sm:px-6 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-2xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-2.5 sm:gap-4">
          {/* Duração de Saída */}
          <div className="flex items-center gap-2">
            <span className="hidden xs:inline text-xs sm:text-sm text-[#9ea0ad]">{t.outputPreviewLabel}</span>
            <span className="xs:hidden text-xs text-[#9ea0ad]">Saída:</span>
            <span className="rounded-lg border border-[#2c2d36] bg-[#23232b] px-2.5 sm:px-3 py-1 font-mono text-sm sm:text-base font-bold text-white shadow-inner">
              {formatTime(finalDuration, false)}
            </span>
          </div>

          {/* Formato e Botão Exportar */}
          <div className="flex items-center gap-2 sm:gap-3">
            <select
              id="formatSelect"
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
              className="cursor-pointer rounded-xl border border-[#2c2d36] bg-[#23232b] px-2.5 sm:px-3 py-2 text-xs sm:text-sm font-semibold text-white outline-none transition focus:border-[#1a7cff] h-10"
              aria-label="Formato de áudio"
            >
              <option value="mp3">MP3</option>
              <option value="wav">WAV</option>
              <option value="ogg">OGG</option>
            </select>

            <button
              type="button"
              onClick={() => {
                stopPlayback();
                onExport(exportFormat, cutMode, crossfade, selectionStart, selectionEnd);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1a7cff] px-4 sm:px-6 py-2 text-xs sm:text-sm font-bold text-white shadow-lg shadow-[#1a7cff]/35 transition active:scale-95 hover:bg-[#1468dc] h-10 min-w-[100px]"
            >
              <Download className="h-4 w-4 shrink-0" />
              <span>{t.btnExport}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
