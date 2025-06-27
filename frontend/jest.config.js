export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest'
  },
  testMatch: [
    '**/*.test.{ts,tsx}'
  ],
  setupFilesAfterEnv: [
    '<rootDir>/src/tests/setup.ts'
  ]
};
