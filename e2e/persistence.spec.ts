import { test, expect } from '@playwright/test';
import { navigateToApp, addTask, getColumn } from './test-utils';

test.describe('Data Persistence', () => {
  test('should persist tasks after page reload', async ({ page }) => {
    await navigateToApp(page);

    // Add tasks to different columns
    await addTask(page, 'To Do', 'Persistent Task 1');
    await addTask(page, 'In Progress', 'Persistent Task 2');
    await addTask(page, 'Done', 'Persistent Task 3');

    // Reload the page
    await page.reload();
    await page.waitForSelector('h1', { timeout: 30000 });

    // Verify all tasks are still present
    await expect(getColumn(page, 'To Do').getByText('Persistent Task 1')).toBeVisible({ timeout: 5000 });
    await expect(getColumn(page, 'In Progress').getByText('Persistent Task 2')).toBeVisible({ timeout: 5000 });
    await expect(getColumn(page, 'Done').getByText('Persistent Task 3')).toBeVisible({ timeout: 5000 });
  });

  test('should persist task edits after reload', async ({ page }) => {
    await navigateToApp(page);

    const todoColumn = getColumn(page, 'To Do');

    // Add a task
    await addTask(page, 'To Do', 'Original Title');

    // Edit the task
    await todoColumn.getByText('✏️').click();
    const titleInput = page.locator('input[type="text"]').first();
    await titleInput.clear();
    await titleInput.fill('Updated Title');

    const descInput = page.locator('textarea').first();
    await descInput.fill('Updated Description');

    await page.getByRole('button', { name: 'Save' }).click();

    // Wait for save to complete
    await page.waitForTimeout(500);

    // Reload the page
    await page.reload();
    await page.waitForSelector('h1', { timeout: 30000 });

    // Verify edited task persists
    await expect(todoColumn.getByText('Updated Title')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Updated Description')).toBeVisible({ timeout: 5000 });
    await expect(todoColumn.getByText('Original Title')).not.toBeVisible();
  });

  test('should persist task deletions after reload', async ({ page }) => {
    await navigateToApp(page);

    const todoColumn = getColumn(page, 'To Do');

    // Add two tasks
    await addTask(page, 'To Do', 'Task to Keep');
    await addTask(page, 'To Do', 'Task to Delete');

    // Delete the second task
    const deleteButtons = await todoColumn.getByText('🗑️').all();
    await deleteButtons[1].click();

    // Wait for deletion to complete
    await page.waitForTimeout(500);

    // Verify deletion
    await expect(todoColumn.getByText('Task to Delete')).not.toBeVisible();
    await expect(todoColumn.getByText('Task to Keep')).toBeVisible();

    // Reload the page
    await page.reload();
    await page.waitForSelector('h1', { timeout: 30000 });

    // Verify deletion persists
    await expect(todoColumn.getByText('Task to Keep')).toBeVisible({ timeout: 5000 });
    await expect(todoColumn.getByText('Task to Delete')).not.toBeVisible();
  });
});