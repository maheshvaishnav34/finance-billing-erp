import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

// Singleton toast event emitter
class ToastEmitter {
  constructor() {
    this.listeners = new Set();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify(toast) {
    this.listeners.forEach((listener) => listener(toast));
  }
}

export const toastEmitter = new ToastEmitter();

// Universal toast helper function callable anywhere
export const toast = {
  success: (message, duration = 3200) => {
    toastEmitter.notify({ id: Date.now() + Math.random(), type: 'success', message, duration });
  },
  error: (message, duration = 4000) => {
    toastEmitter.notify({ id: Date.now() + Math.random(), type: 'error', message, duration });
  },
  warning: (message, duration = 3500) => {
    toastEmitter.notify({ id: Date.now() + Math.random(), type: 'warning', message, duration });
  },
  info: (message, duration = 3200) => {
    toastEmitter.notify({ id: Date.now() + Math.random(), type: 'info', message, duration });
  }
};

// Override window.alert globally so native "localhost:5173 says" modal is completely eliminated
if (typeof window !== 'undefined') {
  window.alert = (message) => {
    if (typeof message === 'string' && (message.toLowerCase().includes('fail') || message.toLowerCase().includes('error'))) {
      toast.error(message);
    } else {
      toast.success(message);
    }
  };
}

const TOAST_ICONS = {
  success: <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />,
  error: <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />,
  warning: <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />,
  info: <Info className="w-4 h-4 text-blue-600 shrink-0" />
};

const TOAST_STYLES = {
  success: { bar: 'bg-emerald-500' },
  error: { bar: 'bg-rose-500' },
  warning: { bar: 'bg-amber-500' },
  info: { bar: 'bg-blue-500' }
};

function ToastItem({ toast: item, onRemove }) {
  const [isClosing, setIsClosing] = useState(false);
  const style = TOAST_STYLES[item.type] || TOAST_STYLES.info;

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => onRemove(item.id), 180);
  };

  useEffect(() => {
    const timer = setTimeout(handleClose, item.duration);
    return () => clearTimeout(timer);
  }, [item.id, item.duration]);

  return (
    <div
      className={`pointer-events-auto w-full max-w-sm rounded-xl border border-slate-200 bg-white p-3.5 shadow-lg shadow-slate-200/60 relative overflow-hidden transition-all duration-200 select-none ${
        isClosing ? 'opacity-0 translate-y-[-4px] scale-95' : 'animate-toastSlideIn'
      }`}
    >
      <div className="flex items-center gap-2.5">
        <div className="shrink-0">{TOAST_ICONS[item.type]}</div>
        <p className="flex-1 text-xs font-semibold text-slate-800 leading-snug">
          {item.message}
        </p>
        <button
          onClick={handleClose}
          className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition-colors shrink-0"
          title="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Clean 2px Timer Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-slate-100 overflow-hidden">
        <div
          className={`h-full ${style.bar}`}
          style={{
            animation: `toastProgress ${item.duration}ms linear forwards`
          }}
        />
      </div>
    </div>
  );
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const unsubscribe = toastEmitter.subscribe((newToast) => {
      setToasts((prev) => [...prev, newToast]);
    });
    return unsubscribe;
  }, []);

  const handleRemove = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (typeof document === 'undefined' || toasts.length === 0) return null;

  return ReactDOM.createPortal(
    <div className="fixed top-5 right-5 z-[999999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onRemove={handleRemove} />
      ))}
    </div>,
    document.body
  );
}
