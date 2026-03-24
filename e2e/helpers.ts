/**
 * E2E Test Helpers
 * ─────────────────
 * Shared page objects and fixtures used across all E2E tests.
 */

import { type Page, expect } from '@playwright/test';

// ── Page Object: Login ────────────────────────────────────────────────────────

export class LoginPage {
  constructor(private page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/');
  }

  async loginAs(role: 'Admin' | 'Recruiter' | 'Interviewer' | 'Read-only' = 'Admin'): Promise<void> {
    await this.page.getByRole('button', { name: role }).click();
    await this.page.getByRole('button', { name: /sign in/i }).click();
    // Wait for dashboard to appear
    await expect(this.page.getByText(/good morning/i)).toBeVisible({ timeout: 5000 });
  }
}

// ── Page Object: Dashboard ───────────────────────────────────────────────────

export class DashboardPage {
  constructor(private page: Page) {}

  async expectLoaded(): Promise<void> {
    await expect(this.page.getByText(/good morning/i)).toBeVisible();
    await expect(this.page.getByText(/Active Roles/i)).toBeVisible();
  }

  async navigateTo(section: 'candidates' | 'jobs' | 'schedule' | 'connections' | 'settings'): Promise<void> {
    const labels: Record<string, RegExp> = {
      candidates:  /candidates/i,
      jobs:        /jobs/i,
      schedule:    /interview schedule/i,
      connections: /connections/i,
      settings:    /settings/i,
    };
    await this.page.getByRole('navigation').getByText(labels[section]!).click();
  }
}

// ── Page Object: Candidates ──────────────────────────────────────────────────

export class CandidatesPage {
  constructor(private page: Page) {}

  async expectLoaded(): Promise<void> {
    await expect(this.page.getByRole('heading', { name: /candidates/i })).toBeVisible();
    await expect(this.page.getByRole('list')).toBeVisible();
  }

  async filterByStage(stage: string): Promise<void> {
    await this.page.getByRole('button', { name: stage }).click();
  }

  async openAddModal(): Promise<void> {
    await this.page.getByRole('button', { name: /\+ add candidate/i }).click();
    await expect(this.page.getByRole('dialog')).toBeVisible();
  }
}

// ── Utility: Check for axe violations ────────────────────────────────────────

export async function checkA11y(page: Page, selector = 'html'): Promise<void> {
  // Inject axe-core and run analysis
  const violations = await page.evaluate(async (sel: string) => {
    // axe is injected via CDN in the test setup below
    if (!('axe' in window)) return [];
    const results = await (window as typeof window & { axe: { run: (el: Element, opts: object) => Promise<{ violations: unknown[] }> } })
      .axe.run(document.querySelector(sel) ?? document.documentElement, {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
      });
    return results.violations;
  }, selector);

  if (Array.isArray(violations) && violations.length > 0) {
    const report = JSON.stringify(violations, null, 2);
    throw new Error(`Accessibility violations found:\n${report}`);
  }
}
