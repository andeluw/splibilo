import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Response } from 'express';
import { Observable, map } from 'rxjs';
import { ApiResponse, PaginatedApiResponse } from '../types/api-response.type';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const http = context.switchToHttp();
    const res = http.getResponse<Response>();

    return next.handle().pipe(
      map((value) => {
        const statusCode = res.statusCode ?? 200;

        if (value && typeof value === 'object' && 'meta' in value) {
          const { data, meta, message } = value as Omit<
            PaginatedApiResponse<any>,
            'code'
          >;

          return {
            code: statusCode,
            message,
            data: data ?? null,
            meta,
          };
        }

        if (
          value &&
          typeof value === 'object' &&
          'message' in value &&
          'data' in value
        ) {
          const { message, data } = value as Omit<ApiResponse<any>, 'code'>;
          return {
            code: statusCode,
            message,
            data: data ?? null,
          };
        }

        return {
          code: statusCode,
          message: 'OK',
          data: value ?? null,
        };
      }),
    );
  }
}
