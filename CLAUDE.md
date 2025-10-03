# LiveStore Kanban Board

A simple Kanban board application built with LiveStore, React, and TypeScript.

## Tech Stack

- **LiveStore**: Event-sourced state management with SQLite backend
- **React**: UI framework
- **TypeScript**: Type safety
- **Vite**: Build tool
- **@dnd-kit**: Drag and drop functionality
- **pnpm**: Package manager

## Project Structure

```
src/
├── livestore/
│   └── schema.ts         # LiveStore schema with events and tables
├── livestore.worker.ts   # LiveStore web worker
├── components/
│   ├── KanbanBoard.tsx   # Main board component
│   ├── KanbanColumn.tsx  # Column component
│   ├── TaskCard.tsx      # Individual task card
│   └── KanbanBoard.css   # Styles
└── App.tsx               # Root component with LiveStore provider
```

## LiveStore Events

The app uses the following events for state management:

- **taskCreated**: Creates a new task with title, description, column, and position
- **taskMoved**: Moves a task to a different column or position
- **taskUpdated**: Updates task title or description
- **taskDeleted**: Deletes a task from the board

## Features

- Three fixed columns: To Do, In Progress, Done
- Drag and drop tasks between columns
- Add new tasks to any column
- Edit task title and description
- Delete tasks
- Tasks persist using LiveStore with OPFS storage
- Real-time updates with event sourcing

## Development

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build
```

The app runs on http://localhost:60000 by default.
LiveStore DevTools are available at http://localhost:60000/_livestore

## How It Works

1. **State Management**: LiveStore manages all state through events that are materialized into SQLite tables
2. **Persistence**: Data is stored in the browser's Origin Private File System (OPFS)
3. **Web Workers**: LiveStore runs in a web worker for better performance
4. **Event Sourcing**: All changes are recorded as events, providing a complete audit trail
5. **Drag & Drop**: Uses @dnd-kit for accessible drag and drop functionality