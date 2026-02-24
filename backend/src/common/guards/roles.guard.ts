import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles set, let it pass and let other guards handle auth
    if (!roles || roles.length === 0) {
      return true;
    }

    const req = context.switchToHttp().getRequest();
    const user = req.user as
      | { userId: string; email: string; role: UserRole }
      | undefined;

    if (!user) {
      throw new ForbiddenException('User not found in request');
    }

    if (!roles.includes(user.role)) {
      throw new ForbiddenException(
        'You do not have permission to access this resource',
      );
    }

    return true;
  }
}
