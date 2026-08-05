import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'copy';
  title: string;
  message?: string;
  countdown?: number; // In seconds
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full px-4 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
};

const ToastItem: React.FC<{
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}> = ({ toast, onDismiss }) => {
  const [remaining, setRemaining] = useState<number | undefined>(
    toast.countdown
  );

  useEffect(() => {
    if (toast.countdown) {
      const interval = setInterval(() => {
        setRemaining((prev) => {
          if (prev === undefined || prev <= 1) {
            clearInterval(interval);
            onDismiss(toast.id);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    } else {
      const timer = setTimeout(() => {
        onDismiss(toast.id);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast, onDismiss]);

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />;
      case 'copy':
        return <Copy className="w-5 h-5 text-cyan-400 shrink-0" />;
      default:
        return <Info className="w-5 h-5 text-sky-400 shrink-0" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
      className="pointer-events-auto bg-slate-900/95 text-slate-100 border border-slate-700/80 rounded-xl p-4 shadow-2xl backdrop-blur-md flex items-start gap-3"
    >
      {getIcon()}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-slate-100 leading-tight">
          {toast.title}
        </h4>
        {toast.message && (
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            {toast.message}
          </p>
        )}
        {remaining !== undefined && remaining > 0 && (
          <div className="mt-2 flex items-center gap-2">
            <div className="h-1 flex-1 bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-cyan-400"
                initial={{ width: '100%' }}
                animate={{ width: `${(remaining / (toast.countdown || 1)) * 100}%` }}
                transition={{ duration: 1, ease: 'linear' }}
              />
            </div>
            <span className="text-[11px] font-mono text-cyan-300 shrink-0">
              {remaining}s
            </span>
          </div>
        )}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-slate-400 hover:text-slate-200 p-1 rounded-lg transition-colors shrink-0"
        aria-label="Cerrar notificación"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
};
