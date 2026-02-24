import { Decimal } from '@prisma/client/runtime/binary';
import { camelCase, snakeCase } from 'lodash';

export function keysToCamel(input: any): any {
  if (Array.isArray(input)) {
    return input.map((v) => keysToCamel(v));
  }

  if (input instanceof Date) {
    return input;
  }

  if (input !== null && typeof input === 'object') {
    return Object.entries(input).reduce((acc, [key, value]) => {
      acc[camelCase(key)] = keysToCamel(value);
      return acc;
    }, {} as any);
  }

  return input;
}

export function keysToSnake(input: any): any {
  // null / undefined
  if (input === null || input === undefined) return input;

  // arrays
  if (Array.isArray(input)) {
    return input.map((item) => keysToSnake(item));
  }

  // number-like objects (e.g., Decimal)
  if (
    typeof input === 'object' &&
    input !== null &&
    typeof (input as any).toNumber === 'function'
  ) {
    try {
      return (input as any).toNumber();
    } catch {
      return Number((input as any).toString());
    }
  }

  // Date
  if (input instanceof Date) {
    return input;
  }

  // plain object
  if (typeof input === 'object') {
    const result: Record<string, any> = {};

    for (const [key, value] of Object.entries(input)) {
      const snakeKey = snakeCase(key);
      result[snakeKey] = keysToSnake(value);
    }

    return result;
  }

  // primitives (string, number, boolean, etc.)
  return input;
}
