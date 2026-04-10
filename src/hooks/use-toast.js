import { useState, useCallback } from 'react';

let toastCount = 0;
const listeners = [];

function genId() {
  toastCount = (toastCount + 1) % Number.MAX_SAFE_INTEGER;
  return toastCount.toString();
}

export function toast({ title, description, variant = 'default', duration = 5000 }) {
  const id = genId();
  const newToast = { id, title, description, variant, open: true };
  listeners.forEach((listener) => listener(newToast));
  
  if (duration > 0) {
    setTimeout(() => {
      listeners.forEach((listener) => listener({ ...newToast, open: false }));
    }, duration);
  }
  
  return { id, dismiss: () => listeners.forEach((l) => l({ ...newToast, open: false })) };
}

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((newToast) => {
    setToasts((prev) => {
      if (!newToast.open) {
        return prev.filter((t) => t.id !== newToast.id);
      }
      const exists = prev.find((t) => t.id === newToast.id);
      if (exists) return prev;
      return [...prev, newToast].slice(-5);
    });
  }, []);

  useState(() => {
    listeners.push(addToast);
    return () => {
      const index = listeners.indexOf(addToast);
      if (index > -1) listeners.splice(index, 1);
    };
  });

  return { toasts, toast };
}
