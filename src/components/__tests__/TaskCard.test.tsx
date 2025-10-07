import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DndContext } from '@dnd-kit/core';
import TaskCard from '../TaskCard';

// Mock @dnd-kit/sortable
vi.mock('@dnd-kit/sortable', () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: undefined,
    isDragging: false,
  }),
}));

describe('TaskCard', () => {
  const mockTask = {
    id: 'task-1',
    title: 'Test Task',
    description: 'Test Description',
    column: 'todo',
    position: 0,
  };

  const mockOnDelete = vi.fn();
  const mockOnUpdate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders task title and description', () => {
    render(
      <DndContext>
        <TaskCard
          task={mockTask}
          onDelete={mockOnDelete}
          onUpdate={mockOnUpdate}
        />
      </DndContext>
    );

    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });

  it('shows edit and delete buttons', () => {
    render(
      <DndContext>
        <TaskCard
          task={mockTask}
          onDelete={mockOnDelete}
          onUpdate={mockOnUpdate}
        />
      </DndContext>
    );

    expect(screen.getByText('✏️')).toBeInTheDocument();
    expect(screen.getByText('🗑️')).toBeInTheDocument();
  });

  it('calls onDelete when delete button is clicked', () => {
    render(
      <DndContext>
        <TaskCard
          task={mockTask}
          onDelete={mockOnDelete}
          onUpdate={mockOnUpdate}
        />
      </DndContext>
    );

    const deleteButton = screen.getByText('🗑️');
    fireEvent.click(deleteButton);

    expect(mockOnDelete).toHaveBeenCalledWith('task-1');
  });

  it('enters edit mode when edit button is clicked', async () => {
    render(
      <DndContext>
        <TaskCard
          task={mockTask}
          onDelete={mockOnDelete}
          onUpdate={mockOnUpdate}
        />
      </DndContext>
    );

    const editButton = screen.getByText('✏️');
    fireEvent.click(editButton);

    // Check if edit inputs are displayed
    expect(screen.getByDisplayValue('Test Task')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Description')).toBeInTheDocument();
    expect(screen.getByText('Save')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('updates task when save is clicked in edit mode', async () => {
    const user = userEvent.setup();

    render(
      <DndContext>
        <TaskCard
          task={mockTask}
          onDelete={mockOnDelete}
          onUpdate={mockOnUpdate}
        />
      </DndContext>
    );

    // Enter edit mode
    const editButton = screen.getByText('✏️');
    fireEvent.click(editButton);

    // Modify the title
    const titleInput = screen.getByDisplayValue('Test Task') as HTMLInputElement;
    await user.clear(titleInput);
    await user.type(titleInput, 'Updated Task');

    // Save changes
    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    expect(mockOnUpdate).toHaveBeenCalledWith('task-1', 'Updated Task', 'Test Description');
  });

  it('cancels edit mode without saving changes', async () => {
    const user = userEvent.setup();

    render(
      <DndContext>
        <TaskCard
          task={mockTask}
          onDelete={mockOnDelete}
          onUpdate={mockOnUpdate}
        />
      </DndContext>
    );

    // Enter edit mode
    const editButton = screen.getByText('✏️');
    fireEvent.click(editButton);

    // Modify the title
    const titleInput = screen.getByDisplayValue('Test Task') as HTMLInputElement;
    await user.clear(titleInput);
    await user.type(titleInput, 'Should not be saved');

    // Cancel changes
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    // Check that onUpdate was not called
    expect(mockOnUpdate).not.toHaveBeenCalled();

    // Check that original text is displayed
    expect(screen.getByText('Test Task')).toBeInTheDocument();
  });

  it('renders correctly when dragging', () => {
    render(
      <DndContext>
        <TaskCard
          task={mockTask}
          isDragging={true}
          onDelete={mockOnDelete}
          onUpdate={mockOnUpdate}
        />
      </DndContext>
    );

    const card = screen.getByText('Test Task').closest('.task-card');
    expect(card).toHaveClass('dragging');
  });

  it('renders task without description', () => {
    const taskWithoutDescription = {
      ...mockTask,
      description: '',
    };

    render(
      <DndContext>
        <TaskCard
          task={taskWithoutDescription}
          onDelete={mockOnDelete}
          onUpdate={mockOnUpdate}
        />
      </DndContext>
    );

    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.queryByText('Test Description')).not.toBeInTheDocument();
  });
});