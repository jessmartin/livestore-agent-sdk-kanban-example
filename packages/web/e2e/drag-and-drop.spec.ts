import { test, expect } from '@playwright/test';
import { navigateToApp, addTask, getColumn } from './test-utils';

test.describe('Drag and Drop', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToApp(page);

    // Add test tasks to different columns
    await addTask(page, 'To Do', 'Draggable Task');
    await addTask(page, 'In Progress', 'Progress Task');
  });

  test('should drag task from To Do to In Progress', async ({ page }) => {
    const todoColumn = getColumn(page, 'To Do');
    const inProgressColumn = getColumn(page, 'In Progress');

    // Get the draggable task
    const task = todoColumn.getByText('Draggable Task');
    await expect(task).toBeVisible();

    // Drag the task to In Progress column
    await task.dragTo(inProgressColumn.locator('.task-list'));

    // Wait a bit for the drag operation to complete
    await page.waitForTimeout(1000);

    // Verify task moved to In Progress
    await expect(inProgressColumn.getByText('Draggable Task')).toBeVisible({ timeout: 5000 });
    await expect(todoColumn.getByText('Draggable Task')).not.toBeVisible();
  });

  test('should drag task from In Progress to Done', async ({ page }) => {
    const inProgressColumn = getColumn(page, 'In Progress');
    const doneColumn = getColumn(page, 'Done');

    // Get the task
    const task = inProgressColumn.getByText('Progress Task');
    await expect(task).toBeVisible();

    // Drag the task to Done column
    await task.dragTo(doneColumn.locator('.task-list'));

    // Wait for drag operation
    await page.waitForTimeout(1000);

    // Verify task moved to Done
    await expect(doneColumn.getByText('Progress Task')).toBeVisible({ timeout: 5000 });
    await expect(inProgressColumn.getByText('Progress Task')).not.toBeVisible();
  });

  test('should handle dragging task to empty column', async ({ page }) => {
    const todoColumn = getColumn(page, 'To Do');
    const doneColumn = getColumn(page, 'Done');

    // Drag task from To Do to empty Done column
    const task = todoColumn.getByText('Draggable Task');
    await task.dragTo(doneColumn);

    // Wait for drag operation
    await page.waitForTimeout(1000);

    // Verify task moved to Done
    await expect(doneColumn.getByText('Draggable Task')).toBeVisible({ timeout: 5000 });
  });
});