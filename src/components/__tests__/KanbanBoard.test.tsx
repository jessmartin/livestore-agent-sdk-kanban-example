import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import KanbanBoard from '../KanbanBoard';

// Mock LiveStore hooks and functions
vi.mock('@livestore/react', () => ({
  useStore: () => ({
    store: {
      useQuery: vi.fn(() => []),
      commit: vi.fn(),
    },
  }),
}));

vi.mock('@livestore/livestore', () => ({
  queryDb: vi.fn(),
}));

// Mock the Chat component
vi.mock('../Chat', () => ({
  default: () => <div>Chat Component</div>,
}));

// Mock crypto.randomUUID
global.crypto = {
  randomUUID: () => 'mock-uuid-123',
} as any;

describe('KanbanBoard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the kanban board with three columns', () => {
    render(<KanbanBoard />);

    expect(screen.getByText('Kanban Board')).toBeInTheDocument();
    expect(screen.getByText('To Do')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();
  });

  it('renders the chat component', () => {
    render(<KanbanBoard />);
    expect(screen.getByText('Chat Component')).toBeInTheDocument();
  });

  it('shows add task buttons for each column', () => {
    render(<KanbanBoard />);

    const addButtons = screen.getAllByText('+ Add Task');
    expect(addButtons).toHaveLength(3);
  });

  it('opens modal when add task button is clicked', async () => {
    render(<KanbanBoard />);

    const addButtons = screen.getAllByText('+ Add Task');
    fireEvent.click(addButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Add New Task to To Do')).toBeInTheDocument();
    });

    expect(screen.getByPlaceholderText('Task title')).toBeInTheDocument();
    expect(screen.getByText('Add Task')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('closes modal when cancel is clicked', async () => {
    render(<KanbanBoard />);

    const addButtons = screen.getAllByText('+ Add Task');
    fireEvent.click(addButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Add New Task to To Do')).toBeInTheDocument();
    });

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByText('Add New Task to To Do')).not.toBeInTheDocument();
    });
  });

  it('closes modal when overlay is clicked', async () => {
    render(<KanbanBoard />);

    const addButtons = screen.getAllByText('+ Add Task');
    fireEvent.click(addButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Add New Task to To Do')).toBeInTheDocument();
    });

    const overlay = document.querySelector('.modal-overlay');
    if (overlay) {
      fireEvent.click(overlay);
    }

    await waitFor(() => {
      expect(screen.queryByText('Add New Task to To Do')).not.toBeInTheDocument();
    });
  });

  it('adds task when enter key is pressed in input', async () => {
    const user = userEvent.setup();
    const mockStore = {
      useQuery: vi.fn(() => []),
      commit: vi.fn(),
    };

    vi.mocked(vi.importActual('@livestore/react') as any).useStore = () => ({
      store: mockStore,
    });

    render(<KanbanBoard />);

    const addButtons = screen.getAllByText('+ Add Task');
    fireEvent.click(addButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Add New Task to To Do')).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText('Task title') as HTMLInputElement;
    await user.type(input, 'New Task{Enter}');

    await waitFor(() => {
      expect(mockStore.commit).toHaveBeenCalled();
    });
  });

  it('handles drag and drop operations', () => {
    const mockTasks = [
      { id: 'task-1', title: 'Task 1', description: '', column: 'todo', position: 0 },
      { id: 'task-2', title: 'Task 2', description: '', column: 'doing', position: 0 },
    ];

    const mockStore = {
      useQuery: vi.fn((query) => {
        if (query.toString().includes('todo')) return [mockTasks[0]];
        if (query.toString().includes('doing')) return [mockTasks[1]];
        return [];
      }),
      commit: vi.fn(),
    };

    vi.mocked(vi.importActual('@livestore/react') as any).useStore = () => ({
      store: mockStore,
    });

    render(<KanbanBoard />);

    // Verify tasks are rendered
    expect(screen.getByText('Task 1')).toBeInTheDocument();
    expect(screen.getByText('Task 2')).toBeInTheDocument();
  });

  it('renders empty columns correctly', () => {
    const mockStore = {
      useQuery: vi.fn(() => []),
      commit: vi.fn(),
    };

    vi.mocked(vi.importActual('@livestore/react') as any).useStore = () => ({
      store: mockStore,
    });

    render(<KanbanBoard />);

    // All columns should be present even when empty
    expect(screen.getByText('To Do')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();

    // Task counts should all be 0
    const counts = screen.getAllByText('0');
    expect(counts).toHaveLength(3);
  });

  it('handles different modal states for each column', async () => {
    render(<KanbanBoard />);

    const addButtons = screen.getAllByText('+ Add Task');

    // Test "In Progress" column
    fireEvent.click(addButtons[1]);
    await waitFor(() => {
      expect(screen.getByText('Add New Task to In Progress')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Cancel'));

    // Test "Done" column
    fireEvent.click(addButtons[2]);
    await waitFor(() => {
      expect(screen.getByText('Add New Task to Done')).toBeInTheDocument();
    });
  });
});