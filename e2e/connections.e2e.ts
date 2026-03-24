/**
 * E2E: Connections (Email Inbox)
 */
import { test, expect } from '@playwright/test';
import { LoginPage }    from './helpers';

test.describe('Connections', () => {
  test.beforeEach(async ({ page }) => {
    await new LoginPage(page).goto();
    await new LoginPage(page).loginAs('Admin');
    await page.getByRole('navigation').getByText('Connections').click();
    await expect(page.getByRole('heading', { name: 'Connections' })).toBeVisible();
  });

  test('inbox thread list is visible', async ({ page }) => {
    await expect(page.locator('.conn-list')).toBeVisible();
  });

  test('email threads show sender name and subject', async ({ page }) => {
    await expect(page.locator('.ci-name').first()).toBeVisible();
    await expect(page.locator('.ci-subject').first()).toBeVisible();
  });

  test('unread emails have an unread dot indicator', async ({ page }) => {
    await expect(page.locator('.unread-dot').first()).toBeVisible();
  });

  test('clicking a thread shows email content in the reading pane', async ({ page }) => {
    const firstThread = page.locator('.conn-item').first();
    await firstThread.click();
    await expect(page.locator('.email-subject')).toBeVisible();
    await expect(page.locator('.email-body-wrap')).toBeVisible();
  });

  test('email pane shows sender name and address', async ({ page }) => {
    await page.locator('.conn-item').first().click();
    await expect(page.locator('.email-sender-name')).toBeVisible();
    await expect(page.locator('.email-addr')).toBeVisible();
  });

  test('reply compose area is visible', async ({ page }) => {
    await expect(page.locator('.email-compose')).toBeVisible();
    await expect(page.locator('.compose-input')).toBeVisible();
  });

  test('email template buttons are rendered', async ({ page }) => {
    for (const tmpl of ['Reply', 'Offer Letter', 'Rejection', 'Interview Invite']) {
      await expect(page.getByText(tmpl, { exact: true }).first()).toBeVisible();
    }
  });

  test('clicking a template populates the compose area', async ({ page }) => {
    await page.getByText('Offer Letter', { exact: true }).first().click();
    const textarea = page.locator('.compose-input');
    await expect(textarea).not.toBeEmpty();
  });

  test('Send button is present in compose footer', async ({ page }) => {
    await expect(page.getByRole('button', { name: /send →/i })).toBeVisible();
  });

  test('Save draft button is present', async ({ page }) => {
    await expect(page.getByRole('button', { name: /save draft/i })).toBeVisible();
  });

  test('+ Compose button is in the page header', async ({ page }) => {
    await expect(page.getByRole('button', { name: /\+ compose/i })).toBeVisible();
  });

  test('search input is present in thread list', async ({ page }) => {
    await expect(page.locator('.conn-search-input')).toBeVisible();
  });

  test('threads can be switched by clicking different items', async ({ page }) => {
    const threads = page.locator('.conn-item');
    const count   = await threads.count();
    if (count >= 2) {
      await threads.nth(0).click();
      const subject0 = await page.locator('.email-subject').textContent();
      await threads.nth(1).click();
      const subject1 = await page.locator('.email-subject').textContent();
      expect(subject0).not.toBe(subject1);
    }
  });
});
