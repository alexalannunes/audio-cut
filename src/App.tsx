import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { LandingPage } from './components/LandingPage';
import { AudioEditor } from './components/AudioEditor';
import { ExportModal } from './components/ExportModal';
import { ToastContainer } from './components/ToastContainer';
import {
  AudioMetadata,
  CutMode,
  ExportFormat,
  LanguageChoice,
  ResolvedLanguage,
  ToastMessage,
} from './types/audio';
import {
  I18N,
  getSavedLanguagePreference,
  resolveLanguage,
} from './i18n/translations';
import {
  createEditedAudioBuffer,
  exportWAV,
  exportMP3,
  exportOGG,
  generateDemoAudioBuffer,
  triggerDownload,
} from './utils/audioEncoder';

export default function App() {
  // Idioma
  const [langSetting, setLangSetting] = useState<LanguageChoice>(() => getSavedLanguagePreference());
  const resolvedLang: ResolvedLanguage = resolveLanguage(langSetting);
  const t = I18N[resolvedLang];

  // Sincroniza o título da página e atributo html lang
  useEffect(() => {
    document.title = t.appTitle;
    document.documentElement.lang = resolvedLang === 'pt' ? 'pt-BR' : 'en';
  }, [resolvedLang, t.appTitle]);

  const handleLanguageChange = (choice: LanguageChoice) => {
    setLangSetting(choice);
    localStorage.setItem('audiocorte_lang', choice);
  };

  // Estado do Áudio
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [metadata, setMetadata] = useState<AudioMetadata | null>(null);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const showToast = useCallback((text: string, type: 'info' | 'success' | 'error' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, text }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((tItem) => tItem.id !== id));
    }, 3800);
  }, []);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((tItem) => tItem.id !== id));
  };

  // Modal de Exportação
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportTitle, setExportTitle] = useState<string>('');
  const [exportDesc, setExportDesc] = useState<string>('');
  const [exportProgress, setExportProgress] = useState<number>(0);

  // AudioContext persistente para decodificação
  const decodeCtxRef = useRef<AudioContext | null>(null);
  const getDecodeAudioContext = () => {
    if (!decodeCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      decodeCtxRef.current = new AudioCtx();
    }
    if (decodeCtxRef.current.state === 'suspended') {
      decodeCtxRef.current.resume();
    }
    return decodeCtxRef.current;
  };

  // Carregamento de arquivo real do usuário
  const handleFileSelected = async (file: File) => {
    showToast(`${t.toastLoading} ${file.name}...`, 'info');
    try {
      const arrayBuffer = await file.arrayBuffer();
      const ctx = getDecodeAudioContext();
      const decoded = await ctx.decodeAudioData(arrayBuffer);

      setAudioBuffer(decoded);
      setMetadata({
        fileName: file.name,
        fileSize: file.size,
        duration: decoded.duration,
        sampleRate: decoded.sampleRate,
        numberOfChannels: decoded.numberOfChannels,
      });
    } catch (err) {
      console.error('Erro na decodificação:', err);
      showToast(t.toastDecodeError, 'error');
    }
  };

  // Carregamento de áudio demo sintetizado
  const handleLoadDemo = () => {
    try {
      const ctx = getDecodeAudioContext();
      const demoBuffer = generateDemoAudioBuffer(ctx);
      setAudioBuffer(demoBuffer);
      setMetadata({
        fileName: 'audio-demo-sintetizado.wav',
        fileSize: demoBuffer.length * 4,
        duration: demoBuffer.duration,
        sampleRate: demoBuffer.sampleRate,
        numberOfChannels: demoBuffer.numberOfChannels,
      });
      showToast(t.toastDemoLoaded, 'success');
    } catch (err) {
      console.error('Erro ao gerar demo:', err);
    }
  };

  // Exportação
  const handleExport = async (
    format: ExportFormat,
    mode: CutMode,
    crossfade: boolean,
    startSec: number,
    endSec: number
  ) => {
    if (!audioBuffer || !metadata) return;

    setIsExporting(true);
    setExportTitle(t.modalExportTitle);
    setExportDesc(`${t.modalExportDesc} (${format.toUpperCase()})`);
    setExportProgress(10);

    // Pequeno intervalo para a UI renderizar
    await new Promise((r) => setTimeout(r, 60));

    try {
      setExportDesc(t.modalCutting);
      setExportProgress(20);

      const editedBuffer = createEditedAudioBuffer(audioBuffer, startSec, endSec, mode, crossfade);

      let fileBlob: Blob | null = null;
      let ext: string = format;

      if (format === 'wav') {
        setExportDesc(t.modalGenWav);
        setExportProgress(50);
        await new Promise((r) => setTimeout(r, 40));
        fileBlob = exportWAV(editedBuffer);
        setExportProgress(100);
      } else if (format === 'mp3') {
        setExportDesc(t.modalInitMp3);
        setExportProgress(30);
        fileBlob = await exportMP3(editedBuffer, (pct) => {
          setExportProgress(30 + Math.floor(pct * 0.65));
          setExportDesc(`${t.modalEncodingMp3}${Math.floor(pct)}%`);
        });
        setExportProgress(100);
      } else if (format === 'ogg') {
        setExportDesc(t.modalRecordOgg);
        setExportProgress(30);
        const res = await exportOGG(editedBuffer, (pct) => {
          setExportProgress(30 + Math.floor(pct * 0.65));
        });
        fileBlob = res.blob;
        ext = res.ext;
        setExportProgress(100);
      }

      if (fileBlob) {
        const baseName = metadata.fileName.replace(/\.[^/.]+$/, '');
        const outFileName = `${baseName}-editado.${ext}`;
        triggerDownload(fileBlob, outFileName);

        setTimeout(() => {
          setIsExporting(false);
          const successMsg = t.toastDownloadSuccess.replace('{filename}', outFileName);
          showToast(successMsg, 'success');
        }, 300);
      }
    } catch (err: any) {
      console.error('Falha na exportação:', err);
      setIsExporting(false);
      showToast(`${t.toastExportError}${err.message || ''}`, 'error');
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#141418] text-[#f1f1f5]">
      {/* Cabeçalho */}
      <Header
        currentLangSetting={langSetting}
        resolvedLang={resolvedLang}
        onLanguageChange={handleLanguageChange}
        onLogoClick={() => {
          setAudioBuffer(null);
          setMetadata(null);
        }}
      />

      {/* Conteúdo Principal: Landing ou Editor */}
      {!audioBuffer || !metadata ? (
        <LandingPage
          resolvedLang={resolvedLang}
          onFileSelected={handleFileSelected}
          onLoadDemo={handleLoadDemo}
        />
      ) : (
        <AudioEditor
          resolvedLang={resolvedLang}
          audioBuffer={audioBuffer}
          metadata={metadata}
          onBack={() => {
            setAudioBuffer(null);
            setMetadata(null);
          }}
          onExport={handleExport}
          onShowToast={showToast}
        />
      )}

      {/* Modal de Exportação */}
      <ExportModal
        isOpen={isExporting}
        title={exportTitle}
        desc={exportDesc}
        progress={exportProgress}
      />

      {/* Container de Toasts */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
