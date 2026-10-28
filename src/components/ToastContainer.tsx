import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { ToastMessage } from '../types/audio';

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-24 right-4 z-50 flex flex-col gap-2.5 pointer-events-none max-w-sm w-full">
      {toasts.map((toast) => {
        const isError = toast.type === 'error';
        const isSuccess = toast.type === 'success';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 rounded-xl border p-3.5 shadow-2xl transition-all duration-300 animate-in slide-in-from-bottom-2 ${
              isError
                ? 'border-red-500/40 bg-[#25181b] text-red-200'
                : isSuccess
                ? 'border-emerald-500/40 bg-[#14241e] text-emerald-200'
                : 'border-[#2c2d36] bg-[#202029] text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {isError ? (
                <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
              ) : isSuccess ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              ) : (
                <Info className="h-4 w-4 text-[#1a7cff] shrink-0" />
              )}
              <span className="text-xs sm:text-sm font-medium leading-tight">{toast.text}</span>
            </div>

            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="text-[#9ea0ad] hover:text-white p-0.5 rounded"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
