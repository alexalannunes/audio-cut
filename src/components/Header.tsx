import React from 'react';
import { Globe, Activity, ShieldCheck } from 'lucide-react';
import { LanguageChoice, ResolvedLanguage } from '../types/audio';
import { I18N } from '../i18n/translations';

interface HeaderProps {
  currentLangSetting: LanguageChoice;
  resolvedLang: ResolvedLanguage;
  onLanguageChange: (lang: LanguageChoice) => void;
  onLogoClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentLangSetting,
  resolvedLang,
  onLanguageChange,
  onLogoClick,
}) => {
  const t = I18N[resolvedLang];

  return (
    <header className="sticky top-0 z-40 border-b border-[#2c2d36] bg-[#141418]/95 backdrop-blur-md">
      <div className="mx-auto flex h-14 sm:h-16 max-w-7xl items-center justify-between px-3.5 sm:px-6">
        {/* Logo */}
        <div
          onClick={onLogoClick}
          className="flex cursor-pointer items-center gap-2 sm:gap-3 transition-opacity active:opacity-75 select-none"
        >
          <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#1a7cff] to-[#5fa4ff] text-white shadow-md shadow-[#1a7cff]/30 shrink-0">
            <Activity className="h-4 w-4 sm:h-5 sm:w-5 stroke-[2.5]" />
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-base sm:text-lg font-bold tracking-tight text-white">AudioCorte</span>
            <span className="hidden xs:inline-block rounded-full border border-[#1a7cff]/40 bg-[#1a7cff]/15 px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold text-[#70adff]">
              Web
            </span>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Seletor de Idioma */}
          <div className="flex items-center gap-1.5 rounded-lg border border-[#2c2d36] bg-[#23232b] px-2.5 py-1.5 text-xs font-semibold text-[#9ea0ad] transition hover:border-[#3a3b47] hover:text-white">
            <Globe className="h-3.5 w-3.5 text-[#1a7cff] shrink-0" />
            <select
              value={currentLangSetting}
              onChange={(e) => onLanguageChange(e.target.value as LanguageChoice)}
              className="cursor-pointer bg-transparent pr-1 text-xs font-semibold text-white outline-none"
              aria-label="Idioma / Language"
            >
              <option value="auto" className="bg-[#1c1c22] text-[#f1f1f5]">
                {t.langAuto}
              </option>
              <option value="pt" className="bg-[#1c1c22] text-[#f1f1f5]">
                🇧🇷 PT
              </option>
              <option value="en" className="bg-[#1c1c22] text-[#f1f1f5]">
                🇺🇸 EN
              </option>
            </select>
          </div>

          {/* Badge de Privacidade */}
          <div className="flex items-center gap-1.5 rounded-full border border-[#2c2d36] bg-[#23232b] px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-medium text-[#9ea0ad]">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#10b981] opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#10b981]"></span>
            </span>
            <span className="hidden sm:inline">{t.badgePrivacyHeader}</span>
            <span className="sm:hidden font-medium">Local</span>
          </div>
        </div>
      </div>
    </header>
  );
};
