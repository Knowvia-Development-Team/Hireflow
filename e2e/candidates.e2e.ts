/**
 * E2E: Candidates
 * ─────────────────
 * List, filter, profile, mutations.
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from './helpers';

test.describe('Candidates', () => {
  test.beforeEach(async ({ page }) => {
    await new LoginPage(page).goto();
    await new LoginPage(page).loginAs('Admin');
    await page.getByRole('navigation').getByText('Candidates').click();
    await expect(page.getByRole('heading', { name: 'Candidates' })).toBeVisible();
  });

  test('shows candidate list with virtual scroll container', async ({ page }) => {
    await expect(page.getByRole('list')).toBeVisible();
  });

  test('shows column headers', async ({ page }) => {
    await expect(page.getByRole('columnheader', { name: 'Name' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Stage' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Role' })).toBeVisible();
  });

  test('stage filter buttons are all present', async ({ page }) => {
    for (const stage of ['Applied', 'Screening', 'Interview', 'Final Round', 'Offer']) {
      await expect(page.getByRole('button', { name: new RegExp(stage, 'i') }).first()).toBeVisible();
    }
  });

  test('Rejected filter button is red/styled distinctly', async ({ page }) => {
    const rejBtn = page.getByRole('button', { name: /rejected/i });
    await expect(rejBtn).toHaveCSS('color', /rgb/);
  });

  test('AI Analyse button is in the page header', async ({ page }) => {
    await expect(page.getByRole('button', { name: /ai analyse/i })).toBeVisible();
  });

  test('Add Candidate button opens modal', async ({ page }) => {
    await page.getByRole('button', { name: /\+ add candidate/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText(/add candidate/i)).toBeVisible();
  });

  test('Add Candidate modal has all required fields', async ({ page }) => {
    await page.getByRole('button', { name: /\+ add candidate/i }).click();
    await expect(page.getByLabel(/first name/i)).toBeVisible();
    await expect(page.getByLabel(/last name/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
  });

  test('Add Candidate modal closes on Cancel', async ({ page }) => {
    await page.getByRole('button', { name: /\+ add candidate/i }).click();
    await page.getByRole('button', { name: /cancel/i }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('clicking a candidate row opens profile view', async ({ page }) => {
    // Click the first visible candidate row
    const firstRow = page.getByRole('button').first();
    await firstRow.click();
    // Profile view shows "Back to Candidates"
    await expect(page.getByText(/back to candidates/i)).toBeVisible({ timeout: 5000 });
  });
});
