import { apiClient } from '@/shared/lib/api/client';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Recruiter' | 'Interviewer' | 'Read-only';
}

interface LoginResponse {
  success: true;
  data: {
    user: AuthUser;
    accessToken: string;
  };
}

interface MeResponse {
  success: true;
  data: AuthUser;
}

export const authService = {
  login: async (email: string, password: string): Promise<{ user: AuthUser; accessToken: string }> => {
    const res = await apiClient.post<LoginResponse>('/api/auth/login', { email, password });
    return { user: res.data.user, accessToken: res.data.accessToken };
  },
  refresh: async (): Promise<string | null> => {
    const res = await apiClient.post<{ success: true; data: { accessToken: string } }>('/api/auth/refresh', {});
    return res.data.accessToken;
  },
  me: async (): Promise<AuthUser> => {
    const res = await apiClient.get<MeResponse>('/api/auth/me');
    return res.data;
  },
  logout: async (): Promise<void> => {
    await apiClient.post('/api/auth/logout', {});
  },
};
