// Mock the jose module without requiring the actual module
// since it's an ESM module causing the error

class MockSignJWT {
  payload: any;
  constructor(payload: Record<string, any>) {
    // Store the payload or do something with it if needed
    this.payload = payload;
  }
  setProtectedHeader = jest.fn().mockReturnThis();
  setIssuedAt = jest.fn().mockReturnThis();
  setExpirationTime = jest.fn().mockReturnThis();
  sign = jest.fn().mockResolvedValue("mocked.jwt.token");
}

const jwtVerify = jest.fn(async (token: string) => {
    if (token === "invalid.jwt.token" || token.length < 10) {
      throw new Error("JWT verification failed");
    }
    return { payload: { username: "test_user" } };
  });
module.exports = {
  SignJWT: MockSignJWT,
  jwtVerify,
  // Add any other jose methods you need to mock here
};
  