import React from 'react';
import { Download, Loader2 } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  title: string;
  desc: string;
  progress: number;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  title,
  desc,
  progress,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a0e]/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl border border-[#2c2d36] bg-[#1c1c22] p-8 text-center shadow-2xl">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1a7cff]/15 text-[#1a7cff]">
          {progress < 100 ? (
            <Loader2 className="h-7 w-7 animate-spin" />
          ) : (
            <Download className="h-7 w-7" />
          )}
        </div>

        <h3 className="mb-2 text-xl font-bold text-white">{title}</h3>
        <p className="mb-6 text-sm text-[#9ea0ad] min-h-[20px]">{desc}</p>

        {/* Barra de Progresso */}
        <div className="mb-2.5 h-2 w-full overflow-hidden rounded-full bg-[#23232b]">
          <div
            style={{ width: `${progress}%` }}
            className="h-full rounded-full bg-gradient-to-r from-[#1a7cff] to-[#60a5fa] transition-all duration-200"
          />
        </div>

        <div className="font-mono text-xs font-semibold text-[#9ea0ad]">{progress}%</div>
      </div>
    </div>
  );
};
