import { describe, it, expect, beforeEach } from 'vitest';
import { useUiStore } from '../uiStore';

describe('useUiStore', () => {
  beforeEach(() => {
    useUiStore.setState({
      isDark: false, openModal: null,
      notifOpen: false, sidebarOpen: true,
    });
  });

  it('starts with isDark=false', () => {
    expect(useUiStore.getState().isDark).toBe(false);
  });

  it('toggleTheme switches isDark', () => {
    useUiStore.getState().toggleTheme();
    expect(useUiStore.getState().isDark).toBe(true);
    useUiStore.getState().toggleTheme();
    expect(useUiStore.getState().isDark).toBe(false);
  });

  it('starts with openModal=null', () => {
    expect(useUiStore.getState().openModal).toBeNull();
  });

  it('setModal stores modal id', () => {
    useUiStore.getState().setModal('new-job');
    expect(useUiStore.getState().openModal).toBe('new-job');
  });

  it('closeModal resets to null', () => {
    useUiStore.getState().setModal('add-cand');
    useUiStore.getState().closeModal();
    expect(useUiStore.getState().openModal).toBeNull();
  });

  it('setModal supports all ModalId values', () => {
    const ids = ['new-job', 'add-cand', 'schedule', 'ai-analyse'] as const;
    ids.forEach(id => {
      useUiStore.getState().setModal(id);
      expect(useUiStore.getState().openModal).toBe(id);
    });
  });

  it('notifOpen starts false', () => {
    expect(useUiStore.getState().notifOpen).toBe(false);
  });

  it('toggleNotif flips notifOpen', () => {
    useUiStore.getState().toggleNotif();
    expect(useUiStore.getState().notifOpen).toBe(true);
    useUiStore.getState().toggleNotif();
    expect(useUiStore.getState().notifOpen).toBe(false);
  });

  it('sidebarOpen starts true', () => {
    expect(useUiStore.getState().sidebarOpen).toBe(true);
  });

  it('toggleSidebar flips sidebarOpen', () => {
    useUiStore.getState().toggleSidebar();
    expect(useUiStore.getState().sidebarOpen).toBe(false);
  });

  it('multiple modals can be set sequentially', () => {
    useUiStore.getState().setModal('new-job');
    useUiStore.getState().setModal('add-cand');
    expect(useUiStore.getState().openModal).toBe('add-cand');
  });
});
