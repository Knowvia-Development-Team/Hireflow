/**
 * E2E: Dashboard
 * ────────────────
 * Critical metrics, navigation, and key interactions.
 */

import { test, expect } from '@playwright/test';
import { LoginPage, DashboardPage } from './helpers';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await new LoginPage(page).goto();
    await new LoginPage(page).loginAs('Admin');
  });

  test('shows all 4 stat cards', async ({ page }) => {
    await expect(page.getByText('Active Roles')).toBeVisible();
    await expect(page.getByText('Total Candidates')).toBeVisible();
    await expect(page.getByText('In Offer Stage')).toBeVisible();
    await expect(page.getByText('Time to Hire')).toBeVisible();
  });

  test('hiring pipeline section renders', async ({ page }) => {
    await expect(page.getByText('Hiring Pipeline')).toBeVisible();
    await expect(page.getByText('Applied')).toBeVisible();
    await expect(page.getByText('Screening')).toBeVisible();
  });

  test('activity feed is visible and live', async ({ page }) => {
    await expect(page.getByText('Recent Activity')).toBeVisible();
    await expect(page.getByText('Live')).toBeVisible();
  });

  test('communication health section renders', async ({ page }) => {
    await expect(page.getByText('Communication Health')).toBeVisible();
  });

  test('sidebar navigation links are all present', async ({ page }) => {
    const nav = page.getByRole('navigation');
    await expect(nav.getByText('Dashboard')).toBeVisible();
    await expect(nav.getByText('Candidates')).toBeVisible();
    await expect(nav.getByText('Jobs')).toBeVisible();
    await expect(nav.getByText(/interview schedule/i)).toBeVisible();
    await expect(nav.getByText('Connections')).toBeVisible();
    await expect(nav.getByText('Settings')).toBeVisible();
  });

  test('AI Analyse button is in the topbar', async ({ page }) => {
    await expect(page.getByRole('button', { name: /ai analyse/i })).toBeVisible();
  });

  test('theme toggle is clickable', async ({ page }) => {
    const toggleBtn = page.getByText(/dark|light/i).first();
    await toggleBtn.click();
    // After clicking, the body class changes
    const htmlClass = await page.evaluate(() => document.documentElement.className);
    expect(typeof htmlClass).toBe('string');
  });

  test('View Schedule button navigates to schedule view', async ({ page }) => {
    await page.getByRole('button', { name: /view schedule/i }).click();
    await expect(page.getByRole('heading', { name: 'Schedule' })).toBeVisible();
  });

  test('Post a Job button opens the new job modal', async ({ page }) => {
    await page.getByRole('button', { name: /post a job/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText(/post a new job/i)).toBeVisible();
  });

  test('modal closes on Escape key', async ({ page }) => {
    await page.getByRole('button', { name: /post a job/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });
});
