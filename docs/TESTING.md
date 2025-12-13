# Testing Guide

ChefWise uses Jest and React Testing Library for comprehensive test coverage.

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test -- useOpenAI.test.js

# Run tests with coverage
npm test -- --coverage

# Run tests in CI mode
npm test -- --ci --coverage
```

## Test Structure

```
src/
├── components/
│   ├── Component.jsx
│   └── __tests__/
│       └── Component.test.jsx
├── hooks/
│   ├── useHook.js
│   └── __tests__/
│       └── useHook.test.js
└── utils/
    ├── utility.js
    └── __tests__/
        └── utility.test.js
```

## Writing Tests

### Component Tests

```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import MyComponent from '../MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('handles user interaction', () => {
    render(<MyComponent />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(screen.getByText('Clicked')).toBeInTheDocument();
  });
});
```

### Hook Tests

```javascript
import { renderHook, act } from '@testing-library/react';
import useMyHook from '../useMyHook';

describe('useMyHook', () => {
  it('returns expected values', () => {
    const { result } = renderHook(() => useMyHook());
    expect(result.current.value).toBe(initialValue);
  });

  it('updates state correctly', () => {
    const { result } = renderHook(() => useMyHook());
    
    act(() => {
      result.current.updateValue('new value');
    });
    
    expect(result.current.value).toBe('new value');
  });
});
```

### Utility Tests

```javascript
import { calculateCalories } from '../macroCalculator';

describe('calculateCalories', () => {
  it('calculates correctly', () => {
    const macros = { protein: 50, carbs: 100, fat: 20 };
    expect(calculateCalories(macros)).toBe(780);
  });

  it('handles edge cases', () => {
    expect(calculateCalories({ protein: 0, carbs: 0, fat: 0 })).toBe(0);
  });
});
```

## Mocking

### Firebase Functions

```javascript
jest.mock('firebase/functions', () => ({
  httpsCallable: jest.fn(() => jest.fn()),
}));
```

### API Responses

```javascript
const mockResponse = { data: { /* ... */ } };
const mockFunction = jest.fn().mockResolvedValue(mockResponse);
httpsCallable.mockReturnValue(mockFunction);
```

### Next.js Router

```javascript
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: '/',
    query: {},
  }),
}));
```

## Coverage Goals

Aim for:
- **Statements**: 80%+
- **Branches**: 70%+
- **Functions**: 80%+
- **Lines**: 80%+

Critical paths should have 100% coverage:
- Authentication flows
- Payment processing
- Data mutations
- AI API calls

## Best Practices

1. **Test Behavior, Not Implementation**
   - Focus on what users see
   - Avoid testing internal state
   - Test user interactions

2. **Use Descriptive Test Names**
   ```javascript
   // Good
   it('displays error message when API call fails')
   
   // Bad
   it('works correctly')
   ```

3. **Arrange, Act, Assert (AAA)**
   ```javascript
   it('increments counter', () => {
     // Arrange
     const { getByRole } = render(<Counter />);
     
     // Act
     fireEvent.click(getByRole('button'));
     
     // Assert
     expect(screen.getByText('1')).toBeInTheDocument();
   });
   ```

4. **Test Edge Cases**
   - Empty arrays/objects
   - Null/undefined values
   - Maximum/minimum values
   - Error conditions

5. **Keep Tests Fast**
   - Mock external dependencies
   - Avoid unnecessary async operations
   - Use `beforeEach` for shared setup

## Continuous Integration

Tests run automatically on:
- Every push to main/develop
- Every pull request
- Before deployment

CI must pass before merging.

## Debugging Tests

```bash
# Run with verbose output
npm test -- --verbose

# Run specific test
npm test -- -t "test name pattern"

# Debug in Chrome
node --inspect-brk node_modules/.bin/jest --runInBand
```

Then open `chrome://inspect` and click "inspect".

## Common Issues

### "Cannot find module"
- Check import paths
- Ensure file extensions match
- Verify jest.config.js moduleNameMapper

### "ReferenceError: fetch is not defined"
- Add fetch polyfill to jest.setup.js
- Mock fetch for tests

### "Timeout Exceeded"
- Increase timeout: `jest.setTimeout(10000)`
- Check for unresolved promises
- Ensure async operations complete

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
