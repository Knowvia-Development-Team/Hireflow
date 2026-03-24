import { get, put, post } from '@/shared/lib/api/client';
import type { AuditEntry } from '@/types';

export interface OrgSettings {
  theme:          'light' | 'dark' | 'system';
  emailNotifs:    boolean;
  slackNotifs:    boolean;
  aiScoring:      boolean;
  autoReject:     boolean;
}

export interface TeamMember {
  id:       string;
  name:     string;
  email:    string;
  role:     string;
  initials: string;
}

export const settingsService = {
  getSettings: async (): Promise<OrgSettings> => {
    try {
      const response = await get<OrgSettings>('/api/settings');
      return response;
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      throw error;
    }
  },

  updateSettings: async (data: Partial<OrgSettings>): Promise<OrgSettings> => {
    try {
      const response = await put<Partial<OrgSettings>, OrgSettings>('/api/settings', data);
      return response;
    } catch (error) {
      console.error('Failed to update settings:', error);
      throw error;
    }
  },

  getAuditLog: async (): Promise<AuditEntry[]> => {
    try {
      const response = await get<AuditEntry[]>('/api/settings/audit');
      return response;
    } catch (error) {
      console.error('Failed to fetch audit log:', error);
      throw error;
    }
  },

  getTeam: async (): Promise<TeamMember[]> => {
    try {
      const response = await get<TeamMember[]>('/api/settings/team');
      return response;
    } catch (error) {
      console.error('Failed to fetch team members:', error);
      throw error;
    }
  },

  inviteMember: async (email: string, role: string): Promise<TeamMember> => {
    try {
      const response = await post<{ email: string; role: string }, TeamMember>('/api/settings/invite', { email, role });
      return response;
    } catch (error) {
      console.error('Failed to invite team member:', error);
      throw error;
    }
  },

  generateApiKey: async (): Promise<{ key: string; name: string }> => {
    try {
      const response = await post<{}, { key: string; name: string }>('/api/settings/api-key', {});
      return response;
    } catch (error) {
      console.error('Failed to generate API key:', error);
      throw error;
    }
  },
};
