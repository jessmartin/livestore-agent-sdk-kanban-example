import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import KanbanBoard from '../KanbanBoard';

// Mock LiveStore schema module first
vi.mock('../../livestore/schema', () => ({
  events: {
    taskCreated: vi.fn((data) => ({ type: 'v1.TaskCreated', ...data })),
    taskMoved: vi.fn((data) => ({ type: 'v1.TaskMoved', ...data })),
    taskUpdated: vi.fn((data) => ({ type: 'v1.TaskUpdated', ...data })),
    taskDeleted: vi.fn((data) => ({ type: 'v1.TaskDeleted', ...data })),
  },
  tables: {
    tasks: {
      where: vi.fn(() => ({
        orderBy: vi.fn(),
      })),
    },
  },
}));

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
  queryDb: vi.fn((query, options) => query),
  Events: {
    synced: vi.fn(),
  },
  State: {
    SQLite: {
      table: vi.fn(),
      text: vi.fn(),
      integer: vi.fn(),
      materializers: vi.fn(),
      makeState: vi.fn(),
    },
  },
  Schema: {
    Struct: vi.fn(),
    String: {},
    Number: {},
    Date: {},
    DateFromNumber: {},
    optional: vi.fn(),
  },
  makeSchema: vi.fn(),
}));

// Mock the Chat component
vi.mock('../Chat', () => ({
  default: () => <div>Chat Component</div>,
}));

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'mock-uuid-123',
  },
  writable: true,
});

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

  it('renders empty columns correctly', () => {
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