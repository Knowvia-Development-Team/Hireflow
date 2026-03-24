/**
 * E2E: Jobs Board
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from './helpers';

test.describe('Jobs', () => {
  test.beforeEach(async ({ page }) => {
    await new LoginPage(page).goto();
    await new LoginPage(page).loginAs('Admin');
    await page.getByRole('navigation').getByText('Jobs').click();
    await expect(page.getByRole('heading', { name: /jobs board/i })).toBeVisible();
  });

  test('jobs table renders with headers', async ({ page }) => {
    for (const h of ['Title', 'Department', 'Type', 'Location', 'Status', 'Applicants']) {
      await expect(page.getByRole('columnheader', { name: h })).toBeVisible();
    }
  });

  test('shows job status pills', async ({ page }) => {
    await expect(page.locator('.pill-open').first()).toBeVisible();
  });

  test('Post Job button opens modal', async ({ page }) => {
    await page.getByRole('button', { name: /\+ post job/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText(/post a new job/i)).toBeVisible();
  });

  test('Post Job modal has all required fields', async ({ page }) => {
    await page.getByRole('button', { name: /\+ post job/i }).click();
    await expect(page.getByLabel(/job title/i)).toBeVisible();
    await expect(page.getByLabel(/department/i)).toBeVisible();
    await expect(page.getByLabel(/job description/i)).toBeVisible();
    await expect(page.getByLabel(/required skills/i)).toBeVisible();
  });

  test('can fill in and submit the new job form', async ({ page }) => {
    await page.getByRole('button', { name: /\+ post job/i }).click();
    await page.getByLabel(/job title/i).fill('Senior TypeScript Engineer');
    await page.getByLabel(/job description/i).fill('Build production-grade apps.');
    await page.getByLabel(/required skills/i).fill('TypeScript, React, Node.js');
    await page.getByRole('button', { name: /post job/i }).last().click();
    // Toast should appear
    await expect(page.getByText(/job published/i)).toBeVisible({ timeout: 5000 });
  });

  test('Draft jobs show Publish button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /publish/i }).first()).toBeVisible();
  });

  test('Paused jobs show Resume button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /resume/i }).first()).toBeVisible();
  });
});
