# Test Suite

This project includes comprehensive testing with Vitest for unit tests and Playwright for E2E tests.

## ⚠️ E2E Test Status

**The E2E tests are currently not functional** due to LiveStore/SharedArrayBuffer compatibility issues with Playwright's headless browser. The app gets stuck on "Loading LiveStore..." and never finishes initialization in the test environment.

This is a known limitation with testing applications that use SharedArrayBuffer and OPFS (Origin Private File System) in headless browser environments. 

**The unit tests work perfectly** (23/23 passing) and provide comprehensive coverage of all React component behavior.

## Running Tests

### Unit Tests (Vitest) ✅
```bash
# Run all unit tests
pnpm test

# Run tests with UI
pnpm test:ui

# Run tests with coverage
pnpm test:coverage
```

### E2E Tests (Playwright) ⚠️ Not Working
```bash
# Run all E2E tests (will timeout due to LiveStore initialization issue)
pnpm test:e2e

# Run E2E tests with UI
pnpm test:e2e:ui

# Debug E2E tests
pnpm test:e2e:debug
```

## Test Structure

### Unit Tests
- `src/components/__tests__/` - React component tests
  - `TaskCard.test.tsx` - Tests for task card component (8 tests)
  - `KanbanColumn.test.tsx` - Tests for column component (7 tests)
  - `KanbanBoard.test.tsx` - Tests for main board component (8 tests)

### E2E Tests (Not Functional)
- `e2e/` - End-to-end tests
  - `kanban-board.spec.ts` - Basic board functionality
  - `drag-and-drop.spec.ts` - Drag and drop operations
  - `persistence.spec.ts` - Data persistence tests
  - `test-utils.ts` - Helper functions

## Test Coverage

Unit tests cover:
- Component rendering
- User interactions (clicks, typing, form submission)
- Event handlers
- State management
- Props validation
- Edge cases

## Known Issues

1. **E2E Tests**: LiveStore requires SharedArrayBuffer and OPFS which don't initialize properly in Playwright's headless Chromium environment
2. **Workaround**: Manual testing or running the app in headed mode works fine
3. **Alternative**: Unit tests provide sufficient coverage for CI/CD pipelines

## Future Improvements

- Investigate alternative E2E testing approaches for LiveStore apps
- Consider mocking LiveStore for E2E tests
- Look into Playwright headed mode in CI environments
