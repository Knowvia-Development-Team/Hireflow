/**
 * UI Store — Zustand
 * ──────────────────
 * Global UI state only (modals, notifications panel, theme).
 * Server/domain data lives in React Query, not here.
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { ModalId } from '@/types';

interface UiState {
  // Theme
  isDark:     boolean;
  toggleTheme: () => void;

  // Modal
  openModal:  ModalId;
  setModal:   (id: ModalId) => void;
  closeModal: () => void;

  // Notification panel
  notifOpen:     boolean;
  toggleNotif:   () => void;

  // Sidebar collapse (mobile)
  sidebarOpen:   boolean;
  toggleSidebar: () => void;
}

export const useUiStore = create<UiState>()(
  devtools(
    persist(
      (set) => ({
        // Theme — persisted in localStorage
        isDark: false,
        toggleTheme: () => set(s => ({ isDark: !s.isDark }), false, 'toggleTheme'),

        // Modal
        openModal:  null,
        setModal:   (id) => set({ openModal: id },  false, 'setModal'),
        closeModal: ()   => set({ openModal: null }, false, 'closeModal'),

        // Notification panel
        notifOpen:     false,
        toggleNotif: () => set(s => ({ notifOpen: !s.notifOpen }), false, 'toggleNotif'),

        // Sidebar
        sidebarOpen:   true,
        toggleSidebar: () => set(s => ({ sidebarOpen: !s.sidebarOpen }), false, 'toggleSidebar'),
      }),
      {
        name:    'hireflow-ui',
        partialize: (s) => ({ isDark: s.isDark }), // only persist theme
      },
    ),
    { name: 'UiStore' },
  ),
);
