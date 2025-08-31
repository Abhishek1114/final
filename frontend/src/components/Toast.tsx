import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastProps extends Toast {
  onRemove: (id: string) => void;
}

const ToastComponent: React.FC<ToastProps> = ({ id, type, message, duration = 5000, onRemove }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onRemove]);

  const icons = {
    success: <CheckCircle className="h-5 w-5 text-green-400" />,
    error: <AlertCircle className="h-5 w-5 text-red-400" />,
    info: <AlertCircle className="h-5 w-5 text-blue-400" />,
  };

  const bgColors = {
    success: 'bg-green-900/50 border-green-700',
    error: 'bg-red-900/50 border-red-700',
    info: 'bg-blue-900/50 border-blue-700',
  };

  return (
    <div className={`flex items-start space-x-3 p-4 rounded-xl border backdrop-blur-sm ${bgColors[type]} animate-slide-up`}>
      {icons[type]}
      <div className="flex-1 text-sm text-white">{message}</div>
      <button
        onClick={() => onRemove(id)}
        className="text-gray-400 hover:text-white transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

// Toast container and hook
let toastId = 0;
const toastListeners: Set<(toasts: Toast[]) => void> = new Set();
let toasts: Toast[] = [];

function notifyListeners() {
  toastListeners.forEach(listener => listener([...toasts]));
}

export function addToast(type: ToastType, message: string, duration?: number) {
  const toast: Toast = {
    id: (++toastId).toString(),
    type,
    message,
    duration,
  };
  
  toasts.push(toast);
  notifyListeners();
  
  return toast.id;
}

export function removeToast(id: string) {
  toasts = toasts.filter(toast => toast.id !== id);
  notifyListeners();
}

export function useToasts() {
  const [toastList, setToastList] = useState<Toast[]>([]);

  useEffect(() => {
    toastListeners.add(setToastList);
    return () => {
      toastListeners.delete(setToastList);
    };
  }, []);

  return { toasts: toastList, removeToast };
}

// Toast container component
export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToasts();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {toasts.map((toast) => (
        <ToastComponent
          key={toast.id}
          {...toast}
          onRemove={removeToast}
        />
      ))}
    </div>
  );
};

// Convenience functions
export const toast = {
  success: (message: string, duration?: number) => addToast('success', message, duration),
  error: (message: string, duration?: number) => addToast('error', message, duration),
  info: (message: string, duration?: number) => addToast('info', message, duration),
};