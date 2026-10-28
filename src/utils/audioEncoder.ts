import { CutMode } from '../types/audio';

declare const lamejs: any;

/**
 * Converte segundos para string mm:ss ou mm:ss.cc
 */
export function formatTime(seconds: number, includeCentis: boolean = false): string {
  if (isNaN(seconds) || seconds < 0) seconds = 0;
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const centis = Math.floor((seconds % 1) * 100);

  const pad = (n: number) => (n < 10 ? '0' + n : '' + n);

  if (includeCentis) {
    return `${pad(mins)}:${pad(secs)}.${pad(centis)}`;
  }
  return `${pad(mins)}:${pad(secs)}`;
}

/**
 * Converte string mm:ss.cc ou ss.cc para segundos decimais
 */
export function parseTimeToSeconds(str: string): number | null {
  if (!str || typeof str !== 'string') return null;
  const clean = str.trim().replace(',', '.');

  if (clean.includes(':')) {
    const parts = clean.split(':');
    if (parts.length === 2) {
      const mins = parseFloat(parts[0]);
      const secs = parseFloat(parts[1]);
      if (!isNaN(mins) && !isNaN(secs)) {
        return mins * 60 + secs;
      }
    }
  } else {
    const val = parseFloat(clean);
    if (!isNaN(val)) return val;
  }
  return null;
}

/**
 * Formata bytes para string legível (KB, MB)
 */
export function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Cria um novo AudioBuffer cortado conforme o modo (extrair ou excluir), com crossfade opcional de ~50ms
 */
export function createEditedAudioBuffer(
  origBuffer: AudioBuffer,
  startSec: number,
  endSec: number,
  mode: CutMode,
  crossfade: boolean
): AudioBuffer {
  const sampleRate = origBuffer.sampleRate;
  const numChannels = origBuffer.numberOfChannels;
  const origLength = origBuffer.length;

  const selStartSample = Math.max(0, Math.min(Math.floor(startSec * sampleRate), origLength));
  const selEndSample = Math.max(selStartSample, Math.min(Math.floor(endSec * sampleRate), origLength));

  // AudioContext temporário para criar buffer
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  const tempCtx = new AudioCtx();
  const crossfadeSamples = crossfade ? Math.floor(0.05 * sampleRate) : 0;

  if (mode === 'extract') {
    const extractLength = selEndSample - selStartSample;
    if (extractLength <= 0) throw new Error('O trecho selecionado é inválido ou vazio.');

    const outBuffer = tempCtx.createBuffer(numChannels, extractLength, sampleRate);

    for (let ch = 0; ch < numChannels; ch++) {
      const inData = origBuffer.getChannelData(ch);
      const outData = outBuffer.getChannelData(ch);

      for (let i = 0; i < extractLength; i++) {
        outData[i] = inData[selStartSample + i];
      }

      // Aplica fade in e out nas extremidades se crossfade estiver ativo
      if (crossfade && crossfadeSamples > 0 && extractLength > crossfadeSamples * 2) {
        for (let i = 0; i < crossfadeSamples; i++) {
          const factor = i / crossfadeSamples;
          outData[i] *= factor;
          outData[extractLength - 1 - i] *= factor;
        }
      }
    }

    tempCtx.close();
    return outBuffer;
  } else {
    // Modo excluir: Trecho 1 [0, selStartSample] + Trecho 2 [selEndSample, origLength]
    const part1Length = selStartSample;
    const part2Length = origLength - selEndSample;

    const canOverlap = crossfade && crossfadeSamples > 0 && part1Length >= crossfadeSamples && part2Length >= crossfadeSamples;
    const overlap = canOverlap ? crossfadeSamples : 0;

    const totalOutLength = part1Length + part2Length - overlap;
    if (totalOutLength <= 0) throw new Error('O corte resultaria em um áudio vazio.');

    const outBuffer = tempCtx.createBuffer(numChannels, totalOutLength, sampleRate);

    for (let ch = 0; ch < numChannels; ch++) {
      const inData = origBuffer.getChannelData(ch);
      const outData = outBuffer.getChannelData(ch);

      for (let i = 0; i < part1Length - overlap; i++) {
        outData[i] = inData[i];
      }

      if (canOverlap) {
        for (let i = 0; i < overlap; i++) {
          const idxOut = part1Length - overlap + i;
          const sample1 = inData[part1Length - overlap + i];
          const sample2 = inData[selEndSample + i];

          const t = i / overlap;
          const w1 = 1 - t;
          const w2 = t;

          outData[idxOut] = sample1 * w1 + sample2 * w2;
        }

        for (let i = overlap; i < part2Length; i++) {
          const idxOut = part1Length + i - overlap;
          outData[idxOut] = inData[selEndSample + i];
        }
      } else {
        for (let i = 0; i < part2Length; i++) {
          outData[part1Length + i] = inData[selEndSample + i];
        }
      }
    }

    tempCtx.close();
    return outBuffer;
  }
}

/**
 * Exporta AudioBuffer como WAV PCM 16-bit com cabeçalho RIFF
 */
export function exportWAV(audioBuffer: AudioBuffer): Blob {
  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const numSamples = audioBuffer.length;

  const byteRate = sampleRate * numChannels * 2;
  const blockAlign = numChannels * 2;
  const dataByteLength = numSamples * blockAlign;
  const wavBufferLength = 44 + dataByteLength;

  const buffer = new ArrayBuffer(wavBufferLength);
  const view = new DataView(buffer);

  function writeString(offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataByteLength, true);
  writeString(8, 'WAVE');

  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true); // 16-bit

  writeString(36, 'data');
  view.setUint32(40, dataByteLength, true);

  let offset = 44;
  const channels: Float32Array[] = [];
  for (let ch = 0; ch < numChannels; ch++) {
    channels.push(audioBuffer.getChannelData(ch));
  }

  for (let i = 0; i < numSamples; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      let sample = channels[ch][i];
      sample = Math.max(-1, Math.min(1, sample));
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, intSample, true);
      offset += 2;
    }
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

/**
 * Exporta AudioBuffer como MP3 usando lamejs no navegador
 */
export async function exportMP3(
  audioBuffer: AudioBuffer,
  onProgress?: (pct: number) => void
): Promise<Blob> {
  if (typeof lamejs === 'undefined') {
    throw new Error('A biblioteca lamejs não foi carregada.');
  }

  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const kbps = 192;

  const mp3encoder = new lamejs.Mp3Encoder(numChannels, sampleRate, kbps);
  const mp3Data: any[] = [];

  function floatToInt16(floatArr: Float32Array): Int16Array {
    const len = floatArr.length;
    const int16 = new Int16Array(len);
    for (let i = 0; i < len; i++) {
      const s = Math.max(-1, Math.min(1, floatArr[i]));
      int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return int16;
  }

  const leftInt = floatToInt16(audioBuffer.getChannelData(0));
  const rightInt = numChannels > 1 ? floatToInt16(audioBuffer.getChannelData(1)) : null;

  const totalSamples = leftInt.length;
  const sampleBlockSize = 1152;
  let processed = 0;

  while (processed < totalSamples) {
    const chunkEnd = Math.min(processed + 24000, totalSamples);

    for (let i = processed; i < chunkEnd; i += sampleBlockSize) {
      const end = Math.min(i + sampleBlockSize, chunkEnd);
      const leftChunk = leftInt.subarray(i, end);

      let mp3buf: any;
      if (numChannels === 1 || !rightInt) {
        mp3buf = mp3encoder.encodeBuffer(leftChunk);
      } else {
        const rightChunk = rightInt.subarray(i, end);
        mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk);
      }

      if (mp3buf && mp3buf.length > 0) {
        mp3Data.push(mp3buf);
      }
    }

    processed = chunkEnd;
    if (onProgress) {
      onProgress((processed / totalSamples) * 100);
    }

    await new Promise((r) => setTimeout(r, 2));
  }

  const finalBuf = mp3encoder.flush();
  if (finalBuf && finalBuf.length > 0) {
    mp3Data.push(finalBuf);
  }

  return new Blob(mp3Data, { type: 'audio/mp3' });
}

/**
 * Exporta AudioBuffer como OGG/Opus usando MediaRecorder
 */
export async function exportOGG(
  audioBuffer: AudioBuffer,
  onProgress?: (pct: number) => void
): Promise<{ blob: Blob; ext: string }> {
  let mimeType = 'audio/ogg;codecs=opus';
  let ext = 'ogg';

  if (!MediaRecorder.isTypeSupported(mimeType)) {
    if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
      mimeType = 'audio/webm;codecs=opus';
      ext = 'webm';
    } else {
      throw new Error('O formato OGG/Opus não é suportado pelo seu navegador.');
    }
  }

  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  const audioCtx = new AudioCtx({ sampleRate: audioBuffer.sampleRate });
  const dest = audioCtx.createMediaStreamDestination();
  const source = audioCtx.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(dest);

  const recorder = new MediaRecorder(dest.stream, { mimeType });
  const chunks: Blob[] = [];

  return new Promise((resolve, reject) => {
    const totalDuration = audioBuffer.duration;
    const startTime = Date.now();

    const progressInterval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      const pct = Math.min(98, (elapsed / totalDuration) * 100);
      if (onProgress) onProgress(pct);
    }, 150);

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      clearInterval(progressInterval);
      audioCtx.close();
      resolve({
        blob: new Blob(chunks, { type: mimeType }),
        ext: ext,
      });
    };

    recorder.onerror = (e) => {
      clearInterval(progressInterval);
      audioCtx.close();
      reject(e);
    };

    recorder.start();
    source.start(0);

    source.onended = () => {
      setTimeout(() => {
        if (recorder.state !== 'inactive') recorder.stop();
      }, 120);
    };
  });
}

/**
 * Gera um buffer sintético de demonstração com melodia e arpeggio
 */
export function generateDemoAudioBuffer(audioCtx: AudioContext): AudioBuffer {
  const sampleRate = audioCtx.sampleRate || 44100;
  const duration = 24;
  const numChannels = 2;
  const totalSamples = Math.floor(sampleRate * duration);

  const buffer = audioCtx.createBuffer(numChannels, totalSamples, sampleRate);
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);

  const notes = [261.63, 329.63, 392.0, 523.25, 392.0, 329.63, 293.66, 349.23, 440.0, 587.33];
  const tempo = 0.35;

  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    const noteIndex = Math.floor(t / tempo) % notes.length;
    const freq = notes[noteIndex];
    const noteTime = t % tempo;
    const env = Math.exp(-noteTime * 4.0);

    const sample =
      (Math.sin(2 * Math.PI * freq * t) * 0.4 +
        Math.sin(2 * Math.PI * freq * 2 * t) * 0.15 +
        Math.sin(2 * Math.PI * freq * 0.5 * t) * 0.2) *
      env;

    left[i] = sample * (0.7 + 0.3 * Math.sin(t * 0.8));
    right[i] = sample * (0.7 - 0.3 * Math.sin(t * 0.8));
  }

  return buffer;
}

/**
 * Dispara o download de um Blob no navegador
 */
export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
