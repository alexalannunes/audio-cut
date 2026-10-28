import { LanguageChoice, ResolvedLanguage } from '../types/audio';

export const I18N = {
  pt: {
    appTitle: 'Cortador de Áudio Web — Corte áudios 100% no navegador',
    badgePrivacyHeader: '100% no Navegador',
    saveHtmlBtn: 'Salvar HTML Offline',
    saveHtmlToast: 'Aplicativo salvo como arquivo HTML autônomo!',
    langAuto: 'Auto (Navegador)',
    langPt: 'Português (BR)',
    langEn: 'English (US)',

    // Landing Page
    heroTag: 'Sem Upload • Sem Servidor • Processamento Local',
    heroTitlePrefix: 'Corte áudios ',
    heroTitleAccent: 'direto no navegador.',
    heroSubtitle: 'Seus arquivos nunca saem do seu computador. Rápido, privado, com precisão milimétrica e sem limite de tamanho.',
    btnSelectAudio: 'Selecionar áudio',
    dropzoneHint: 'ou arraste e solte o arquivo aqui',
    demoAudioPrompt: 'Não tem um arquivo em mãos?',
    demoAudioLink: 'Experimentar com áudio demo sintetizado',
    howItWorksTitle: 'Como funciona',
    howItWorksSubtitle: 'Edite e corte faixas em 3 passos simples',
    step1Title: '1. Escolha seu áudio',
    step1Desc: 'Selecione ou solte qualquer formato de áudio. O arquivo é decodificado diretamente na memória do seu navegador pela Web Audio API.',
    step2Title: '2. Arraste a seleção',
    step2Desc: 'Ajuste as alças amarelas sobre o trecho desejado. Escolha entre Excluir (remover parte) ou Extrair (isolar trecho).',
    step3Title: '3. Exporte no formato que preferir',
    step3Desc: 'Escolha WAV, MP3 ou OGG. O corte aplica atenuação cruzada para evitar cliques indesejados e baixa instantaneamente.',
    formatsTitle: 'Formatos Aceitos',
    formatsDesc: 'Decodificação nativa para todos os formatos comuns. Você pode exportar seu áudio em alta fidelidade WAV sem perdas, MP3 compatível universal ou OGG/Opus.',
    privacyTitle: 'Privacidade Absoluta',
    privacyDescPrefix: 'Ao contrário de outros serviços online, aqui o seu arquivo ',
    privacyDescBold: 'nunca é enviado para a internet',
    privacyDescSuffix: '. Não há servidores, bancos de dados nem logs. O áudio fica somente na memória RAM do seu próprio navegador.',
    privacyBadge: 'Zero tráfego de dados do áudio na rede',
    footerTextPrefix: 'AudioCorte Web — Processamento 100% no navegador via Web Audio API. Seus arquivos nunca saem da sua máquina.',
    footerSubtext: 'Sem servidores • Sem upload • Sem limites',

    // Editor
    btnBackTitle: 'Voltar para a página inicial',
    shortcutHint: 'Reproduzir / Pausar',
    btnPlayTitle: 'Reproduzir / Pausar (Espaço)',
    btnRewindTitle: 'Voltar ao início',
    handleLeftTitle: 'Arrastar início',
    handleRightTitle: 'Arrastar fim',
    cutModeTitle: 'Modo de Corte',
    modeExcludeLabel: 'Excluir Selecionado',
    modeExcludeSub: 'Remove o trecho marcado e une as partes restantes.',
    modeExtractLabel: 'Extrair Selecionado',
    modeExtractSub: 'Mantém apenas o trecho marcado e remove o resto.',
    timeSectionLabel: 'Cortar a partir de, segundo:',
    timeStartLabel: 'Início',
    timeEndLabel: 'Fim',
    crossfadeLabel: 'Atenuação cruzada',
    crossfadeDesc: 'Suavização de ~50 ms na junção do corte para eliminar cliques e estalos abruptos.',
    outputPreviewLabel: 'Saída final —',
    formatLabel: 'Formato:',
    btnExport: 'Exportar',
    channelsMono: 'Mono',
    channelsStereo: 'Estéreo',

    // Modals e Toasts
    modalExportTitle: 'Exportando áudio...',
    modalExportDesc: 'Processando corte e codificando arquivo.',
    modalCutting: 'Cortando trecho de áudio com atenuação...',
    modalGenWav: 'Gerando arquivo WAV PCM 16-bit...',
    modalInitMp3: 'Inicializando codificador MP3 (lamejs)...',
    modalEncodingMp3: 'Codificando MP3: ',
    modalRecordOgg: 'Gravando fluxo OGG/Opus em tempo real...',
    modalDone: 'Concluído!',
    toastLoading: 'Carregando ',
    toastDecodeError: 'Não foi possível decodificar este arquivo de áudio. Certifique-se de que o formato é suportado e o arquivo não está corrompido.',
    toastDemoLoaded: 'Áudio de demonstração carregado com sucesso!',
    toastInvalidTimeFormat: 'Formato de tempo inválido. Use mm:ss.cc (ex: 00:04.50)',
    toastInvalidTimeRange: 'O início deve ser menor que o fim e ambos dentro da duração do áudio.',
    toastDownloadSuccess: 'Arquivo "{filename}" baixado com sucesso!',
    toastExportError: 'Erro na exportação: ',
    oggUnsupportedOption: 'OGG (Não suportado neste navegador)',
    oggWebmOption: 'OGG / WebM Opus'
  },
  en: {
    appTitle: 'Web Audio Cutter — Cut audio 100% in the browser',
    badgePrivacyHeader: '100% in Browser',
    saveHtmlBtn: 'Save Offline HTML',
    saveHtmlToast: 'App saved as standalone HTML file!',
    langAuto: 'Auto (Browser)',
    langPt: 'Português (BR)',
    langEn: 'English (US)',

    // Landing Page
    heroTag: 'No Upload • No Server • Local Processing',
    heroTitlePrefix: 'Cut audio ',
    heroTitleAccent: 'directly in your browser.',
    heroSubtitle: 'Your files never leave your computer. Fast, private, millisecond-accurate, with no file size limits.',
    btnSelectAudio: 'Select audio',
    dropzoneHint: 'or drag and drop audio file here',
    demoAudioPrompt: "Don't have an audio file right now?",
    demoAudioLink: 'Try with synthesized demo audio',
    howItWorksTitle: 'How it works',
    howItWorksSubtitle: 'Edit and trim audio in 3 simple steps',
    step1Title: '1. Choose your audio',
    step1Desc: 'Select or drop any audio format. The file is decoded directly in your browser RAM via the Web Audio API.',
    step2Title: '2. Drag the selection',
    step2Desc: 'Adjust the yellow handles over the desired section. Choose between Delete (remove section) or Extract (keep section).',
    step3Title: '3. Export in any format',
    step3Desc: 'Choose WAV, MP3, or OGG. The cut applies crossfading to eliminate audio pops and downloads instantly.',
    formatsTitle: 'Supported Formats',
    formatsDesc: 'Native decoding for all standard formats. Export in lossless high-fidelity WAV, universally compatible MP3, or OGG/Opus.',
    privacyTitle: 'Absolute Privacy',
    privacyDescPrefix: 'Unlike other online tools, your files are ',
    privacyDescBold: 'never sent to the internet',
    privacyDescSuffix: '. There are no servers, no databases, and no logs. Audio stays strictly inside your browser memory.',
    privacyBadge: 'Zero audio data transferred over the network',
    footerTextPrefix: 'AudioCorte Web — 100% in-browser processing via Web Audio API. Your files never leave your machine.',
    footerSubtext: 'No servers • No upload • No limits',

    // Editor
    btnBackTitle: 'Back to home page',
    shortcutHint: 'Play / Pause',
    btnPlayTitle: 'Play / Pause (Space)',
    btnRewindTitle: 'Rewind to start',
    handleLeftTitle: 'Drag start',
    handleRightTitle: 'Drag end',
    cutModeTitle: 'Cut Mode',
    modeExcludeLabel: 'Delete Selected',
    modeExcludeSub: 'Removes the marked portion and joins the remaining audio.',
    modeExtractLabel: 'Extract Selected',
    modeExtractSub: 'Keeps only the marked portion and discards the rest.',
    timeSectionLabel: 'Cut from, second:',
    timeStartLabel: 'Start',
    timeEndLabel: 'End',
    crossfadeLabel: 'Crossfade',
    crossfadeDesc: 'Smooth ~50 ms transition at the cut junction to eliminate clicks and pops.',
    outputPreviewLabel: 'Final output —',
    formatLabel: 'Format:',
    btnExport: 'Export',
    channelsMono: 'Mono',
    channelsStereo: 'Stereo',

    // Modals and Toasts
    modalExportTitle: 'Exporting audio...',
    modalExportDesc: 'Processing cut and encoding file.',
    modalCutting: 'Trimming audio section with crossfade...',
    modalGenWav: 'Generating 16-bit PCM WAV file...',
    modalInitMp3: 'Initializing MP3 encoder (lamejs)...',
    modalEncodingMp3: 'Encoding MP3: ',
    modalRecordOgg: 'Recording real-time OGG/Opus stream...',
    modalDone: 'Completed!',
    toastLoading: 'Loading ',
    toastDecodeError: 'Could not decode this audio file. Please ensure the format is supported and the file is not corrupted.',
    toastDemoLoaded: 'Demo audio loaded successfully!',
    toastInvalidTimeFormat: 'Invalid time format. Use mm:ss.cc (e.g. 00:04.50)',
    toastInvalidTimeRange: 'Start must be less than end, and both must be within audio duration.',
    toastDownloadSuccess: 'File "{filename}" downloaded successfully!',
    toastExportError: 'Export error: ',
    oggUnsupportedOption: 'OGG (Not supported in this browser)',
    oggWebmOption: 'OGG / WebM Opus'
  }
};

export function detectBrowserLanguage(): ResolvedLanguage {
  if (typeof navigator === 'undefined') return 'pt';
  const navLang = (navigator.language || (navigator as any).userLanguage || 'pt').toLowerCase();
  return navLang.startsWith('pt') ? 'pt' : 'en';
}

export function getSavedLanguagePreference(): LanguageChoice {
  if (typeof localStorage === 'undefined') return 'auto';
  const saved = localStorage.getItem('audiocorte_lang');
  if (saved === 'pt' || saved === 'en' || saved === 'auto') {
    return saved;
  }
  return 'auto';
}

export function resolveLanguage(choice: LanguageChoice): ResolvedLanguage {
  if (choice === 'auto') {
    return detectBrowserLanguage();
  }
  return choice;
}
