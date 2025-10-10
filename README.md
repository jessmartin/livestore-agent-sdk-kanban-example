# 🎯 LiveStore Kanban Board

A blazingly fast Kanban board powered by **event sourcing** and **SQLite**—running entirely in your browser.

## ✨ What Makes This Cool

- **Event-Sourced**: Every change is an immutable event, giving you a complete audit trail
- **Offline-First**: Powered by LiveStore with OPFS storage—works without a backend
- **Real-Time**: Changes materialize instantly through SQLite queries
- **Type-Safe**: Full TypeScript coverage from events to UI
- **Web Worker Magic**: LiveStore runs in a worker for buttery-smooth performance

## 🚀 Quick Start

```bash
pnpm install
pnpm dev
```

Visit **http://localhost:60000** and start organizing.

Check out the **LiveStore DevTools** at **http://localhost:60000/_livestore** to see events flowing in real-time.

### LiveStore Agent Server

The chat assistant now runs on a companion Node server that syncs with the LiveStore backend.

```bash
# 1. Export your Claude API key
export ANTHROPIC_API_KEY=...

# 2. Build the server bundle
pnpm run server:build

# 3. Start the agent server (connects to ws://localhost:8787 by default)
pnpm run server:start

# Or run both steps together
pnpm run server:dev
```

You can customise the sync endpoint or store by setting `LIVESTORE_SYNC_URL` and `LIVESTORE_STORE_ID` before starting the server. Tool usage and Claude responses are emitted back into the chat timeline as LiveStore events.

## 🏗️ Architecture

```
src/
├── livestore/
│   └── schema.ts           # Event schema & table definitions
├── livestore.worker.ts     # LiveStore runtime (runs in Web Worker)
├── components/
│   ├── KanbanBoard.tsx     # Board orchestration + drag/drop
│   ├── KanbanColumn.tsx    # Column rendering
│   └── TaskCard.tsx        # Individual task UI
└── App.tsx                 # LiveStore provider setup
```

## 🎪 Features

- **Drag & Drop**: Smooth, accessible DnD powered by @dnd-kit
- **Full CRUD**: Create, read, update, and delete tasks with ease
- **Three Columns**: To Do → In Progress → Done
- **Instant Persistence**: All changes saved to browser OPFS automatically
- **Zero Backend**: Everything runs client-side

## 🧠 How It Works

1. **User Action** → Trigger an event (`taskCreated`, `taskMoved`, etc.)
2. **Event Logged** → Immutable event stored in LiveStore
3. **Materialization** → SQLite tables automatically updated
4. **React Subscribes** → Components re-render with fresh data
5. **Persist** → OPFS saves everything locally

### Event Types

| Event | Purpose |
|-------|---------|
| `taskCreated` | Add a new task with title, description, column, position |
| `taskMoved` | Reposition task within or across columns |
| `taskUpdated` | Edit title or description |
| `taskDeleted` | Remove task from board |

## 🛠️ Tech Stack

- **LiveStore** - Event-sourced reactive state management
- **React** - UI rendering
- **TypeScript** - Type safety
- **Vite** - Lightning-fast dev & build
- **@dnd-kit** - Modern drag and drop
- **pnpm** - Efficient package management

## 📦 Build

```bash
pnpm build
```

Output lands in `dist/` ready for deployment.

---

**Built with [LiveStore](https://livestore.dev)** | The event-sourced database for local-first apps
