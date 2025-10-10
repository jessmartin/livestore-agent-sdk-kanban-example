import { test, expect } from '@playwright/test';
import { navigateToApp, addTask, getColumn, waitForModal, closeModal } from './test-utils';

test.describe('Kanban Board', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToApp(page);
  });

  test('should display the kanban board with three columns', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Kanban Board' })).toBeVisible();
    await expect(page.getByText('To Do')).toBeVisible();
    await expect(page.getByText('In Progress')).toBeVisible();
    await expect(page.getByText('Done')).toBeVisible();
  });

  test('should add a new task to the To Do column', async ({ page }) => {
    const todoColumn = getColumn(page, 'To Do');

    // Click the add button
    await todoColumn.getByText('+ Add Task').click();

    // Wait for modal to appear
    await waitForModal(page, 'Add New Task to To Do');

    // Fill in the task details
    await page.getByPlaceholder('Task title').fill('Test Task');
    await page.getByRole('button', { name: 'Add Task', exact: true }).click();

    // Verify the task appears in the To Do column
    await expect(todoColumn.getByText('Test Task')).toBeVisible({ timeout: 5000 });
  });

  test('should add task by pressing Enter', async ({ page }) => {
    const todoColumn = getColumn(page, 'To Do');
    await todoColumn.getByText('+ Add Task').click();

    await page.getByPlaceholder('Task title').fill('Enter Test Task');
    await page.getByPlaceholder('Task title').press('Enter');

    await expect(todoColumn.getByText('Enter Test Task')).toBeVisible({ timeout: 5000 });
  });

  test('should cancel adding a task', async ({ page }) => {
    const todoColumn = getColumn(page, 'To Do');
    await todoColumn.getByText('+ Add Task').click();

    await page.getByPlaceholder('Task title').fill('Cancelled Task');
    await closeModal(page);

    // Modal should be closed
    await expect(page.getByText('Add New Task to To Do')).not.toBeVisible();

    // Task should not be added
    await expect(todoColumn.getByText('Cancelled Task')).not.toBeVisible();
  });

  test('should close modal when clicking overlay', async ({ page }) => {
    const todoColumn = getColumn(page, 'To Do');
    await todoColumn.getByText('+ Add Task').click();

    await waitForModal(page, 'Add New Task to To Do');

    // Click outside the modal
    await page.locator('.modal-overlay').click({ position: { x: 10, y: 10 } });

    await expect(page.getByText('Add New Task to To Do')).not.toBeVisible();
  });

  test('should edit a task', async ({ page }) => {
    // First add a task
    await addTask(page, 'To Do', 'Original Task');

    const todoColumn = getColumn(page, 'To Do');

    // Edit the task
    await todoColumn.getByText('✏️').click();

    const titleInput = page.locator('input[type="text"]').first();
    await titleInput.clear();
    await titleInput.fill('Updated Task');

    await page.getByRole('button', { name: 'Save' }).click();

    // Verify the task was updated
    await expect(todoColumn.getByText('Updated Task')).toBeVisible({ timeout: 5000 });
    await expect(todoColumn.getByText('Original Task')).not.toBeVisible();
  });

  test('should cancel editing a task', async ({ page }) => {
    // First add a task
    await addTask(page, 'To Do', 'Unchanged Task');

    const todoColumn = getColumn(page, 'To Do');

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
    await addTask(page, 'To Do', 'Task to Delete');

    const todoColumn = getColumn(page, 'To Do');

    // Delete the task
    await todoColumn.getByText('🗑️').click();

    // Verify the task is deleted
    await expect(todoColumn.getByText('Task to Delete')).not.toBeVisible();
  });

  test('should add tasks to different columns', async ({ page }) => {
    // Add to In Progress
    await addTask(page, 'In Progress', 'In Progress Task');

    // Add to Done
    await addTask(page, 'Done', 'Completed Task');

    // Verify tasks appear in correct columns
    await expect(getColumn(page, 'In Progress').getByText('In Progress Task')).toBeVisible();
    await expect(getColumn(page, 'Done').getByText('Completed Task')).toBeVisible();
  });

  test('should show task count for each column', async ({ page }) => {
    const todoColumn = getColumn(page, 'To Do');

    // Check initial count
    const initialCount = await todoColumn.locator('.task-count').textContent();
    const initialCountNum = parseInt(initialCount || '0', 10);

    // Add a task
    await addTask(page, 'To Do', 'First Task');

    // Should increment by 1
    await expect(todoColumn.locator('.task-count')).toHaveText(String(initialCountNum + 1));

    // Add another task
    await addTask(page, 'To Do', 'Second Task');

    // Should increment by 1 again
    await expect(todoColumn.locator('.task-count')).toHaveText(String(initialCountNum + 2));
  });
});