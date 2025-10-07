import { test, expect } from '@playwright/test';

test.describe('Kanban Board', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should display the kanban board with three columns', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Kanban Board' })).toBeVisible();
    await expect(page.getByText('To Do')).toBeVisible();
    await expect(page.getByText('In Progress')).toBeVisible();
    await expect(page.getByText('Done')).toBeVisible();
  });

  test('should add a new task to the To Do column', async ({ page }) => {
    // Click the add button in the To Do column
    const todoColumn = page.locator('.kanban-column').filter({ hasText: 'To Do' });
    await todoColumn.getByText('+ Add Task').click();

    // Fill in the task details
    await expect(page.getByText('Add New Task to To Do')).toBeVisible();
    await page.getByPlaceholder('Task title').fill('Test Task');
    await page.getByRole('button', { name: 'Add Task' }).click();

    // Verify the task appears in the To Do column
    await expect(todoColumn.getByText('Test Task')).toBeVisible();
  });

  test('should add task by pressing Enter', async ({ page }) => {
    const todoColumn = page.locator('.kanban-column').filter({ hasText: 'To Do' });
    await todoColumn.getByText('+ Add Task').click();

    await page.getByPlaceholder('Task title').fill('Enter Test Task');
    await page.getByPlaceholder('Task title').press('Enter');

    await expect(todoColumn.getByText('Enter Test Task')).toBeVisible();
  });

  test('should cancel adding a task', async ({ page }) => {
    const todoColumn = page.locator('.kanban-column').filter({ hasText: 'To Do' });
    await todoColumn.getByText('+ Add Task').click();

    await page.getByPlaceholder('Task title').fill('Cancelled Task');
    await page.getByRole('button', { name: 'Cancel' }).click();

    // Modal should be closed
    await expect(page.getByText('Add New Task to To Do')).not.toBeVisible();

    // Task should not be added
    await expect(todoColumn.getByText('Cancelled Task')).not.toBeVisible();
  });

  test('should close modal when clicking overlay', async ({ page }) => {
    const todoColumn = page.locator('.kanban-column').filter({ hasText: 'To Do' });
    await todoColumn.getByText('+ Add Task').click();

    await expect(page.getByText('Add New Task to To Do')).toBeVisible();

    // Click outside the modal
    await page.locator('.modal-overlay').click({ position: { x: 10, y: 10 } });

    await expect(page.getByText('Add New Task to To Do')).not.toBeVisible();
  });

  test('should edit a task', async ({ page }) => {
    // First add a task
    const todoColumn = page.locator('.kanban-column').filter({ hasText: 'To Do' });
    await todoColumn.getByText('+ Add Task').click();
    await page.getByPlaceholder('Task title').fill('Original Task');
    await page.getByRole('button', { name: 'Add Task' }).click();

    // Edit the task
    await todoColumn.getByText('✏️').click();

    const titleInput = page.locator('input[type="text"]').first();
    await titleInput.clear();
    await titleInput.fill('Updated Task');

    await page.getByRole('button', { name: 'Save' }).click();

    // Verify the task was updated
    await expect(todoColumn.getByText('Updated Task')).toBeVisible();
    await expect(todoColumn.getByText('Original Task')).not.toBeVisible();
  });

  test('should cancel editing a task', async ({ page }) => {
    // First add a task
    const todoColumn = page.locator('.kanban-column').filter({ hasText: 'To Do' });
    await todoColumn.getByText('+ Add Task').click();
    await page.getByPlaceholder('Task title').fill('Unchanged Task');
    await page.getByRole('button', { name: 'Add Task' }).click();

    // Start editing but cancel
    await todoColumn.getByText('✏️').click();

    const titleInput = page.locator('input[type="text"]').first();
    await titleInput.clear();
    await titleInput.fill('Should Not Be Saved');

    await page.getByRole('button', { name: 'Cancel' }).click();

    // Verify the original task title remains
    await expect(todoColumn.getByText('Unchanged Task')).toBeVisible();
    await expect(todoColumn.getByText('Should Not Be Saved')).not.toBeVisible();
  });

  test('should delete a task', async ({ page }) => {
    // First add a task
    const todoColumn = page.locator('.kanban-column').filter({ hasText: 'To Do' });
    await todoColumn.getByText('+ Add Task').click();
    await page.getByPlaceholder('Task title').fill('Task to Delete');
    await page.getByRole('button', { name: 'Add Task' }).click();

    // Delete the task
    await todoColumn.getByText('🗑️').click();

    // Verify the task is deleted
    await expect(todoColumn.getByText('Task to Delete')).not.toBeVisible();
  });

  test('should add tasks to different columns', async ({ page }) => {
    // Add to In Progress
    const inProgressColumn = page.locator('.kanban-column').filter({ hasText: 'In Progress' });
    await inProgressColumn.getByText('+ Add Task').click();
    await page.getByPlaceholder('Task title').fill('In Progress Task');
    await page.getByRole('button', { name: 'Add Task' }).click();

    // Add to Done
    const doneColumn = page.locator('.kanban-column').filter({ hasText: 'Done' });
    await doneColumn.getByText('+ Add Task').click();
    await page.getByPlaceholder('Task title').fill('Completed Task');
    await page.getByRole('button', { name: 'Add Task' }).click();

    // Verify tasks appear in correct columns
    await expect(inProgressColumn.getByText('In Progress Task')).toBeVisible();
    await expect(doneColumn.getByText('Completed Task')).toBeVisible();
  });

  test('should show task count for each column', async ({ page }) => {
    const todoColumn = page.locator('.kanban-column').filter({ hasText: 'To Do' });

    // Initially should show 0
    await expect(todoColumn.locator('.task-count')).toHaveText('0');

    // Add a task
    await todoColumn.getByText('+ Add Task').click();
    await page.getByPlaceholder('Task title').fill('First Task');
    await page.getByRole('button', { name: 'Add Task' }).click();

    // Should show 1
    await expect(todoColumn.locator('.task-count')).toHaveText('1');

    // Add another task
    await todoColumn.getByText('+ Add Task').click();
    await page.getByPlaceholder('Task title').fill('Second Task');
    await page.getByRole('button', { name: 'Add Task' }).click();

    // Should show 2
    await expect(todoColumn.locator('.task-count')).toHaveText('2');
  });
});