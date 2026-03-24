import { describe, it, expect } from 'vitest';
import { settingsService } from '../services/settingsService';

describe('settingsService', () => {
  it('exports getSettings, updateSettings, getAuditLog, getTeam', () => {
    expect(typeof settingsService.getSettings).toBe('function');
    expect(typeof settingsService.updateSettings).toBe('function');
    expect(typeof settingsService.getAuditLog).toBe('function');
    expect(typeof settingsService.getTeam).toBe('function');
    expect(typeof settingsService.generateApiKey).toBe('function');
    expect(typeof settingsService.inviteMember).toBe('function');
  });

  it('getSettings() returns a Promise', () => {
    const p = settingsService.getSettings();
    expect(p).toBeInstanceOf(Promise);
    p.catch(() => undefined);
  });
});
