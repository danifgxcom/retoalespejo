export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  globals: {
    'ts-jest': {
      tsconfig: {
        module: 'CommonJS',
        moduleResolution: 'node',
        jsx: 'react-jsx',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true
      }
    }
  },
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
    '^.+\\.js$': 'babel-jest'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(apca-w3|colorparsley|lucide-react)/)'
  ],
  testMatch: [
    '**/*.test.{ts,tsx}'
  ],
  setupFilesAfterEnv: [
    '<rootDir>/src/tests/setup.ts'
  ]
};
