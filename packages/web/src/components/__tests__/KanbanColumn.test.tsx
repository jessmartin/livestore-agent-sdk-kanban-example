import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DndContext } from '@dnd-kit/core';
import KanbanColumn from '../KanbanColumn';

// Mock @dnd-kit packages
vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useDroppable: () => ({
    setNodeRef: vi.fn(),
    isOver: false,
  }),
}));

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  verticalListSortingStrategy: vi.fn(),
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: undefined,
    isDragging: false,
  }),
}));

describe('KanbanColumn', () => {
  const mockTasks = [
    {
      id: 'task-1',
      title: 'Task 1',
      description: 'Description 1',
      column: 'todo',
      position: 0,
    },
    {
      id: 'task-2',
      title: 'Task 2',
      description: 'Description 2',
      column: 'todo',
      position: 1,
    },
  ];

  const mockOnAddTask = vi.fn();
  const mockOnDeleteTask = vi.fn();
  const mockOnUpdateTask = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders column title and task count', () => {
    render(
      <DndContext>
        <KanbanColumn
          id="todo"
          title="To Do"
          tasks={mockTasks}
          onAddTask={mockOnAddTask}
          onDeleteTask={mockOnDeleteTask}
          onUpdateTask={mockOnUpdateTask}
        />
      </DndContext>
    );

    expect(screen.getByText('To Do')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // task count
  });

  it('renders all tasks', () => {
    render(
      <DndContext>
        <KanbanColumn
          id="todo"
          title="To Do"
          tasks={mockTasks}
          onAddTask={mockOnAddTask}
          onDeleteTask={mockOnDeleteTask}
          onUpdateTask={mockOnUpdateTask}
        />
      </DndContext>
    );

    expect(screen.getByText('Task 1')).toBeInTheDocument();
    expect(screen.getByText('Task 2')).toBeInTheDocument();
    expect(screen.getByText('Description 1')).toBeInTheDocument();
    expect(screen.getByText('Description 2')).toBeInTheDocument();
  });

  it('renders add task button', () => {
    render(
      <DndContext>
        <KanbanColumn
          id="todo"
          title="To Do"
          tasks={mockTasks}
          onAddTask={mockOnAddTask}
          onDeleteTask={mockOnDeleteTask}
          onUpdateTask={mockOnUpdateTask}
        />
      </DndContext>
    );

    expect(screen.getByText('+ Add Task')).toBeInTheDocument();
  });

  it('calls onAddTask when add button is clicked', () => {
    render(
      <DndContext>
        <KanbanColumn
          id="todo"
          title="To Do"
          tasks={mockTasks}
          onAddTask={mockOnAddTask}
          onDeleteTask={mockOnDeleteTask}
          onUpdateTask={mockOnUpdateTask}
        />
      </DndContext>
    );

    const addButton = screen.getByText('+ Add Task');
    fireEvent.click(addButton);

    expect(mockOnAddTask).toHaveBeenCalledTimes(1);
  });

  it('renders empty column correctly', () => {
    render(
      <DndContext>
        <KanbanColumn
          id="done"
          title="Done"
          tasks={[]}
          onAddTask={mockOnAddTask}
          onDeleteTask={mockOnDeleteTask}
          onUpdateTask={mockOnUpdateTask}
        />
      </DndContext>
    );

    expect(screen.getByText('Done')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument(); // task count
    expect(screen.getByText('+ Add Task')).toBeInTheDocument();
  });

  it('passes correct props to TaskCard components', () => {
    render(
      <DndContext>
        <KanbanColumn
          id="todo"
          title="To Do"
          tasks={mockTasks}
          onAddTask={mockOnAddTask}
          onDeleteTask={mockOnDeleteTask}
          onUpdateTask={mockOnUpdateTask}
        />
      </DndContext>
    );

    // Delete buttons should exist for each task
    const deleteButtons = screen.getAllByText('🗑️');
    expect(deleteButtons).toHaveLength(2);

    // Edit buttons should exist for each task
    const editButtons = screen.getAllByText('✏️');
    expect(editButtons).toHaveLength(2);
  });

  it('handles different column types', () => {
    const columnTypes = [
      { id: 'todo', title: 'To Do' },
      { id: 'in-progress', title: 'In Progress' },
      { id: 'done', title: 'Done' },
    ];

    columnTypes.forEach(column => {
      const { unmount } = render(
        <DndContext>
          <KanbanColumn
            id={column.id}
            title={column.title}
            tasks={[]}
            onAddTask={mockOnAddTask}
            onDeleteTask={mockOnDeleteTask}
            onUpdateTask={mockOnUpdateTask}
          />
        </DndContext>
      );

      expect(screen.getByText(column.title)).toBeInTheDocument();
      unmount();
    });
  });
});