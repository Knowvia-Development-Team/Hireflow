/**
 * Toast Store — Zustand
 * ─────────────────────
 * Decoupled from React component tree.
 * Can be called from services, stores, and components alike.
 */

import { create } from 'zustand';
import type { Toast, ToastColor } from '@/types';

interface ToastState {
  toasts: Toast[];
  addToast:    (title: string, msg: string, color?: ToastColor) => void;
  removeToast: (id: number) => void;
  markLeaving: (id: number) => void;
}

let nextId = 1;

export const useToastStore = create<ToastState>()((set) => ({
  toasts: [],

  addToast: (title, msg, color = 'blue') => {
    const id = nextId++;
    set(s => ({ toasts: [...s.toasts, { id, title, msg, color, leaving: false }] }));

    // Begin exit animation then remove
    setTimeout(() => {
      set(s => ({ toasts: s.toasts.map(t => t.id === id ? { ...t, leaving: true } : t) }));
    }, 3500);
    setTimeout(() => {
      set(s => ({ toasts: s.toasts.filter(t => t.id !== id) }));
    }, 3800);
  },

  removeToast: (id) =>
    set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),

  markLeaving: (id) =>
    set(s => ({ toasts: s.toasts.map(t => t.id === id ? { ...t, leaving: true } : t) })),
}));

/** Imperative helper — call anywhere without hooks */
export const toast = {
  success: (title: string, msg = '') => useToastStore.getState().addToast(title, msg, 'green'),
  info:    (title: string, msg = '') => useToastStore.getState().addToast(title, msg, 'blue'),
  warning: (title: string, msg = '') => useToastStore.getState().addToast(title, msg, 'amber'),
};
