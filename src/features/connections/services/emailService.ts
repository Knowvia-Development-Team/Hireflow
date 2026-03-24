import { get, post } from '@/shared/lib/api/client';
import type { Email } from '@/types';

export interface SendEmailPayload {
  to:      string;
  subject: string;
  body:    string;
  type:    string;
}

export interface SendEmailResponse {
  messageId: string;
  delivered: boolean;
}

export const emailService = {
  list: (): Promise<Email[]> => get('/emails'),

  send: (payload: SendEmailPayload): Promise<SendEmailResponse> =>
    post('/emails/send', payload),

  markRead: (id: string): Promise<void> =>
    post(`/emails/${id}/read`, {}),
};
