// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Polyfill fetch for tests
global.fetch = jest.fn()

// Mock Firebase
jest.mock('./src/firebase/firebaseConfig', () => ({
  auth: {},
  db: {},
  functions: {},
}))

// Mock next/router
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}))

// Suppress console errors in tests
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
}
