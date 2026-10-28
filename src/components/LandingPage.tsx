import React, { useRef, useState } from 'react';
import {
  Upload,
  Music,
  Scissors,
  Download,
  ShieldCheck,
  Sparkles,
  FileAudio,
  Lock,
} from 'lucide-react';
import { ResolvedLanguage } from '../types/audio';
import { I18N } from '../i18n/translations';

interface LandingPageProps {
  resolvedLang: ResolvedLanguage;
  onFileSelected: (file: File) => void;
  onLoadDemo: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  resolvedLang,
  onFileSelected,
  onLoadDemo,
}) => {
  const t = I18N[resolvedLang];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelected(e.target.files[0]);
    }
  };

  const formats = ['MP3', 'WAV', 'OGG', 'M4A', 'AAC', 'FLAC', 'WEBM'];

  return (
    <div className="flex flex-1 flex-col pb-16">
      <div className="mx-auto w-full max-w-5xl px-3.5 sm:px-6">
        {/* Hero Section */}
        <section className="py-8 sm:py-16 text-center">
          <div className="mb-4 sm:mb-6 inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-[#f5c518]/30 bg-[#f5c518]/10 px-3 py-1 text-[11px] sm:text-xs font-semibold text-[#f5c518]">
            <Lock className="h-3 w-3 shrink-0" />
            <span>{t.heroTag}</span>
          </div>

          <h1 className="mb-3 text-2xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl leading-tight">
            {t.heroTitlePrefix}
            <span className="bg-gradient-to-r from-[#7ab5ff] to-[#1a7cff] bg-clip-text text-transparent">
              {t.heroTitleAccent}
            </span>
          </h1>

          <p className="mx-auto mb-8 max-w-2xl text-sm leading-relaxed text-[#9ea0ad] sm:text-base md:text-lg">
            {t.heroSubtitle}
          </p>

          {/* Dropzone Container */}
          <div className="mx-auto max-w-2xl">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`group relative cursor-pointer rounded-2xl border-2 border-dashed p-6 sm:p-14 text-center transition-all duration-200 active:scale-[0.99] ${
                isDragOver
                  ? 'border-[#1a7cff] bg-[#1a7cff]/10 scale-[1.01] shadow-2xl shadow-[#1a7cff]/20'
                  : 'border-[#2c2d36] bg-[#1c1c22] hover:border-[#1a7cff] hover:bg-[#1a7cff]/5'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac,.webm"
                onChange={handleFileInputChange}
                className="hidden"
              />

              <div className="mx-auto mb-4 sm:mb-6 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-[#1a7cff]/15 text-[#1a7cff] transition-transform duration-200 group-hover:scale-110">
                <Upload className="h-7 w-7 sm:h-8 sm:w-8 stroke-[2.2]" />
              </div>

              <button
                type="button"
                className="mb-3 w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#1a7cff] px-6 sm:px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-[#1a7cff]/35 transition hover:bg-[#1468dc] active:scale-[0.98] min-h-[48px]"
              >
                <FileAudio className="h-5 w-5 shrink-0" />
                <span>{t.btnSelectAudio}</span>
              </button>

              <p className="mb-4 text-xs sm:text-sm text-[#9ea0ad]">{t.dropzoneHint}</p>

              <div className="flex flex-wrap items-center justify-center gap-1.5 text-[11px] sm:text-xs">
                {formats.map((fmt) => (
                  <span
                    key={fmt}
                    className="rounded border border-[#2c2d36] bg-[#23232b] px-2 py-0.5 font-mono text-[#9ea0ad]"
                  >
                    {fmt}
                  </span>
                ))}
              </div>
            </div>

            {/* Demonstração Sintetizada */}
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-1 text-xs sm:text-sm text-[#676977]">
              <span>{t.demoAudioPrompt}</span>
              <button
                type="button"
                onClick={onLoadDemo}
                className="inline-flex items-center gap-1 text-[#70adff] underline transition hover:text-white font-medium p-1 min-h-[36px]"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>{t.demoAudioLink}</span>
              </button>
            </div>
          </div>
        </section>

        {/* Como funciona */}
        <section className="py-8 sm:py-12 border-t border-[#2c2d36]/50">
          <div className="mb-8 text-center">
            <h2 className="text-xl sm:text-3xl font-bold text-white mb-1.5">{t.howItWorksTitle}</h2>
            <p className="text-xs sm:text-base text-[#9ea0ad]">{t.howItWorksSubtitle}</p>
          </div>

          <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
            {/* Step 1 */}
            <div className="flex flex-col gap-3 rounded-xl border border-[#2c2d36] bg-[#1c1c22] p-5 sm:p-6 transition hover:border-[#3a3b47]">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#23232b] border border-[#2c2d36] text-[#1a7cff]">
                  <Music className="h-5 w-5" />
                </div>
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#1a7cff]/15 text-xs font-bold text-[#70adff]">
                  1
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-white">{t.step1Title}</h3>
              <p className="text-xs sm:text-sm leading-relaxed text-[#9ea0ad]">{t.step1Desc}</p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col gap-3 rounded-xl border border-[#2c2d36] bg-[#1c1c22] p-5 sm:p-6 transition hover:border-[#3a3b47]">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#23232b] border border-[#2c2d36] text-[#f5c518]">
                  <Scissors className="h-5 w-5" />
                </div>
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#f5c518]/15 text-xs font-bold text-[#f5c518]">
                  2
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-white">{t.step2Title}</h3>
              <p className="text-xs sm:text-sm leading-relaxed text-[#9ea0ad]">{t.step2Desc}</p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col gap-3 rounded-xl border border-[#2c2d36] bg-[#1c1c22] p-5 sm:p-6 transition hover:border-[#3a3b47]">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#23232b] border border-[#2c2d36] text-[#10b981]">
                  <Download className="h-5 w-5" />
                </div>
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#10b981]/15 text-xs font-bold text-[#10b981]">
                  3
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-white">{t.step3Title}</h3>
              <p className="text-xs sm:text-sm leading-relaxed text-[#9ea0ad]">{t.step3Desc}</p>
            </div>
          </div>
        </section>

        {/* Informações de Formatos e Privacidade */}
        <section className="mt-2 grid gap-4 sm:gap-6 md:grid-cols-2">
          {/* Formatos */}
          <div className="rounded-xl border border-[#2c2d36] bg-[#1c1c22] p-5 sm:p-7">
            <div className="mb-3 sm:mb-4 flex items-center gap-2.5 sm:gap-3">
              <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-[#f5c518]/15 text-[#f5c518]">
                <FileAudio className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-white">{t.formatsTitle}</h3>
            </div>
            <p className="mb-4 text-xs sm:text-sm leading-relaxed text-[#9ea0ad]">{t.formatsDesc}</p>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {formats.map((fmt) => (
                <span
                  key={fmt}
                  className="rounded-lg border border-[#2c2d36] bg-[#23232b] px-2.5 py-1 font-mono text-[11px] sm:text-xs font-semibold text-white"
                >
                  {fmt}
                </span>
              ))}
            </div>
          </div>

          {/* Privacidade */}
          <div className="rounded-xl border border-[#2c2d36] bg-[#1c1c22] p-5 sm:p-7">
            <div className="mb-3 sm:mb-4 flex items-center gap-2.5 sm:gap-3">
              <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-[#10b981]/15 text-[#10b981]">
                <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-white">{t.privacyTitle}</h3>
            </div>
            <p className="mb-4 text-xs sm:text-sm leading-relaxed text-[#9ea0ad]">
              {t.privacyDescPrefix}
              <strong className="text-white">{t.privacyDescBold}</strong>
              {t.privacyDescSuffix}
            </p>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#10b981]/30 bg-[#10b981]/10 px-3 py-1 text-[11px] sm:text-xs font-medium text-[#10b981]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#10b981]"></span>
              <span>{t.privacyBadge}</span>
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="mt-auto border-t border-[#2c2d36] bg-[#141418] py-6 sm:py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-2 px-4 text-center text-[11px] sm:text-xs text-[#676977] sm:flex-row sm:text-left sm:px-6">
          <p>{t.footerTextPrefix}</p>
          <p>{t.footerSubtext}</p>
        </div>
      </footer>
    </div>
  );
};
