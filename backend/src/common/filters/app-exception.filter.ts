import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Catch()
export class AppExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] | Record<string, string[]> =
      'An unexpected error occurred.';

    // ! Prisma known request errors
    if (exception instanceof PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2002':
          status = HttpStatus.CONFLICT;
          message = 'A record with this data already exists.';
          break;
        case 'P2025':
          status = HttpStatus.NOT_FOUND;
          message = 'The requested record was not found.';
          break;
        case 'P2003':
          status = HttpStatus.BAD_REQUEST;
          message = 'Foreign key constraint failed.';
          break;
        case 'P2004':
          status = HttpStatus.BAD_REQUEST;
          message = 'A database constraint failed.';
          break;
        default:
          status = HttpStatus.INTERNAL_SERVER_ERROR;
          message = 'A database error occurred';
          break;
      }

      return res.status(status).json({
        code: status,
        message,
      });
    }

    // ! Regular Nest HttpException
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const resp = exception.getResponse();

      if (typeof resp === 'string') {
        message = resp;
      } else if (typeof resp === 'object' && resp && 'message' in resp) {
        const msg = resp.message;

        if (Array.isArray(msg)) {
          message = msg.length === 1 ? msg[0] : msg;
        } else {
          message = msg as string | Record<string, string[]>;
        }
      }

      return res.status(status).json({
        code: status,
        message,
      });
    }

    // ! Fallback unknown error
    // eslint-disable-next-line no-console
    // console.error(exception);

    return res.status(status).json({
      code: status,
      message,
    });
  }
}
