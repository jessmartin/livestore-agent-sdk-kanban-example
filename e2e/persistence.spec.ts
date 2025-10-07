import { test, expect } from '@playwright/test';

test.describe('Data Persistence', () => {
  test('should persist tasks after page reload', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Add tasks to different columns
    const todoColumn = page.locator('.kanban-column').filter({ hasText: 'To Do' });
    const inProgressColumn = page.locator('.kanban-column').filter({ hasText: 'In Progress' });
    const doneColumn = page.locator('.kanban-column').filter({ hasText: 'Done' });

    // Add task to To Do
    await todoColumn.getByText('+ Add Task').click();
    await page.getByPlaceholder('Task title').fill('Persistent Task 1');
    await page.getByRole('button', { name: 'Add Task' }).click();

    // Add task to In Progress
    await inProgressColumn.getByText('+ Add Task').click();
    await page.getByPlaceholder('Task title').fill('Persistent Task 2');
    await page.getByRole('button', { name: 'Add Task' }).click();

    // Add task to Done
    await doneColumn.getByText('+ Add Task').click();
    await page.getByPlaceholder('Task title').fill('Persistent Task 3');
    await page.getByRole('button', { name: 'Add Task' }).click();

    // Reload the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify all tasks are still present
    await expect(todoColumn.getByText('Persistent Task 1')).toBeVisible();
    await expect(inProgressColumn.getByText('Persistent Task 2')).toBeVisible();
    await expect(doneColumn.getByText('Persistent Task 3')).toBeVisible();

    // Verify task counts
    await expect(todoColumn.locator('.task-count')).toHaveText('1');
    await expect(inProgressColumn.locator('.task-count')).toHaveText('1');
    await expect(doneColumn.locator('.task-count')).toHaveText('1');
  });

  test('should persist task edits after reload', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const todoColumn = page.locator('.kanban-column').filter({ hasText: 'To Do' });

    // Add a task
    await todoColumn.getByText('+ Add Task').click();
    await page.getByPlaceholder('Task title').fill('Original Title');
    await page.getByRole('button', { name: 'Add Task' }).click();

    // Edit the task
    await todoColumn.getByText('✏️').click();
    const titleInput = page.locator('input[type="text"]').first();
    await titleInput.clear();
    await titleInput.fill('Updated Title');

    const descInput = page.locator('textarea').first();
    await descInput.fill('Updated Description');

    await page.getByRole('button', { name: 'Save' }).click();

    // Reload the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify edited task persists
    await expect(todoColumn.getByText('Updated Title')).toBeVisible();
    await expect(todoColumn.getByText('Updated Description')).toBeVisible();
    await expect(todoColumn.getByText('Original Title')).not.toBeVisible();
  });

  test('should persist task movements after reload', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const todoColumn = page.locator('.kanban-column').filter({ hasText: 'To Do' });
    const doneColumn = page.locator('.kanban-column').filter({ hasText: 'Done' });

    // Add a task to To Do
    await todoColumn.getByText('+ Add Task').click();
    await page.getByPlaceholder('Task title').fill('Moving Task');
    await page.getByRole('button', { name: 'Add Task' }).click();

    // Drag task to Done
    const task = todoColumn.getByText('Moving Task');
    await task.dragTo(doneColumn);

    // Wait for the move to complete
    await expect(doneColumn.getByText('Moving Task')).toBeVisible();

    // Reload the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify task is still in Done column
    await expect(doneColumn.getByText('Moving Task')).toBeVisible();
    await expect(todoColumn.getByText('Moving Task')).not.toBeVisible();
  });

  test('should persist task deletions after reload', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const todoColumn = page.locator('.kanban-column').filter({ hasText: 'To Do' });

    // Add two tasks
    await todoColumn.getByText('+ Add Task').click();
    await page.getByPlaceholder('Task title').fill('Task to Keep');
    await page.getByRole('button', { name: 'Add Task' }).click();

    await todoColumn.getByText('+ Add Task').click();
    await page.getByPlaceholder('Task title').fill('Task to Delete');
    await page.getByRole('button', { name: 'Add Task' }).click();

    // Delete the second task
    const deleteButtons = await todoColumn.getByText('🗑️').all();
    await deleteButtons[1].click();

    // Verify deletion
    await expect(todoColumn.getByText('Task to Delete')).not.toBeVisible();
    await expect(todoColumn.getByText('Task to Keep')).toBeVisible();

    // Reload the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify deletion persists
    await expect(todoColumn.getByText('Task to Keep')).toBeVisible();
    await expect(todoColumn.getByText('Task to Delete')).not.toBeVisible();
    await expect(todoColumn.locator('.task-count')).toHaveText('1');
  });

  test('should persist task order within columns after reload', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const todoColumn = page.locator('.kanban-column').filter({ hasText: 'To Do' });

    // Add three tasks
    for (const taskName of ['Task A', 'Task B', 'Task C']) {
      await todoColumn.getByText('+ Add Task').click();
      await page.getByPlaceholder('Task title').fill(taskName);
      await page.getByRole('button', { name: 'Add Task' }).click();
    }

    // Reorder: drag Task A below Task C (making order: B, C, A)
    const taskA = todoColumn.getByText('Task A');
    const taskC = todoColumn.getByText('Task C');
    await taskA.dragTo(taskC);

    // Wait for reordering
    await page.waitForTimeout(500);

    // Reload the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify order is preserved
    const tasks = await todoColumn.locator('.task-card').all();
    await expect(tasks[0]).toContainText('Task B');
    await expect(tasks[1]).toContainText('Task C');
    await expect(tasks[2]).toContainText('Task A');
  });

  test('should handle multiple sessions accessing same data', async ({ page, context }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Add a task in first tab
    const todoColumn = page.locator('.kanban-column').filter({ hasText: 'To Do' });
    await todoColumn.getByText('+ Add Task').click();
    await page.getByPlaceholder('Task title').fill('Multi-session Task');
    await page.getByRole('button', { name: 'Add Task' }).click();

    // Open a second tab
    const page2 = await context.newPage();
    await page2.goto('/');
    await page2.waitForLoadState('networkidle');

    // Verify task appears in second tab
    const todoColumn2 = page2.locator('.kanban-column').filter({ hasText: 'To Do' });
    await expect(todoColumn2.getByText('Multi-session Task')).toBeVisible();

    // Edit task in second tab
    await todoColumn2.getByText('✏️').click();
    const titleInput = page2.locator('input[type="text"]').first();
    await titleInput.clear();
    await titleInput.fill('Edited in Tab 2');
    await page2.getByRole('button', { name: 'Save' }).click();

    // Reload first tab and verify changes
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(todoColumn.getByText('Edited in Tab 2')).toBeVisible();

    // Clean up
    await page2.close();
  });
});