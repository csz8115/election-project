export const createTestError = (message = 'Service failure'): Error => new Error(message);

export const resetMockObject = (mockObject: Record<string, unknown>): void => {
  for (const value of Object.values(mockObject)) {
    if (jest.isMockFunction(value)) {
      value.mockReset();
    }
  }
};
