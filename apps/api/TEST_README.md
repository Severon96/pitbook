# Backend Tests

This directory contains comprehensive tests for the Pitbook API backend.

## Test Coverage

### Unit Tests

#### Vehicles Module
- **vehicles.service.spec.ts**: Tests for VehiclesService
  - ✅ Finding all vehicles with counts
  - ✅ Finding a single vehicle by ID
  - ✅ Creating new vehicles
  - ✅ Updating existing vehicles
  - ✅ Deleting vehicles
  - ✅ Getting vehicle cost summaries
  - ✅ Error handling for not found cases

- **vehicles.controller.spec.ts**: Tests for VehiclesController
  - ✅ All HTTP endpoints (GET, POST, PUT, DELETE)
  - ✅ Request/response handling
  - ✅ Summary endpoint

#### Cost Entries Module
- **cost-entries.service.spec.ts**: Tests for CostEntriesService
  - ✅ Finding cost entries by vehicle
  - ✅ Filtering by season
  - ✅ Creating entries without items
  - ✅ Creating entries with itemized breakdown
  - ✅ Automatic total calculation from items
  - ✅ Deleting entries
  - ✅ Error handling

#### Spritmonitor Module
- **spritmonitor.service.spec.ts**: Tests for SpritmonitorService
  - ✅ Fetching vehicles from Spritmonitor API
  - ✅ Linking vehicles to Spritmonitor
  - ✅ Syncing fuel logs from external API
  - ✅ Deduplication logic
  - ✅ Error handling for unlinked vehicles
  - ✅ API authentication

### E2E (Integration) Tests

#### vehicles.e2e-spec.ts
Full integration tests for the vehicles API:
- ✅ Creating vehicles
- ✅ Listing all vehicles
- ✅ Getting vehicle details
- ✅ Updating vehicle information
- ✅ Deleting vehicles
- ✅ Getting cost summaries
- ✅ Validation error handling
- ✅ 404 error handling

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm test -- --watch
```

### Run Tests with Coverage
```bash
npm test -- --coverage
```

### Run Specific Test File
```bash
npm test -- vehicles.service.spec.ts
```

### Run E2E Tests Only
```bash
npm test -- test/
```

## Test Statistics

- **Total Test Suites**: 4
- **Total Tests**: 36
- **Pass Rate**: 100%

### Breakdown:
- Vehicles Service: 11 tests
- Vehicles Controller: 6 tests
- Cost Entries Service: 8 tests
- Spritmonitor Service: 5 tests
- Vehicles E2E: 6+ tests

## Test Structure

### Unit Tests
Unit tests mock all dependencies and test individual components in isolation. They use:
- `@nestjs/testing` for NestJS-specific testing utilities
- `jest` for test framework and mocking
- Mocked `DrizzleService` to avoid database dependencies

### E2E Tests
E2E tests use the actual application setup with a real database connection. They:
- Test complete request/response cycles
- Validate HTTP status codes
- Check response data structure
- Test error scenarios
- Clean up test data after execution

## Mock Patterns

### DrizzleService Mock
```typescript
const mockDb = {
  query: {
    vehicles: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
  },
  insert: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  select: jest.fn(),
  transaction: jest.fn(),
};
```

### Transaction Handling
```typescript
const mockTransaction = jest.fn((callback) => {
  const tx = {
    insert: jest.fn().mockReturnValue({
      values: jest.fn().mockReturnValue({
        returning: jest.fn().mockResolvedValue([result]),
      }),
    }),
  };
  return callback(tx);
});
```

## Configuration

Jest configuration is in `package.json`:
- Uses `ts-jest` for TypeScript support
- Maps `@pitbook/db` to built package
- Excludes dist folder from tests
- Collects coverage from src directory

## Best Practices

1. **Arrange-Act-Assert Pattern**: All tests follow AAA pattern
2. **Clean Mocks**: `afterEach` clears all mocks between tests
3. **Descriptive Names**: Test names clearly describe what they test
4. **Error Cases**: Tests include both happy path and error scenarios
5. **Isolation**: Each test is independent and doesn't rely on others
6. **Real-World Scenarios**: E2E tests simulate actual user workflows

## Adding New Tests

When adding new features, create tests following this structure:

```typescript
describe('FeatureName', () => {
  let service: YourService;

  beforeEach(async () => {
    // Setup test module
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('methodName', () => {
    it('should handle success case', async () => {
      // Arrange
      // Act
      // Assert
    });

    it('should handle error case', async () => {
      // Test error handling
    });
  });
});
```

## Continuous Integration

These tests are designed to run in CI/CD pipelines:
- Fast execution (< 3 seconds)
- No external dependencies (except E2E tests which need database)
- Clear pass/fail indicators
- Detailed error messages

## Troubleshooting

### Tests fail with module resolution errors
Make sure `@pitbook/db` package is built:
```bash
npm run build --workspace=@pitbook/db
```

### E2E tests fail
Ensure database is running and `DATABASE_URL` is set:
```bash
docker compose up -d postgres
export DATABASE_URL="postgresql://pitbook:pitbook_secret@localhost:5432/pitbook"
```

### Tests timeout
Increase Jest timeout in package.json or specific tests:
```typescript
jest.setTimeout(10000);
```
