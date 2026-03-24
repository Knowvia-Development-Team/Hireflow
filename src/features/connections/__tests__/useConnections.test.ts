import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { type ReactNode }            from 'react';
import { useEmails, useSendEmail, useMarkEmailRead, useUnreadCount } from '../hooks/useConnections';
import { INITIAL_EMAILS }  from '@/data';
import { useToastStore }   from '@/shared/stores/toastStore';

function wrap(qc: QueryClient) {
  return function W({ children }: { children: ReactNode }): JSX.Element {
    return React.createElement(QueryClientProvider, { client: qc }, children);
  };
}

describe('useEmails', () => {
  let qc: QueryClient;
  beforeEach(() => {
    qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  });

  it('returns all initial emails', async () => {
    const { result } = renderHook(() => useEmails(), { wrapper: wrap(qc) });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(INITIAL_EMAILS.length);
  });

  it('each email has required fields', async () => {
    const { result } = renderHook(() => useEmails(), { wrapper: wrap(qc) });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const email = result.current.data?.[0];
    expect(email).toHaveProperty('id');
    expect(email).toHaveProperty('from');
    expect(email).toHaveProperty('subject');
    expect(email).toHaveProperty('unread');
    expect(email).toHaveProperty('body');
  });

  it('has a mix of read and unread emails', async () => {
    const { result } = renderHook(() => useEmails(), { wrapper: wrap(qc) });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const hasUnread = result.current.data?.some(e => e.unread);
    const hasRead   = result.current.data?.some(e => !e.unread);
    expect(hasUnread).toBe(true);
    expect(hasRead).toBe(true);
  });
});

describe('useUnreadCount', () => {
  let qc: QueryClient;
  beforeEach(() => {
    qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  });

  it('returns number of unread emails once data is loaded', async () => {
    const expectedUnread = INITIAL_EMAILS.filter(e => e.unread).length;
    // Render both hooks together so useEmails is populated
    const { result } = renderHook(
      () => ({ count: useUnreadCount(), emails: useEmails() }),
      { wrapper: wrap(qc) },
    );
    await waitFor(() => expect(result.current.emails.isSuccess).toBe(true));
    expect(result.current.count).toBe(expectedUnread);
  });
});

describe('useSendEmail', () => {
  let qc: QueryClient;
  beforeEach(() => {
    qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: 0 } } });
    useToastStore.setState({ toasts: [] });
  });

  it('resolves with a messageId', async () => {
    const { result } = renderHook(() => useSendEmail(), { wrapper: wrap(qc) });
    const res = await result.current.mutateAsync({ to: 'lena@example.com', body: 'Hello!', threadId: 'e1' });
    expect(res.messageId).toMatch(/^msg-/);
    expect(res.delivered).toBe(true);
  });

  it('shows success toast on send', async () => {
    const { result } = renderHook(() => useSendEmail(), { wrapper: wrap(qc) });
    await result.current.mutateAsync({ to: 'user@example.com', body: 'Hi', threadId: 'e2' });
    expect(useToastStore.getState().toasts.some(t => t.title === 'Email Sent')).toBe(true);
  });

  it('rejects and shows warning when body is empty', async () => {
    const { result } = renderHook(() => useSendEmail(), { wrapper: wrap(qc) });
    await expect(result.current.mutateAsync({ to: 'x@y.com', body: '  ', threadId: 'e3' }))
      .rejects.toThrow('Email body cannot be empty');
  });
});

describe('useMarkEmailRead', () => {
  let qc: QueryClient;
  beforeEach(() => {
    qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: 0 } } });
    qc.setQueryData(['emails', 'list'], INITIAL_EMAILS);
  });

  it('optimistically marks email as read in cache', async () => {
    const unreadEmail = INITIAL_EMAILS.find(e => e.unread);
    if (!unreadEmail) return;
    const { result } = renderHook(() => useMarkEmailRead(), { wrapper: wrap(qc) });
    await act(async () => { result.current.mutate(unreadEmail.id); });
    const cached = qc.getQueryData<typeof INITIAL_EMAILS>(['emails', 'list']);
    const updated = cached?.find(e => e.id === unreadEmail.id);
    expect(updated?.unread).toBe(false);
  });
});
