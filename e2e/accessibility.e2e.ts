/**
 * E2E: Accessibility (WCAG 2.1 AA)
 * ──────────────────────────────────
 * Runs axe-core on every major view.
 * Fails CI if any WCAG 2.1 AA violations are found.
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { LoginPage } from './helpers';

test.describe('Accessibility: Login page', () => {
  test('login page has no critical axe violations', async ({ page }) => {
    await page.goto('/');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });
});

test.describe('Accessibility: Authenticated views', () => {
  test.beforeEach(async ({ page }) => {
    await new LoginPage(page).goto();
    await new LoginPage(page).loginAs('Admin');
  });

  test('Dashboard has no critical axe violations', async ({ page }) => {
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .exclude('.toast-container')   // toasts are transient — skip
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test('Candidates page has no critical axe violations', async ({ page }) => {
    await page.getByRole('navigation').getByText('Candidates').click();
    await expect(page.getByRole('heading', { name: /candidates/i })).toBeVisible();
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test('Jobs page has no critical axe violations', async ({ page }) => {
    await page.getByRole('navigation').getByText('Jobs').click();
    await expect(page.getByRole('heading', { name: /jobs board/i })).toBeVisible();
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test('Settings page has no critical axe violations', async ({ page }) => {
    await page.getByRole('navigation').getByText('Settings').click();
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test('Post Job modal has no critical axe violations', async ({ page }) => {
    await page.getByRole('navigation').getByText('Jobs').click();
    await page.getByRole('button', { name: /\+ post job/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .include('[role="dialog"]')   // scope to just the modal
      .analyze();
    expect(results.violations).toEqual([]);
  });
});
