import { test, expect } from '@playwright/test';

test.describe('Drag and Drop', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Add test tasks to different columns
    const todoColumn = page.locator('.kanban-column').filter({ hasText: 'To Do' });
    const inProgressColumn = page.locator('.kanban-column').filter({ hasText: 'In Progress' });

    // Add task to To Do
    await todoColumn.getByText('+ Add Task').click();
    await page.getByPlaceholder('Task title').fill('Draggable Task');
    await page.getByRole('button', { name: 'Add Task' }).click();

    // Add task to In Progress
    await inProgressColumn.getByText('+ Add Task').click();
    await page.getByPlaceholder('Task title').fill('Progress Task');
    await page.getByRole('button', { name: 'Add Task' }).click();
  });

  test('should drag task from To Do to In Progress', async ({ page }) => {
    const todoColumn = page.locator('.kanban-column').filter({ hasText: 'To Do' });
    const inProgressColumn = page.locator('.kanban-column').filter({ hasText: 'In Progress' });

    // Get the draggable task
    const task = todoColumn.getByText('Draggable Task');
    await expect(task).toBeVisible();

    // Drag the task to In Progress column
    await task.dragTo(inProgressColumn.locator('.task-list'));

    // Verify task moved to In Progress
    await expect(inProgressColumn.getByText('Draggable Task')).toBeVisible();
    await expect(todoColumn.getByText('Draggable Task')).not.toBeVisible();

    // Verify task counts updated
    await expect(todoColumn.locator('.task-count')).toHaveText('0');
    await expect(inProgressColumn.locator('.task-count')).toHaveText('2');
  });

  test('should drag task from In Progress to Done', async ({ page }) => {
    const inProgressColumn = page.locator('.kanban-column').filter({ hasText: 'In Progress' });
    const doneColumn = page.locator('.kanban-column').filter({ hasText: 'Done' });

    // Get the task
    const task = inProgressColumn.getByText('Progress Task');
    await expect(task).toBeVisible();

    // Drag the task to Done column
    await task.dragTo(doneColumn.locator('.task-list'));

    // Verify task moved to Done
    await expect(doneColumn.getByText('Progress Task')).toBeVisible();
    await expect(inProgressColumn.getByText('Progress Task')).not.toBeVisible();

    // Verify task counts
    await expect(inProgressColumn.locator('.task-count')).toHaveText('0');
    await expect(doneColumn.locator('.task-count')).toHaveText('1');
  });

  test('should reorder tasks within the same column', async ({ page }) => {
    const todoColumn = page.locator('.kanban-column').filter({ hasText: 'To Do' });

    // Add a second task to To Do
    await todoColumn.getByText('+ Add Task').click();
    await page.getByPlaceholder('Task title').fill('Second Task');
    await page.getByRole('button', { name: 'Add Task' }).click();

    // Get both tasks
    const firstTask = todoColumn.getByText('Draggable Task');
    const secondTask = todoColumn.getByText('Second Task');

    // Verify initial order
    const taskElements = await todoColumn.locator('.task-card').all();
    await expect(taskElements[0]).toContainText('Draggable Task');
    await expect(taskElements[1]).toContainText('Second Task');

    // Drag first task below second task
    await firstTask.dragTo(secondTask);

    // Wait for reordering
    await page.waitForTimeout(500);

    // Verify new order
    const reorderedTasks = await todoColumn.locator('.task-card').all();
    await expect(reorderedTasks[0]).toContainText('Second Task');
    await expect(reorderedTasks[1]).toContainText('Draggable Task');
  });

  test('should handle dragging task to empty column', async ({ page }) => {
    const todoColumn = page.locator('.kanban-column').filter({ hasText: 'To Do' });
    const doneColumn = page.locator('.kanban-column').filter({ hasText: 'Done' });

    // Initially Done column should be empty
    await expect(doneColumn.locator('.task-count')).toHaveText('0');

    // Drag task from To Do to empty Done column
    const task = todoColumn.getByText('Draggable Task');
    await task.dragTo(doneColumn);

    // Verify task moved to Done
    await expect(doneColumn.getByText('Draggable Task')).toBeVisible();
    await expect(doneColumn.locator('.task-count')).toHaveText('1');
    await expect(todoColumn.locator('.task-count')).toHaveText('0');
  });

  test('should handle multiple drag operations', async ({ page }) => {
    const todoColumn = page.locator('.kanban-column').filter({ hasText: 'To Do' });
    const inProgressColumn = page.locator('.kanban-column').filter({ hasText: 'In Progress' });
    const doneColumn = page.locator('.kanban-column').filter({ hasText: 'Done' });

    // Add more tasks
    await todoColumn.getByText('+ Add Task').click();
    await page.getByPlaceholder('Task title').fill('Task A');
    await page.getByRole('button', { name: 'Add Task' }).click();

    await todoColumn.getByText('+ Add Task').click();
    await page.getByPlaceholder('Task title').fill('Task B');
    await page.getByRole('button', { name: 'Add Task' }).click();

    // Drag Task A to In Progress
    await todoColumn.getByText('Task A').dragTo(inProgressColumn);
    await expect(inProgressColumn.getByText('Task A')).toBeVisible();

    // Drag Task B to Done
    await todoColumn.getByText('Task B').dragTo(doneColumn);
    await expect(doneColumn.getByText('Task B')).toBeVisible();

    // Drag Progress Task to Done
    await inProgressColumn.getByText('Progress Task').dragTo(doneColumn);
    await expect(doneColumn.getByText('Progress Task')).toBeVisible();

    // Verify final counts
    await expect(todoColumn.locator('.task-count')).toHaveText('1'); // Only Draggable Task remains
    await expect(inProgressColumn.locator('.task-count')).toHaveText('1'); // Only Task A
    await expect(doneColumn.locator('.task-count')).toHaveText('2'); // Task B and Progress Task
  });
});