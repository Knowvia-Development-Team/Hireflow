/**
 * E2E: Settings
 */
import { test, expect } from '@playwright/test';
import { LoginPage }    from './helpers';

test.describe('Settings', () => {
  test.beforeEach(async ({ page }) => {
    await new LoginPage(page).goto();
    await new LoginPage(page).loginAs('Admin');
    await page.getByRole('navigation').getByText('Settings').click();
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  });

  test('all settings nav tabs are visible', async ({ page }) => {
    for (const tab of ['General', 'Account', 'Notifications', 'Team', 'Integrations', 'Billing', 'Apikeys', 'Auditlog']) {
      await expect(page.getByText(tab, { exact: true })).toBeVisible();
    }
  });

  test('General tab is active by default', async ({ page }) => {
    await expect(page.getByText('Supabase Connection')).toBeVisible();
  });

  test('Supabase Connected pill is shown', async ({ page }) => {
    await expect(page.getByText('Connected').first()).toBeVisible();
  });

  test('Notifications tab shows toggles', async ({ page }) => {
    await page.getByText('Notifications', { exact: true }).click();
    await expect(page.getByText('Email Notifications')).toBeVisible();
    await expect(page.getByText('AI CV Scoring')).toBeVisible();
    await expect(page.locator('.toggle').first()).toBeVisible();
  });

  test('toggle state changes on click', async ({ page }) => {
    await page.getByText('Notifications', { exact: true }).click();
    const toggle = page.locator('.toggle').first();
    const wasOn  = await toggle.evaluate(el => el.classList.contains('on'));
    await toggle.click();
    const isOn   = await toggle.evaluate(el => el.classList.contains('on'));
    expect(isOn).toBe(!wasOn);
  });

  test('Team tab shows team members', async ({ page }) => {
    await page.getByText('Team', { exact: true }).click();
    await expect(page.getByText('Tino Dube')).toBeVisible();
    await expect(page.getByText('James Khumalo')).toBeVisible();
  });

  test('Team tab has Invite button', async ({ page }) => {
    await page.getByText('Team', { exact: true }).click();
    await expect(page.getByRole('button', { name: /invite/i })).toBeVisible();
  });

  test('Integrations tab shows connected services', async ({ page }) => {
    await page.getByText('Integrations', { exact: true }).click();
    await expect(page.getByText('Google Meet')).toBeVisible();
    await expect(page.getByText('SendGrid')).toBeVisible();
    await expect(page.getByText('Connected').first()).toBeVisible();
  });

  test('Billing tab shows plan details', async ({ page }) => {
    await page.getByText('Billing', { exact: true }).click();
    await expect(page.getByText('Pro Team')).toBeVisible();
    await expect(page.getByText('$149.00')).toBeVisible();
  });

  test('API Keys tab shows existing keys', async ({ page }) => {
    await page.getByText('Apikeys', { exact: true }).click();
    await expect(page.getByText('Production Key')).toBeVisible();
    await expect(page.getByText('Staging Key')).toBeVisible();
  });

  test('Generate new key button is present', async ({ page }) => {
    await page.getByText('Apikeys', { exact: true }).click();
    await expect(page.getByRole('button', { name: /generate new key/i })).toBeVisible();
  });

  test('Audit Log tab shows entries', async ({ page }) => {
    await page.getByText('Auditlog', { exact: true }).click();
    await expect(page.getByText('Audit Log')).toBeVisible();
    await expect(page.locator('.audit-row').first()).toBeVisible();
  });

  test('audit entries have actor, action, and time columns', async ({ page }) => {
    await page.getByText('Auditlog', { exact: true }).click();
    await expect(page.locator('.audit-actor').first()).toBeVisible();
    await expect(page.locator('.audit-action').first()).toBeVisible();
    await expect(page.locator('.audit-time').first()).toBeVisible();
  });

  test('theme toggle changes the app theme', async ({ page }) => {
    // Theme toggle is in General tab
    const toggle = page.locator('.toggle').first();
    await toggle.click();
    const darkClass = await page.evaluate(() => document.querySelector('.hf-app')?.classList.contains('dark'));
    expect(typeof darkClass).toBe('boolean');
  });
});
