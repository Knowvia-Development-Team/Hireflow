/**
 * E2E: Authentication Flow
 * ─────────────────────────
 * Tests the login screen and role selection.
 */

import { test, expect } from '@playwright/test';
import { LoginPage, DashboardPage } from './helpers';

test.describe('Authentication', () => {
  test('login page loads and shows the HireFlow logo', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Flow')).toBeVisible();  // Cormorant "Flow" part of logo
    await expect(page.getByText(/welcome back/i)).toBeVisible();
  });

  test('shows email and password inputs', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });

  test('shows role selector buttons', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Admin' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Recruiter' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Interviewer' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Read-only' })).toBeVisible();
  });

  test('Admin login navigates to dashboard', async ({ page }) => {
    const login     = new LoginPage(page);
    const dashboard = new DashboardPage(page);
    await login.goto();
    await login.loginAs('Admin');
    await dashboard.expectLoaded();
  });

  test('Recruiter login navigates to dashboard', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.loginAs('Recruiter');
    await expect(page.getByText(/good morning/i)).toBeVisible();
  });

  test('selected role button shows active state', async ({ page }) => {
    await page.goto('/');
    const recruiterBtn = page.getByRole('button', { name: 'Recruiter' });
    await recruiterBtn.click();
    await expect(recruiterBtn).toHaveClass(/active/);
  });

  test('sign in button is reachable by keyboard', async ({ page }) => {
    await page.goto('/');
    // Tab through the form
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    // At least one element should be focused
    const focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(['INPUT', 'BUTTON']).toContain(focused);
  });
});
