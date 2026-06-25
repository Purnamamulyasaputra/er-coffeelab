import React from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Trash2, 
  X, 
  Info
} from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  type: 'success' | 'warning' | 'danger' | 'info';
  title: string;
  message: React.ReactNode;
  confirmText: string;
  cancelText?: string;
}

export function ConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  type, 
  title, 
  message, 
  confirmText, 
  cancelText = "Batal" 
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  // Konfigurasi style berdasarkan tipe modal
  const theme = {
    success: {
      icon: <CheckCircle2 size={32} className="text-emerald-500" />,
      iconBg: 'bg-emerald-500/10',
      iconBorder: 'border-emerald-500/20',
      buttonBg: 'bg-emerald-600 hover:bg-emerald-500',
      buttonText: 'text-white',
      glow: 'shadow-[0_0_30px_rgba(16,185,129,0.2)]'
    },
    warning: {
      icon: <AlertTriangle size={32} className="text-amber-500" />,
      iconBg: 'bg-amber-500/10',
      iconBorder: 'border-amber-500/20',
      buttonBg: 'bg-amber-500 hover:bg-amber-400',
      buttonText: 'text-gray-900 font-bold',
      glow: 'shadow-[0_0_30px_rgba(245,158,11,0.2)]'
    },
    danger: {
      icon: <Trash2 size={32} className="text-rose-500" />,
      iconBg: 'bg-rose-500/10',
      iconBorder: 'border-rose-500/20',
      buttonBg: 'bg-rose-600 hover:bg-rose-500',
      buttonText: 'text-white',
      glow: 'shadow-[0_0_30px_rgba(244,63,94,0.2)]'
    },
    info: {
      icon: <Info size={32} className="text-indigo-500" />,
      iconBg: 'bg-indigo-500/10',
      iconBorder: 'border-indigo-500/20',
      buttonBg: 'bg-indigo-600 hover:bg-indigo-500',
      buttonText: 'text-white',
      glow: 'shadow-[0_0_30px_rgba(99,102,241,0.2)]'
    }
  };

  const currentTheme = theme[type] || theme.info;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop (Hitam transparan dengan efek blur) */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Kontainer Modal */}
      <div 
        className={`relative w-full max-w-md bg-background border border-border rounded-3xl p-6 sm:p-8 flex flex-col items-center text-center transform transition-all animate-in fade-in zoom-in duration-200 ${currentTheme.glow}`}
        role="dialog"
        aria-modal="true"
      >
        {/* Tombol Tutup (X) di pojok kanan atas */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-full transition-colors cursor-pointer z-10"
        >
          <X size={20} />
        </button>

        <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 border-8 ${currentTheme.iconBg} ${currentTheme.iconBorder}`}>
          <div>
            {currentTheme.icon}
          </div>
        </div>

        {/* Teks Konten */}
        <h2 className="text-2xl font-bold text-foreground mb-3">{title}</h2>
        {message && (
          <div className="text-muted-foreground text-sm leading-relaxed mb-8 px-2 w-full">
            {message}
          </div>
        )}

        {/* Grup Tombol Aksi */}
        <div className="flex flex-col-reverse sm:flex-row w-full gap-3 sm:gap-4">
          <button 
            onClick={onClose}
            className="flex-1 px-6 py-3 rounded-xl text-sm font-semibold text-secondary-foreground bg-secondary hover:bg-secondary/80 border border-border transition-all duration-200 cursor-pointer"
          >
            {cancelText}
          </button>
          <button 
            onClick={onConfirm}
            className={`flex-1 px-6 py-3 rounded-xl text-sm transition-all duration-200 border border-transparent hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${currentTheme.buttonBg} ${currentTheme.buttonText}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
