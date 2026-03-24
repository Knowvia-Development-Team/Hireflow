/**
 * E2E: Interview Schedule
 */
import { test, expect } from '@playwright/test';
import { LoginPage }    from './helpers';

test.describe('Interview Schedule', () => {
  test.beforeEach(async ({ page }) => {
    await new LoginPage(page).goto();
    await new LoginPage(page).loginAs('Admin');
    await page.getByRole('navigation').getByText(/interview schedule/i).click();
    await expect(page.getByRole('heading', { name: 'Schedule' })).toBeVisible();
  });

  test('shows upcoming interview count in subtitle', async ({ page }) => {
    await expect(page.getByText(/upcoming/i)).toBeVisible();
  });

  test('week navigation buttons are present', async ({ page }) => {
    await expect(page.getByRole('button', { name: /prev/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /next/i })).toBeVisible();
  });

  test('current week label is displayed', async ({ page }) => {
    await expect(page.getByText(/week of/i)).toBeVisible();
  });

  test('Grid View / List View toggle works', async ({ page }) => {
    const toggle = page.getByRole('button', { name: /grid view/i });
    await expect(toggle).toBeVisible();
    await toggle.click();
    await expect(page.getByRole('button', { name: /list view/i })).toBeVisible();
    // Toggle back
    await page.getByRole('button', { name: /list view/i }).click();
    await expect(page.getByRole('button', { name: /grid view/i })).toBeVisible();
  });

  test('interview cards show candidate name and time', async ({ page }) => {
    // List view — find at least one sched-cand element
    await expect(page.locator('.sched-cand').first()).toBeVisible();
    await expect(page.locator('.sched-time').first()).toBeVisible();
  });

  test('interview status badges are rendered', async ({ page }) => {
    await expect(page.locator('.int-status-badge').first()).toBeVisible();
  });

  test('+ Schedule Interview button opens modal', async ({ page }) => {
    await page.getByRole('button', { name: /\+ schedule interview/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText(/schedule interview/i)).toBeVisible();
  });

  test('schedule modal has all required fields', async ({ page }) => {
    await page.getByRole('button', { name: /\+ schedule interview/i }).click();
    await expect(page.getByLabel(/candidate/i)).toBeVisible();
    await expect(page.getByLabel(/type/i)).toBeVisible();
    await expect(page.getByLabel(/date/i)).toBeVisible();
    await expect(page.getByLabel(/time/i)).toBeVisible();
    await expect(page.getByLabel(/duration/i)).toBeVisible();
  });

  test('schedule modal closes on Cancel', async ({ page }) => {
    await page.getByRole('button', { name: /\+ schedule interview/i }).click();
    await page.getByRole('button', { name: /cancel/i }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('prev week navigation changes the week label', async ({ page }) => {
    const before = await page.getByText(/week of/i).textContent();
    await page.getByRole('button', { name: /prev/i }).click();
    const after = await page.getByText(/week of/i).textContent();
    expect(after).not.toBe(before);
  });

  test('next week navigation changes the week label', async ({ page }) => {
    const before = await page.getByText(/week of/i).textContent();
    await page.getByRole('button', { name: /next/i }).click();
    const after = await page.getByText(/week of/i).textContent();
    expect(after).not.toBe(before);
  });
});
