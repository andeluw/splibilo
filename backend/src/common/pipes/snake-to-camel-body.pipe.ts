import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { keysToCamel } from '../utils/case.util';

@Injectable()
export class SnakeToCamelBodyPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (metadata.type === 'body' && value && typeof value === 'object') {
      return keysToCamel(value);
    }
    return value;
  }
}
