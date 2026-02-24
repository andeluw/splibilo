import {
  ArgumentsHost,
  BadRequestException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { AppExceptionFilter } from '../src/common/filters/app-exception.filter';

function createMockHost() {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });

  const res = { status } as unknown as Response;

  const host = {
    switchToHttp: () => ({
      getResponse: () => res,
    }),
  } as unknown as ArgumentsHost;

  return { host, res, status, json };
}

// Helper to fabricate a PrismaClientKnownRequestError without calling its ctor
function createPrismaError(code: string): PrismaClientKnownRequestError {
  const err = Object.create(
    PrismaClientKnownRequestError.prototype,
  ) as PrismaClientKnownRequestError & { code: string };

  err.code = code;
  return err;
}

// Custom HttpException whose getResponse returns a raw string
class StringResponseException extends HttpException {
  constructor() {
    super('ignored', HttpStatus.I_AM_A_TEAPOT);
  }

  // override to exercise the "string" branch
  override getResponse(): string {
    return 'plain error text';
  }
}

describe('AppExceptionFilter (unit-style in E2E project)', () => {
  let filter: AppExceptionFilter;

  beforeEach(() => {
    filter = new AppExceptionFilter();
  });

  it('maps Prisma P2003 to 400 + "Foreign key constraint failed."', () => {
    const { host, status, json } = createMockHost();
    const prismaError = createPrismaError('P2003');

    filter.catch(prismaError, host);

    expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(json).toHaveBeenCalledWith({
      code: HttpStatus.BAD_REQUEST,
      message: 'Foreign key constraint failed.',
    });
  });

  it('maps Prisma P2004 to 400 + "A database constraint failed."', () => {
    const { host, status, json } = createMockHost();
    const prismaError = createPrismaError('P2004');

    filter.catch(prismaError, host);

    expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(json).toHaveBeenCalledWith({
      code: HttpStatus.BAD_REQUEST,
      message: 'A database constraint failed.',
    });
  });

  it('maps unknown Prisma error code to 500 + generic database message', () => {
    const { host, status, json } = createMockHost();
    const prismaError = createPrismaError('P9999');

    filter.catch(prismaError, host);

    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(json).toHaveBeenCalledWith({
      code: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'A database error occurred',
    });
  });

  it('handles HttpException whose getResponse returns a string', () => {
    const { host, status, json } = createMockHost();
    const ex = new StringResponseException();

    filter.catch(ex, host);

    expect(status).toHaveBeenCalledWith(HttpStatus.I_AM_A_TEAPOT);
    expect(json).toHaveBeenCalledWith({
      code: HttpStatus.I_AM_A_TEAPOT,
      message: 'plain error text',
    });
  });

  it('flattens HttpException with single-element array message to a string', () => {
    const { host, status, json } = createMockHost();

    const ex = new BadRequestException(['only-one']);

    filter.catch(ex, host);

    expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(json).toHaveBeenCalledWith({
      code: HttpStatus.BAD_REQUEST,
      message: 'only-one',
    });
  });

  it('preserves HttpException with multi-element array message as array', () => {
    const { host, status, json } = createMockHost();

    const ex = new BadRequestException(['first', 'second']);

    filter.catch(ex, host);

    expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(json).toHaveBeenCalledWith({
      code: HttpStatus.BAD_REQUEST,
      message: ['first', 'second'],
    });
  });

  it('falls back to 500 + generic message for unknown errors', () => {
    const { host, status, json } = createMockHost();
    const err = new Error('boom');

    filter.catch(err, host as ArgumentsHost);

    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(json).toHaveBeenCalledWith({
      code: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'An unexpected error occurred.',
    });
  });
});
