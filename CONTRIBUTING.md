# Contributing to ChefWise

Thank you for your interest in contributing to ChefWise! This document provides guidelines for contributing to the project.

## Table of Contents
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Style](#code-style)
- [Testing Guidelines](#testing-guidelines)
- [Commit Messages](#commit-messages)
- [Pull Request Guidelines](#pull-request-guidelines)
- [Issue Labels](#issue-labels)
- [Code Review Process](#code-review-process)

## Getting Started

### First Time Contributors

Welcome! We're excited to have you contribute to ChefWise. Here's how to get started:

1. **Find an Issue**: Look for issues labeled `good-first-issue` or `help-wanted`
2. **Fork the repository**: Click the "Fork" button on GitHub
3. **Clone your fork**: `git clone https://github.com/YOUR_USERNAME/Chefwise.git`
4. **Set up development environment**:
   ```bash
   cd Chefwise
   npm install
   cp .env.example .env.local
   # Add your API keys to .env.local
   ```
5. **Create a new branch**: `git checkout -b feature/your-feature-name`
6. **Make your changes** and test thoroughly
7. **Submit a Pull Request**

### Development Environment Setup

### Development Environment Setup

**Required Tools:**
- Node.js 18+ (LTS recommended)
- npm or yarn
- Git
- Code editor (VS Code recommended with ESLint extension)

**Optional but Recommended:**
- Firebase CLI: `npm install -g firebase-tools`
- React Developer Tools browser extension
- Redux DevTools (if state management expands)

**Setup Steps:**

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/Chefwise.git`
3. Create a new branch: `git checkout -b feature/your-feature-name`
4. Install dependencies: `npm install`
5. Set up your environment variables (see `.env.example`)

## Development Workflow

1. Make your changes in your feature branch
2. Write or update tests if applicable
3. Run linting: `npm run lint`
4. Test your changes locally: `npm run dev`
5. Commit your changes with a descriptive message
6. Push to your fork: `git push origin feature/your-feature-name`
7. Create a Pull Request

## Code Style

- Use ES6+ JavaScript syntax
- Follow React best practices and hooks patterns
- Use functional components over class components
- Keep components small and focused (Single Responsibility Principle)
- Write meaningful variable and function names (use camelCase)
- Add JSDoc comments for complex logic and public APIs
- Use Prettier for code formatting (config in `.prettierrc`)
- Follow the project's ESLint rules

**Component Structure:**
```jsx
// 1. Imports
import React, { useState } from 'react';

// 2. Component
export const MyComponent = ({ prop1, prop2 }) => {
  // 3. Hooks
  const [state, setState] = useState(null);
  
  // 4. Event handlers
  const handleClick = () => {
    // logic
  };
  
  // 5. Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
};
```

**Naming Conventions:**
- Components: `PascalCase` (e.g., `RecipeCard.jsx`)
- Hooks: `camelCase` with `use` prefix (e.g., `useOpenAI.js`)
- Utilities: `camelCase` (e.g., `macroCalculator.js`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `API_ENDPOINTS`)

## Testing Guidelines

We use Jest and React Testing Library for testing. All new features should include tests.

**Test Coverage Requirements:**
- Components: Test rendering and user interactions
- Hooks: Test state changes and side effects
- Utilities: Test edge cases and error handling
- API calls: Use mocks (see `__mocks__` directory)

**Writing Tests:**
```javascript
// MyComponent.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('handles user interaction', () => {
    render(<MyComponent />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('Updated Text')).toBeInTheDocument();
  });
});
```

**Running Tests:**
```bash
npm test              # Run all tests
npm test -- --watch   # Run in watch mode
npm test -- --coverage # Generate coverage report
```

## Commit Messages

Use clear, descriptive commit messages following the Conventional Commits specification:

**Format:**
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements

**Examples:**
```bash
feat(recipe): Add AI-powered ingredient substitution
fix(pantry): Resolve duplicate item bug
docs(readme): Update installation instructions
test(hooks): Add tests for useOpenAI hook
refactor(components): Simplify RecipeCard logic
perf(cache): Implement response caching for AI calls
```

## Pull Request Guidelines

Before submitting a PR, ensure:

**Checklist:**
- [ ] Code follows the style guidelines
- [ ] All tests pass (`npm test`)
- [ ] New tests added for new features
- [ ] Linting passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] Documentation updated (if needed)
- [ ] No console errors or warnings
- [ ] Accessibility considerations addressed

**PR Description Should Include:**
1. **What**: Clear description of changes
2. **Why**: Reason for the changes
3. **How**: Implementation approach
4. **Testing**: How you tested the changes
5. **Screenshots**: For UI changes (required)
6. **Related Issues**: Link to issues (e.g., "Fixes #123")

**Example PR Description:**
```markdown
## What
Adds caching layer for AI recipe generation to improve performance

## Why
Reduces API calls and improves response time for frequently requested recipes

## How
- Implemented IndexedDB caching with hash-based keys
- Added cache validation and TTL (24 hours)
- Updated useOpenAI hook to check cache before API calls

## Testing
- Added unit tests for cache logic
- Manually tested with 100+ recipe generations
- Verified cache invalidation after TTL

## Screenshots
[Before/After performance comparison]

Fixes #42
```

## Issue Labels

We use labels to categorize and prioritize issues:

**Priority Labels:**
- `priority: high` - Critical issues that need immediate attention
- `priority: medium` - Important but not urgent
- `priority: low` - Nice to have

**Type Labels:**
- `bug` - Something isn't working
- `feature` - New feature request
- `documentation` - Documentation improvements
- `enhancement` - Improvement to existing feature
- `question` - Further information requested

**Status Labels:**
- `good-first-issue` - Good for newcomers
- `help-wanted` - Extra attention needed
- `in-progress` - Being worked on
- `blocked` - Blocked by other issues

**Area Labels:**
- `area: ai` - AI/OpenAI related
- `area: ui` - User interface
- `area: backend` - Firebase/Cloud Functions
- `area: performance` - Performance optimization
- `area: testing` - Testing infrastructure

## Code Review Process

1. **Submission**: Create a PR from your fork
2. **Automated Checks**: CI runs linting, tests, and builds
3. **Review**: Maintainers review your code
4. **Feedback**: Address any comments or requested changes
5. **Approval**: Once approved, your PR will be merged
6. **Recognition**: Contributors are recognized in release notes

**Review Criteria:**
- Code quality and maintainability
- Test coverage and quality
- Documentation completeness
- Performance implications
- Security considerations
- Accessibility compliance

**Response Time:**
- We aim to provide initial feedback within 48 hours
- Larger PRs may take longer to review
- Feel free to ping maintainers after 3 days if no response

## Community Guidelines

**Be Respectful:**
- Use welcoming and inclusive language
- Respect differing viewpoints and experiences
- Accept constructive criticism gracefully
- Focus on what's best for the community

**Code of Conduct:**
We follow the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/version/2/1/code_of_conduct/). 
Unacceptable behavior can be reported to the maintainers.

## Getting Help

**Questions?** 
- Open a [Discussion](https://github.com/AreteDriver/Chefwise/discussions) (preferred)
- Create an issue with `question` label
- Check existing issues and docs first

**Found a Bug?**
- Check if it's already reported
- Create a new issue with detailed steps to reproduce
- Include environment details (browser, OS, etc.)

**Feature Requests?**
- Open a Discussion to propose the idea
- Explain the use case and benefits
- Be open to feedback and alternatives

## Questions?

Feel free to open an issue for questions or discussions.

Thank you for contributing to ChefWise!
