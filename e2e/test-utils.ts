import { Page, expect } from '@playwright/test';

/**
 * Wait for LiveStore to be ready by checking if the app has loaded
 * and is no longer showing a loading state
 */
export async function waitForLiveStoreReady(page: Page) {
  // Wait for the main heading to be visible (indicates app has loaded)
  await page.waitForSelector('h1', { timeout: 30000 });

  // Give LiveStore a moment to initialize
  await page.waitForTimeout(500);
}

/**
 * Navigate to the app and wait for it to be ready
 */
export async function navigateToApp(page: Page) {
  await page.goto('/');
  await waitForLiveStoreReady(page);
}

/**
 * Check if the app is still loading (can happen in CI environments)
 */
export async function isAppLoading(page: Page): Promise<boolean> {
  const loadingIndicator = page.locator('text=/loading/i').first();
  return await loadingIndicator.isVisible().catch(() => false);
}

/**
 * Add a task to a specific column
 */
export async function addTask(page: Page, columnName: string, taskTitle: string) {
  const column = page.locator('.kanban-column').filter({ hasText: columnName });
  await column.getByText('+ Add Task').click();

  await page.getByPlaceholder('Task title').fill(taskTitle);
  // Use exact match to avoid matching the "+ Add Task" buttons
  await page.getByRole('button', { name: 'Add Task', exact: true }).click();

  // Wait for the task to appear
  await expect(column.getByText(taskTitle)).toBeVisible({ timeout: 5000 });
}

/**
 * Get a specific column by name
 */
export function getColumn(page: Page, columnName: string) {
  return page.locator('.kanban-column').filter({ hasText: columnName });
}

/**
 * Wait for modal to be visible
 */
export async function waitForModal(page: Page, modalTitle: string) {
  await expect(page.getByText(modalTitle)).toBeVisible({ timeout: 5000 });
}

/**
 * Close modal by clicking cancel
 */
export async function closeModal(page: Page) {
  await page.getByRole('button', { name: 'Cancel' }).click();
}