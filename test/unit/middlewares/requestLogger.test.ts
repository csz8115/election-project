import { EventEmitter } from 'events';
import { NextFunction, Request, Response } from 'express';

const loggerMock = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

jest.mock('../../../src/server/utils/logger.ts', () => ({
  __esModule: true,
  default: loggerMock,
}));

import { requestLogger } from '../../../src/server/middlewares/requestLogger.ts';

type MockRequest = Pick<Request, 'method' | 'originalUrl' | 'url'> & {
  user?: Record<string, unknown>;
};

type MockResponse = EventEmitter & {
  statusCode: number;
  locals: Record<string, unknown>;
};

const makeRequest = (overrides: Partial<MockRequest> = {}): Request =>
  ({
    method: 'GET',
    originalUrl: '/api/v1/member/ballots',
    url: '/api/v1/member/ballots',
    ...overrides,
  }) as Request;

const makeResponse = (overrides: Partial<MockResponse> = {}): Response => {
  const res = new EventEmitter() as MockResponse;
  res.statusCode = 200;
  res.locals = {};
  Object.assign(res, overrides);
  return res as unknown as Response;
};

describe('requestLogger middleware', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    loggerMock.info.mockReset();
    loggerMock.warn.mockReset();
    loggerMock.error.mockReset();
    process.env.NODE_ENV = 'development';
  });

  afterAll(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  test('logs completed request details using info level and includes optional IDs', () => {
    const bigintSpy = jest
      .spyOn(process.hrtime, 'bigint')
      .mockReturnValueOnce(BigInt(1_000_000))
      .mockReturnValueOnce(BigInt(9_000_000));

    const req = makeRequest({ method: 'POST', originalUrl: '/api/v1/member/login' });
    const res = makeResponse({
      statusCode: 200,
      locals: {
        userID: 42,
        companyID: 8,
      },
    });
    const next = jest.fn() as NextFunction;

    requestLogger(req, res, next);
    (res as unknown as EventEmitter).emit('finish');

    expect(next).toHaveBeenCalledTimes(1);
    expect(loggerMock.info).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        url: '/api/v1/member/login',
        statusCode: 200,
        durationMs: 8,
        userID: 42,
        companyID: 8,
      }),
      'HTTP request completed',
    );
    expect(loggerMock.warn).not.toHaveBeenCalled();
    expect(loggerMock.error).not.toHaveBeenCalled();

    bigintSpy.mockRestore();
  });

  test('uses warn for 4xx and error for 5xx responses', () => {
    const bigintSpy = jest.spyOn(process.hrtime, 'bigint').mockImplementation(() => BigInt(5_000_000));
    const next = jest.fn() as NextFunction;

    const reqWarn = makeRequest({ originalUrl: '/api/v1/member/protected' });
    const resWarn = makeResponse({ statusCode: 403 });
    requestLogger(reqWarn, resWarn, next);
    (resWarn as unknown as EventEmitter).emit('finish');
    expect(loggerMock.warn).toHaveBeenCalledTimes(1);

    const reqError = makeRequest({ originalUrl: '/api/v1/member/server-error' });
    const resError = makeResponse({ statusCode: 500 });
    requestLogger(reqError, resError, next);
    (resError as unknown as EventEmitter).emit('finish');
    expect(loggerMock.error).toHaveBeenCalledTimes(1);

    bigintSpy.mockRestore();
  });

  test('does not log request entries when NODE_ENV is test', () => {
    process.env.NODE_ENV = 'test';
    const bigintSpy = jest.spyOn(process.hrtime, 'bigint');
    const req = makeRequest();
    const res = makeResponse();
    const next = jest.fn() as NextFunction;

    requestLogger(req, res, next);
    (res as unknown as EventEmitter).emit('finish');

    expect(next).toHaveBeenCalledTimes(1);
    expect(loggerMock.info).not.toHaveBeenCalled();
    expect(loggerMock.warn).not.toHaveBeenCalled();
    expect(loggerMock.error).not.toHaveBeenCalled();
    expect(bigintSpy).not.toHaveBeenCalled();

    bigintSpy.mockRestore();
  });
});
