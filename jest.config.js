/* eslint-disable no-undef */
module.exports = {
  projects: [
    // Unit tests keep singleton mocks and only include unit/__tests__ spec files
    {
      displayName: 'unit',
      testEnvironment: 'node',
      transform: { '^.+\\.tsx?$': 'ts-jest' },
      testMatch: [
        '<rootDir>/test/unit/**/*.test.(ts|tsx|js|jsx)',
        '<rootDir>/test/unit/**/*.spec.(ts|tsx|js|jsx)',
        '<rootDir>/__tests__/**/*.test.(ts|tsx|js|jsx)',
        '<rootDir>/__tests__/**/*.spec.(ts|tsx|js|jsx)',
      ],
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
      setupFilesAfterEnv: ['<rootDir>/__mocks__/singleton.ts'],
      clearMocks: true,
    },

    // Integration tests: no singleton mock, plus DB bootstrap hooks
    {
      displayName: 'integration',
      testEnvironment: 'node',
      transform: { '^.+\\.tsx?$': 'ts-jest' },
      testMatch: [
        '<rootDir>/test/integration/**/*.test.(ts|tsx)',
        '<rootDir>/test/integration/**/*.spec.(ts|tsx)',
      ],
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

      setupFiles: ['<rootDir>/test/envSetup.ts'],
      globalSetup: '<rootDir>/test/globalSetup.ts',
      globalTeardown: '<rootDir>/test/globalTeardown.ts',

      // optional but highly recommended for DB tests (reduces flakiness)
      maxWorkers: 1,
      clearMocks: true,
    },
  ],
};
