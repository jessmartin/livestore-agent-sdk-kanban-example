# Test Suite

This project includes comprehensive testing with Vitest for unit tests and Playwright for E2E tests.

## Running Tests

### Unit Tests (Vitest)
```bash
# Run all unit tests
pnpm test

# Run tests with UI
pnpm test:ui

# Run tests with coverage
pnpm test:coverage
```

### E2E Tests (Playwright)
```bash
# Run all E2E tests
pnpm test:e2e

# Run E2E tests with UI
pnpm test:e2e:ui

# Debug E2E tests
pnpm test:e2e:debug
```

### Run All Tests
```bash
pnpm test:all
```

## Test Structure

### Unit Tests
- `src/components/__tests__/` - React component tests
  - `TaskCard.test.tsx` - Tests for task card component
  - `KanbanColumn.test.tsx` - Tests for column component
  - `KanbanBoard.test.tsx` - Tests for main board component

### E2E Tests
- `e2e/` - End-to-end tests
  - `kanban-board.spec.ts` - Basic board functionality
  - `drag-and-drop.spec.ts` - Drag and drop operations
  - `persistence.spec.ts` - Data persistence tests

## Test Coverage

Unit tests cover:
- Component rendering
- User interactions
- Event handlers
- State management
- Props validation

E2E tests cover:
- Task creation, editing, and deletion
- Drag and drop between columns
- Task reordering within columns
- Data persistence across reloads
- Multi-session synchronization

## Configuration Files

- `vitest.config.ts` - Vitest configuration
- `playwright.config.ts` - Playwright configuration
- `src/tests/setup.ts` - Test setup and utilities